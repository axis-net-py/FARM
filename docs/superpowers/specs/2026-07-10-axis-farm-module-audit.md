# AXIS Farm — Auditoria de Módulos e Propostas (2026-07-10)

Auditoria funcional (não só inventário de arquivos) dos 13 módulos existentes + IA + gaps de domínio agrícola. Sem código nesta rodada — só levantamento e priorização, para o usuário escolher o que entra em spec+plano em seguida.

## Modelos Prisma agrícolas (todos flat, sem tabelas-filhas)

- **Harvest**: name, cropType (string livre), startDate/endDate, status. Sem yield/produção.
- **Plot**: name, area, unit, currentCrop (string livre), status, harvestId. Sem geolocalização, solo, irrigação.
- **Vehicle**: name, type (string livre), plate, status, **um único** `lastMaintenance` (sobrescrito, sem histórico).
- **Employee**: name, role (string livre), phone, status. Sem folha, sem vínculo a talhão/veículo.
- **Contract**: contractNumber, harvestId, siloName (string livre — silo do comprador), grainType, quantity, pricePerUnit, status (tudo-ou-nada, sem entrega parcial).

## Gaps por módulo (existentes)

| Módulo | Severidade | Gap |
|---|---|---|
| frota | **Crítico** | Manutenção é 1 campo de data sobrescrito — zero histórico, zero combustível, zero horímetro/GPS, zero vínculo a operador |
| talhoes | **Crítico** | Sem geolocalização/polígono, sem solo, sem histórico de aplicação (defensivo/adubo), sem custo próprio |
| contratos | Importante | Status tudo-ou-nada (sem entrega parcial), desconectado de CommercialInvoice/Transaction (não fecha o ciclo financeiro) |
| accounting | Importante | Sem centro de custo por talhão/safra — impossível responder "esse talhão deu lucro?" |
| safra | Importante | Sem produção/yield colhido, sem custo de insumo por safra |
| reports | Importante | Tipo `contratos` não existe na lista de relatórios (só sales/purchases/inventory/harvests/plots/vehicles/employees) |
| funcionarios | Médio | Sem CPF/documento, sem vínculo a talhão/veículo, sem licença de aplicação fitossanitária |
| products | Médio | Grão colhido e insumo comprado são o mesmo model genérico — sem distinção, sem grau/umidade/lote |
| settings | Médio | Sem perfil da propriedade (região, tipo de solo, coordenadas) — pré-requisito de várias propostas abaixo |

## Domínios ausentes por completo

Confirmado por busca no repo inteiro — nenhum resquício de: análise de solo, irrigação, aplicação fitossanitária registrada (só um diagnóstico de imagem avulso via IA, sem registro), pecuária, manutenção de máquinas, consumo de combustível, histórico/previsão de clima (WeatherCard é só condição atual), custo por talhão, certificação/rastreabilidade, estoque de grão distinto de produto genérico.

## Propostas de módulos novos (priorizadas)

1. **Manutenção e Combustível de Frota** — tabela filha de Vehicle (eventos de manutenção + abastecimento), horímetro/odômetro. Resolve o gap crítico #1. Esforço médio.
2. **Aplicações por Talhão** (fitossanitário/adubação) — registra consumo de insumo (Product) por Talhão+Safra, com data/dose/operador. Habilita rastreabilidade e é pré-requisito do custo-por-talhão. Esforço médio-alto.
3. **Custo e Rentabilidade por Talhão/Safra** — tag opcional `plotId`/`harvestId` em Transaction/JournalEntry + relatório de P&L por talhão. Maior valor estratégico do lote, mas depende de #2 pra ficar completo. Esforço alto.
4. **Estoque de Grão/Silo** — model próprio (capacidade, umidade, grau, lote), fecha o ciclo Safra → Silo → Contrato. Esforço médio.
5. **Clima — histórico e alertas** — persiste previsão multi-dia e histórico de chuva por região do talhão, não só condição atual. Esforço médio.
6. **Manejo de Solo** — registro de análise (pH, nutrientes, data, recomendação) por talhão. Fundação agronômica, mas sem urgência imediata. Esforço baixo-médio.
7. **Pecuária/Rebanho** — só relevante se a operação real do usuário tiver gado misto com agricultura. Perguntar antes de priorizar. Esforço alto (model novo do zero).
8. **Rastreabilidade/Certificação** (orgânico, GLOBALG.A.P) — relevante principalmente pra operação de exportação. Baixa prioridade a menos que seja requisito comercial atual.
9. **Irrigação** — baixa prioridade se a operação for sequeiro (comum em soja/milho no Paraguai); perguntar antes de descartar.

## Cobertura da IA (frente futura, só registrando aqui)

route.ts na verdade já tem **11 ações de criação** (não 8 como pensei na Fase 1) + chat + diagnóstico = 13 branches, cobrindo safra/talhões/frota/funcionários/contratos/produtos/clientes/fornecedores/financeiro/faturas. **Zero cobertura**: dashboard, reports, settings. NLP local (sem Gemini) só cobre 5 das 11 ações. Fica para a frente "IA tool-calling real".

## Quick wins (baixo esforço, alto valor perceptível)

- Adicionar tipo `contratos` na lista de relatórios (1 linha de config + query)
- Campo de entrega parcial em Contract (quantidade entregue vs pendente)
- Perfil da propriedade em settings (região/coordenadas) — habilita #5 e #6 depois
