# Entre Nós — site do projeto

Site estático (HTML + CSS + JavaScript puro, sem build, sem framework) para o projeto **Entre Nós**. Pensado para crescer por anos sem precisar de um HTML novo por encontro.

## Como rodar localmente

python3 -m http.server 8000

O site usa `fetch()` para carregar o header/footer e os dados, o que **não funciona abrindo o arquivo `.html` diretamente no navegador** (restrição de CORS do `file://`). Rode um servidor local simples na pasta do projeto:

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

(Qualquer outro servidor estático funciona igual — `npx serve`, extensão "Live Server" do VS Code, etc.)

## Estrutura do projeto

```
/
├── index.html            → Início
├── sobre.html             → Sobre / O projeto
├── como-funciona.html     → Como funciona
├── principios.html        → Princípios
├── participar.html        → Participar (com perguntas frequentes)
├── encontros.html         → Lista de todos os encontros
├── encontro.html          → Template ÚNICO de encontro (encontro.html?id=slug)
├── perguntas.html         → Perguntas que ficaram + formulário de nova pergunta
├── contribua.html         → Formulário de contribuições
├── privacidade.html       → Página de privacidade
│
├── partials/
│   ├── header.html        → Menu, injetado em toda página por main.js
│   └── footer.html        → Rodapé, injetado em toda página por main.js
│
├── css/
│   ├── style.css           → Cores, tipografia, componentes (mobile-first)
│   └── responsive.css      → Ajustes para tablet/desktop e menu mobile
│
├── js/
│   ├── data.js              → ÚNICO lugar que sabe de onde vêm os dados
│   ├── main.js               → Menu, formulários, acordeão, injeção de partials
│   └── encontros.js          → Renderiza home, listagem e página de encontro
│
└── data/
    └── encontros.json        → Dados de demonstração (fallback / protótipo)
```

## Como adicionar um novo encontro

**Você nunca cria um HTML novo.** Um único template (`encontro.html`) exibe qualquer encontro, lendo os dados pelo parâmetro da URL: `encontro.html?id=slug-do-encontro`.

### Se você ainda está usando o JSON local (`data/encontros.json`)

Abra o arquivo e adicione:

1. Um objeto em `"encontros"` com `id`, `numero`, `slug` (usado na URL), `titulo`, `perguntaCentral`, `data` (formato `AAAA-MM-DD`), `resumo`, `contexto`, `status` (`"proximo"` ou `"realizado"`) e `destaque`.
2. Objetos em `"subperguntas"` apontando para o `encontroId` correspondente.
3. Objetos em `"pesquisas"` apontando para o `subperguntaId` correspondente (`textos`, `reflexao`, `interpretacao`, `duvidas`).
4. Objetos em `"textosBiblicos"` apontando para o `encontroId`.
5. Objetos em `"perguntasAbertas"` apontando para o `encontroId` (e, se já foi investigada depois, `encontroInvestigacaoId`).
6. Se fizer sentido, uma entrada em `"relacoes"` ligando dois `encontroId`.

O site lê tudo isso sozinho — não precisa mexer em nenhum HTML, CSS ou JS.

### Se você já conectou o Google Sheets (recomendado a médio prazo)

Adicione uma nova linha na aba correspondente da planilha (`encontros`, `subperguntas`, `pesquisas`, `textosBiblicos`, `perguntasAbertas` ou `relacoes`), seguindo as mesmas colunas descritas acima. O site busca a planilha a cada carregamento (com um cache de alguns minutos).

## Como conectar ao Google Sheets

1. Crie uma planilha com uma aba para cada entidade (`encontros`, `subperguntas`, `pesquisas`, `textosBiblicos`, `perguntasAbertas`, `relacoes`), com as colunas descritas acima como cabeçalho da primeira linha.
2. Em cada aba: **Arquivo → Compartilhar → Publicar na Web → selecione a aba → formato CSV → Publicar**. Copie o link gerado.
3. Abra `js/data.js` e preencha `CONFIG.SHEET_CSV_URLS` com os seis links:

```js
SHEET_CSV_URLS: {
  encontros: 'https://docs.google.com/spreadsheets/d/.../pub?gid=0&single=true&output=csv',
  subperguntas: '...',
  pesquisas: '...',
  textosBiblicos: '...',
  perguntasAbertas: '...',
  relacoes: '...'
}
```

Pronto — o site passa a buscar da planilha automaticamente, sem precisar mudar mais nada. Se algum link falhar, o site cai de volta para o `data/encontros.json` (ou para o último dado salvo em cache no navegador), então o site nunca fica quebrado por causa disso.

**Importante:** uma planilha publicada assim fica pública para qualquer pessoa com o link. Não inclua nada sensível nela — o que já é compatível com a política de não publicar nomes completos e dados pessoais.

**Texto longo nas células:** funciona bem em Markdown simples (parágrafos, quebras de linha). Formatação HTML rica dentro da célula não é recomendada; se um encontro precisar de algo mais elaborado, considere registrá-lo diretamente no JSON local em vez da planilha.

### Migrar depois para uma API própria ou banco de dados

Como todo o site só fala com `js/data.js` (nunca lê CSV/JSON diretamente em outro lugar), migrar no futuro significa reescrever só as funções internas desse arquivo — as páginas e o resto do JavaScript não mudam.

## Onde alterar cada coisa

| O que mudar | Onde |
|---|---|
| Cores da paleta | `:root` no topo de `css/style.css` |
| Fontes | `@import` e `--fonte-serifada` / `--fonte-sans` em `css/style.css` |
| Menu de navegação | `partials/header.html` (uma vez só, vale para o site todo) |
| Rodapé, Instagram | `partials/footer.html` — troque `[INSTAGRAM]` pelo @ real |
| WhatsApp / contato | `participar.html` — troque `[LINK_WHATSAPP]` pelo link real |
| Faixa etária / política de participação | `participar.html`, trechos marcados com `[DEFINIR ...]` |
| Textos institucionais (Sobre, Princípios etc.) | dentro do próprio `.html` de cada página, em `<div class="texto-corpo">` |
| Dados dos encontros | `data/encontros.json` ou a planilha do Google Sheets (veja acima) |

Todos os placeholders que ainda precisam da sua decisão estão marcados no código com `<span class="marcador">` ou colchetes, como `[INSTAGRAM]` e `[LINK_WHATSAPP]` — busque por `marcador` ou `[` no projeto para achar todos rapidamente.

## O que depende de backend (ainda não existe)

Os formulários de **Perguntas** (`perguntas.html`) e **Contribua** (`contribua.html`) têm interface completa, mas **não enviam os dados a lugar nenhum** — eles só mostram uma confirmação visual (`js/main.js`, função `ativarFormularios`). Para funcionar de verdade, conecte a um serviço de formulários (Formspree, um endpoint próprio, Google Forms por trás, etc.) e troque o `preventDefault()` por um envio real, ou adicione um `action` de formulário apontando para esse serviço.

O sistema de comentários vinculados a um encontro específico também está preparado apenas na interface (seção "Contribuições" da página de encontro) — sem armazenamento real ainda.

## Dados de exemplo

`data/encontros.json` traz três encontros fictícios (marcados com `"_aviso"` no topo do arquivo) só para demonstrar o funcionamento do site. Apague-os ou substitua pelos encontros reais antes de publicar.

## Acessibilidade e SEO — o que já está feito

- HTML semântico, hierarquia de headings, `alt` em imagens (quando adicionadas), foco visível, navegação por teclado, `prefers-reduced-motion` respeitado.
- Cada página tem `<title>` e meta description próprios; a página de encontro atualiza os dois dinamicamente via JavaScript quando os dados carregam.
- **Limitação a saber:** como o conteúdo do encontro é montado via JavaScript no navegador, buscadores que não executam JS bem podem indexar `encontro.html` sem o conteúdo específico do encontro. Para a maioria dos casos isso é aceitável; se a indexação de cada encontro individualmente se tornar prioridade, o próximo passo natural é pré-renderizar as páginas de encontro (gerar um HTML estático por encontro em tempo de build) — o que pode ser adicionado depois sem mudar a estrutura de dados.
