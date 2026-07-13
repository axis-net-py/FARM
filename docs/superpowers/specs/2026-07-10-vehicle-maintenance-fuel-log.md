# Módulo: Manutenção e Combustível de Frota

Primeiro módulo novo da auditoria (`2026-07-10-axis-farm-module-audit.md`, gap crítico #1). Implementação inline direto em `main` (sem branch/worktree, por preferência do usuário).

## Modelo

```prisma
enum VehicleLogType {
  MAINTENANCE
  FUEL
}

model VehicleLog {
  id              String         @id @default(cuid())
  tenantId        String
  tenant          Tenant         @relation(fields: [tenantId], references: [id])
  vehicleId       String
  vehicle         Vehicle        @relation(fields: [vehicleId], references: [id])
  type            VehicleLogType
  date            DateTime
  odometerOrHours Decimal?       @db.Decimal(12, 2)
  employeeId      String?
  employee        Employee?      @relation(fields: [employeeId], references: [id])
  notes           String?
  // combustível
  liters          Decimal?       @db.Decimal(10, 2)
  fuelCost        Decimal?       @db.Decimal(12, 2)
  // manutenção
  description     String?
  maintenanceCost Decimal?       @db.Decimal(12, 2)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([tenantId])
  @@index([vehicleId])
}
```

`Vehicle` ganha `currentReading Decimal? @db.Decimal(12, 2)` e **perde** `lastMaintenance` (campo único sobrescrito, sem histórico — vira derivado da última entrada `MAINTENANCE` do log). `Employee` e `Vehicle` ganham a relation reversa `vehicleLogs VehicleLog[]`.

`type` usa enum real do Prisma (não string livre como os outros status do domínio) porque tem só 2 valores fixos e nunca crescem por tenant — diferente de `status`/`type` livres que variam (ex: tipo de veículo).

## Actions (`src/app/actions/vehicleLog.ts`)

- `getVehicleLogs(vehicleId)` — timeline ordenada por `date desc`, inclui `employee`
- `createVehicleLog(data)` — cria log; se `odometerOrHours` for maior que `vehicle.currentReading` atual, atualiza `Vehicle.currentReading`
- `updateVehicleLog(id, data)`
- `deleteVehicleLog(id)`
- `getFuelConsumption(vehicleId)` — pega logs `FUEL` ordenados por data, calcula consumo entre pares consecutivos (`liters / (odometerOrHours atual - anterior)`), retorna lista de deltas + média. Ignora pares sem leitura em algum dos dois.

`frota.ts` perde as referências a `lastMaintenance` (tipo `VehicleFormData`, `createVehicle`, `updateVehicle`) e ganha `getVehicleById(id)`.

## UI

- `frota/[id]/page.tsx` (novo) — perfil do veículo: card com nome/tipo/placa/status/leitura atual, timeline de `VehicleLog` (ícone diferente por tipo), stat de consumo médio (só aparece com ≥2 abastecimentos com leitura), botão "Novo Registro".
- `VehicleLogSheet.tsx` (novo) — dialog com toggle Manutenção/Abastecimento no topo; campos condicionais (litros+custo combustível vs. descrição+custo manutenção), data, leitura, funcionário (select opcional).
- `VehicleList.tsx` — coluna "Última Manutenção" vira "Leitura Atual" (`currentReading`); nome do veículo vira link pra `frota/${id}`.
- `VehicleSheet.tsx` — remove campo "Última Manutenção".

## Fora de escopo

Edição/exclusão de log fica só via clique no item da timeline (sem view de tabela separada). Relatório agregado de custo de frota fica pra quando entrar "custo por talhão/safra" (proposta #3 da auditoria) — aqui só a timeline por veículo.
