/* Visualizador de mapas em ecrã inteiro (página Trabalhos).
   Os mapas das galerias abrem numa janela (elemento <dialog>) e passa-se de um para o
   outro com os botões, com as setas do teclado ou a deslizar no telemóvel.
   Sem JavaScript, cada miniatura abre a imagem grande num separador novo. */
(function () {
  'use strict';

  var ligacoes = Array.prototype.slice.call(document.querySelectorAll('.galeria a.moldura'));
  if (ligacoes.length === 0 || typeof HTMLDialogElement !== 'function') {
    return;
  }

  function icone(caminho) {
    return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
      '<path d="' + caminho + '" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // Janela do visualizador, criada uma vez
  var janela = document.createElement('dialog');
  janela.className = 'visualizador';
  janela.setAttribute('aria-label', 'Visualizador de mapas');
  janela.tabIndex = -1; // a própria janela recebe o foco ao abrir (as setas funcionam logo)
  janela.innerHTML =
    '<div class="visualizador-imagem"><img src="data:," alt=""></div>' +
    '<div class="visualizador-rodape">' +
    '<p class="visualizador-legenda"><strong></strong><span></span></p>' +
    '<p class="visualizador-contador"></p>' +
    '</div>' +
    '<button type="button" class="visualizador-botao visualizador-anterior" aria-label="Mapa anterior">' + icone('M15 5l-7 7 7 7') + '</button>' +
    '<button type="button" class="visualizador-botao visualizador-seguinte" aria-label="Mapa seguinte">' + icone('M9 5l7 7-7 7') + '</button>' +
    '<button type="button" class="visualizador-botao visualizador-fechar" aria-label="Fechar">' + icone('M6 6l12 12M18 6L6 18') + '</button>';
  document.body.appendChild(janela);

  var imagem = janela.querySelector('img');
  var titulo = janela.querySelector('.visualizador-legenda strong');
  var legenda = janela.querySelector('.visualizador-legenda span');
  var contador = janela.querySelector('.visualizador-contador');
  var indice = 0;
  var abridor = null;

  function mostrar(n) {
    indice = (n + ligacoes.length) % ligacoes.length;
    var ligacao = ligacoes[indice];
    var miniatura = ligacao.querySelector('img');
    var figura = ligacao.closest('figure');
    var artigo = ligacao.closest('article');

    imagem.src = ligacao.getAttribute('href');
    imagem.alt = miniatura ? miniatura.alt : '';
    titulo.textContent = artigo ? artigo.querySelector('h2').textContent : '';
    legenda.textContent = figura && figura.querySelector('figcaption') ? figura.querySelector('figcaption').textContent : '';
    contador.textContent = (indice + 1) + ' de ' + ligacoes.length;

    // carrega já o mapa seguinte, para a passagem ser imediata
    var seguinte = new Image();
    seguinte.src = ligacoes[(indice + 1) % ligacoes.length].getAttribute('href');
  }

  ligacoes.forEach(function (ligacao, n) {
    ligacao.addEventListener('click', function (evento) {
      evento.preventDefault();
      abridor = ligacao;
      mostrar(n);
      janela.showModal();
      janela.focus();
    });
  });

  janela.querySelector('.visualizador-anterior').addEventListener('click', function () { mostrar(indice - 1); });
  janela.querySelector('.visualizador-seguinte').addEventListener('click', function () { mostrar(indice + 1); });
  janela.querySelector('.visualizador-fechar').addEventListener('click', function () { janela.close(); });

  // teclado: setas para mudar de mapa (a tecla Esc fecha, por ser um <dialog>)
  janela.addEventListener('keydown', function (evento) {
    if (evento.key === 'ArrowLeft') {
      mostrar(indice - 1);
    } else if (evento.key === 'ArrowRight') {
      mostrar(indice + 1);
    }
  });

  // clicar no fundo escuro, fora da janela, fecha
  janela.addEventListener('click', function (evento) {
    if (evento.target === janela) {
      janela.close();
    }
  });

  // deslizar o dedo para o lado, no telemóvel
  var inicioX = null;
  janela.addEventListener('pointerdown', function (evento) { inicioX = evento.clientX; });
  janela.addEventListener('pointerup', function (evento) {
    if (inicioX === null) {
      return;
    }
    var distancia = evento.clientX - inicioX;
    inicioX = null;
    if (Math.abs(distancia) > 60) {
      mostrar(distancia < 0 ? indice + 1 : indice - 1);
    }
  });

  // ao fechar, o foco volta à miniatura que abriu o visualizador
  janela.addEventListener('close', function () {
    if (abridor) {
      abridor.focus();
    }
  });
})();
