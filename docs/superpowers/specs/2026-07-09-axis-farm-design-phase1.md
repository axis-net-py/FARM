# AXIS Farm — Fase 1: Fundação Visual Awwwards (Campo Verde Moderno)

## Contexto

Projeto (ex-AURELIUS) renomeado para **AXIS Farm**, repo `axis-net-py/FARM` (mesmo repo do AURELIUS, renomeado no GitHub — GitHub redireciona a URL antiga, sem necessidade de reclonar). Fork agrícola do Cooper ERP, já com módulos de fazenda (Harvest/Plot/Vehicle/Employee/Contract), IA (Gemini, ações fixas) e i18n parcial (11/84 componentes usam `useLanguage()`).

Esta é a primeira de 4 frentes independentes pedidas pelo usuário:
1. **Fundação visual awwwards (este spec)**
2. Auditoria de módulos + módulos novos de gestão de fazenda + melhorias nos existentes
3. IA com tool-calling real, capaz de executar qualquer função do sistema
4. Bilíngue PT/ES completo em todos os módulos

Cada frente vira seu próprio spec + plano, seguindo o padrão usado no fork AXIS Clinic (6 fases sequenciais, cada uma com mudança visível).

## Objetivo desta fase

Replicar o polimento estético "awwwards" aplicado no AXIS Clinic (Fase 1 + Fase 6 de polish) na variante AXIS Farm, com identidade agrícola própria — sem herdar cores/nome do Clinic.

## Paleta — "Campo Verde Moderno"

### Light (`:root`)
- `--background: #faf8f4` (creme, mesmo tom base do Clinic)
- `--foreground: #22302c`
- `--card: #ffffff`
- `--primary: #1f4d3a` (verde-campo profundo — evolução do atual `#004225`, mais "campo" que corporate)
- `--primary-foreground: #ffffff`
- `--secondary: #f1efe9`
- `--muted: #f5f3ed` / `--muted-foreground: #6b7671`
- `--accent: #eef2ee`
- `--border/--input: #e5e1d8`
- `--ring: #1f4d3a`
- Acentos próprios: `--harvest-gold: #a98e5b` / `--harvest-gold-light: #c4ad7f` (dourado-colheita, reaproveita tokens gold já existentes no legado Cooper), `--sage: #5c7a6a` (estados/badges secundários)

### Dark (`.dark`) — **verde escuro, não sage-claro**
- `--background: #0d1410` (quase-preto, tingido de verde)
- `--foreground: #edf0ec`
- `--card: #131a15`
- `--primary: #2f6b4a` (verde-floresta médio — permanece na família "verde escuro", diferente do Clinic que clareia o primary no dark; aqui o primary NÃO vira sage-claro/mint)
- `--primary-foreground: #eef7f0`
- `--muted: #1a221c` / `--muted-foreground: #9aa69e`
- `--border/--input: #26302a`
- `--ring: #2f6b4a`
- `--harvest-gold: #b8a068` / `--sage: #4a6b5a`

## Tipografia

- Fraunces (serif) em h1/h2, peso 600, letter-spacing negativo — igual ao Clinic (consistência de família AXIS entre variantes, decisão do usuário).
- Geist Sans mantido no corpo (já em uso).

## Micro-interação (portar 1:1 do Clinic `globals.css`)

- `@keyframes fade-up` + `.animate-fade-up`
- `.hover-lift` (translateY -2px, shadow, border-color mix com primary)
- Refino de `.axis-btn-primary` e `button.bg-primary`/`.bg-primary`: borda inferior mais escura + inset highlight, active state com `color-mix`
- `@media (prefers-reduced-motion: reduce)` desativa tudo acima

## Favicon

Substituir `src/app/icon.svg` atual (ainda é o "C" dourado herdado do Cooper — nunca foi trocado nem na variante Clinic). Novo ícone: mesma técnica de construção (rect arredondado com gradiente de fundo + glifo com gradiente dourado), mas:
- Gradiente de fundo: verde-campo escuro (`#0f2b1e` → `#04130c`)
- Glifo: forma de folha/trigo estilizada em gradiente dourado (`--harvest-gold`), substituindo a letra "C"

## Telas com redesign dedicado

- **Login**: tratamento premium claro, mesmo padrão do Clinic, copy/ícone trocados para AXIS Farm
- **Sidebar**: paleta nova + Fraunces no branding "AXIS Farm", ordem de módulos mantida
- **Dashboard**: KPIs com `hover-lift` + `fade-up`; `WeatherCard` existente recebe só os tokens novos (sem redesenhar lógica)

## Fora de escopo (frentes futuras)

- Novos módulos de fazenda, melhorias funcionais em módulos existentes
- Reescrita da IA para tool-calling real
- Cobertura bilíngue completa
- Pasta `src/app/(dashboard)/[tenantId]/testes` — flagada como possível leftover de dev, não removida aqui (confirmar com usuário antes de deletar)
- Renomear pasta local `AURELIUS-repo` / atualizar remote git — cosmético, não bloqueia esta fase

## Verificação

- `prisma generate` + `tsc --noEmit` antes de push
- Dev server local, checar light/dark, checar `prefers-reduced-motion`, checar contraste do texto em cards (histórico do repo mostra retrabalho de contraste em light mode — evitar repetir)
