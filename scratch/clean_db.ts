import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando limpeza do banco de dados...");

  try {
    // 1. Itens e Movimentos de Estoque
    console.log("Deletando InvoiceItem...");
    await prisma.invoiceItem.deleteMany({});
    
    console.log("Deletando InventoryMovement...");
    await prisma.inventoryMovement.deleteMany({});

    // 2. Faturas
    console.log("Deletando CommercialInvoice...");
    await prisma.commercialInvoice.deleteMany({});

    // 3. Cadastros comerciais
    console.log("Deletando Product...");
    await prisma.product.deleteMany({});
    
    console.log("Deletando Customer...");
    await prisma.customer.deleteMany({});
    
    console.log("Deletando Supplier...");
    await prisma.supplier.deleteMany({});

    // 4. Lançamentos contábeis e transações
    console.log("Deletando Transaction...");
    await prisma.transaction.deleteMany({});
    
    console.log("Deletando JournalLine...");
    await prisma.journalLine.deleteMany({});
    
    console.log("Deletando JournalEntry...");
    await prisma.journalEntry.deleteMany({});
    
    console.log("Deletando Account...");
    await prisma.account.deleteMany({});

    // 5. Configurações e câmbio
    console.log("Deletando ExchangeRate...");
    await prisma.exchangeRate.deleteMany({});

    // 6. Módulos Agrícolas
    console.log("Deletando Plot...");
    await prisma.plot.deleteMany({});
    
    console.log("Deletando Vehicle...");
    await prisma.vehicle.deleteMany({});
    
    console.log("Deletando Employee...");
    await prisma.employee.deleteMany({});

    // 7. Contratos (caso a tabela já exista)
    try {
      console.log("Deletando Contract (se existir)...");
      // @ts-ignore - a propriedade pode não existir ainda antes de rodar o db push
      if (prisma.contract) {
        // @ts-ignore
        await prisma.contract.deleteMany({});
      }
    } catch (e) {
      console.log("Tabela Contract ainda não criada no banco.");
    }

    console.log("Deletando Harvest...");
    await prisma.harvest.deleteMany({});

    // 8. Logs e permissões adicionais
    console.log("Deletando AuditLog...");
    await prisma.auditLog.deleteMany({});

    console.log("Banco de dados limpo com sucesso (Usuários e Tenants foram preservados).");
  } catch (error) {
    console.error("Erro ao limpar banco de dados:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
