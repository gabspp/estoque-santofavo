# Design Spec — Fichas Técnicas Santo Favo

Sistema de design para o projeto **fichas-tecnicas** (Next.js + Tailwind + Supabase). Este documento substitui qualquer estilização Tailwind genérica anterior e define os tokens, componentes e padrões visuais que toda a UI deve seguir.

A linguagem visual é derivada da identidade impressa do Santo Favo (cardápio, embalagens) e otimizada para uso prático na cozinha — funcional primeiro, decorativo só onde traz utilidade.

---

## 1. Princípios

1. **Funcional acima de bonito.** Densidade alta, hierarquia clara, decoração só onde serve à leitura.
2. **DNA da marca via paleta + tipografia + leader dots.** Sem logo, sem ornamentos. A marca aparece pelo conjunto, não por elementos isolados.
3. **Marrom sobre creme, não preto sobre branco.** Não usar `text-black`, `bg-white` ou `text-gray-*` em lugar nenhum.
4. **Amarelo é acento, não primary.** Reservado para: estrela de favorito, tag "conferir", dot no eyebrow, links sutis. Nunca como cor de botão de ação.
5. **Rules (linhas finas) em vez de sombras.** Hierarquia se constrói por tipografia, espaçamento e linhas — não por shadows ou cards elevados.
6. **Light e dark com a mesma identidade.** Dark mode inverte (creme → marrom muito escuro, marrom → creme), mas mantém amarelo como acento.

---

## 2. Tokens

### 2.1 Cores

Cores da marca (não usar direto na UI — usar os tokens semânticos abaixo):

```css
--brand-yellow:         #FFCC1C;  /* Pantone 116C - Amarelo */
--brand-marrom-escuro:  #72381C;  /* Pantone 724C - Marrom Escuro */
--brand-marrom:         #8C4820;  /* Pantone 724C - Marrom */
--brand-rosa:           #FF4D79;  /* Pantone 1915C - Rosa */
--brand-verde:          #96CC70;  /* Pantone 1915C - Verde */
--brand-roxo:           #A890CC;  /* Pantone 271C - Roxo */
```

Tokens semânticos (usar sempre estes na UI):

```css
/* Light theme - default */
:root {
  --bg:        #F8F1E0;  /* fundo principal, creme */
  --bg-soft:   #F2E9D2;  /* fundo um tom abaixo (sidebar, inputs) */
  --bg-card:   #FBF6E9;  /* cards, variants, scale bg */
  --bg-hover:  rgba(114, 56, 28, 0.06);

  --ink:        #72381C; /* tinta principal - todos os textos */
  --ink-soft:   #8C4820; /* tinta secundária */
  --ink-muted:  #A88560; /* labels, captions, metadados */

  --rule:       rgba(114, 56, 28, 0.5);   /* linhas de seção */
  --rule-soft:  rgba(114, 56, 28, 0.15);  /* divisores sutis */
  --dot:        #B0905F; /* leader dots */

  --accent:     #FFCC1C; /* amarelo - apenas acento */
}

/* Dark theme */
[data-theme="dark"] {
  --bg:        #1A130B;
  --bg-soft:   #221A10;
  --bg-card:   #251C12;
  --bg-hover:  rgba(242, 226, 194, 0.06);

  --ink:        #F2E2C2;
  --ink-soft:   #D8BE91;
  --ink-muted:  #8A745B;

  --rule:       rgba(216, 190, 145, 0.4);
  --rule-soft:  rgba(216, 190, 145, 0.15);
  --dot:        #6B4D2A;

  --accent:     #FFCC1C;
}
```

**Cores secundárias** (rosa, verde, roxo) são reservadas para uso em **categorias de receita** ou **estados** no futuro (não usar agora).

### 2.2 Tipografia

Fontes (Google Fonts):

```html
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..500&family=DM+Sans:opsz,wght@9..40,400..700&display=swap" rel="stylesheet">
```

- **Newsreader** — substituta da Pipo (fonte da marca, Carbono Type). Usar apenas para headings (h1, h2) e ênfases italic.
- **DM Sans** — substituta da Fig Grotesk (fonte da marca). Usar para body, UI, labels.

> Se o Santo Favo licenciar Pipo + Fig Grotesk no futuro, basta trocar `font-family` nos tokens — o sistema continua funcionando.

Stack de fontes:

```css
--font-serif: "Newsreader", Georgia, serif;
--font-sans:  "DM Sans", system-ui, -apple-system, sans-serif;
```

Escala tipográfica (mobile-first, responsiva onde indicado):

| Token | Valor | Uso |
|---|---|---|
| `--text-xs`   | 0.7rem  / 11.2px | labels uppercase, captions, eyebrows |
| `--text-sm`   | 0.82rem / 13.1px | UI chrome, breadcrumbs, scale buttons |
| `--text-base` | 0.98rem / 15.7px | body, ingredient rows, step text |
| `--text-md`   | 1.05rem / 16.8px | step numbers (italic Newsreader) |
| `--text-lg`   | 1.2rem  / 19.2px | h3 section heads (sans uppercase) - na verdade pequeno mas com letter-spacing |
| `--text-xl`   | 1.5rem  / 24px   | h2 element heads (Newsreader) |
| `--text-2xl`  | 2.1rem  / 33.6px | h1 recipe title (Newsreader, responsive até 1.75rem mobile) |

Pesos (DM Sans usa optical sizes):
- 400 — body
- 500 — labels, qty values, scale buttons
- 600 — section heads (h3 uppercase), section-head h3
- 700 — strong/emphasis (raro)

Newsreader usa peso 400 (regular) e 500 (medium) com opsz variável.

Line-heights:
- Body: `1.55`
- Headings: `1.1` (apertado)
- Steps: `1.55`

### 2.3 Espaçamento

Sistema de 4px base. Tailwind defaults funcionam (`p-1`=4px, `p-2`=8px, etc.) — usar essa escala. Espaçamentos verticais consistentes:

| Token | px | Uso |
|---|---|---|
| `--space-1` | 4px  | gap mínimo |
| `--space-2` | 8px  | gap padrão entre itens |
| `--space-3` | 12px | gap médio |
| `--space-4` | 16px | gap entre seções |
| `--space-6` | 24px | margin entre seções dentro de elemento |
| `--space-8` | 32px | margin entre elementos da receita |
| `--space-12`| 48px | top padding de stage |

### 2.4 Bordas e radii

- `--radius-sm`: 3px — checkboxes
- `--radius-md`: 4px — tags, scale buttons internos
- `--radius-lg`: 6px — scale wrapper, variant cards, icon buttons
- `--radius-pill`: 100px — usado apenas para o switcher de escala (ver componente abaixo)

**Bordas:** sempre 1px solid. Usar `--rule` para divisores estruturais e `--rule-soft` para divisores sutis. **Não usar borders coloridas** (nada de border-blue, border-yellow exceto em estados específicos como favorito/conferir).

### 2.5 Sombras

**Não usar sombras.** A hierarquia se constrói por:
- Linhas (rule)
- Diferenças sutis de bg (`--bg`, `--bg-soft`, `--bg-card`)
- Tipografia (peso, tamanho)

Única exceção: a topbar pode usar `backdrop-filter: blur(12px)` com bg semi-transparente quando sticky.

---

## 3. Tailwind config

Estender `tailwind.config.ts` para refletir os tokens. Exemplo:

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:        "var(--bg)",
        "bg-soft": "var(--bg-soft)",
        "bg-card": "var(--bg-card)",
        "bg-hover":"var(--bg-hover)",
        ink:       "var(--ink)",
        "ink-soft":"var(--ink-soft)",
        "ink-muted":"var(--ink-muted)",
        rule:      "var(--rule)",
        "rule-soft":"var(--rule-soft)",
        dot:       "var(--dot)",
        accent:    "var(--accent)",
        brand: {
          yellow:        "#FFCC1C",
          "marrom-escuro": "#72381C",
          marrom:         "#8C4820",
          rosa:           "#FF4D79",
          verde:          "#96CC70",
          roxo:           "#A890CC",
        },
      },
      fontFamily: {
        serif: ['"Newsreader"', "Georgia", "serif"],
        sans:  ['"DM Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        xs:   ["0.7rem",  { lineHeight: "1.4" }],
        sm:   ["0.82rem", { lineHeight: "1.45" }],
        base: ["0.98rem", { lineHeight: "1.55" }],
        md:   ["1.05rem", { lineHeight: "1.5" }],
        lg:   ["1.2rem",  { lineHeight: "1.4" }],
        xl:   ["1.5rem",  { lineHeight: "1.15" }],
        "2xl":["2.1rem",  { lineHeight: "1.1" }],
      },
      borderRadius: {
        sm: "3px",
        md: "4px",
        lg: "6px",
        pill: "100px",
      },
      letterSpacing: {
        wider: "0.1em",
        widest: "0.18em",
        ultra: "0.22em",
      },
    },
  },
} satisfies Config;
```

Globals CSS (`app/globals.css`) deve definir os tokens em `:root` e `[data-theme="dark"]` conforme seção 2.1, e importar as fontes via `<link>` no `<head>` ou via `next/font`.

---

## 4. Componentes-base

### 4.1 Botão Ícone (`<IconButton>`)

Para ações de UI como editar, imprimir, favoritar.

```tsx
<button className="
  w-[34px] h-[34px] rounded-md
  inline-flex items-center justify-center
  text-ink-soft hover:text-ink hover:bg-bg-hover
  transition-colors
  text-[0.95rem]
">
  ✎
</button>
```

Estado favorito ativo: `text-accent` (amarelo).

### 4.2 Botão Texto (`<Button>`)

Para ações com label visível. Pílula com borda fina.

```tsx
<button className="
  px-5 py-2.5 rounded-pill
  border border-ink text-ink
  font-medium text-xs uppercase tracking-wider
  hover:bg-ink hover:text-bg transition-colors
">
  Editar
</button>
```

**Não usar amarelo como bg de botão padrão.** Botões primários são marrom (`bg-ink text-bg`).

### 4.3 Tag

Categorias e tags da receita.

```tsx
<span className="
  inline-block px-2 py-0.5 rounded-md
  border border-rule-soft bg-bg-card
  text-xs font-medium text-ink-soft
">
  Salgados
</span>
```

### 4.4 Tag "conferir" (voz da marca)

Para info que precisa revisão — herdou da brincadeira "Pão de ~~mel~~ queijo" do cardápio.

```tsx
<span className="inline-flex items-baseline gap-1">
  <s className="text-ink-muted">60 g</s>
  <span className="
    px-1.5 rounded-sm
    bg-accent/20 text-brand-marrom-escuro
    font-serif italic text-[0.78rem]
  ">conferir</span>
</span>
```

### 4.5 Switcher de Escala

Pílula horizontal com botões internos. Único componente que usa border-radius pill.

```tsx
<div className="
  inline-flex items-center p-0.5 rounded-pill
  border border-rule bg-bg-card
">
  <button className="px-3 py-1.5 rounded-md text-sm font-medium text-ink-soft hover:text-ink">0,5×</button>
  <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-ink text-bg">1×</button>
  <button className="px-3 py-1.5 rounded-md text-sm font-medium text-ink-soft hover:text-ink">2×</button>
  <button className="px-3 py-1.5 rounded-md text-sm font-medium text-ink-soft hover:text-ink">3×</button>
</div>
```

---

## 5. Padrões de layout

### 5.1 Topbar (sticky)

Header sticky com breadcrumb à esquerda e ações à direita. Background semitransparente com blur.

```tsx
<header className="
  sticky top-0 z-50
  px-5 py-2.5
  bg-bg/90 backdrop-blur-md
  border-b border-rule-soft
">
  <div className="max-w-[1040px] mx-auto flex items-center justify-between gap-4">
    {/* Breadcrumbs */}
    {/* Actions */}
  </div>
</header>
```

### 5.2 Stage / container

Largura máxima fixa em 760px para a ficha de receita. Conteúdo mais largo (lista de fichas, dashboard) pode ir até 1040px.

```tsx
<main className="max-w-[760px] mx-auto px-5 pt-8 pb-16">
  ...
</main>
```

### 5.3 Section heads (3 níveis)

Três níveis de cabeçalho com tratamento distinto:

**H1 — Título da receita** (Newsreader, ~2.1rem, peso 500)
```tsx
<h1 className="font-serif font-medium text-2xl leading-[1.1] tracking-tight text-ink">
  Pasta de Tomate
</h1>
```

**H2 — Elemento da receita** (Newsreader, ~1.5rem, peso 500)
```tsx
<h2 className="font-serif font-medium text-xl tracking-tight text-ink">
  Massa
</h2>
```

**H3 — Seção dentro de elemento** (DM Sans uppercase, ~0.74rem, peso 600)
```tsx
<h3 className="font-sans font-semibold text-[0.74rem] uppercase tracking-widest text-ink-soft">
  Ingredientes
</h3>
```

H3 sempre vem com border-bottom no container:

```tsx
<header className="flex items-baseline justify-between gap-3 pb-1.5 mb-3 border-b border-rule">
  <h3>...</h3>
  <span className="text-xs text-ink-muted">4 itens</span>
</header>
```

---

## 6. Componentes da Ficha Técnica

### 6.1 Recipe head

Bloco do topo da receita com título, descrição opcional, tags e meta inline.

```tsx
<div className="mb-6 pb-5 border-b border-rule">
  <div className="flex items-baseline justify-between gap-4 flex-wrap mb-2">
    <div>
      <h1>Bolo de Pão de Mel</h1>
      {/* subtítulo opcional, italic */}
      <p className="font-serif italic text-ink-soft -mt-1 mb-2">
        com ganache de chocolate branco caramelizado...
      </p>
    </div>
    <div className="flex gap-1.5 flex-wrap">
      <Tag>Bolos</Tag>
      <Tag>Pão de Mel</Tag>
    </div>
  </div>

  {/* Meta inline */}
  <div className="flex flex-wrap items-center gap-y-2 gap-x-3.5 text-[0.86rem] text-ink-soft">
    <span><MetaKey>Rende</MetaKey><strong>8 bolos P</strong> ou <strong>4 G</strong></span>
    <Sep />
    <span><MetaKey>Tempo</MetaKey><strong>2 h 10</strong></span>
    <Sep />
    <span><MetaKey>Atualizada</MetaKey>15 mai 2026</span>
  </div>
</div>
```

`<MetaKey>` é um span uppercase 0.75rem text-ink-muted com letter-spacing wider e mr-1.
`<Sep />` é um span "·" opacity-50.

### 6.2 Ingredient row (linha de ingrediente — leader dots)

**Padrão de assinatura.** Toda ficha técnica usa esse layout:

```tsx
<div className="flex items-baseline gap-2 py-1.5 text-base">
  <Checkbox /> {/* opcional, ver 6.3 */}
  <span className="text-ink shrink-0">Alho</span>
  <span className="
    flex-1 min-w-[1rem]
    border-b-[1.5px] border-dotted border-dot
    -translate-y-1 opacity-55
  " />
  <span className="text-ink font-medium tabular-nums shrink-0">
    3<span className="font-normal text-ink-soft text-[0.9em] ml-0.5">dentes</span>
  </span>
</div>
```

Variações:

- **`.gosto`** (ingrediente sem qty exata): a quantidade vira italic light, ex: `<span className="italic font-normal text-ink-soft">a gosto</span>`
- **`.sub`** (sub-receita): o nome vira marrom + prefixo ↳ + sublinhado tracejado clicável
- **`.checked`** (riscado): aplicar line-through no nome e na qty, cor ink-muted

### 6.3 Ingredient checkbox

Quadrado 16×16 com border 1.5px. Quando marcado, fundo `--ink` com check branco.

```tsx
<span className="
  w-4 h-4 rounded-sm
  border-[1.5px] border-rule mr-1.5
  cursor-pointer self-center
  data-[checked=true]:bg-ink data-[checked=true]:border-ink
" />
```

### 6.4 Step list (passos)

Lista ordenada com números em Newsreader italic, sem círculo nem badge.

```tsx
<ol className="list-none [counter-reset:step]">
  <li className="
    grid grid-cols-[1.5rem_1fr] gap-x-3.5
    py-2 text-base leading-[1.55] text-ink
    items-baseline
    before:content-[counter(step)_'.'] before:[counter-increment:step]
    before:font-serif before:italic before:text-md
    before:text-ink-muted before:font-medium before:text-right
  ">
    Processar tomate e alho com mixer.
  </li>
</ol>
```

Dentro do texto do passo, usar `<em>` (Newsreader italic ink-soft) para destacar tempos, temperaturas, observações:

```tsx
<li>Cozinhar por <em>aprox. 2 h</em> em fogo médio.</li>
```

### 6.5 Step com sub-lista (peso por forma, etc.)

```tsx
<li>
  Distribuir a massa em formas untadas:
  <ul className="list-none mt-1.5 space-y-1">
    <li className="flex items-baseline gap-1.5 text-[0.94rem] text-ink-soft
                   before:content-['—'] before:text-ink-muted">
      <strong className="text-ink font-medium">8 formas de 15 cm</strong> · 260 g em cada
    </li>
  </ul>
</li>
```

### 6.6 Step block (sub-procedimentos dentro de Preparo)

Quando um elemento tem fases distintas (ex: "Caramelizar o chocolate" + "Fazer a ganache"):

```tsx
<div className="space-y-4">
  <div>
    <div className="font-sans font-semibold text-[0.72rem] uppercase tracking-wider text-ink-muted mb-1">
      1 · Caramelizar o chocolate branco
    </div>
    <ol className="steps">...</ol>
  </div>
  <div>
    <div className="font-sans font-semibold text-[0.72rem] uppercase tracking-wider text-ink-muted mb-1">
      2 · Ganache
    </div>
    <ol className="steps">...</ol>
  </div>
</div>
```

### 6.7 Element index nav (índice de elementos)

Aparece **apenas quando a receita tem 2+ elementos**. Barra horizontal com anchors.

```tsx
<nav className="
  flex gap-1 flex-wrap mb-8
  p-1.5 rounded-lg
  bg-bg-card border border-rule-soft
">
  <span className="px-2 py-1.5 text-xs uppercase tracking-wider text-ink-muted font-medium">
    Ir para
  </span>
  <a href="#massa" className="px-2.5 py-1.5 rounded-md text-sm text-ink-soft hover:text-ink hover:bg-bg-hover">
    Massa
  </a>
  ...
</nav>
```

### 6.8 Variant cards (variações na Montagem)

Quando há variantes por tamanho ou tipo (Bolo P / Bolo G), usar grid auto-fit de cards:

```tsx
<div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mt-2">
  <div className="p-3.5 rounded-lg bg-bg-card border border-rule-soft">
    <div className="text-[0.72rem] uppercase tracking-wider text-ink-soft font-semibold mb-2">
      Bolo P · 15 cm
    </div>
    {/* Ingredient rows compactas */}
  </div>
</div>
```

### 6.9 Sub-recipe reference (referência inline)

Quando uma sub-receita aparece fora de um ingredient row (ex: "Molhar com X"):

```tsx
<span className="text-brand-marrom border-b border-dashed border-ink-muted cursor-pointer">
  ↳ Calda de Pão de Mel
</span>
```

### 6.10 Ingredient groups (grupos visuais)

Quando a Massa tem grupos lógicos (líquidos / açúcares / secos), separar com divisor tracejado sutil:

```tsx
<div className="space-y-0">
  <div>{/* grupo 1: rows */}</div>
  <div className="pt-2.5 mt-1 border-t border-dashed border-rule-soft">
    {/* grupo 2 */}
  </div>
</div>
```

---

## 7. Outras telas

### 7.1 Lista de fichas (índice)

Layout em coluna única ou grid de 2-3 colunas (responsivo). Cada item compacto.

```tsx
<a className="
  block py-3 px-4 -mx-4 rounded-md
  hover:bg-bg-hover transition-colors
  border-b border-rule-soft
">
  <div className="flex items-baseline justify-between gap-3">
    <div>
      <h3 className="font-serif text-lg text-ink">Bolo de Pão de Mel</h3>
      <p className="text-sm text-ink-soft mt-0.5">2 elementos · 875 g · 2h 10</p>
    </div>
    <div className="flex gap-1">
      <Tag>Bolos</Tag>
      <span className="text-accent">★</span>
    </div>
  </div>
</a>
```

### 7.2 Editor de receita

Formulário com a mesma linguagem da ficha. Inputs sem bg, com bottom border somente:

```tsx
<input className="
  w-full bg-transparent
  border-0 border-b border-rule-soft focus:border-ink
  py-1.5 text-ink placeholder-ink-muted
  font-sans
  outline-none transition-colors
" />
```

Textareas seguem o mesmo padrão. Selects podem usar bg-bg-card com borda full.

Ingredient editor row: combinar autocomplete de produto + qty + unit + display_note num único componente em linha.

### 7.3 Importador (chat com IA)

Textarea grande pra colar markdown + preview da ficha estruturada à direita (em desktop) ou abaixo (em mobile). Use o componente de **Ficha Técnica** completo no preview — assim o admin vê exatamente como vai ficar.

Mapeamento de ingredientes usa highlights:
- Match exato: borda `--brand-verde` à esquerda do row (3px)
- Match parcial: borda amarela (`--accent`)
- Novo produto: borda rosa (`--brand-rosa`)

(Aqui as cores secundárias da paleta finalmente entram em uso.)

---

## 8. Modo de impressão

CSS `@media print` deve:

1. Esconder: topbar, scale bar, element nav, action buttons, theme toggle, checkboxes
2. Mudar paleta: `--ink` → `#1a1a1a`, `--bg` → `white`, `--dot` → `#999`, etc.
3. Reduzir paddings do stage
4. Sub-receitas: expandir inline (mostrar ingredientes + passos completos abaixo do ingredient row)
5. Garantir que cada elemento da receita não quebre no meio de uma seção (page-break-inside: avoid)

```css
@media print {
  .no-print { display: none !important; }
  body { background: white; color: #1a1a1a; }
  :root {
    --bg: white; --bg-card: white; --bg-soft: #f5f5f5;
    --ink: #1a1a1a; --ink-soft: #4a4a4a; --ink-muted: #7a7a7a;
    --rule: #999; --rule-soft: #ddd; --dot: #999;
  }
  .element, .section { page-break-inside: avoid; }
  .stage { padding: 1rem; max-width: 100%; }
}
```

Para expansão de sub-receitas no print: implementar via React (renderizar o conteúdo da sub-receita inline quando `window.matchMedia('print').matches` ou via uma prop `printMode={true}` ativada antes de chamar `window.print()`).

---

## 9. Anti-padrões (NÃO FAZER)

| ❌ Não usar | ✅ Em vez disso |
|---|---|
| `font-family: Inter` | DM Sans |
| `bg-white`, `text-black`, `text-gray-*` | `bg-bg`, `text-ink`, `text-ink-soft`, `text-ink-muted` |
| `shadow-*`, `drop-shadow` | Borders + diferenças de bg |
| `rounded-2xl`, `rounded-3xl`, `rounded-full` (exceto switcher de escala) | `rounded-md` (4px) ou `rounded-lg` (6px) |
| Botões com `bg-blue-*`, `bg-yellow-*` | Botões `bg-ink text-bg` para primário, borda fina para secundário |
| Cards com `shadow-lg p-6 bg-white` | Cards com `bg-bg-card border border-rule-soft rounded-lg p-3.5` |
| Emojis em UI chrome (🔍 ⭐ 🍞) | Símbolos tipográficos discretos (★ ✎ ⎙ ☾ ↳ ↑ ↓) ou ícones SVG monocromáticos do Lucide |
| Gradientes | Cores sólidas |
| Tags em formato pill (`rounded-full`) | Tags retangulares (`rounded-md`) |
| Step numbers em círculo colorido | Number `1.` em Newsreader italic |
| "Drop shadows" para profundidade | Apenas linhas e contraste de bg |
| Animações de mais de 200ms | Transições 120-200ms `ease` no máximo |
| Cor de erro em vermelho puro (`#FF0000`) | Brand-rosa `#FF4D79` |
| `text-center` em blocos de conteúdo | Tudo alinhado à esquerda (textos centrais só em casos específicos) |

---

## 10. Acessibilidade

- **Contraste:** Os tokens `--ink` (#72381C) sobre `--bg` (#F8F1E0) têm contraste ≥ 7:1 (WCAG AAA). Dark mode similar.
- **Foco visível:** Todo elemento interativo deve ter outline visível no foco. Usar `focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2`.
- **Tamanhos de toque:** Botões interativos têm pelo menos 34×34px (icon buttons) ou padding suficiente em botões de texto.
- **Labels:** Inputs sem placeholder visível devem ter label associado (mesmo que via `sr-only`).
- **Atalhos:** Considerar `Ctrl/Cmd+P` para imprimir, `Ctrl/Cmd+E` para editar, `/` para focar busca.

---

## 11. Resumo das fontes

Para carregar via `next/font/google`:

```tsx
import { Newsreader, DM_Sans } from "next/font/google";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// no layout.tsx:
<html className={`${newsreader.variable} ${dmSans.variable}`}>
```

---

## 12. Checklist para o Claude Code

Ao aplicar este spec ao projeto existente:

- [ ] Atualizar `tailwind.config.ts` com a extensão descrita em §3
- [ ] Atualizar `app/globals.css` com tokens CSS (seção 2.1) e import das fontes
- [ ] Configurar `next/font` para Newsreader + DM Sans no `layout.tsx`
- [ ] Implementar `data-theme` no `<body>` + toggle de tema (botão na topbar)
- [ ] Refatorar a página da ficha técnica seguindo §6 (head, scale, elements, steps, montagem, notas)
- [ ] Implementar leader dots em `IngredientRow` como componente reutilizável
- [ ] Implementar `StepList` com counter CSS para numeração italic
- [ ] Implementar `ElementNav` (anchor strip) que aparece condicionalmente quando elements.length >= 2
- [ ] Implementar `VariantCards` para Montagem com variantes
- [ ] Implementar tag "conferir" como componente que aceita markdown `~~strikethrough~~` e detecta automaticamente
- [ ] Implementar print stylesheet conforme §8, incluindo expansão inline de sub-receitas
- [ ] Aplicar a mesma linguagem na lista de fichas (§7.1) e editor (§7.2)
- [ ] Garantir que nenhum dos anti-padrões da §9 está sendo usado
