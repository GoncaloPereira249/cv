/* Mapa do percurso (página Experiência).
   Ao carregar num cartão (ou ao passar o rato, nos ecrãs largos), o ponto do seu lugar
   acende no mapa; ao carregar num ponto do mapa, acende o cartão. Sem JavaScript, os pontos
   são ligações que descem até ao cartão. */
(function () {
  'use strict';

  var cartoes = Array.prototype.slice.call(document.querySelectorAll('.experiencia'));
  var pontos = Array.prototype.slice.call(document.querySelectorAll('.ponto'));
  var legenda = document.querySelector('.percurso-mapa figcaption');
  if (cartoes.length === 0 || pontos.length === 0 || !legenda) {
    return;
  }

  // verdadeiro quando o mapa está ao lado dos cartões (no CSS, até 900px fica por cima)
  var aoLado = window.matchMedia('(min-width: 901px)');

  function ativar(cartao) {
    var lugar = cartao.getAttribute('data-lugar');

    cartoes.forEach(function (c) {
      c.classList.toggle('ativa', c === cartao);
    });
    pontos.forEach(function (p) {
      p.classList.toggle('ativo', lugar !== null && p.getAttribute('data-lugar') === lugar);
    });

    // a legenda do mapa diz o que está aceso
    var titulo = cartao.querySelector('h3').textContent;
    var local = cartao.querySelector('.local').textContent;
    legenda.textContent = lugar ? titulo + ': ' + local : titulo + ': atividade online, sem lugar no mapa';
  }

  cartoes.forEach(function (cartao) {
    // passar o rato só acende o mapa quando ele está à vista, ao lado dos cartões;
    // em ecrãs estreitos, depois de saltar para um cartão, o rato ficava por cima de outro
    cartao.addEventListener('mouseenter', function () {
      if (aoLado.matches) {
        ativar(cartao);
      }
    });
    cartao.addEventListener('focusin', function () { ativar(cartao); });
    cartao.addEventListener('click', function () { ativar(cartao); });
  });

  pontos.forEach(function (ponto) {
    ponto.addEventListener('click', function () {
      // o href do ponto (#exp-bar) é o id do cartão
      var cartao = document.getElementById(ponto.getAttribute('href').slice(1));
      if (cartao) {
        ativar(cartao);
      }
    });
  });

  ativar(cartoes[0]);
})();
