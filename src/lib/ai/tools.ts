import { tool } from 'ai'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { createVehicleLog, getVehicleLogs, getFuelConsumption } from '@/app/actions/vehicleLog'
import { createPlotApplication, getPlotApplications } from '@/app/actions/plotApplication'
import { createSoilAnalysis, getSoilAnalyses } from '@/app/actions/soilAnalysis'
import { createIrrigationEvent, getIrrigationEvents } from '@/app/actions/irrigationEvent'
import { getHarvestProfitability } from '@/app/actions/harvestProfitability'
import { createSiloMovement } from '@/app/actions/siloMovement'
import { createLivestockEvent } from '@/app/actions/livestockEvent'
import { createCertification, getCertifications } from '@/app/actions/certification'

// Tools de IA pros 9 módulos novos de fazenda. Resolução por nome
// (contains, case-insensitive); ambiguidade volta como texto pro modelo perguntar.

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

async function resolveVehicle(tenantId: string, name: string) {
  const matches = await prisma.vehicle.findMany({
    where: { tenantId, name: { contains: name, mode: 'insensitive' } },
    take: 5,
  })
  if (matches.length === 1) return { ok: matches[0] }
  if (matches.length === 0) return { error: `Nenhum veículo encontrado parecido com "${name}".` }
  return { error: `Vários veículos correspondem a "${name}": ${matches.map((m) => m.name).join(', ')}.` }
}

async function resolvePlot(tenantId: string, name: string) {
  const matches = await prisma.plot.findMany({
    where: { tenantId, name: { contains: name, mode: 'insensitive' } },
    take: 5,
  })
  if (matches.length === 1) return { ok: matches[0] }
  if (matches.length === 0) return { error: `Nenhum talhão encontrado parecido com "${name}".` }
  return { error: `Vários talhões correspondem a "${name}": ${matches.map((m) => m.name).join(', ')}.` }
}

async function resolveHarvest(tenantId: string, name: string) {
  const matches = await prisma.harvest.findMany({
    where: { tenantId, name: { contains: name, mode: 'insensitive' } },
    take: 5,
  })
  if (matches.length === 1) return { ok: matches[0] }
  if (matches.length === 0) return { error: `Nenhuma safra encontrada parecida com "${name}".` }
  return { error: `Várias safras correspondem a "${name}": ${matches.map((m) => m.name).join(', ')}.` }
}

async function resolveSilo(tenantId: string, name: string) {
  const matches = await prisma.silo.findMany({
    where: { tenantId, name: { contains: name, mode: 'insensitive' } },
    take: 5,
  })
  if (matches.length === 1) return { ok: matches[0] }
  if (matches.length === 0) return { error: `Nenhum silo encontrado parecido com "${name}".` }
  return { error: `Vários silos correspondem a "${name}": ${matches.map((m) => m.name).join(', ')}.` }
}

async function resolveLivestockBatch(tenantId: string, name: string) {
  const matches = await prisma.livestockBatch.findMany({
    where: { tenantId, name: { contains: name, mode: 'insensitive' } },
    take: 5,
  })
  if (matches.length === 1) return { ok: matches[0] }
  if (matches.length === 0) return { error: `Nenhum lote de gado encontrado parecido com "${name}".` }
  return { error: `Vários lotes correspondem a "${name}": ${matches.map((m) => m.name).join(', ')}.` }
}

async function resolveProduct(tenantId: string, name: string) {
  const matches = await prisma.product.findMany({
    where: { tenantId, isActive: true, name: { contains: name, mode: 'insensitive' } },
    take: 5,
  })
  if (matches.length === 1) return { ok: matches[0] }
  if (matches.length === 0) return { error: `Nenhum produto/insumo encontrado parecido com "${name}".` }
  return { error: `Vários produtos correspondem a "${name}": ${matches.map((m) => m.name).join(', ')}.` }
}

async function resolveEmployee(tenantId: string, name: string) {
  const matches = await prisma.employee.findMany({
    where: { tenantId, name: { contains: name, mode: 'insensitive' } },
    take: 5,
  })
  if (matches.length === 1) return matches[0]
  return null
}

export function buildFarmTools(tenantId: string) {
  return {
    logVehicleEvent: tool({
      description:
        'Registra manutenção ou abastecimento de um veículo/máquina da frota. Use quando o usuário relatar que abasteceu ou fez manutenção em um veículo.',
      inputSchema: z.object({
        vehicleName: z.string().describe('Nome do veículo/máquina'),
        type: z.enum(['MAINTENANCE', 'FUEL']),
        date: z.string().describe('Data YYYY-MM-DD'),
        odometerOrHours: z.number().optional().describe('Leitura de horímetro/odômetro no momento'),
        liters: z.number().optional().describe('Litros abastecidos (só FUEL)'),
        fuelCost: z.number().optional().describe('Custo do combustível (só FUEL)'),
        description: z.string().optional().describe('O que foi feito na manutenção (só MAINTENANCE)'),
        maintenanceCost: z.number().optional().describe('Custo da manutenção (só MAINTENANCE)'),
        employeeName: z.string().optional().describe('Funcionário responsável'),
      }),
      execute: async (args) => {
        const vehicle = await resolveVehicle(tenantId, args.vehicleName)
        if ('error' in vehicle) return vehicle.error
        const employee = args.employeeName ? await resolveEmployee(tenantId, args.employeeName) : null
        try {
          await createVehicleLog({
            vehicleId: vehicle.ok.id,
            type: args.type,
            date: new Date(args.date),
            odometerOrHours: args.odometerOrHours,
            liters: args.liters,
            fuelCost: args.fuelCost,
            description: args.description,
            maintenanceCost: args.maintenanceCost,
            employeeId: employee?.id,
          })
          return `Registrado: ${args.type === 'FUEL' ? 'abastecimento' : 'manutenção'} de ${vehicle.ok.name} em ${args.date}.`
        } catch (e) {
          return `Não foi possível registrar: ${errMsg(e)}`
        }
      },
    }),

    getVehicleHistory: tool({
      description: 'Consulta o histórico de manutenção/combustível e consumo médio de um veículo.',
      inputSchema: z.object({ vehicleName: z.string() }),
      execute: async ({ vehicleName }) => {
        const vehicle = await resolveVehicle(tenantId, vehicleName)
        if ('error' in vehicle) return vehicle.error
        const [logs, consumption] = await Promise.all([
          getVehicleLogs(vehicle.ok.id),
          getFuelConsumption(vehicle.ok.id),
        ])
        if (logs.length === 0) return `${vehicle.ok.name} não tem registros de manutenção/combustível ainda.`
        const lines = [`VEÍCULO: ${vehicle.ok.name} (leitura atual: ${vehicle.ok.currentReading ?? 'não informada'})`]
        if (consumption.average !== null) lines.push(`Consumo médio: ${consumption.average.toFixed(2)} L/h`)
        lines.push('HISTÓRICO (mais recente primeiro):')
        for (const log of logs.slice(0, 10)) {
          lines.push(
            `- ${fmtDate(log.date)} · ${log.type === 'FUEL' ? 'Abastecimento' : 'Manutenção'}` +
              (log.liters ? ` · ${log.liters}L` : '') +
              (log.description ? ` · ${log.description}` : '')
          )
        }
        return lines.join('\n')
      },
    }),

    registerPlotApplication: tool({
      description:
        'Registra aplicação de insumo (adubo, defensivo, semente) num talhão. Baixa o estoque do produto automaticamente.',
      inputSchema: z.object({
        plotName: z.string(),
        productName: z.string().describe('Nome do insumo/produto aplicado'),
        quantity: z.number(),
        date: z.string().describe('Data YYYY-MM-DD'),
        employeeName: z.string().optional(),
        notes: z.string().optional(),
      }),
      execute: async (args) => {
        const plot = await resolvePlot(tenantId, args.plotName)
        if ('error' in plot) return plot.error
        const product = await resolveProduct(tenantId, args.productName)
        if ('error' in product) return product.error
        const employee = args.employeeName ? await resolveEmployee(tenantId, args.employeeName) : null
        try {
          await createPlotApplication({
            plotId: plot.ok.id,
            productId: product.ok.id,
            quantity: args.quantity,
            date: new Date(args.date),
            employeeId: employee?.id,
            notes: args.notes,
          })
          return `Aplicação registrada: ${args.quantity} ${product.ok.unit} de ${product.ok.name} no talhão ${plot.ok.name} em ${args.date}. Estoque atualizado.`
        } catch (e) {
          return `Não foi possível registrar a aplicação: ${errMsg(e)}`
        }
      },
    }),

    registerSoilAnalysis: tool({
      description: 'Registra uma análise de solo (pH, fósforo, potássio, matéria orgânica) de um talhão.',
      inputSchema: z.object({
        plotName: z.string(),
        date: z.string().describe('Data YYYY-MM-DD'),
        ph: z.number().optional(),
        phosphorus: z.number().optional().describe('Fósforo (P), mg/dm³'),
        potassium: z.number().optional().describe('Potássio (K), cmolc/dm³'),
        organicMatter: z.number().optional().describe('Matéria orgânica, %'),
        recommendation: z.string().optional(),
      }),
      execute: async (args) => {
        const plot = await resolvePlot(tenantId, args.plotName)
        if ('error' in plot) return plot.error
        try {
          await createSoilAnalysis({
            plotId: plot.ok.id,
            date: new Date(args.date),
            ph: args.ph,
            phosphorus: args.phosphorus,
            potassium: args.potassium,
            organicMatter: args.organicMatter,
            recommendation: args.recommendation,
          })
          return `Análise de solo registrada para o talhão ${plot.ok.name} em ${args.date}.`
        } catch (e) {
          return `Não foi possível registrar a análise: ${errMsg(e)}`
        }
      },
    }),

    registerIrrigation: tool({
      description: 'Registra um turno de irrigação de um talhão.',
      inputSchema: z.object({
        plotName: z.string(),
        date: z.string().describe('Data YYYY-MM-DD'),
        method: z.string().optional().describe('pivo, gotejamento, aspersao, sulco'),
        durationHours: z.number().optional(),
        flowRate: z.number().optional(),
        volumeApplied: z.number().optional(),
        employeeName: z.string().optional(),
      }),
      execute: async (args) => {
        const plot = await resolvePlot(tenantId, args.plotName)
        if ('error' in plot) return plot.error
        const employee = args.employeeName ? await resolveEmployee(tenantId, args.employeeName) : null
        try {
          await createIrrigationEvent({
            plotId: plot.ok.id,
            date: new Date(args.date),
            method: args.method,
            durationHours: args.durationHours,
            flowRate: args.flowRate,
            volumeApplied: args.volumeApplied,
            employeeId: employee?.id,
          })
          return `Turno de irrigação registrado no talhão ${plot.ok.name} em ${args.date}.`
        } catch (e) {
          return `Não foi possível registrar a irrigação: ${errMsg(e)}`
        }
      },
    }),

    getPlotHistory: tool({
      description: 'Consulta o histórico completo de um talhão: aplicações de insumo, análises de solo e irrigação.',
      inputSchema: z.object({ plotName: z.string() }),
      execute: async ({ plotName }) => {
        const plot = await resolvePlot(tenantId, plotName)
        if ('error' in plot) return plot.error
        const [applications, soilAnalyses, irrigation] = await Promise.all([
          getPlotApplications(plot.ok.id),
          getSoilAnalyses(plot.ok.id),
          getIrrigationEvents(plot.ok.id),
        ])
        const lines = [`TALHÃO: ${plot.ok.name}`]
        lines.push(`Aplicações de insumo (${applications.length}):`)
        for (const a of applications.slice(0, 5)) {
          lines.push(`- ${fmtDate(a.date)} · ${a.product.name} · ${a.quantity} ${a.product.unit}`)
        }
        lines.push(`Análises de solo (${soilAnalyses.length}):`)
        for (const s of soilAnalyses.slice(0, 5)) {
          lines.push(`- ${fmtDate(s.date)} · pH ${s.ph ?? '-'}`)
        }
        lines.push(`Turnos de irrigação (${irrigation.length}):`)
        for (const i of irrigation.slice(0, 5)) {
          lines.push(`- ${fmtDate(i.date)} · ${i.method ?? 'irrigação'}`)
        }
        return lines.join('\n')
      },
    }),

    getHarvestProfitability: tool({
      description: 'Consulta a rentabilidade de uma safra: custo de insumo por talhão e receita de contratos, por moeda.',
      inputSchema: z.object({ harvestName: z.string() }),
      execute: async ({ harvestName }) => {
        const harvest = await resolveHarvest(tenantId, harvestName)
        if ('error' in harvest) return harvest.error
        const profitability = await getHarvestProfitability(harvest.ok.id)
        const lines = [`SAFRA: ${harvest.ok.name}`]
        for (const p of profitability.plotCosts) {
          lines.push(`- Talhão ${p.plotName}: custo ${p.totalCost.toLocaleString()}`)
        }
        for (const r of profitability.revenueByCurrency) {
          const cost = profitability.costByCurrency.find((c) => c.currency === r.currency)?.total ?? 0
          lines.push(`Margem (${r.currency}): ${(r.total - cost).toLocaleString()} (receita ${r.total.toLocaleString()} - custo ${cost.toLocaleString()})`)
        }
        return lines.join('\n')
      },
    }),

    registerSiloMovement: tool({
      description: 'Registra entrada (colheita) ou saída (embarque) de grão num silo.',
      inputSchema: z.object({
        siloName: z.string(),
        type: z.enum(['IN', 'OUT']),
        quantity: z.number(),
        date: z.string().describe('Data YYYY-MM-DD'),
        harvestName: z.string().optional().describe('Safra de origem (só entrada)'),
        moisture: z.number().optional().describe('Umidade %, só entrada'),
        qualityGrade: z.string().optional(),
      }),
      execute: async (args) => {
        const silo = await resolveSilo(tenantId, args.siloName)
        if ('error' in silo) return silo.error
        let harvestId: string | undefined
        if (args.harvestName) {
          const harvest = await resolveHarvest(tenantId, args.harvestName)
          if ('error' in harvest) return harvest.error
          harvestId = harvest.ok.id
        }
        try {
          await createSiloMovement({
            siloId: silo.ok.id,
            type: args.type,
            quantity: args.quantity,
            date: new Date(args.date),
            harvestId,
            moisture: args.moisture,
            qualityGrade: args.qualityGrade,
          })
          return `${args.type === 'IN' ? 'Entrada' : 'Saída'} de ${args.quantity} ${silo.ok.unit} registrada no silo ${silo.ok.name}.`
        } catch (e) {
          return `Não foi possível registrar o movimento: ${errMsg(e)}`
        }
      },
    }),

    getSiloStatus: tool({
      description: 'Consulta o estoque atual e capacidade de um silo (ou de todos, se nenhum nome for dado).',
      inputSchema: z.object({ siloName: z.string().optional() }),
      execute: async ({ siloName }) => {
        if (siloName) {
          const silo = await resolveSilo(tenantId, siloName)
          if ('error' in silo) return silo.error
          const pct = Number(silo.ok.capacity) > 0 ? Math.round((Number(silo.ok.currentStock) / Number(silo.ok.capacity)) * 100) : 0
          return `Silo ${silo.ok.name}: ${silo.ok.currentStock}/${silo.ok.capacity} ${silo.ok.unit} (${pct}% ocupado).`
        }
        const silos = await prisma.silo.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })
        if (silos.length === 0) return 'Nenhum silo cadastrado.'
        return silos
          .map((s) => `- ${s.name}: ${s.currentStock}/${s.capacity} ${s.unit}`)
          .join('\n')
      },
    }),

    registerLivestockEvent: tool({
      description: 'Registra pesagem, sanidade ou movimentação de piquete de um lote de gado.',
      inputSchema: z.object({
        batchName: z.string(),
        type: z.enum(['WEIGHING', 'HEALTH', 'MOVEMENT']),
        date: z.string().describe('Data YYYY-MM-DD'),
        weight: z.number().optional().describe('Peso médio do lote, kg (só WEIGHING)'),
        location: z.string().optional().describe('Novo piquete/pasto (só MOVEMENT)'),
        description: z.string().optional().describe('Vacina/tratamento (só HEALTH)'),
        employeeName: z.string().optional(),
      }),
      execute: async (args) => {
        const batch = await resolveLivestockBatch(tenantId, args.batchName)
        if ('error' in batch) return batch.error
        const employee = args.employeeName ? await resolveEmployee(tenantId, args.employeeName) : null
        try {
          await createLivestockEvent({
            batchId: batch.ok.id,
            type: args.type,
            date: new Date(args.date),
            weight: args.weight,
            location: args.location,
            description: args.description,
            employeeId: employee?.id,
          })
          const labels = { WEIGHING: 'Pesagem', HEALTH: 'Sanidade', MOVEMENT: 'Movimentação' }
          return `${labels[args.type]} registrada para o lote ${batch.ok.name}.`
        } catch (e) {
          return `Não foi possível registrar: ${errMsg(e)}`
        }
      },
    }),

    getLivestockBatchStatus: tool({
      description: 'Consulta quantidade, peso médio e piquete atual de um lote de gado.',
      inputSchema: z.object({ batchName: z.string() }),
      execute: async ({ batchName }) => {
        const batch = await resolveLivestockBatch(tenantId, batchName)
        if ('error' in batch) return batch.error
        return `Lote ${batch.ok.name}: ${batch.ok.quantity} cabeças (${batch.ok.category}), peso médio ${batch.ok.averageWeight ?? 'não informado'} kg, piquete ${batch.ok.location ?? 'não informado'}.`
      },
    }),

    registerCertification: tool({
      description: 'Cadastra uma certificação da fazenda (orgânico, GLOBALG.A.P, etc).',
      inputSchema: z.object({
        name: z.string(),
        issuingBody: z.string().optional(),
        expiryDate: z.string().optional().describe('Data YYYY-MM-DD'),
        scope: z.string().optional(),
      }),
      execute: async (args) => {
        try {
          await createCertification({
            name: args.name,
            issuingBody: args.issuingBody,
            expiryDate: args.expiryDate ? new Date(args.expiryDate) : undefined,
            scope: args.scope,
          })
          return `Certificação "${args.name}" cadastrada.`
        } catch (e) {
          return `Não foi possível cadastrar: ${errMsg(e)}`
        }
      },
    }),

    listCertifications: tool({
      description: 'Lista as certificações da fazenda e sua validade.',
      inputSchema: z.object({}),
      execute: async () => {
        const certifications = await getCertifications()
        if (certifications.length === 0) return 'Nenhuma certificação cadastrada.'
        return certifications
          .map((c) => `- ${c.name} (${c.status})${c.expiryDate ? `, vence em ${fmtDate(c.expiryDate)}` : ''}`)
          .join('\n')
      },
    }),
  }
}
