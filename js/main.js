/* ==========================================================================
   ENTRE NÓS — main.js
   Comportamento comum a todas as páginas: cabeçalho/rodapé reutilizáveis,
   menu mobile, acordeão e formulários sem backend.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  carregarParciais().then(() => {
    marcarLinkAtivo();
    ativarMenuMobile();
  });
  ativarAcordeoes();
  ativarFormularios();
  document.querySelectorAll('[data-ano-atual]').forEach(el => { el.textContent = new Date().getFullYear(); });
});

/* --- Carrega header.html e footer.html dentro dos elementos marcados --- */
async function carregarParciais() {
  const alvos = document.querySelectorAll('[data-parcial]');
  await Promise.all(Array.from(alvos).map(async (el) => {
    const caminho = el.getAttribute('data-parcial');
    try {
      const resposta = await fetch(caminho);
      el.innerHTML = await resposta.text();
    } catch (erro) {
      console.error('Não foi possível carregar ' + caminho + '. O site precisa rodar em um servidor local (não abra o arquivo diretamente).', erro);
    }
  }));
}

/* --- Marca o item de navegação da página atual usando data-pagina no <body> --- */
function marcarLinkAtivo() {
  const pagina = document.body.getAttribute('data-pagina');
  if (!pagina) return;
  document.querySelectorAll('.nav-principal__link[data-link]').forEach(link => {
    if (link.getAttribute('data-link') === pagina) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

function ativarMenuMobile() {
  const botao = document.querySelector('.botao-menu');
  if (!botao) return;
  botao.addEventListener('click', () => {
    const aberto = document.body.classList.toggle('menu-aberto');
    botao.setAttribute('aria-expanded', String(aberto));
  });
  document.querySelectorAll('.nav-principal__link').forEach(link => {
    link.addEventListener('click', () => document.body.classList.remove('menu-aberto'));
  });
}

/* --- Acordeão acessível (usado em Participar) --- */
function ativarAcordeoes() {
  document.querySelectorAll('.acordeao__item').forEach(item => {
    const botao = item.querySelector('.acordeao__pergunta');
    const resposta = item.querySelector('.acordeao__resposta');
    if (!botao || !resposta) return;
    botao.addEventListener('click', () => {
      const aberto = item.getAttribute('data-aberto') === 'true';
      item.setAttribute('data-aberto', String(!aberto));
      botao.setAttribute('aria-expanded', String(!aberto));
      resposta.style.maxHeight = !aberto ? resposta.scrollHeight + 'px' : '0px';
    });
  });
}

/* --- Formulários sem backend: mostram uma confirmação visual e não fingem
   enviar os dados a lugar nenhum. Ver README.md para conectar um backend real. --- */
function ativarFormularios() {
  document.querySelectorAll('form[data-form-sem-backend]').forEach(form => {
    form.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const mensagem = form.parentElement.querySelector('.mensagem-envio');
      form.reset();
      if (mensagem) {
        mensagem.classList.add('visivel');
        mensagem.setAttribute('tabindex', '-1');
        mensagem.focus();
      }
    });
  });
}
