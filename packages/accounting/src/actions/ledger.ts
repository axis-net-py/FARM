import { prismaWithTenant } from "@axis/core/prisma/client";
import { prisma } from "@axis/core/prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { AccountType, EntryStatus, LineType } from "@axis/core";
import type { JournalEntry, JournalLine, LedgerEntry } from "@axis/core";
import { logAudit } from "@axis/core/lib/auth/guard";

// ─── Plano de Contas ─────────────────────────────────────────

export async function getAccounts(tenantId: string) {
  const prisma = prismaWithTenant(tenantId);

  return await prisma.account.findMany({
    where: { tenantId },
    include: {
      parent: { select: { id: true, code: true, namePt: true } },
      children: { select: { id: true, code: true, namePt: true, isActive: true } },
    },
    orderBy: { code: 'asc' }
  });
}

export async function getAccountByCode(tenantId: string, code: string) {
  const prisma = prismaWithTenant(tenantId);
  return await prisma.account.findUnique({
    where: { tenantId_code: { tenantId, code } }
  });
}

export async function createAccount(tenantId: string, data: {
  code: string;
  namePt: string;
  nameEs: string;
  type: AccountType;
  parentId?: string;
  level?: number;
}) {
  const prisma = prismaWithTenant(tenantId);

  const level = data.parentId
    ? (await prisma.account.findUnique({ where: { id: data.parentId } }))?.level ?? 1 + 1
    : 1;

  return await prisma.account.create({
    data: {
      tenantId,
      code: data.code,
      namePt: data.namePt,
      nameEs: data.nameEs,
      type: data.type,
      parentId: data.parentId,
      level,
    }
  });
}

// ─── Journal Entries (Lançamentos de Diário) ──────────────────────

export async function getJournalEntries(tenantId: string, filters?: {
  status?: EntryStatus;
  startDate?: Date;
  endDate?: Date;
}) {
  const prisma = prismaWithTenant(tenantId);

  return await prisma.journalEntry.findMany({
    where: {
      tenantId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.startDate && filters?.endDate && {
        date: { gte: filters.startDate, lte: filters.endDate }
      }),
    },
    include: { lines: { include: { account: true } } },
    orderBy: { date: 'desc' }
  });
}

export async function getJournalEntryById(tenantId: string, id: string) {
  const prisma = prismaWithTenant(tenantId);

  return await prisma.journalEntry.findFirst({
    where: { id, tenantId },
    include: {
      lines: {
        include: { account: true },
        orderBy: { type: 'asc' }
      }
    }
  });
}

// ─── Post Invoice to Ledger (Conversão Fatura → Partidas Dobradas) ─

export async function postInvoiceToLedger(tenantId: string, invoiceId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // Fetch invoice with items - try Invoice first, then CommercialInvoice
    let invoice: any = await tx.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { lines: true }
    });

    let invoiceType: 'legacy' | 'commercial' = 'legacy';

    if (!invoice) {
      invoice = await tx.commercialInvoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: { items: true }
      });
      if (invoice) {
        invoiceType = 'commercial';
      }
    }

    if (!invoice) throw new Error("Invoice not found");

    // Check if already posted
    const existingEntry = await tx.journalEntry.findFirst({
      where: {
        tenantId,
        referenceType: invoiceType === 'commercial' ? 'COMMERCIAL_INVOICE' : 'SALES_INVOICE',
        referenceId: invoiceId,
        status: EntryStatus.POSTED
      }
    });

    if (existingEntry) {
      throw new Error("Invoice already posted to ledger");
    }

    // Get account IDs from chart of accounts
    const [accountsReceivable, salesRevenue, vatPayable] = await Promise.all([
      tx.account.findFirst({ where: { tenantId, code: '1.1.02' } }), // Contas a Receber
      tx.account.findFirst({ where: { tenantId, code: '4.1.01' } }), // Receita de Vendas
      tx.account.findFirst({ where: { tenantId, code: '2.1.01' } }), // IVA a Recolher
    ]);

    if (!accountsReceivable || !salesRevenue) {
      throw new Error("Required accounts not found in chart of accounts");
    }

    // Generate journal entry number
    const count = await tx.journalEntry.count({ where: { tenantId } });
    const number = `JE-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    // Calculate amounts using Decimal operations
    const totalAmount = new Decimal(invoice.totalAmount?.toString() || invoice.total?.toString() || '0');
    const totalIva10 = new Decimal((invoice.totalIva10 || 0).toString());
    const totalIva5 = new Decimal((invoice.totalIva5 || 0).toString());
    const subtotal = totalAmount.minus(totalIva10).minus(totalIva5);

    const currency = invoice.currency || 'PYG';
    const exchangeRate = new Decimal((invoice.exchangeRate || 1).toString());

    // Create journal entry with double-entry lines
    const journalEntry = await tx.journalEntry.create({
      data: {
        tenantId,
        number,
        date: invoice.issueDate || invoice.issuedAt || new Date(),
        description: `Venda Ref. Fatura ${invoice.documentNumber || invoice.number || invoice.id}`,
        referenceType: invoiceType === 'commercial' ? 'COMMERCIAL_INVOICE' : 'SALES_INVOICE',
        referenceId: invoiceId,
        status: EntryStatus.POSTED,
        postedAt: new Date(),
        createdBy: userId,
        lines: {
          create: [
            // Debit: Accounts Receivable
            {
              tenantId,
              accountId: accountsReceivable.id,
              type: LineType.DEBIT,
              amount: totalAmount,
              currency,
              exchangeRate,
              amountUSD: invoice.totalUSD ? new Decimal(invoice.totalUSD.toString()) : new Decimal(0),
            },
            // Credit: Sales Revenue (subtotal)
            {
              tenantId,
              accountId: salesRevenue.id,
              type: LineType.CREDIT,
              amount: subtotal,
              currency,
              exchangeRate,
              amountUSD: invoice.totalUSD ? new Decimal(invoice.totalUSD.toString()).minus(
                new Decimal(invoice.totalUSD.toString()).times(
                  totalIva10.plus(totalIva5).dividedBy(totalAmount)
                )
              ) : new Decimal(0),
            },
            // Credit: VAT Payable (if applicable)
            ...(totalIva10.greaterThan(0) || totalIva5.greaterThan(0) ? [{
              tenantId,
              accountId: vatPayable?.id || accountsReceivable.id,
              type: LineType.CREDIT as LineType,
              amount: totalIva10.plus(totalIva5),
              currency,
              exchangeRate,
              amountUSD: invoice.totalUSD ? new Decimal(invoice.totalUSD.toString()).times(
                totalIva10.plus(totalIva5).dividedBy(totalAmount)
              ) : new Decimal(0),
            }] : []),
          ]
        }
      },
      include: { lines: true }
    });

    // Validate double-entry balance (Debit === Credit)
    const debitTotal = journalEntry.lines
      .filter(l => l.type === 'DEBIT')
      .reduce((acc, l) => acc.add(l.amount), new Decimal(0));

    const creditTotal = journalEntry.lines
      .filter(l => l.type === 'CREDIT')
      .reduce((acc, l) => acc.add(l.amount), new Decimal(0));

    const balance = debitTotal.sub(creditTotal);

    if (!balance.abs().lessThan(new Decimal(0.01))) {
      throw new Error(`Accounting Imbalance: ${balance.toString()}. Entry rejected.`);
    }

    // Create ledger entries for each line (Shadow Accounting)
    for (const line of journalEntry.lines) {
      const period = journalEntry.date.toISOString().slice(0, 7); // YYYY-MM

      // Get previous balance for this account
      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { tenantId, accountId: line.accountId, period },
        orderBy: { id: 'desc' }
      });

      const previousBalance = lastEntry?.balance || new Decimal(0);
      const newBalance = line.type === 'DEBIT'
        ? previousBalance.add(line.amount)
        : previousBalance.sub(line.amount);

      await tx.ledgerEntry.create({
        data: {
          tenantId,
          accountId: line.accountId,
          journalLineId: line.id,
          period,
          debit: line.type === 'DEBIT' ? line.amount : new Decimal(0),
          credit: line.type === 'CREDIT' ? line.amount : new Decimal(0),
          balance: newBalance,
          currency: line.currency,
        }
      });
    }

    // Update invoice status to indicate it's posted
    if (invoiceType === 'commercial') {
      await tx.commercialInvoice.update({
        where: { id: invoiceId },
        data: { status: 'APPROVED' }
      });
    } else {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'APPROVED' }
      });
    }

    return { success: true, entryId: journalEntry.id };
  });
}

// ─── Void/Reversal Entry ───────────────────────────────────────────

export async function voidJournalEntry(tenantId: string, entryId: string, reason: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.findFirst({
      where: { id: entryId, tenantId },
      include: { lines: true }
    });

    if (!entry) throw new Error("Journal entry not found");
    if (entry.status === EntryStatus.VOIDED) {
      throw new Error("Entry already voided");
    }

    // Create reversal entry
    const count = await tx.journalEntry.count({ where: { tenantId } });
    const reversalNumber = `JE-REV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const reversalEntry = await tx.journalEntry.create({
      data: {
        tenantId,
        number: reversalNumber,
        date: new Date(),
        description: `Reversal of ${entry.number}: ${reason}`,
        referenceType: 'REVERSAL',
        referenceId: entryId,
        status: EntryStatus.POSTED,
        postedAt: new Date(),
        createdBy: userId,
        lines: {
          create: entry.lines.map(line => ({
            tenantId,
            accountId: line.accountId,
            type: line.type === 'DEBIT' ? LineType.CREDIT : LineType.DEBIT,
            amount: line.amount,
            currency: line.currency,
            exchangeRate: line.exchangeRate,
            amountUSD: line.amountUSD,
          }))
        }
      },
      include: { lines: true }
    });

    // Create reversal ledger entries
    for (const line of reversalEntry.lines) {
      const period = reversalEntry.date.toISOString().slice(0, 7);

      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { tenantId, accountId: line.accountId, period },
        orderBy: { id: 'desc' }
      });

      const previousBalance = lastEntry?.balance || new Decimal(0);
      const newBalance = line.type === 'DEBIT'
        ? previousBalance.add(line.amount)
        : previousBalance.sub(line.amount);

      await tx.ledgerEntry.create({
        data: {
          tenantId,
          accountId: line.accountId,
          journalLineId: line.id,
          period,
          debit: line.type === 'DEBIT' ? line.amount : new Decimal(0),
          credit: line.type === 'CREDIT' ? line.amount : new Decimal(0),
          balance: newBalance,
          currency: line.currency,
        }
      });
    }

    // Mark original as voided
    await tx.journalEntry.update({
      where: { id: entryId },
      data: { status: EntryStatus.VOIDED }
    });

    return { success: true, reversalId: reversalEntry.id };
  });
}

// ─── Ledger Entries (Livro Razão) ────────────────────────────────

export async function getLedgerEntries(tenantId: string, filters?: {
  accountId?: string;
  period?: string; // YYYY-MM
  startDate?: Date;
  endDate?: Date;
}) {
  const prisma = prismaWithTenant(tenantId);

  return await prisma.ledgerEntry.findMany({
    where: {
      tenantId,
      ...(filters?.accountId && { accountId: filters.accountId }),
      ...(filters?.period && { period: filters.period }),
      ...(filters?.startDate && filters?.endDate && {
        journalLine: {
          journalEntry: {
            date: { gte: filters.startDate, lte: filters.endDate }
          }
        }
      }),
    },
    include: {
      account: true,
      journalLine: {
        include: {
          journalEntry: {
            select: { number: true, date: true, description: true }
          }
        }
      }
    },
    orderBy: [
      { period: 'asc' },
      { id: 'asc' }
    ]
  });
}

// ─── Shadow Accounting: Get ledger entries with USD conversion ───

export async function getLedgerEntriesWithShadow(tenantId: string, filters?: {
  accountId?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const prisma = prismaWithTenant(tenantId);

  const entries = await prisma.ledgerEntry.findMany({
    where: {
      tenantId,
      ...(filters?.accountId && { accountId: filters.accountId }),
      ...(filters?.period && { period: filters.period }),
      ...(filters?.startDate && filters?.endDate && {
        journalLine: {
          journalEntry: {
            date: { gte: filters.startDate, lte: filters.endDate }
          }
        }
      }),
    },
    include: {
      account: true,
      journalLine: {
        include: {
          journalEntry: {
            select: { number: true, date: true, description: true }
          }
        }
      }
    },
    orderBy: [
      { period: 'asc' },
      { id: 'asc' }
    ]
  });

  // Enrich with shadow accounting (USD equivalent using historical exchange rate)
  return entries.map((entry: any) => ({
    ...entry,
    shadowAmountUSD: entry.journalLine.amountUSD || entry.journalLine.amount.dividedBy(entry.journalLine.exchangeRate || 1),
    exchangeRate: entry.journalLine.exchangeRate,
    originalCurrency: entry.journalLine.currency,
  }));
}

// ─── Trial Balance (Balanço de Verificação) ──────────────────────

export interface TrialBalanceAccount {
  code: string;
  namePt: string;
  nameEs: string;
  type: AccountType;
  debit: Decimal;
  credit: Decimal;
  balance: Decimal;
}

export async function getTrialBalance(tenantId: string, period: string): Promise<{
  accounts: TrialBalanceAccount[];
  totalDebit: Decimal;
  totalCredit: Decimal;
  isBalanced: boolean;
}> {
  const prisma = prismaWithTenant(tenantId);

  const entries = await prisma.ledgerEntry.findMany({
    where: { tenantId, period },
    include: { account: true }
  });

  const accountBalances = new Map<string, {
    code: string;
    namePt: string;
    nameEs: string;
    type: AccountType;
    debit: Decimal;
    credit: Decimal;
    balance: Decimal;
  }>();

  for (const entry of entries) {
    const existing = accountBalances.get(entry.accountId) || {
      code: entry.account.code,
      namePt: entry.account.namePt,
      nameEs: entry.account.nameEs,
      type: entry.account.type,
      debit: new Decimal(0),
      credit: new Decimal(0),
      balance: new Decimal(0),
    };

    existing.debit = existing.debit.add(entry.debit);
    existing.credit = existing.credit.add(entry.credit);
    existing.balance = entry.balance;

    accountBalances.set(entry.accountId, existing);
  }

  const accounts = Array.from(accountBalances.values());
  const totalDebit = accounts.reduce((acc, a) => acc.add(a.debit), new Decimal(0));
  const totalCredit = accounts.reduce((acc, a) => acc.add(a.credit), new Decimal(0));

  return {
    accounts,
    totalDebit,
    totalCredit,
    isBalanced: totalDebit.equals(totalCredit)
  };
}

// ─── Seed Default Chart of Accounts ───────────────────────────────

export async function seedDefaultAccounts(tenantId: string) {
  const prisma = prismaWithTenant(tenantId);

  const defaultAccounts = [
    // Ativo (1)
    { code: "1", namePt: "Ativo", nameEs: "Activo", type: AccountType.ASSET, level: 1 },
    { code: "1.1", namePt: "Ativo Circulante", nameEs: "Activo Circulante", type: AccountType.ASSET, level: 2, parentCode: "1" },
    { code: "1.1.01", namePt: "Caixa", nameEs: "Caja", type: AccountType.ASSET, level: 3, parentCode: "1.1" },
    { code: "1.1.02", namePt: "Contas a Receber", nameEs: "Cuentas por Cobrar", type: AccountType.ASSET, level: 3, parentCode: "1.1" },
    { code: "1.1.03", namePt: "Estoque", nameEs: "Inventario", type: AccountType.ASSET, level: 3, parentCode: "1.1" },
    { code: "1.1.04", namePt: "Bancos", nameEs: "Bancos", type: AccountType.ASSET, level: 3, parentCode: "1.1" },

    // Passivo (2)
    { code: "2", namePt: "Passivo", nameEs: "Pasivo", type: AccountType.LIABILITY, level: 1 },
    { code: "2.1", namePt: "Passivo Circulante", nameEs: "Pasivo Circulante", type: AccountType.LIABILITY, level: 2, parentCode: "2" },
    { code: "2.1.01", namePt: "IVA a Recolher", nameEs: "IVA por Pagar", type: AccountType.LIABILITY, level: 3, parentCode: "2.1" },
    { code: "2.1.02", namePt: "Contas a Pagar", nameEs: "Cuentas por Pagar", type: AccountType.LIABILITY, level: 3, parentCode: "2.1" },
    { code: "2.1.03", namePt: "Salários a Pagar", nameEs: "Salarios por Pagar", type: AccountType.LIABILITY, level: 3, parentCode: "2.1" },

    // Patrimônio Líquido (3)
    { code: "3", namePt: "Patrimônio Líquido", nameEs: "Patrimonio", type: AccountType.EQUITY, level: 1 },
    { code: "3.1", namePt: "Capital Social", nameEs: "Capital Social", type: AccountType.EQUITY, level: 2, parentCode: "3" },
    { code: "3.2", namePt: "Lucros Acumulados", nameEs: "Utilidades Acumuladas", type: AccountType.EQUITY, level: 2, parentCode: "3" },

    // Receita (4)
    { code: "4", namePt: "Receitas", nameEs: "Ingresos", type: AccountType.REVENUE, level: 1 },
    { code: "4.1", namePt: "Receita Operacional", nameEs: "Ingresos Operativos", type: AccountType.REVENUE, level: 2, parentCode: "4" },
    { code: "4.1.01", namePt: "Vendas de Produtos", nameEs: "Ventas de Productos", type: AccountType.REVENUE, level: 3, parentCode: "4.1" },
    { code: "4.1.02", namePt: "Serviços Prestados", nameEs: "Servicios Prestados", type: AccountType.REVENUE, level: 3, parentCode: "4.1" },

    // Despesas (5)
    { code: "5", namePt: "Despesas", nameEs: "Gastos", type: AccountType.EXPENSE, level: 1 },
    { code: "5.1", namePt: "Despesas Operacionais", nameEs: "Gastos Operativos", type: AccountType.EXPENSE, level: 2, parentCode: "5" },
    { code: "5.1.01", namePt: "Custo de Mercadorias", nameEs: "Costo de Mercadería", type: AccountType.EXPENSE, level: 3, parentCode: "5.1" },
    { code: "5.1.02", namePt: "Salários e Jornales", nameEs: "Salarios y Jornales", type: AccountType.EXPENSE, level: 3, parentCode: "5.1" },
    { code: "5.1.03", namePt: "Aluguel", nameEs: "Alquiler", type: AccountType.EXPENSE, level: 3, parentCode: "5.1" },
    { code: "5.1.04", namePt: "Marketing e Publicidade", nameEs: "Marketing y Publicidad", type: AccountType.EXPENSE, level: 3, parentCode: "5.1" },
  ];

  // Sort by level to ensure parents are created first
  const sorted = [...defaultAccounts].sort((a, b) => a.level - b.level);

  for (const acc of sorted) {
    const parent = acc.parentCode ? await prisma.account.findFirst({
      where: { tenantId, code: acc.parentCode }
    }) : null;

    await prisma.account.upsert({
      where: { tenantId_code: { tenantId, code: acc.code } },
      update: {
        namePt: acc.namePt,
        nameEs: acc.nameEs,
        type: acc.type,
        level: acc.level,
        parentId: parent?.id,
      },
      create: {
        tenantId,
        code: acc.code,
        namePt: acc.namePt,
        nameEs: acc.nameEs,
        type: acc.type,
        level: acc.level,
        parentId: parent?.id,
      }
    });
  }

  return { success: true, count: defaultAccounts.length };
}

// ─── Financial Reports ────────────────────────────────────────────

export async function getIncomeStatement(tenantId: string, period: string) {
  const prisma = prismaWithTenant(tenantId);

  const [year, month] = period.split('-');
  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(`${year}-${month}-31`);

  const entries = await prisma.ledgerEntry.findMany({
    where: {
      tenantId,
      journalLine: {
        journalEntry: {
          date: { gte: startDate, lte: endDate }
        }
      }
    },
    include: { account: true }
  });

  const revenue: Array<{ code: string; name: string; amount: Decimal }> = [];
  const expenses: Array<{ code: string; name: string; amount: Decimal }> = [];
  let totalRevenue = new Decimal(0);
  let totalExpenses = new Decimal(0);

  entries.forEach((entry: any) => {
    if (entry.account.type === AccountType.REVENUE) {
      const amount = entry.credit;
      revenue.push({ code: entry.account.code, name: entry.account.namePt, amount });
      totalRevenue = totalRevenue.add(amount);
    } else if (entry.account.type === AccountType.EXPENSE) {
      const amount = entry.debit;
      expenses.push({ code: entry.account.code, name: entry.account.namePt, amount });
      totalExpenses = totalExpenses.add(amount);
    }
  });

  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue.sub(totalExpenses)
  };
}

// ─── Shadow Accounting: Get account balance with historical exchange rate ──

export async function getAccountBalanceWithShadow(
  tenantId: string,
  accountId: string,
  period: string,
  targetCurrency: 'PYG' | 'USD' = 'PYG'
) {
  const prisma = prismaWithTenant(tenantId);

  const entries = await prisma.ledgerEntry.findMany({
    where: { tenantId, accountId, period },
    include: { account: true }
  });

  let balance = new Decimal(0);
  let balanceUSD = new Decimal(0);

  for (const entry of entries) {
    const line = await prisma.journalLine.findFirst({
      where: { id: entry.journalLineId }
    });

    if (line) {
      if (targetCurrency === 'USD' && line.amountUSD) {
        balanceUSD = balanceUSD.add(line.type === 'DEBIT' ? line.amountUSD : line.amountUSD.negated());
      } else {
        balance = entry.balance;
      }
    }
  }

  return {
    accountId,
    period,
    balancePYG: balance,
    balanceUSD,
    currency: targetCurrency
  };
}
