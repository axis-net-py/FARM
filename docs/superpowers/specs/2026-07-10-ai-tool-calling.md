# IA com Tool-Calling Real (9 módulos novos)

## Decisões (via perguntas ao usuário)

- **Arquitetura**: reescreve pro padrão do Clinic (Vercel AI SDK: `ai` + `@ai-sdk/google`, `tool()`+zod, `generateText` com `tools`+`stopWhen: stepCountIs(8)`). Substitui o classificador single-shot atual só na branch de texto puro.
- **Fluxos especiais intocados**: diagnóstico de imagem de folha e importador de fatura PDF continuam exatamente como estão — são branches separadas em `route.ts` (`activePurpose === "diagnostic"` / `"invoice"`, disparadas só quando há `file`/`image` no body). A nova engine só substitui a branch `if (text)` (linhas 641-986 do arquivo atual), que só roda quando não há arquivo anexado.
- **Escopo de cobertura**: só os 9 módulos novos (frota/log, talhão/aplicação/solo/irrigação, safra/rentabilidade, silo, rebanho, certificação) — que hoje têm ZERO cobertura de IA. Os 11 actions antigos (clientes/fornecedores/produtos/faturas/financeiro/safra-cadastro/talhão-cadastro/veículo-cadastro/funcionário-cadastro/contrato-cadastro) **continuam existindo tal como estão** numa segunda passada da engine antiga dentro do mesmo endpoint, não migram nesta rodada — para não regredir nada que já funciona no chat de texto hoje.

## Como as duas engines coexistem na mesma branch `if (text)`

A nova engine (tool-calling) roda primeiro. Se nenhuma tool for chamada e o modelo responder só texto (ex: usuário pediu "cadastrar um cliente" — algo que só a engine antiga cobre), a resposta final da engine nova já cobre isso como conversa; mas para não perder a capacidade de *executar* os 11 cadastros antigos, a branch antiga permanece como um **tool adicional só de fallback**: se o texto do usuário não corresponder a nenhuma tool nova E a engine antiga (classificador JSON) reconhecer uma das 11 ações fixas, executa por ela. Ou seja: tenta tools novas primeiro (mais expressivas, multi-step); se não casar com nada, cai pro classificador antigo. Nenhum comando que funciona hoje deixa de funcionar.

## Tools novas (`src/lib/ai/tools.ts`, `buildFarmTools(tenantId)`)

Resolução por nome (contains, case-insensitive) igual ao Clinic — ambiguidade retorna texto pro modelo perguntar ao usuário.

- **Frota**: `logVehicleEvent` (manutenção ou combustível, chama `createVehicleLog`), `getVehicleHistory` (chama `getVehicleLogs`+`getFuelConsumption`)
- **Talhão**: `registerPlotApplication` (chama `createPlotApplication`), `registerSoilAnalysis` (chama `createSoilAnalysis`), `registerIrrigation` (chama `createIrrigationEvent`), `getPlotHistory` (aplicações+solo+irrigação combinados)
- **Safra**: `getHarvestProfitability` (chama a action existente)
- **Silo**: `registerSiloMovement` (chama `createSiloMovement`), `getSiloStatus` (lista silos com ocupação)
- **Rebanho**: `registerLivestockEvent` (pesagem/sanidade/movimentação, chama `createLivestockEvent`), `getLivestockBatchStatus`
- **Certificação**: `listCertifications`, `registerCertification` (chama `createCertification`)

Todas as tools reusam as server actions já existentes (nenhuma lógica de banco duplicada) — só resolução de nome + chamada + formatação da resposta em texto, igual ao `tools.ts` do Clinic.

## Model

`src/lib/ai/model.ts` — mesmo padrão do Clinic: `createGoogleGenerativeAI({apiKey: process.env.GEMINI_API_KEY})`, modelo `gemini-2.5-flash`.

## Verificação

Sem streaming de UI (mantém o contrato JSON `{message, action}` que `AIAssistant.tsx` já consome, pra não precisar reescrever o componente de 403 linhas com voz/upload/diagnóstico). `generateText` (não `streamText`) — resposta final vira `data.message` normal. `tsc --noEmit` + teste manual de prompt cobrindo pelo menos 1 tool de cada módulo novo, com servidor rodando (precisa de `GEMINI_API_KEY` real — sem chave configurada localmente, verificação fica limitada a compilação/tipos, igual módulos anteriores sem DB).
