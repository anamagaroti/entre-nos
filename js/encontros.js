/* ==========================================================================
   ENTRE NÓS — encontros.js
   Lê dados via data.js (EntreNosDados) e renderiza:
   - destaque de "próximo encontro" e "últimos encontros" na home;
   - a listagem completa em encontros.html;
   - o template dinâmico em encontro.html;
   - a lista de perguntas em perguntas.html.
   ========================================================================== */

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (!ano || !mes || !dia) return iso;
  return `${dia} de ${MESES[mes - 1].replace('.', '')} de ${ano}`;
}

function seloDeStatus(status) {
  if (status === 'proximo') return '<span class="selo selo--aberto">Próximo encontro</span>';
  return '<span class="selo selo--realizado">Realizado</span>';
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function cartaoEncontroHTML(e) {
  return `
    <article class="cartao-encontro">
      <p class="cartao-encontro__numero">ENCONTRO #${String(e.numero).padStart(2, '0')}</p>
      <h3 class="cartao-encontro__titulo">${escapeHTML(e.titulo)}</h3>
      <p class="cartao-encontro__data">${formatarData(e.data)}</p>
      <p class="cartao-encontro__resumo">${escapeHTML(e.resumo)}</p>
      <div class="cartao-encontro__rodape">
        ${seloDeStatus(e.status)}
        <a href="encontro.html?id=${encodeURIComponent(e.slug || e.id)}" class="botao--texto">Ver encontro →</a>
      </div>
    </article>`;
}

/* ===================== HOME ===================== */
async function montarSecoesDaHome() {
  const areaProximo = document.querySelector('[data-area="proximo-encontro"]');
  const areaUltimos = document.querySelector('[data-area="ultimos-encontros"]');
  const areaPerguntas = document.querySelector('[data-area="perguntas-abertas"]');
  if (!areaProximo && !areaUltimos && !areaPerguntas) return;

  try {
    const [proximo, encontros, perguntas] = await Promise.all([
      EntreNosDados.proximoEncontro(),
      EntreNosDados.listarEncontros(),
      EntreNosDados.perguntasAbertas()
    ]);

    if (areaProximo) {
      areaProximo.innerHTML = proximo ? `
        <div class="destaque-proximo">
          <div>
            <p class="destaque-proximo__rotulo">Próximo encontro</p>
            <p class="destaque-proximo__pergunta">${escapeHTML(proximo.perguntaCentral)}</p>
            <p class="destaque-proximo__data">${formatarData(proximo.data)}</p>
          </div>
          <a href="encontro.html?id=${encodeURIComponent(proximo.slug || proximo.id)}" class="botao botao--sobre-escuro destaque-proximo__acao">Conhecer o encontro</a>
        </div>` : `<p class="carregando">Ainda não há um próximo encontro marcado.</p>`;
    }

    if (areaUltimos) {
      const recentes = encontros.filter(e => e.status !== 'proximo').slice(0, 3);
      areaUltimos.innerHTML = recentes.length
        ? `<div class="grade-encontros">${recentes.map(cartaoEncontroHTML).join('')}</div>`
        : `<p class="carregando">Os primeiros encontros ainda serão registrados aqui.</p>`;
    }

    if (areaPerguntas) {
      const abertas = perguntas.filter(p => p.status === 'aberta').slice(0, 3);
      areaPerguntas.innerHTML = abertas.length
        ? `<div class="lista-perguntas">${abertas.map(p => `
            <div class="item-pergunta">
              <p class="item-pergunta__texto">${escapeHTML(p.pergunta)}</p>
              <p class="item-pergunta__meta">Em aberto</p>
            </div>`).join('')}</div>`
        : `<p class="carregando">Nenhuma pergunta em aberto no momento.</p>`;
    }
  } catch (erro) {
    console.error(erro);
    [areaProximo, areaUltimos, areaPerguntas].forEach(a => {
      if (a) a.innerHTML = '<p class="erro-dados">Não foi possível carregar os dados dos encontros agora.</p>';
    });
  }
}

/* ===================== LISTAGEM (encontros.html) ===================== */
async function montarListagemDeEncontros() {
  const area = document.querySelector('[data-area="listagem-encontros"]');
  if (!area) return;
  try {
    const encontros = await EntreNosDados.listarEncontros();
    area.innerHTML = encontros.length
      ? `<div class="grade-encontros">${encontros.map(cartaoEncontroHTML).join('')}</div>`
      : '<p class="carregando">Nenhum encontro registrado ainda.</p>';
  } catch (erro) {
    console.error(erro);
    area.innerHTML = '<p class="erro-dados">Não foi possível carregar os encontros agora.</p>';
  }
}

/* ===================== PÁGINA INDIVIDUAL (encontro.html) ===================== */
async function montarPaginaDeEncontro() {
  const area = document.querySelector('[data-area="encontro"]');
  if (!area) return;

  const parametros = new URLSearchParams(window.location.search);
  const chave = parametros.get('id');
  if (!chave) {
    area.innerHTML = '<p class="erro-dados">Nenhum encontro foi especificado na URL (use encontro.html?id=slug-do-encontro).</p>';
    return;
  }

  try {
    const encontro = await EntreNosDados.buscarEncontroPorSlugOuId(chave);
    if (!encontro) {
      area.innerHTML = `<p class="erro-dados">Não encontramos um encontro com o identificador "${escapeHTML(chave)}".</p>`;
      return;
    }

    document.title = `${encontro.titulo} — Entre Nós`;
    const metaDescricao = document.querySelector('meta[name="description"]');
    if (metaDescricao) metaDescricao.setAttribute('content', encontro.resumo || encontro.perguntaCentral);

    const [subperguntas, textos, perguntasNascidas, relacionados] = await Promise.all([
      EntreNosDados.subperguntasDoEncontro(encontro.id),
      EntreNosDados.textosBiblicosDoEncontro(encontro.id),
      EntreNosDados.perguntasNascidasNoEncontro(encontro.id),
      EntreNosDados.encontrosRelacionados(encontro.id)
    ]);

    const pesquisas = await Promise.all(subperguntas.map(s => EntreNosDados.pesquisaDaSubpergunta(s.id)));

    const blocoSubperguntas = subperguntas.length ? subperguntas.map((s, i) => {
      const pesquisa = pesquisas[i];
      return `
        <div class="subpergunta">
          <h3 class="subpergunta__titulo">${escapeHTML(s.pergunta)}</h3>
          ${pesquisa ? `
            <div class="subpergunta__conteudo">
              ${pesquisa.textos ? `<div class="subpergunta__campo"><p class="subpergunta__rotulo">Textos pesquisados</p><p>${escapeHTML(pesquisa.textos)}</p></div>` : ''}
              ${pesquisa.reflexao ? `<div class="subpergunta__campo"><p class="subpergunta__rotulo">Reflexão</p><p>${escapeHTML(pesquisa.reflexao)}</p></div>` : ''}
              ${pesquisa.interpretacao ? `<div class="subpergunta__campo"><p class="subpergunta__rotulo">Interpretação</p><p>${escapeHTML(pesquisa.interpretacao)}</p></div>` : ''}
              ${pesquisa.duvidas ? `<div class="subpergunta__campo"><p class="subpergunta__rotulo">O que ficou em dúvida</p><p>${escapeHTML(pesquisa.duvidas)}</p></div>` : ''}
            </div>` : '<p class="estado-vazio">Pesquisa ainda não registrada.</p>'}
        </div>`;
    }).join('') : '<p class="estado-vazio">Nenhuma subpergunta registrada para este encontro.</p>';

    const blocoTextos = textos.length
      ? `<ul class="lista-textos-biblicos">${textos.map(t => `<li><strong>${escapeHTML(t.referencia)}</strong>${t.observacao ? `<span>${escapeHTML(t.observacao)}</span>` : ''}</li>`).join('')}</ul>`
      : '<p class="estado-vazio">Nenhum texto listado.</p>';

    const abertas = perguntasNascidas.filter(p => p.status === 'aberta');
    const blocoAbertas = abertas.length
      ? `<div class="lista-perguntas">${abertas.map(p => `<div class="item-pergunta"><p class="item-pergunta__texto">${escapeHTML(p.pergunta)}</p><p class="item-pergunta__meta">Em aberto</p></div>`).join('')}</div>`
      : '<p class="estado-vazio">Nenhuma pergunta nova ficou registrada.</p>';

    const blocoRelacionados = relacionados.length
      ? `<nav class="encontros-relacionados" aria-label="Encontros relacionados">${relacionados.map(r => `<a href="encontro.html?id=${encodeURIComponent(r.slug || r.id)}">Encontro #${String(r.numero).padStart(2, '0')} — ${escapeHTML(r.titulo)}</a>`).join('')}</nav>`
      : '<p class="estado-vazio">Nenhum encontro relacionado até agora.</p>';

    area.innerHTML = `
      <header class="hero-pagina">
        <div class="container">
          <p class="encontro-cabecalho__numero">ENCONTRO #${String(encontro.numero).padStart(2, '0')}</p>
          <h1>${escapeHTML(encontro.titulo)}</h1>
          <p class="encontro-cabecalho__data">${formatarData(encontro.data)} · ${encontro.status === 'proximo' ? 'Próximo encontro' : 'Realizado'}</p>
        </div>
      </header>

      <div class="secao">
        <div class="container container--leitura">
          <div class="bloco-pergunta-central">
            <p class="bloco-pergunta-central__rotulo">Pergunta central</p>
            <p class="bloco-pergunta-central__texto">${escapeHTML(encontro.perguntaCentral)}</p>
          </div>

          ${encontro.contexto ? `<div class="texto-corpo"><h2>Contexto</h2><p>${escapeHTML(encontro.contexto)}</p></div>` : ''}

          <div class="texto-corpo">
            <h2>Subperguntas investigadas</h2>
          </div>
          ${blocoSubperguntas}

          <div class="texto-corpo">
            <h2>Textos bíblicos estudados</h2>
            ${blocoTextos}
          </div>

          <div class="texto-corpo">
            <h2>O que permaneceu em aberto</h2>
            ${blocoAbertas}
          </div>

          <div class="texto-corpo">
            <h2>Encontros relacionados</h2>
            ${blocoRelacionados}
          </div>

          <div class="texto-corpo">
            <h2>Contribuições</h2>
            <p class="estado-vazio">Ainda não há contribuições públicas para este encontro.</p>
            <a href="contribua.html" class="botao botao--secundario">Contribuir com este encontro</a>
          </div>
        </div>
      </div>`;
  } catch (erro) {
    console.error(erro);
    area.innerHTML = '<p class="erro-dados">Não foi possível carregar este encontro agora.</p>';
  }
}

/* ===================== PERGUNTAS (perguntas.html) ===================== */
async function montarPaginaDePerguntas() {
  const area = document.querySelector('[data-area="lista-perguntas-completa"]');
  if (!area) return;
  try {
    const [perguntas, encontros] = await Promise.all([EntreNosDados.perguntasAbertas(), EntreNosDados.listarEncontros()]);
    const encontroPorId = Object.fromEntries(encontros.map(e => [e.id, e]));

    area.innerHTML = perguntas.length ? perguntas.map(p => {
      const origem = encontroPorId[p.encontroId];
      const investigacao = p.encontroInvestigacaoId ? encontroPorId[p.encontroInvestigacaoId] : null;
      return `
        <div class="item-pergunta">
          <p class="item-pergunta__texto">${escapeHTML(p.pergunta)}</p>
          <p class="item-pergunta__meta">
            ${origem ? `Surgiu no Encontro #${String(origem.numero).padStart(2, '0')}` : ''}
            ${p.status === 'aberta' ? ' · Em aberto' : ''}
            ${p.status === 'investigada' && investigacao ? ` · Investigada no Encontro #${String(investigacao.numero).padStart(2, '0')}` : ''}
          </p>
        </div>`;
    }).join('') : '<p class="carregando">Nenhuma pergunta registrada ainda.</p>';
  } catch (erro) {
    console.error(erro);
    area.innerHTML = '<p class="erro-dados">Não foi possível carregar as perguntas agora.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  montarSecoesDaHome();
  montarListagemDeEncontros();
  montarPaginaDeEncontro();
  montarPaginaDePerguntas();
});
