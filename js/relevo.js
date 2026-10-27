/* Relevo interativo da página inicial.
   As curvas de nível são calculadas em tempo real com o algoritmo "marching squares"
   sobre uma superfície com três elevações; o cursor acrescenta uma pequena elevação
   e ilumina as curvas à sua volta. */
(function () {
  'use strict';

  var heroi = document.querySelector('.heroi');
  var tela = document.getElementById('relevo');
  if (!heroi || !tela || !tela.getContext) {
    return; // sem canvas, fica o relevo estático do CSS
  }

  document.documentElement.classList.add('js');

  var ctx = tela.getContext('2d');

  var NIVEIS = 22;            // número de curvas de nível
  var EQUIDISTANCIA = 0.062;  // distância entre curvas, em unidades da superfície

  var W, H, nx, ny, base, valores;
  var rato = { x: 0.74, y: 0.42 }; // posição do cursor, em proporção da largura e da altura
  var pedido = false;

  // Lados de uma célula cortados pela curva, para cada um dos 16 casos do marching squares
  // (0 = cima, 1 = direita, 2 = baixo, 3 = esquerda)
  var LADOS = {
    1: [3, 2], 2: [2, 1], 3: [3, 1], 4: [0, 1], 5: [3, 0, 2, 1], 6: [0, 2], 7: [3, 0],
    8: [3, 0], 9: [0, 2], 10: [3, 2, 0, 1], 11: [0, 1], 12: [3, 1], 13: [2, 1], 14: [3, 2]
  };

  function preparar() {
    var caixa = tela.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = caixa.width;
    H = caixa.height;
    tela.width = Math.round(W * dpr);
    tela.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // grelha com células de cerca de 8 píxeis
    nx = Math.max(40, Math.round(W / 8));
    ny = Math.max(30, Math.round(H / 8));
    base = new Float32Array((nx + 1) * (ny + 1));
    valores = new Float32Array((nx + 1) * (ny + 1));

    for (var j = 0; j <= ny; j++) {
      for (var i = 0; i <= nx; i++) {
        var x = i / nx;
        var y = j / ny;
        base[j * (nx + 1) + i] =
          1.00 * Math.exp(-(Math.pow((x - 0.76) / 0.20, 2) + Math.pow((y - 0.45) / 0.30, 2))) +
          0.60 * Math.exp(-(Math.pow((x - 0.95) / 0.10, 2) + Math.pow((y - 0.08) / 0.18, 2))) +
          0.45 * Math.exp(-(Math.pow((x - 0.48) / 0.18, 2) + Math.pow((y - 0.98) / 0.22, 2))) +
          0.04 * Math.sin(x * 23) * Math.cos(y * 17);
      }
    }
  }

  // altura num nó da grelha: relevo de base mais a elevação no cursor
  function altura(i, j) {
    var x = i / nx;
    var y = j / ny;
    return base[j * (nx + 1) + i] +
      0.32 * Math.exp(-(Math.pow((x - rato.x) / 0.06, 2) + Math.pow((y - rato.y) / 0.10, 2)));
  }

  // ponto onde a curva de nível L corta um lado da célula (interpolação linear)
  function ponto(lado, a, b, c, d, L, x0, y0, sx, sy) {
    if (lado === 0) { return [x0 + (L - a) / (b - a) * sx, y0]; }
    if (lado === 1) { return [x0 + sx, y0 + (L - b) / (c - b) * sy]; }
    if (lado === 2) { return [x0 + (L - d) / (c - d) * sx, y0 + sy]; }
    return [x0, y0 + (L - a) / (d - a) * sy];
  }

  function desenhar() {
    var i, j, n, s;
    for (j = 0; j <= ny; j++) {
      for (i = 0; i <= nx; i++) {
        valores[j * (nx + 1) + i] = altura(i, j);
      }
    }

    ctx.clearRect(0, 0, W, H);
    var sx = W / nx;
    var sy = H / ny;

    // as curvas acendem à volta do cursor
    var cx = rato.x * W;
    var cy = rato.y * H;
    var luz = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.32);
    luz.addColorStop(0, 'rgba(242, 166, 90, 0.95)');
    luz.addColorStop(1, 'rgba(242, 166, 90, 0.15)');
    ctx.strokeStyle = luz;

    for (n = 0; n < NIVEIS; n++) {
      var L = 0.06 + n * EQUIDISTANCIA;
      ctx.lineWidth = (n % 5 === 4) ? 1.8 : 0.9; // curvas mestras de cinco em cinco
      ctx.beginPath();
      for (j = 0; j < ny; j++) {
        for (i = 0; i < nx; i++) {
          var a = valores[j * (nx + 1) + i];
          var b = valores[j * (nx + 1) + i + 1];
          var c = valores[(j + 1) * (nx + 1) + i + 1];
          var d = valores[(j + 1) * (nx + 1) + i];
          var caso = (a > L ? 8 : 0) + (b > L ? 4 : 0) + (c > L ? 2 : 0) + (d > L ? 1 : 0);
          if (caso === 0 || caso === 15) {
            continue;
          }
          var lados = LADOS[caso];
          for (s = 0; s < lados.length; s += 2) {
            var p = ponto(lados[s], a, b, c, d, L, i * sx, j * sy, sx, sy);
            var q = ponto(lados[s + 1], a, b, c, d, L, i * sx, j * sy, sx, sy);
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(q[0], q[1]);
          }
        }
      }
      ctx.stroke();
    }
  }

  function pedirDesenho() {
    if (!pedido) {
      pedido = true;
      window.requestAnimationFrame(function () {
        pedido = false;
        desenhar();
      });
    }
  }

  function seguirCursor(evento) {
    var caixa = tela.getBoundingClientRect();
    rato.x = (evento.clientX - caixa.left) / caixa.width;
    rato.y = (evento.clientY - caixa.top) / caixa.height;
    pedirDesenho();
  }

  heroi.addEventListener('pointermove', seguirCursor);
  heroi.addEventListener('pointerdown', seguirCursor);
  window.addEventListener('resize', function () {
    preparar();
    pedirDesenho();
  });

  preparar();
  desenhar();
})();
