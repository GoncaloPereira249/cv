/* Story map dos trabalhos (Leaflet 1.9.4).
   Ao descer a página, o mapa acompanha a leitura: quando um trabalho chega ao meio
   do ecrã, o mapa voa até à sua área de estudo e destaca os seus pontos. */
(function () {
  'use strict';

  var contentor = document.getElementById('mapa');
  if (!contentor || !window.L) {
    return; // sem o Leaflet, a página mostra só os trabalhos
  }

  var semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ecraEstreito = window.matchMedia('(max-width: 900px)');

  // Áreas de estudo, em coordenadas WGS84 (latitude, longitude)
  var areas = [
    { trabalho: 'paredes', cor: '#8cc084', coords: [41.2488, -8.3535],
      titulo: 'Aquisição e análise de dados geográficos', local: 'Sobrosa e Louredo, Paredes' },
    { trabalho: 'riscos', cor: '#f2a65a', coords: [41.1070, -8.5510],
      titulo: 'Cheia rápida no rio Febros', local: 'Avintes, Vila Nova de Gaia' },
    { trabalho: 'riscos', cor: '#f2a65a', coords: [41.0769, -7.9512],
      titulo: 'Fluxo de detritos', local: 'Resende' },
    { trabalho: 'riscos', cor: '#f2a65a', coords: [41.3110, -8.7390],
      titulo: 'Erosão costeira', local: 'Reserva Ornitológica de Mindelo, Vila do Conde' },
    { trabalho: 'criminalidade', cor: '#6fb3d9', coords: [39.9526, -75.1652],
      titulo: 'Criminalidade violenta', local: 'Filadélfia, Estados Unidos' },
    { trabalho: 'python', cor: '#e6ecee', coords: [41.1496, -8.6109],
      titulo: 'Alojamento Local em Python', local: 'Porto' }
  ];

  // Mapa: aproxima com os botões + e -, com a roda do rato e, no telemóvel, com dois dedos
  var mapa = L.map(contentor, {
    scrollWheelZoom: true,
    touchZoom: true,
    doubleClickZoom: true
  });

  // Fundo: imagem de satélite
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Imagens &copy; Esri, Maxar, Earthstar Geographics'
  }).addTo(mapa);

  // Por cima: limites administrativos e nomes dos lugares
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Limites e nomes &copy; Esri'
  }).addTo(mapa);

  L.control.scale({ imperial: false }).addTo(mapa);

  // Aspeto dos pontos: normal, destacado (trabalho ativo) ou apagado (outros trabalhos);
  // o contorno branco destaca-os sobre a imagem de satélite
  function estilo(area, estado) {
    if (estado === 'ativo') {
      return { radius: 11, color: '#ffffff', weight: 3, opacity: 1, fillColor: area.cor, fillOpacity: 1 };
    }
    if (estado === 'apagado') {
      return { radius: 6, color: '#ffffff', weight: 1, opacity: 0.6, fillColor: area.cor, fillOpacity: 0.45 };
    }
    return { radius: 8, color: '#ffffff', weight: 2, opacity: 1, fillColor: area.cor, fillOpacity: 1 };
  }

  var pontos = areas.map(function (area) {
    var marcador = L.circleMarker(area.coords, estilo(area, 'normal'));
    marcador.bindPopup(
      '<strong>' + area.titulo + '</strong><br>' + area.local +
      '<br><a href="#' + area.trabalho + '">Ver o trabalho</a>'
    );
    marcador.addTo(mapa);
    return { area: area, marcador: marcador };
  });

  // Vista geral: as áreas em Portugal (Filadélfia fica do outro lado do Atlântico)
  var limitesPortugal = L.latLngBounds(
    areas.filter(function (area) { return area.trabalho !== 'criminalidade'; })
      .map(function (area) { return area.coords; })
  ).pad(0.25);

  function voarPara(destino, zoom) {
    var opcoes = { animate: !semAnimacao, duration: 1.4 };
    if (zoom === undefined) {
      mapa.flyToBounds(destino, opcoes);
    } else {
      mapa.flyTo(destino, zoom, opcoes);
    }
  }

  // Passos da história: a introdução ("geral") e um por trabalho
  var passos = Array.prototype.slice.call(document.querySelectorAll('[data-passo]'));
  var atual = null;

  function ativar(passo) {
    if (passo === atual) {
      return;
    }
    atual = passo;

    passos.forEach(function (elemento) {
      elemento.classList.toggle('ativo', elemento.getAttribute('data-passo') === passo);
    });

    var doTrabalho = [];
    pontos.forEach(function (p) {
      var estado = 'normal';
      if (passo !== 'geral') {
        estado = (p.area.trabalho === passo) ? 'ativo' : 'apagado';
      }
      p.marcador.setStyle(estilo(p.area, estado));
      if (p.area.trabalho === passo) {
        doTrabalho.push(p.marcador);
        p.marcador.bringToFront();
      }
    });

    mapa.closePopup();
    if (doTrabalho.length === 0) {
      voarPara(limitesPortugal);
    } else if (doTrabalho.length === 1) {
      voarPara(doTrabalho[0].getLatLng(), passo === 'criminalidade' ? 10 : 11);
    } else {
      voarPara(L.latLngBounds(doTrabalho.map(function (m) { return m.getLatLng(); })).pad(0.35));
    }
  }

  // O passo ativo é o último cujo topo já passou a linha de leitura
  function verificar() {
    var linha = window.innerHeight * (ecraEstreito.matches ? 0.7 : 0.5);
    var escolhido = passos[0];
    passos.forEach(function (elemento) {
      if (elemento.getBoundingClientRect().top <= linha) {
        escolhido = elemento;
      }
    });
    if (escolhido) {
      ativar(escolhido.getAttribute('data-passo'));
    }
  }

  var pendente = false;
  window.addEventListener('scroll', function () {
    if (!pendente) {
      pendente = true;
      window.requestAnimationFrame(function () {
        pendente = false;
        verificar();
      });
    }
  }, { passive: true });

  window.addEventListener('resize', function () {
    mapa.invalidateSize();
  });

  mapa.fitBounds(limitesPortugal);
  document.documentElement.classList.add('com-mapa');
  verificar();
})();
