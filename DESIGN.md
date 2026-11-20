---
name: FPGD RN
description: Portal de energia escuro da Frente Potiguar de Geração Distribuída — site público e CRM de associados.
colors:
  bg: "#0B0E17"
  sunk: "#090B12"
  panel: "#141925"
  raised: "#1B2130"
  field: "#1F2636"
  panel-over-photo: "#0E1320"
  line: "#283044"
  line-strong: "#36405A"
  fg: "#EEF2F8"
  fg-2: "#AFB8C8"
  fg-3: "#7F899C"
  primary: "#2F8CFF"
  primary-hover: "#4C9DFF"
  energy: "#22DDA4"
  cyan: "#12D4E6"
  on-energy: "#04131F"
  energy-stop-1: "#1BFBB6"
  energy-stop-2: "#00DEEA"
  energy-stop-3: "#2B7CFF"
  st-inscrito: "#4CC3FF"
  st-ativo: "#2BD99F"
  st-inadimplente: "#FFA43A"
  st-inativo: "#8C95A8"
  st-cancelado: "#F2626E"
  ok: "#2BD99F"
  warn: "#FFA43A"
  danger: "#F2626E"
  danger-text: "#FF8B95"
  nps-5: "#198754"
  nps-4: "#84CC16"
  nps-3: "#FACC15"
  nps-2: "#F59E0B"
  nps-1: "#EF4444"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4.25rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.03em"
    fontFeature: "'tnum' 1, 'cv11' 1"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 3.4vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  page-title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
  lede:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' 1, 'cv11' 1"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  skeleton: "8px"
  control: "10px"
  panel: "16px"
  pill: "999px"
spacing:
  gutter-sm: "20px"
  gutter-md: "32px"
  stack-sm: "12px"
  stack-md: "24px"
  section: "96px"
  section-md: "128px"
  container: "1280px"
  container-app: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.energy-stop-2}"
    textColor: "{colors.on-energy}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.fg}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    textColor: "{colors.fg-2}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.fg}"
  button-danger:
    textColor: "{colors.danger-text}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-sm:
    padding: "0 12px"
    height: "32px"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  label:
    textColor: "{colors.fg-2}"
    typography: "{typography.label}"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
  kanban-card:
    backgroundColor: "{colors.raised}"
    rounded: "{rounded.control}"
    padding: "12px"
  chip:
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "24px"
  nav-item:
    textColor: "{colors.fg-2}"
    height: "44px"
    padding: "0 12px 0 20px"
  nav-item-active:
    backgroundColor: "{colors.energy-stop-2}"
    textColor: "{colors.on-energy}"
---

# Design System: FPGD RN

## Overview

**Creative North Star: "A Sala de Controle da Usina"**

O sistema é um portal de energia escuro, preciso e calmo, no padrão da categoria (monitoramento solar) executado com a régua do portal elekeeper da SAJ. O chão é um azul-marinho profundo; tudo o que existe são painéis tonais um degrau mais claros, linhas finas e texto quase branco. A cor viva aparece pouco e com função: um único degradê de energia (verde-água, ciano, azul) marca onde o usuário está e o que ele deve fazer em seguida. O resto da informação cromática é dado — status de associado e notas NPS — e nunca se confunde com marca.

O site público alterna fotografia real de usinas (Unsplash, procedência em `src/components/landing/media.ts`) com painéis de dado sobre ela; o CRM é denso, de tabela e Kanban, e reaproveita exatamente os mesmos tokens. As duas metades são o mesmo mundo: quem sai do termômetro da home e entra no CRM não percebe mudança de linguagem, só de densidade.

Telas antigas (tickets, usinas, admin) entram neste mundo por uma camada de compatibilidade: dentro de `.legacy`, `src/styles/legacy.css` (gerado) reescreve a escala clara do Tailwind (slate/gray/green…) para os neutros escuros, e `index.css` troca os verdes e pretos antigos pelo degradê e pelos tokens. Essa camada não é fonte de tokens; superfícies novas usam só os tokens deste arquivo.

Profundidade vem de camadas tonais e de um brilho de canto suave nos painéis-chave, não de sombras. Rejeições confirmadas pela direção: a manchete centralizada sobre foto com fileira de cards embaixo, e o visual claro/verde anterior.

**Key Characteristics:**
- Chão escuro `#0B0E17` com painéis tonais em três degraus (panel, raised, field) e bordas de 1px.
- Um degradê de energia, só em item ativo e ação primária.
- Manrope 400–800 com numerais tabulares ligados globalmente.
- Painéis 16px, controles 10px, chips em pílula.
- Cores de status e de NPS são cores de dado, com significado fixo.
- Sem sombras em superfícies; brilho de canto é o único efeito atmosférico.

## Colors

Um chão marinho quase preto, neutros frios em degraus curtos, e acentos saturados que existem para orientar ou para carregar dado.

### Primary
- **Degradê de Energia** (112°, `#1BFBB6` → `#00DEEA` 38% → `#2B7CFF`): preenchimento do botão primário, do item ativo da navegação lateral, da barra de 3px sob a aba ativa e do traço do logo. Texto sobre ele é sempre Tinta Sobre Energia (`#04131F`).
- **Degradê de Energia Suave** (mesmas paradas a 18%): fundo do item ativo em subnavegação secundária (menu de Configurações do CRM).
- **Azul Sinal** (`#2F8CFF`, hover `#4C9DFF`): links de texto, anel de foco dos campos (`0 0 0 3px` a 20%), série única de gráficos de barra, seleção de texto a 35%.

### Secondary
- **Verde Energia** (`#22DDA4`): ícones de linha em blocos de conteúdo do site e texto de destaque nas telas legadas remapeadas. Nunca preenchimento de área.
- **Ciano Cursor** (`#12D4E6`): contorno de `:focus-visible` (2px, offset 2px) e cor do cursor de digitação.

### Neutral
- **Marinho Profundo** (`#0B0E17`): fundo da página inteira.
- **Marinho Afundado** (`#090B12`): barra lateral e cabeçalho móvel do CRM, um degrau abaixo do chão.
- **Painel** (`#141925`): superfície padrão de cartão, modal lateral, colunas.
- **Painel Elevado** (`#1B2130`): botão secundário, cartão do Kanban, tooltip de gráfico, hover de item.
- **Campo** (`#1F2636`): fundo de input, select, controle segmentado.
- **Vidro Sobre Foto** (`#0E1320` a 85–90% com desfoque): somente painéis que flutuam sobre fotografia.
- **Linha** (`#283044`) e **Linha Forte** (`#36405A`): bordas de 1px em repouso e em hover; grade de gráficos.
- **Texto** (`#EEF2F8`), **Texto 2** (`#AFB8C8`), **Texto 3** (`#7F899C`): título/valor, corpo e rótulo, metadado/placeholder.

### Status do associado (dado)
- **Inscrito** (`#4CC3FF`), **Ativo** (`#2BD99F`), **Inadimplente** (`#FFA43A`), **Inativo** (`#8C95A8`), **Cancelado** (`#F2626E`). Aplicados como cor de texto + borda `currentColor` do chip, ponto de 6px e realce da coluna do Kanban. `ok`, `warn` e `danger` reutilizam os mesmos valores para feedback de sistema; o texto de perigo sobre fundo tingido usa `#FF8B95` para legibilidade.

### NPS 1–5 (dado)
- **5 Excelente** (`#198754`), **4 Bom** (`#84CC16`), **3 Neutro** (`#FACC15`), **2 Ruim** (`#F59E0B`), **1 Péssimo** (`#EF4444`), por faixa da média (≥4,5 / ≥3,5 / ≥2,5 / ≥1,5 / >0). Usados em barras, anéis e rótulos do Termômetro. Sem dado: Texto 3.

### Named Rules
**The Uma Corrente Rule.** O degradê de energia aparece em no máximo dois papéis por tela: onde estou (item/aba ativa) e o que faço agora (ação primária). Nunca em dado, nunca em texto, nunca em ícone solto, nunca como fundo de seção.

**The Dado Não É Marca Rule.** Cores de status e de NPS têm significado fixo e só aparecem amarradas ao dado que representam. Não use o verde NPS-5 ou o verde de Ativo como acento decorativo.

**The Degrau Tonal Rule.** Hierarquia de superfície é bg → panel → raised → field, sempre clareando um degrau. Não invente cinzas intermediários.

## Typography

**Display Font:** Manrope (com ui-sans-serif, system-ui, Segoe UI)
**Body Font:** Manrope
**Label/Mono Font:** Manrope com `tnum`; não há fonte mono.

**Character:** Uma única família geométrica-humanista em pesos fortes: 800 com tracking negativo para manchetes, 700 para títulos e valores, 600 para rótulos. Numerais tabulares (`'tnum' 1, 'cv11' 1` no `:root`) deixam contagens, notas e valores alinhados em colunas.

### Hierarchy
- **Display** (800, clamp(2.25rem, 5vw, 4.25rem), 1.04, -0.03em, `text-balance`): manchete do hero, uma por página, alinhada à esquerda em 2–3 linhas.
- **Headline** (800, clamp(1.875rem, 3.4vw, 2.75rem), 1.1, -0.025em): título de seção do site público; a chamada de adesão sobe até 3rem.
- **Page Title** (800, 1.5rem, tracking apertado): título de página do CRM, com descrição em Body 2 (`fg-2`, até ~42rem).
- **Title** (700, 1.125–1.25rem): título de painel, bloco ou modal lateral.
- **Lede** (400, 1.125rem, 1.625, `fg-2`, 52–60ch): parágrafo de abertura de seções públicas. Corpo corrido do site usa 15px.
- **Body** (400–600, 0.875rem, 1.5): texto do CRM, tabelas, campos, botões (700).
- **Label** (600, 0.8125rem, `fg-2`): rótulo acima de campo.
- **Caption** (600–700, 0.75rem, `fg-3`): metadado, contagem, chip, título de grupo da navegação. Sempre em caixa normal.

### Named Rules
**The Numeral Tabular Rule.** Todo número que se compara com outro (notas, contagens, valores, porcentagens) é tabular e em peso 700. Decimais em vírgula (`4,2`).

**The Caixa Normal Rule.** Rótulos, grupos de navegação e cabeçalhos de coluna ficam em caixa normal, sem tracking aberto. Hierarquia vem de peso e cor, não de versalete.

## Layout

O site público usa um container de 1280px com gutter de 20px (móvel) e 32px (≥768px); seções respiram 96px no móvel e 128px no desktop. Composições são assimétricas e alinhadas à esquerda: hero com texto + painel de 400px à direita, Sobre em 1fr / 1.05fr, Pauta com coluna fixa de 380px e conteúdo fluido. A chamada de adesão é uma faixa quase sangrada (1400px, margem de 12–20px) com foto e raio de 24px. O cabeçalho é fixo, 72px, transparente sobre o hero e sólido (`bg` a 95% com desfoque) após rolar.

O CRM é um shell de barra lateral de 264px (`sunk`) com conteúdo rolável em container de 1440px, gutter 16/32px e topo 24/32px. Abaixo de 1024px a barra vira gaveta e surge um cabeçalho de 56px. O Kanban rola horizontalmente com snap em colunas de 280px até 1280px, quando as colunas se distribuem (mín. 196px). Ritmo interno: 12px entre itens próximos, 20–24px entre grupos, padding de painel 16–24px. Breakpoints padrão do Tailwind (640 / 768 / 1024 / 1280).

## Elevation & Depth

O sistema é plano e tonal. Profundidade vem do degrau de superfície (bg → panel → raised → field), de bordas de 1px que clareiam no hover, e do brilho de canto: duas radiais suaves (verde-água 16% e azul 14%) ancoradas no canto superior direito de painéis-chave — filtro do CRM, cabeçalho do modal do associado, cabeçalho de seção de configuração, termômetro do hero, painel "Por que participar". Sobre fotografia, painéis usam Vidro Sobre Foto com `backdrop-filter: blur` para manter legibilidade.

### Shadow Vocabulary
- **Sobreposição** (`box-shadow: 0 12px 32px -8px rgb(0 0 0 / .6)`): toasts e camadas flutuantes temporárias.
- **Véu de modal** (fundo `rgb(3 5 10 / .7)`): atrás do modal lateral; o painel em si não tem sombra, só borda esquerda.
- **Polegar segmentado** (`box-shadow: 0 1px 2px rgb(0 0 0 / .4)`): única micro-elevação dentro de superfície, no segmento ativo do controle Kanban/Lista.

### Named Rules
**The Sem Sombra Rule.** Superfícies em repouso não têm sombra. Sombra só existe em camada que flutua acima da página (toast, menu, overlay) e no polegar do controle segmentado.

**The Luz de Canto Rule.** O brilho de canto é o único efeito atmosférico: sempre no canto, nunca um halo em volta, nunca em mais de um ou dois painéis por tela.

## Shapes

Três raios e nada mais: painéis e contêineres a 16px, controles (botão, campo, cartão de Kanban, lista, tooltip) a 10px, e pílula (999px) para chips, pontos de status, barras de progresso e avatar. Esqueletos de carregamento usam 8px; o polegar do controle segmentado usa 7px para encaixar dentro do trilho de 10px. Itens ativos da barra lateral são retos à esquerda e arredondados 10px à direita, colados na borda. Bordas são sempre 1px sólidas; tracejado só em estados vazios e em blocos "a fazer" (gerar contrato, criar cobrança). Grades de blocos usam `gap: 1px` sobre `line` para formar divisórias finas dentro de um contêiner de 16px.

## Components

### Buttons
Firmes e compactos, sem enfeite: 40px de altura, 700, ícone de 16px à esquerda.
- **Shape:** controle (10px).
- **Primary:** Degradê de Energia com Tinta Sobre Energia; hover `brightness(1.08)`; ativo `scale(.97)`.
- **Secondary:** Painel Elevado com borda Linha; hover borda Linha Forte e fundo `#222939`.
- **Ghost:** texto Texto 2 sem fundo; hover Texto sobre Painel Elevado. Usado para ícones (sair, menu, excluir).
- **Danger:** `danger` a 12% com borda a 30% e texto `#FF8B95`; hover a 20%.
- **Small:** 32px, padding 12px, 0.8125rem.
- **Disabled:** opacidade 50%, cursor bloqueado. Transições de 150ms.

### Chips
- **Style:** pílula de 24px, borda 1px `currentColor`, texto Caption 700, ponto de 6px na mesma cor, sem fundo.
- **State:** a cor vem do status do associado (ou do estado do contrato: rascunho `fg-3`, enviado `inadimplente`, assinado `ativo`, recusado `cancelado`).

### Cards / Containers
- **Corner Style:** painel (16px).
- **Background:** Painel; Painel Elevado para blocos internos; Vidro Sobre Foto sobre imagem.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Border:** 1px Linha; Linha Forte no hover de painéis clicáveis.
- **Internal Padding:** 16–24px; 32px em painéis de destaque do site.

### Inputs / Fields
- **Style:** fundo Campo, borda 1px Linha, raio 10px, padding 10×14px, 0.875rem, placeholder Texto 3. Rótulo em Label acima, 6px de distância.
- **Focus:** borda Azul Sinal + anel `0 0 0 3px rgb(47 140 255 / .2)`; hover borda Linha Forte.
- **Disabled:** opacidade 55%.

### Navigation
- **Barra lateral do CRM:** fundo Marinho Afundado, itens de 44px em Body 600 com ícone de 18px; repouso Texto 2, hover Texto sobre Painel Elevado, ativo em Degradê de Energia com Tinta Sobre Energia, raio só à direita. Grupos com título Caption em Texto 3. Rodapé com avatar inicial, nome e papel.
- **Abas:** texto 600; a aba ativa ganha uma barra de 3px em Degradê de Energia, pílula, colada à borda inferior.
- **Controle segmentado:** trilho Campo com borda, segmentos de 32px; ativo em Painel Elevado com o polegar segmentado.
- **Cabeçalho público:** 72px, logo + links Texto 2, transparente sobre o hero e sólido com desfoque após rolagem.

### Termômetro (signature)
Painel de dado ao vivo: título Body 700, contagem tabular em Caption, linhas em grade `84px / 1fr / 34px` com canal, barra de 8px em pílula (trilho Painel Elevado, preenchimento na cor NPS da média) e nota tabular 700 com vírgula. Rodapé com a porcentagem de desacordo e link Azul Sinal com seta. Sobre foto ele usa Vidro Sobre Foto e brilho de canto; enquanto carrega, as barras são esqueletos.

### Modal lateral do associado
Folha à direita de até 760px, Painel com borda esquerda Linha sobre véu de 70%, entrada de 240ms `cubic-bezier(.23,1,.32,1)`. Cabeçalho com brilho de canto, título Title 800, abas com barra de energia.

## Do's and Don'ts

### Do:
- **Do** usar o Degradê de Energia só no item ativo e na ação primária, com texto `#04131F` por cima.
- **Do** construir hierarquia com o degrau tonal bg → panel → raised → field e bordas de 1px.
- **Do** manter os três raios: 16px painéis, 10px controles, pílula para chips e barras.
- **Do** escrever números tabulares em 700, decimais com vírgula.
- **Do** usar as cores de status e NPS exatamente pelos seus limiares, e Texto 3 para ausência de dado.
- **Do** pôr Vidro Sobre Foto (`#0E1320` a 85–90% com desfoque) em qualquer painel que flutue sobre fotografia.
- **Do** usar fotos reais de usinas e instalações com a procedência registrada em `media.ts`.

### Don't:
- **Don't** usar o degradê em dado, texto, ícone avulso ou fundo de seção.
- **Don't** usar o verde NPS-5 (`#198754`) ou o verde de Ativo como cor de marca.
- **Don't** pôr sombra em painel, cartão ou botão em repouso; sombra é só de sobreposição.
- **Don't** aplicar brilho de canto como halo em volta do painel nem em mais de um ou dois painéis por tela.
- **Don't** centralizar a manchete sobre foto com uma fileira de cards embaixo.
- **Don't** usar rótulos em caixa alta com tracking aberto, nem sobretítulos acima de manchetes.
- **Don't** voltar ao fundo claro ou à paleta verde antiga; telas legadas são adaptadas pela camada `.legacy`, não o contrário.
