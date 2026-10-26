/* ==========================================================================
   ENTRE NÓS — data.js
   Camada única de acesso a dados dos encontros.

   Como funciona:
   - Se CONFIG.SHEET_CSV_URLS estiver preenchido (veja README.md), os dados
     vêm do Google Sheets publicado como CSV.
   - Caso contrário (ou se a busca falhar), os dados vêm de data/encontros.json,
     que serve tanto de protótipo quanto de fallback.
   - O resto do site (encontros.js, páginas) NUNCA lê Sheets ou JSON
     diretamente — sempre passa pelas funções deste arquivo. Trocar a fonte
     de dados no futuro (API própria, banco de dados) exige mudar só aqui.
   ========================================================================== */

const CONFIG = {
  // Preencha estas URLs com o link "Publicar na web" (formato CSV) de cada
  // aba da planilha do Google Sheets. Deixe em branco para usar o JSON local.
  SHEET_CSV_URLS: {
    encontros: '',
    subperguntas: '',
    pesquisas: '',
    textosBiblicos: '',
    perguntasAbertas: '',
    relacoes: ''
  },
  JSON_LOCAL: 'data/encontros.json',
  // Quanto tempo (ms) manter os dados em cache no localStorage antes de buscar de novo.
  DURACAO_CACHE: 5 * 60 * 1000
};

const EntreNosDados = (function () {
  let _cache = null; // cache em memória para a duração da página

  /* --- Parser de CSV simples (suporta campos entre aspas com vírgulas/quebras de linha) --- */
  function parseCSV(texto) {
    const linhas = [];
    let campo = '', linha = [], dentroDeAspas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i], prox = texto[i + 1];
      if (dentroDeAspas) {
        if (c === '"' && prox === '"') { campo += '"'; i++; }
        else if (c === '"') { dentroDeAspas = false; }
        else { campo += c; }
      } else {
        if (c === '"') dentroDeAspas = true;
        else if (c === ',') { linha.push(campo); campo = ''; }
        else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
        else if (c === '\r') { /* ignora */ }
        else campo += c;
      }
    }
    if (campo.length || linha.length) { linha.push(campo); linhas.push(linha); }
    if (!linhas.length) return [];
    const cabecalho = linhas[0].map(h => h.trim());
    return linhas.slice(1)
      .filter(l => l.some(v => v.trim() !== ''))
      .map(l => {
        const obj = {};
        cabecalho.forEach((chave, i) => { obj[chave] = (l[i] ?? '').trim(); });
        return obj;
      });
  }

  async function buscarCSV(url) {
    const resposta = await fetch(url, { cache: 'no-store' });
    if (!resposta.ok) throw new Error('Falha ao buscar planilha: ' + resposta.status);
    return parseCSV(await resposta.text());
  }

  function usaSheets() {
    return Object.values(CONFIG.SHEET_CSV_URLS).some(u => u && u.trim() !== '');
  }

  /* --- Normalização de tipos (CSV/JSON chegam como texto) --- */
  function paraBool(v) { return v === true || v === 'true' || v === '1' || v === 'TRUE' || v === 'sim'; }
  function paraNumero(v) { const n = Number(v); return Number.isNaN(n) ? null : n; }

  function normalizarEncontro(e) {
    return {
      ...e,
      numero: paraNumero(e.numero),
      destaque: paraBool(e.destaque)
    };
  }
  function normalizarSubpergunta(s) { return { ...s, ordem: paraNumero(s.ordem) ?? 0 }; }

  async function carregarTudo() {
    if (_cache) return _cache;

    let dados;
    if (usaSheets()) {
      try {
        const [encontros, subperguntas, pesquisas, textosBiblicos, perguntasAbertas, relacoes] = await Promise.all([
          buscarCSV(CONFIG.SHEET_CSV_URLS.encontros),
          buscarCSV(CONFIG.SHEET_CSV_URLS.subperguntas),
          buscarCSV(CONFIG.SHEET_CSV_URLS.pesquisas),
          buscarCSV(CONFIG.SHEET_CSV_URLS.textosBiblicos),
          buscarCSV(CONFIG.SHEET_CSV_URLS.perguntasAbertas),
          buscarCSV(CONFIG.SHEET_CSV_URLS.relacoes)
        ]);
        dados = { encontros, subperguntas, pesquisas, textosBiblicos, perguntasAbertas, relacoes };
        try {
          localStorage.setItem('entrenos_cache', JSON.stringify({ dados, quando: Date.now() }));
        } catch (e) { /* localStorage pode falhar (modo privado); tudo bem, seguimos sem cache */ }
      } catch (erro) {
        console.warn('Não foi possível carregar o Google Sheets, tentando cache ou dados locais.', erro);
        dados = lerCacheLocal() || await carregarJSONLocal();
      }
    } else {
      dados = await carregarJSONLocal();
    }

    dados.encontros = (dados.encontros || []).map(normalizarEncontro);
    dados.subperguntas = (dados.subperguntas || []).map(normalizarSubpergunta);
    _cache = dados;
    return dados;
  }

  function lerCacheLocal() {
    try {
      const bruto = localStorage.getItem('entrenos_cache');
      if (!bruto) return null;
      const { dados, quando } = JSON.parse(bruto);
      if (Date.now() - quando > CONFIG.DURACAO_CACHE) return null;
      return dados;
    } catch (e) { return null; }
  }

  async function carregarJSONLocal() {
    const resposta = await fetch(CONFIG.JSON_LOCAL);
    if (!resposta.ok) throw new Error('Não foi possível carregar data/encontros.json');
    return resposta.json();
  }

  /* --- API pública, usada pelas páginas --- */
  return {
    async listarEncontros() {
      const { encontros } = await carregarTudo();
      return [...encontros].sort((a, b) => (b.numero || 0) - (a.numero || 0));
    },
    async buscarEncontroPorSlugOuId(chave) {
      const { encontros } = await carregarTudo();
      return encontros.find(e => e.slug === chave || e.id === chave) || null;
    },
    async proximoEncontro() {
      const { encontros } = await carregarTudo();
      return encontros.find(e => e.status === 'proximo') || null;
    },
    async subperguntasDoEncontro(encontroId) {
      const { subperguntas } = await carregarTudo();
      return subperguntas.filter(s => s.encontroId === encontroId).sort((a, b) => a.ordem - b.ordem);
    },
    async pesquisaDaSubpergunta(subperguntaId) {
      const { pesquisas } = await carregarTudo();
      return pesquisas.find(p => p.subperguntaId === subperguntaId) || null;
    },
    async textosBiblicosDoEncontro(encontroId) {
      const { textosBiblicos } = await carregarTudo();
      return textosBiblicos.filter(t => t.encontroId === encontroId);
    },
    async perguntasAbertas() {
      const { perguntasAbertas } = await carregarTudo();
      return perguntasAbertas;
    },
    async perguntasAbertasDoEncontro(encontroId) {
      const { perguntasAbertas } = await carregarTudo();
      return perguntasAbertas.filter(p => p.encontroId === encontroId);
    },
    async perguntasNascidasNoEncontro(encontroId) {
      // perguntas cujo status investigada aponta de volta a outro encontro de origem
      return this.perguntasAbertasDoEncontro(encontroId);
    },
    async encontrosRelacionados(encontroId) {
      const { relacoes, encontros } = await carregarTudo();
      const ids = relacoes.filter(r => r.encontroId === encontroId).map(r => r.encontroRelacionadoId)
        .concat(relacoes.filter(r => r.encontroRelacionadoId === encontroId).map(r => r.encontroId));
      return encontros.filter(e => ids.includes(e.id));
    }
  };
})();
