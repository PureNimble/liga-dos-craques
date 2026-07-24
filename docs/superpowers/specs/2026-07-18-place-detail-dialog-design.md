# Dialog de detalhe do campo (place)

## Contexto

O mapa de campos (`web/src/features/places/PlacesMapPage.tsx`) agrega pins por
distrito e por concelho; só ao nível do concelho é que aparecem pins
individuais de cada campo. Atualmente, clicar num pin individual abre um
`Popup` do Leaflet com nome, concelho/distrito, telefone e um link opcional.

Este documento cobre **apenas** a substituição desse popup por um dialog mais
completo. A revisão do comportamento de agregação (distrito/concelho) fica
fora de âmbito, para uma sessão futura.

## Objetivo

Ao clicar num pin individual, abrir um dialog modal com:
- **Esquerda:** placeholder de imagem (a app ainda não suporta fotos de campos).
- **Direita:** informação do campo (nome, concelho/distrito, telefone,
  direções, link opcional).

## Componentes

### `PlaceDetailModal.tsx` (novo)

Vive em `web/src/features/places/`, ao lado de `AddPlaceModal.tsx`, e segue o
mesmo padrão: wrapper à volta do `Modal` partilhado (`@/shared/components/ui`).

```
interface PlaceDetailModalProps {
  place: Place;
  onClose: () => void;
}
```

- `Modal` com `title` = `place.name` (o cabeçalho/botão fechar já vêm de
  série do `Modal`).
- `size="lg"` - o layout a duas colunas precisa de mais largura que o `sm`
  usado no `AddPlaceModal`.
- `variant` por omissão (`center"`), para consistência com o `AddPlaceModal`.

### `ImageIcon` (novo, em `shared/components/ui/icons.tsx`)

Ícone simples no mesmo estilo stroke dos restantes (`base(props)`), tipo
moldura + sol/montanha, para preencher o placeholder de imagem.

## Layout do corpo do dialog

Duas colunas dentro do `body` do `Modal`:

- **Coluna esquerda:** caixa de tamanho fixo, fundo/borda subtis (tokens
  existentes, ex. `--gray-750`/`--gray-700`), com o `ImageIcon` centrado.
  Sem legenda "sem foto" - o ícone já comunica isso.
- **Coluna direita:** linhas empilhadas, reaproveitando o padrão de
  `popupRow` do popup antigo (ícone + texto):
  - `PinIcon` + `{concelho}, {district}`
  - `PhoneIcon` + `{phone}` (só se existir)
  - Link "Direções" para
    `https://www.google.com/maps/dir/?api=1&destination={latitude},{longitude}`
    (sempre presente - todo o `place` tem lat/long)
  - Link opcional "Ver ligação" para `place.url` (só se existir)

Em ecrãs estreitos, as duas colunas empilham (imagem em cima) via container
query no wrapper do corpo - consistente com a preferência do projeto por
`@container` em vez de media queries.

## Fluxo de dados / interação

- `PlacesMapPage` ganha estado `selectedPlace: Place | null`.
- Cada `Marker` de campo individual (dentro do bloco
  `selectedMunicipality && concelhoPlaces?.map(...)`) deixa de ter `<Popup>`
  como filho; passa a ter `eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); setSelectedPlace(place); } }}`,
  igual ao padrão já usado nos pins agregados de distrito/concelho.
- O import de `Popup` do `react-leaflet` e o de `PhoneIcon` em
  `PlacesMapPage.tsx` deixam de ser necessários ali (passam a viver só dentro
  do novo `PlaceDetailModal`).
- Render condicional no fim do JSX, ao lado do `AddPlaceModal`:
  ```tsx
  {selectedPlace && (
    <PlaceDetailModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
  )}
  ```

## Fora de âmbito

- Sem ações de editar/apagar o campo.
- Sem upload real de imagem - só o placeholder.
- Sem alterações ao comportamento de agregação por distrito/concelho.

## Testes

Funcionalidade puramente de apresentação (sem lógica de negócio nova) - não
justifica testes unitários dedicados; verificação manual no browser (clicar
num pin, confirmar conteúdo e fecho do dialog, testar em viewport estreito).
