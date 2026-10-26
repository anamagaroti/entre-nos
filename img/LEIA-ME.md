# Logo Entre Nós — conceito

Marca: duas curvas que se encontram (como duas páginas de um livro aberto, ou
duas pessoas se debruçando para conversar), com um pequeno ponto dourado acima
marcando a pergunta que as reúne.

Este é um PONTO DE PARTIDA em vetor (SVG, editável em qualquer momento — Figma,
Illustrator, Inkscape) e não uma imagem gerada por IA: as curvas e cores seguem
exatamente a paleta e a tipografia já definidas para o site.

## Arquivos

- `marca-fundo-creme.svg/png` — símbolo sozinho, sobre creme
- `marca-fundo-verde.svg/png` — símbolo sozinho, versão reversa (creme sobre verde floresta)
- `entre-nos-marca-transparente.svg/png` — símbolo com fundo transparente, para aplicar sobre qualquer cor
- `logotipo-horizontal.svg/png` — símbolo + "Entre Nós", lado a lado (para o header do site)
- `logotipo-completo-com-lema.svg/png` — símbolo + nome + "Perguntar. Buscar. Compartilhar.", versão reversa (para capa, Instagram, etc.)
- `favicon.svg`, `favicon-32.png`, `apple-touch-icon-180.png` — ícone para aba do navegador e atalho no celular

## Uso no site

Para trocar o favicon do site, copie `favicon-32.png` (ou `favicon.svg`) para a
pasta `assets/icons/` do projeto e adicione no `<head>` de cada página:

```html
<link rel="icon" href="assets/icons/favicon-32.png">
<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon-180.png">
```

Para usar o logotipo no lugar do texto "Entre Nós" no header, troque o conteúdo
de `.marca` em `partials/header.html` por `<img src="assets/icons/logotipo-horizontal.svg" alt="Entre Nós" height="32">`.

## Se quiser evoluir o desenho

O SVG é só código — qualquer designer (ou você mesma, com um pouco de paciência)
pode abrir os arquivos `.svg` num editor vetorial e ajustar curvas, espessura do
traço ou proporções livremente. Esta é uma proposta de direção, não uma versão
final e definitiva.
