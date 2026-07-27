# Linguagem de design

Referência de tokens e convenções que **toda a app** (perfil, jogos, desafios,
grupos, estatísticas, admin) deve seguir. Define o sistema; não implementa
componentes - isso é trabalho por página, feito de forma incremental.

## Princípio

Editorial, premium, football-first, calmo. O futebol cria a emoção; a
interface só lhe dá clareza. Inspiração: Apple, Linear, Premier League, Sky
Sports, Nike Football. Evitar: gaming UI, FUT, dashboards Discord/Material,
glassmorphism, gradientes néon. A identidade de futebol vem de tipografia
forte, geometria de campo e espaçamento ao estilo broadcast - nunca de
ícones/clichés óbvios.

## Tokens

Vivem em `web/src/shared/tokens/` (`@import`ados por `theme.css`, um token só
existe se for usado - ver regra em `CLAUDE.md`).

- **`colors.css`** - camada semântica (`--surface-page`, `--text-color`,
  `--accent`, `--border-default`, `--success`/`--warning`/`--danger`, …).
  Referenciar sempre a semântica, nunca os primitivos (`--gray-*`) a direito.
- **`typography.css`** - `--font-display` (Bebas Neue, só títulos) e
  `--font-sans` (Inter Tight, tudo o resto). Escala semântica:
  `--font-size-hero/page-title/section-title/card-title/body/small/label`.
  A escala antiga (`--font-size-xs..6xl`) mantém-se para os ecrãs ainda por
  migrar - não usar em código novo.
- **`spacing.css`** - `--page-padding-x/y`, `--section-gap`, `--card-padding`,
  `--card-gap`, `--grid-gutter` (+ variantes `-mobile`).
- **`radius.css`** - escala base (`--radius-sm/md/lg/xl/full`) + aliases
  semânticos por componente de página inteira (`--radius-button/input/card/
  card-sm/modal/hero/badge`). Widgets menores (painéis de dashboard, tiles,
  chips - ver "Painéis de dashboard" abaixo) referenciam a escala base
  diretamente em vez dos aliases: `--radius-lg` para o contentor do painel/
  tile, `--radius-md` para linhas de lista e ícones quadrados, `--radius-full`
  para avatares/crests/pílulas circulares.
- **`shadows.css`** - `--shadow-sm/md/lg` (elevação universal, igual nos dois
  temas). `--shadow-card/elevated/glow/modal` são legacy (efeitos só no
  escuro) - não usar em componentes novos.
- **`motion.css`** - `--transition-base` (180ms, `--ease-standard`),
  `--hover-lift` (-2px, cartões), `--hover-scale` (1.02, botões).
- **`layout.css`** - `--topnav-height` (72px), `--grid-columns` (12).

## Cor

Só elementos interativos usam o azul de marca (`--accent`). Não pintar a
interface de azul por defeito - superfícies ficam neutras
(`--surface-page/card/panel`), a cor entra para chamar a ação. `--success`/
`--warning`/`--danger` são para estado (não decoração). Variantes de
`--accent` (`--accent-strong` texto/hover, `--accent-soft` acento mais claro,
`--accent-surface`/`--accent-surface-faint` fundo translúcido, `--accent-border`
borda em hover) cobrem os casos de "azul mas mais subtil" - não inventar
`rgb(... / alpha)` ad-hoc a partir de `--accent`. Superfícies de elevação
neutra além de `--surface-card/panel`: `--surface-chip` (círculo/pílula de
ícone), `--surface-sunken` (poço recuado, ex. trilho de barra de progresso),
`--surface-ghost-hover` (hover sobre uma linha/tile sem fundo próprio).
`--surface-brand-dark` é um azul-marinho fixo (tingido pelo `--accent`
escolhido) para faixas "de marca" (ex. cabeçalho do cartão de jogo) que
devem ficar sempre escuras, mesmo no tema claro. `--team-a`/`--team-b`
identificam as duas equipas em qualquer widget (crest, pitch, cartão de
jogo) - não reintroduzir cores de equipa hard-coded fora destes tokens.
Grupos decorativos
("de marca", não cromo de interface: cores de equipa, pódio, campo, estádio
de penáltis, spinner de golos icónicos) continuam **fora** desta linguagem -
ficam iguais nos dois temas de propósito, ver `CLAUDE.md`.

Tema escuro nunca é preto puro - simula iluminação de estádio à noite
(`--surface-page: #0d1625`). Por isso conta com a borda (`--border-default:
rgb(255 255 255 / .08)`), não a sombra, para separar superfícies; `--shadow-*`
fica quase invisível lá de propósito.

## Layout

Full-width (sem `max-width` central - ver regra em `CLAUDE.md`). Grelha
CSS de 12 colunas, `--grid-gutter` de gutter. Padding de página:
`--page-padding-x` horizontal, `--page-padding-y` vertical (mobile:
`--page-padding-x-mobile`, single column). Espaço entre secções:
`--section-gap`. Topo fixo: `--topnav-height`.

## Cartões

Estrutura única em toda a app: fundo `--surface-card`, borda `1px solid
var(--border-default)`, `border-radius: var(--radius-card)`, `padding:
var(--card-padding)`, `gap: var(--card-gap)` entre blocos internos. Sombra
`--shadow-sm`/`--shadow-md` no máximo - nada de glass, nada de glow. Hover
(quando o cartão é acionável): `translateY(var(--hover-lift))` +
`--shadow-md`, transição `--transition-base`.

## Painéis de dashboard

Variante dos cartões para grelhas de widgets pequenos (Home é o caso atual;
qualquer página nova com este formato segue o mesmo padrão em vez de
inventar outro). Estrutura partilhada em `app/components/homePanel.module.css`
(`.panel/.panelHead/.panelTitle/.panelLink`), importado ao lado do module
próprio de cada widget - não duplicar estas classes por widget. Difere do
cartão genérico: fundo `--surface-panel` (não `--surface-card`),
`border-radius: var(--radius-lg)` (não `--radius-card`), `border: 1px solid
var(--border-default)`, `box-shadow: var(--shadow-sm)`.

- **Cabeçalho** (`.panelHead`): título (`.panelTitle` - maiúsculas, itálico,
  `font-weight: bold`, `letter-spacing: var(--tracking-label)`) + link
  opcional "ver tudo" à direita (`.panelLink` - `--accent-strong`, hover
  `--accent-soft`, com `ChevronRightIcon` 14px). Este rótulo itálico+
  maiúsculo é o único sítio da app onde o título não é `--font-display` nem
  texto normal - é a assinatura visual dos painéis do dashboard.
- **Linhas de lista**: altura mínima fixa no contentor (ex. `min-height:
  13.75rem` para 5 linhas de `2.75rem`) para o painel não saltar de tamanho
  consoante há poucos ou muitos itens; `border-bottom: 1px solid
  var(--border-subtle)` entre linhas (`:last-child` sem borda); hover
  `--surface-ghost-hover`; linha de destaque (o próprio jogador, o próximo
  jogo) com fundo `--accent-surface-faint`.
- **Estado vazio** (`HomePanelEmpty`, partilhado): ícone num círculo
  `--surface-chip` + texto `--text-subtle`, centrado no espaço do painel -
  reutilizar este componente em vez de criar um vazio novo por widget.
- **Densidade configurável por CSS custom properties**: o module partilhado
  define omissões (`--panel-min-h: 16rem`, `--panel-pad: var(--space-lg)`,
  `--panel-head-mb: var(--space-md)`, `--panel-title-fs/lh`) que o grid pai
  pode sobrepor por secção (ex. uma fiada de painéis mais compacta) sem
  duplicar CSS por variante.
- **Tiles** (ex. atalhos rápidos): mesmo fundo/raio/borda dos painéis por
  item da grelha (não um painel à volta da grelha inteira), com ícone em
  chip `--radius-md`/`--surface-chip` + texto + chevron; hover sobe
  `border-color` para `--accent-border` e fundo para `--surface-panel-hover`.

## Botões

Altura 48px, `border-radius: var(--radius-button)`, padding horizontal
`var(--space-2xl)` (32px), transição `--transition-base`.

- **Primário**: preenchido a `--accent`, texto `--text-on-accent`.
- **Secundário**: contornado (`1px solid var(--border-default)`), fundo
  transparente.
- **Ghost**: transparente, sem borda, hover com `--surface-ghost-hover`.

Hover subtil (`--surface-*-hover` ou leve escurecer/clarear do accent);
`transform: scale(var(--hover-scale))` só no clique/hover ativo, nunca em
permanência.

## Inputs

Altura 48px, `border-radius: var(--radius-input)`, borda `1px solid
var(--border-input)`. Foco: borda `--accent` + `box-shadow: var(--focus-ring)`
(anel suave, não um glow).

## Ícones

[Lucide Icons](https://lucide.dev), 20px, `stroke-width: 1.75`, só outline.
Preenchido só em badges de notificação/estados especiais.

## Tipografia

`--font-display` (Bebas Neue) só em título de página/secção/hero **ou** num
valor isolado que a página quer tratar como placar (data de jogo em
destaque, nome de jogador em destaque num painel) - nunca em corpo de
texto, botões ou labels. Rótulos (`--font-size-label`) em maiúsculas com
`letter-spacing: var(--tracking-label)`; o título de um painel de dashboard
usa este mesmo tratamento mas em itálico + `font-weight: bold` (ver
"Painéis de dashboard"), não `--font-display`. A tipografia é o elemento
visual mais forte do sistema - a cor fica em segundo plano.

## Consistência

Perfil, jogos, desafios, grupos, estatísticas e admin partilham exatamente
os mesmos tokens. Uma página nova nunca introduz cor, raio, sombra ou
tamanho de fonte "só para si" - se o valor não existe na lista acima, ou é
uma decisão de marca deliberada (ver `CLAUDE.md` → grupos decorativos), ou
falta um token e discute-se antes de hardcode.
