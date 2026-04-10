/**
 * Élections Municipales 2026 — Application principale
 * =====================================================
 * Charge les données depuis data/processed/bureaux_vote_final.json
 * (produit par src/pipeline.py) ou bascule sur les données de test
 * embarquées si le fichier n'est pas disponible (ouverture directe
 * sans serveur HTTP).
 */

/* ══════════════════════════════════════════════════════
   CONSTANTES
   ══════════════════════════════════════════════════════ */

const CSP_COLOR = {
  'Ouvriers':             '#3d8bff',
  'Cadres':               '#9b7aff',
  'Prof. intermédiaires': '#9b7aff',
  'Artisans/Commerçants': '#f58c42',
  'Retraités':            '#f5c842',
  'Employés':             '#34d07a',
  'Agriculteurs':         '#c97c4a',
  'Sans activité':        '#6a7a9a',
  'Inconnue':             '#3a4860',
};

const LIST_COLORS = ['#3d8bff','#9b7aff','#34d07a','#f5c842','#f05050','#2dd4c0','#f58c42'];

/** Chemin vers le JSON produit par le pipeline (relatif à index.html) */
const DATA_PATH = '../data/processed/bureaux_vote_final.json';

/* ══════════════════════════════════════════════════════
   DONNÉES DE TEST (fallback si pas de serveur HTTP)
   ══════════════════════════════════════════════════════ */

const SAMPLE_DATA = [{"bv_id":1,"code_dept":"13","code_commune":"13055","nom_commune":"Marseille","num_bv":"0001","inscrits":828,"votants":354,"abstentions":474,"taux_abstention":57.13,"taux_participation":42.75,"exprimes":344,"blancs_nuls":10,"nb_listes":6,"nuances":["LDVG","LREM","LRN","LDVD","LDIV","LECO"],"sortant_present":true,"csp_dominante":"Ouvriers","csp_scores":{"Agriculteurs":2.1,"Artisans/Commerçants":7.8,"Cadres":15.2,"Prof. intermédiaires":14.8,"Employés":18.9,"Ouvriers":19.4,"Retraités":22.1,"Sans activité":20.4},"voix_listes":[110,89,81,51,10,3],"lat":43.29087,"lon":5.36996,"tour":1},{"bv_id":2,"code_dept":"13","code_commune":"13055","nom_commune":"Marseille","num_bv":"0002","inscrits":654,"votants":319,"abstentions":335,"taux_abstention":51.13,"taux_participation":48.78,"exprimes":306,"blancs_nuls":13,"nb_listes":6,"nuances":["LDVG","LREM","LRN","LDVD","LDIV","LECO"],"sortant_present":true,"csp_dominante":"Ouvriers","csp_scores":{"Agriculteurs":2.1,"Artisans/Commerçants":7.8,"Cadres":15.2,"Prof. intermédiaires":14.8,"Employés":18.9,"Ouvriers":19.4,"Retraités":22.1,"Sans activité":20.4},"voix_listes":[80,63,62,40,37,24],"lat":43.30168,"lon":5.35959,"tour":1},{"bv_id":3,"code_dept":"13","code_commune":"13055","nom_commune":"Marseille","num_bv":"0003","inscrits":1465,"votants":773,"abstentions":692,"taux_abstention":47.19,"taux_participation":52.76,"exprimes":728,"blancs_nuls":45,"nb_listes":6,"nuances":["LDVG","LREM","LRN","LDVD","LDIV","LECO"],"sortant_present":true,"csp_dominante":"Ouvriers","csp_scores":{"Agriculteurs":2.1,"Artisans/Commerçants":7.8,"Cadres":15.2,"Prof. intermédiaires":14.8,"Employés":18.9,"Ouvriers":19.4,"Retraités":22.1,"Sans activité":20.4},"voix_listes":[223,211,157,88,25,24],"lat":43.30109,"lon":5.37089,"tour":1},{"bv_id":13,"code_dept":"75","code_commune":"75056","nom_commune":"Paris 11e","num_bv":"0001","inscrits":1229,"votants":813,"abstentions":416,"taux_abstention":33.79,"taux_participation":66.15,"exprimes":779,"blancs_nuls":34,"nb_listes":7,"nuances":["LREM","LGAU","LECO","LRFI","LDVG","LDVD","LDIV"],"sortant_present":false,"csp_dominante":"Cadres","csp_scores":{"Agriculteurs":0.2,"Artisans/Commerçants":6.5,"Cadres":28.4,"Prof. intermédiaires":19.6,"Employés":20.1,"Ouvriers":10.3,"Retraités":18.8,"Sans activité":14.9},"voix_listes":[197,162,145,131,105,24,15],"lat":48.86954,"lon":2.36915,"tour":1},{"bv_id":14,"code_dept":"75","code_commune":"75056","nom_commune":"Paris 11e","num_bv":"0002","inscrits":1680,"votants":1042,"abstentions":638,"taux_abstention":37.94,"taux_participation":62.02,"exprimes":985,"blancs_nuls":57,"nb_listes":7,"nuances":["LREM","LGAU","LECO","LRFI","LDVG","LDVD","LDIV"],"sortant_present":false,"csp_dominante":"Cadres","csp_scores":{"Agriculteurs":0.2,"Artisans/Commerçants":6.5,"Cadres":28.4,"Prof. intermédiaires":19.6,"Employés":20.1,"Ouvriers":10.3,"Retraités":18.8,"Sans activité":14.9},"voix_listes":[290,210,155,122,89,61,58],"lat":48.8636,"lon":2.37734,"tour":1},{"bv_id":21,"code_dept":"69","code_commune":"69123","nom_commune":"Lyon 3e","num_bv":"0001","inscrits":724,"votants":474,"abstentions":250,"taux_abstention":34.47,"taux_participation":65.47,"exprimes":454,"blancs_nuls":20,"nb_listes":5,"nuances":["LREM","LDVG","LECO","LDVD","LDIV"],"sortant_present":true,"csp_dominante":"Cadres","csp_scores":{"Agriculteurs":0.8,"Artisans/Commerçants":7.2,"Cadres":24.1,"Prof. intermédiaires":17.9,"Employés":18.4,"Ouvriers":14.2,"Retraités":20.1,"Sans activité":16.3},"voix_listes":[173,151,89,27,14],"lat":45.75772,"lon":4.83855,"tour":1},{"bv_id":33,"code_dept":"06","code_commune":"06088","nom_commune":"Nice","num_bv":"0001","inscrits":1319,"votants":991,"abstentions":328,"taux_abstention":24.82,"taux_participation":75.13,"exprimes":933,"blancs_nuls":58,"nb_listes":4,"nuances":["LDVD","LREM","LDVG","LDIV"],"sortant_present":true,"csp_dominante":"Retraités","csp_scores":{"Agriculteurs":0.5,"Artisans/Commerçants":8.1,"Cadres":16.2,"Prof. intermédiaires":14.6,"Employés":16.8,"Ouvriers":10.2,"Retraités":31.4,"Sans activité":20.1},"voix_listes":[354,342,195,42],"lat":43.70377,"lon":7.27588,"tour":2},{"bv_id":34,"code_dept":"06","code_commune":"06088","nom_commune":"Nice","num_bv":"0002","inscrits":1143,"votants":867,"abstentions":276,"taux_abstention":24.08,"taux_participation":75.86,"exprimes":849,"blancs_nuls":18,"nb_listes":4,"nuances":["LDVD","LREM","LDVG","LDIV"],"sortant_present":true,"csp_dominante":"Retraités","csp_scores":{"Agriculteurs":0.5,"Artisans/Commerçants":8.1,"Cadres":16.2,"Prof. intermédiaires":14.6,"Employés":16.8,"Ouvriers":10.2,"Retraités":31.4,"Sans activité":20.1},"voix_listes":[310,233,171,135],"lat":43.71988,"lon":7.25047,"tour":2},{"bv_id":50,"code_dept":"59","code_commune":"59350","nom_commune":"Lille","num_bv":"0001","inscrits":972,"votants":666,"abstentions":306,"taux_abstention":31.47,"taux_participation":68.51,"exprimes":652,"blancs_nuls":14,"nb_listes":7,"nuances":["LDVG","LRFI","LREM","LECO","LDVD","LDIV","LGAU"],"sortant_present":true,"csp_dominante":"Ouvriers","csp_scores":{"Agriculteurs":1.1,"Artisans/Commerçants":7.1,"Cadres":13.4,"Prof. intermédiaires":14.2,"Employés":19.8,"Ouvriers":24.1,"Retraités":22.4,"Sans activité":20.8},"voix_listes":[153,136,134,67,67,58,37],"lat":50.62425,"lon":3.04476,"tour":2},{"bv_id":51,"code_dept":"59","code_commune":"59350","nom_commune":"Lille","num_bv":"0002","inscrits":639,"votants":329,"abstentions":310,"taux_abstention":48.48,"taux_participation":51.48,"exprimes":310,"blancs_nuls":19,"nb_listes":7,"nuances":["LDVG","LRFI","LREM","LECO","LDVD","LDIV","LGAU"],"sortant_present":true,"csp_dominante":"Ouvriers","csp_scores":{"Agriculteurs":1.1,"Artisans/Commerçants":7.1,"Cadres":13.4,"Prof. intermédiaires":14.2,"Employés":19.8,"Ouvriers":24.1,"Retraités":22.4,"Sans activité":20.8},"voix_listes":[127,108,31,28,8,5,3],"lat":50.63163,"lon":3.04946,"tour":2},{"bv_id":71,"code_dept":"48","code_commune":"48095","nom_commune":"Mende","num_bv":"0001","inscrits":1112,"votants":742,"abstentions":370,"taux_abstention":33.27,"taux_participation":66.7,"exprimes":708,"blancs_nuls":34,"nb_listes":2,"nuances":["LDVD","LDIV"],"sortant_present":true,"csp_dominante":"Agriculteurs","csp_scores":{"Agriculteurs":12.4,"Artisans/Commerçants":8.4,"Cadres":8.4,"Prof. intermédiaires":12.8,"Employés":14.8,"Ouvriers":10.2,"Retraités":28.4,"Sans activité":24.1},"voix_listes":[421,287],"lat":44.50991,"lon":3.50884,"tour":2},{"bv_id":72,"code_dept":"48","code_commune":"48095","nom_commune":"Mende","num_bv":"0002","inscrits":1151,"votants":809,"abstentions":342,"taux_abstention":29.7,"taux_participation":70.28,"exprimes":775,"blancs_nuls":34,"nb_listes":2,"nuances":["LDVD","LDIV"],"sortant_present":true,"csp_dominante":"Agriculteurs","csp_scores":{"Agriculteurs":12.4,"Artisans/Commerçants":8.4,"Cadres":8.4,"Prof. intermédiaires":12.8,"Employés":14.8,"Ouvriers":10.2,"Retraités":28.4,"Sans activité":24.1},"voix_listes":[631,144],"lat":44.51988,"lon":3.49917,"tour":2}];

/* ══════════════════════════════════════════════════════
   ÉTAT GLOBAL
   ══════════════════════════════════════════════════════ */

let RAW = [];           // données brutes (tous les BV)
let COMMUNES = {};      // index par code_commune
let mapMode = 'abstention';
let cspFilter = 'all';
let tourFilter = '1';   // '1', '2', ou 'all'
let selectedCommune = null;
let selectedBV = null;
let markers = {};
let map = null;

/* ══════════════════════════════════════════════════════
   CHARGEMENT DES DONNÉES
   ══════════════════════════════════════════════════════ */

async function loadData() {
  try {
    const res = await fetch(DATA_PATH);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    RAW = await res.json();
    const badge = document.getElementById('data-badge');
    badge.textContent = `✓ ${RAW.length.toLocaleString()} bureaux chargés`;
    badge.style.background = 'rgba(52,208,122,.12)';
    badge.style.color = 'var(--green)';
    badge.style.borderColor = 'rgba(52,208,122,.3)';
  } catch (err) {
    // Pas de serveur HTTP ou fichier absent → données de test
    RAW = SAMPLE_DATA;
    console.warn('Données de test utilisées (erreur :', err.message || err, ')');
  }
  buildCommuneIndex();
  initMap();
  renderCommuneList();
  updateGlobalStats();
  renderNationalView();
}

function buildCommuneIndex() {
  COMMUNES = {};
  const activeRaw = tourFilter === 'all' ? RAW : RAW.filter(b => String(b.tour ?? 1) === tourFilter);
  activeRaw.forEach(b => {
    if (!COMMUNES[b.code_commune]) {
      COMMUNES[b.code_commune] = {
        code:       b.code_commune,
        dept:       b.code_dept,
        nom:        b.nom_commune,
        csp:        b.csp_dominante,
        csp_scores: b.csp_scores || {},
        nb_listes:  b.nb_listes,
        nuances:    b.nuances || [],
        sortant:    b.sortant_present,
        bureaux:    [],
      };
    }
    COMMUNES[b.code_commune].bureaux.push(b);
  });

  // Agrégation au niveau commune
  Object.values(COMMUNES).forEach(c => {
    c.inscrits    = c.bureaux.reduce((s, b) => s + b.inscrits, 0);
    c.votants     = c.bureaux.reduce((s, b) => s + b.votants, 0);
    c.abstentions = c.bureaux.reduce((s, b) => s + b.abstentions, 0);
    c.taux_abstention = c.inscrits
      ? +(c.abstentions / c.inscrits * 100).toFixed(2)
      : 0;
    c.lat = c.bureaux.reduce((s, b) => s + b.lat, 0) / c.bureaux.length;
    c.lon = c.bureaux.reduce((s, b) => s + b.lon, 0) / c.bureaux.length;
  });
}

/* ══════════════════════════════════════════════════════
   COULEURS
   ══════════════════════════════════════════════════════ */

function absColor(pct) {
  const t = Math.max(0, Math.min(1, (pct - 20) / 50));
  const r = Math.round(52  + t * (240 - 52));
  const g = Math.round(208 + t * (80  - 208));
  const b = Math.round(122 + t * (80  - 122));
  return `rgb(${r},${g},${b})`;
}

function listColor(n) {
  const t = Math.max(0, Math.min(1, (n - 1) / 7));
  return `rgb(${Math.round(100 + t*(-39))},${Math.round(130 + t*(9))},${Math.round(200 + t*(55))})`;
}

function markerColor(c) {
  if (mapMode === 'abstention') return absColor(c.taux_abstention);
  if (mapMode === 'listes')     return listColor(c.nb_listes);
  return c.sortant ? '#34d07a' : '#f05050';
}

function cspColor(csp) {
  return CSP_COLOR[csp] || '#3a4860';
}

/* ══════════════════════════════════════════════════════
   CARTE LEAFLET
   ══════════════════════════════════════════════════════ */

function findNearestCommune(lat, lon) {
  let best = null, bestDist = Infinity;
  Object.values(COMMUNES).forEach(c => {
    const dlat = c.lat - lat, dlon = c.lon - lon;
    const d = dlat * dlat + dlon * dlon;
    if (d < bestDist) { bestDist = d; best = c; }
  });
  return best;
}

function centerMapOn(lat, lon) {
  const kmLat = 50 / 111.32;
  const kmLon = 50 / (111.32 * Math.cos(lat * Math.PI / 180));
  map.fitBounds([
    [lat - kmLat, lon - kmLon],
    [lat + kmLat, lon + kmLon]
  ]);
  drawCommuneMarkers();

  // Select the nearest commune without flying (map is already centered)
  const nearest = findNearestCommune(lat, lon);
  if (nearest) {
    selectedCommune = nearest.code;
    selectedBV = null;
    renderCommuneList();
    drawBVMarkers(nearest);
    renderCommuneView(nearest);
  }
}

function initMap() {
  const COLMAR = [48.0792, 7.3558];

  map = L.map('map', { zoomControl: true, attributionControl: false })
    .setView(COLMAR, 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 })
    .addTo(map);

  map.on('moveend zoomend', () => {
    if (selectedCommune) {
      drawBVMarkers(COMMUNES[selectedCommune]);
    } else {
      drawCommuneMarkers();
    }
  });
  drawCommuneMarkers();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        // Use GPS only if position is within metropolitan France
        if (lat >= 41.3 && lat <= 51.1 && lon >= -5.1 && lon <= 9.6) {
          centerMapOn(lat, lon);
        } else {
          centerMapOn(COLMAR[0], COLMAR[1]);
        }
      },
      () => centerMapOn(COLMAR[0], COLMAR[1]),
      { timeout: 5000 }
    );
  } else {
    centerMapOn(COLMAR[0], COLMAR[1]);
  }
}

const MAX_MARKERS = 800;

function drawCommuneMarkers() {
  clearMarkers();
  const bounds = map.getBounds();
  const all = Object.values(COMMUNES)
    .filter(c => (cspFilter === 'all' || c.csp === cspFilter)
              && bounds.contains([c.lat, c.lon]));

  // Limiter le nombre de marqueurs pour éviter de geler le navigateur
  const subset = all.length > MAX_MARKERS
    ? all.sort((a, b) => b.inscrits - a.inscrits).slice(0, MAX_MARKERS)
    : all;

  subset.forEach(c => {
    const m = L.circleMarker([c.lat, c.lon], {
      radius:      Math.max(8, Math.min(22, 6 + c.inscrits / 800)),
      fillColor:   markerColor(c),
      color:       'rgba(255,255,255,.3)',
      weight:      1.5,
      fillOpacity: 0.85,
    }).addTo(map);

    m.on('mousemove', e => showCommuneTooltip(e, c));
    m.on('mouseout',  hideTooltip);
    m.on('click',     () => selectCommune(c.code));
    markers[c.code] = m;
  });

  updateLegend();
}

function drawBVMarkers(commune) {
  clearMarkers();
  commune.bureaux.forEach(b => {
    const color = mapMode === 'abstention' ? absColor(b.taux_abstention)
                : mapMode === 'listes'     ? listColor(b.nb_listes)
                : (b.sortant_present ? '#34d07a' : '#f05050');

    const m = L.circleMarker([b.lat, b.lon], {
      radius:      Math.max(7, Math.min(16, 5 + b.inscrits / 300)),
      fillColor:   color,
      color:       'rgba(255,255,255,.4)',
      weight:      1.5,
      fillOpacity: 0.9,
    }).addTo(map);

    m.on('mousemove', e => showBVTooltip(e, b, commune));
    m.on('mouseout',  hideTooltip);
    m.on('click',     () => selectBV(b, commune));
    markers[b.bv_id] = m;
  });
}

function clearMarkers() {
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};
}

/* ── Tooltip ── */
function showCommuneTooltip(e, c) {
  const tt = document.getElementById('map-tooltip');
  tt.innerHTML = `
    <div class="tt-head">
      <span class="tt-name">${c.nom}</span>
      <span class="tt-code">${c.code}</span>
    </div>
    <div class="tt-row"><span class="tt-lbl">Abstention</span>
      <span class="tt-val" style="color:${absColor(c.taux_abstention)}">${c.taux_abstention.toFixed(1)}%</span></div>
    <div class="tt-row"><span class="tt-lbl">CSP dominante</span>
      <span class="tt-val" style="color:${cspColor(c.csp)}">${c.csp}</span></div>
    <div class="tt-row"><span class="tt-lbl">Listes candidates</span>
      <span class="tt-val">${c.nb_listes}</span></div>
    <div class="tt-row"><span class="tt-lbl">Bureaux de vote</span>
      <span class="tt-val">${c.bureaux.length}</span></div>
    <div class="tt-row"><span class="tt-lbl">Inscrits</span>
      <span class="tt-val">${c.inscrits.toLocaleString('fr-FR')}</span></div>
    <hr class="tt-divider">
    <div class="tt-row"><span class="tt-lbl">Sortant</span>
      <span class="tt-val"><span class="tt-tag ${c.sortant ? 'yes' : 'no'}">${c.sortant ? 'Présent' : 'Absent'}</span></span></div>`;
  positionTooltip(e, tt);
}

function showBVTooltip(e, b, c) {
  const tt = document.getElementById('map-tooltip');
  tt.innerHTML = `
    <div class="tt-head">
      <span class="tt-name">${c.nom}</span>
      <span class="tt-code">${b.num_bv}</span>
    </div>
    <div class="tt-row"><span class="tt-lbl">Abstention</span>
      <span class="tt-val" style="color:${absColor(b.taux_abstention)}">${b.taux_abstention.toFixed(1)}%</span></div>
    <div class="tt-row"><span class="tt-lbl">Inscrits</span>
      <span class="tt-val">${b.inscrits.toLocaleString('fr-FR')}</span></div>
    <div class="tt-row"><span class="tt-lbl">Exprimés</span>
      <span class="tt-val">${b.exprimes.toLocaleString('fr-FR')}</span></div>
    <div class="tt-row"><span class="tt-lbl">Listes</span>
      <span class="tt-val">${b.nb_listes}</span></div>`;
  positionTooltip(e, tt);
}

function positionTooltip(e, tt) {
  const rect = document.getElementById('map').getBoundingClientRect();
  let x = e.originalEvent.clientX - rect.left + 14;
  let y = e.originalEvent.clientY - rect.top + 14;
  if (x + 230 > rect.width) x -= 244;
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
  tt.classList.add('show');
}

function hideTooltip() {
  document.getElementById('map-tooltip').classList.remove('show');
}

/* ── Légende ── */
function updateLegend() {
  const leg = document.getElementById('map-legend');
  if (mapMode === 'abstention') {
    leg.innerHTML = `
      <div class="leg-title">Taux d'abstention</div>
      <div class="leg-bar" style="background:linear-gradient(to right,${absColor(20)},${absColor(70)})"></div>
      <div class="leg-labels"><span>20%</span><span>70%</span></div>`;
  } else if (mapMode === 'listes') {
    leg.innerHTML = `
      <div class="leg-title">Nombre de listes</div>
      <div class="leg-bar" style="background:linear-gradient(to right,${listColor(1)},${listColor(8)})"></div>
      <div class="leg-labels"><span>1</span><span>8+</span></div>`;
  } else {
    leg.innerHTML = `
      <div class="leg-title">Sortant présent</div>
      <div style="display:flex;gap:10px;font-size:10px;color:var(--muted);margin-top:4px">
        <span style="color:#34d07a">● Oui</span>
        <span style="color:#f05050">● Non</span>
      </div>`;
  }
}

/* ══════════════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════════════ */

function setBreadcrumb(items) {
  document.getElementById('breadcrumb').innerHTML = items.map((item, i) => `
    ${i > 0 ? '<span class="bc-sep">›</span>' : ''}
    <span class="bc-item ${item.active ? 'active' : ''}"
          ${item.action ? `onclick="${item.action}"` : ''}>
      ${item.label}
    </span>`).join('');
}

function selectCommune(code) {
  selectedCommune = code;
  selectedBV = null;
  const c = COMMUNES[code];
  renderCommuneList();
  map.flyTo([c.lat, c.lon], 14, { duration: 1.2 });
  drawBVMarkers(c);
  renderCommuneView(c);
}

function selectBV(b, c) {
  selectedBV = b;
  // Mettre en évidence le marker sélectionné
  Object.values(markers).forEach(m => { try { m.setStyle({ weight: 1.5 }); } catch {} });
  if (markers[b.bv_id]) markers[b.bv_id].setStyle({ color: '#fff', weight: 2.5 });
  renderBVView(b, c);
}

function goNational() {
  selectedCommune = null;
  selectedBV = null;
  map.flyTo([46.5, 2.5], 5, { duration: 1.2 });
  drawCommuneMarkers();
  renderCommuneList();
  renderNationalView();
}

/* ══════════════════════════════════════════════════════
   PANNEAU DROIT — VUES
   ══════════════════════════════════════════════════════ */

function renderNationalView() {
  setBreadcrumb([{ label: 'France', active: true }]);

  const communes = Object.values(COMMUNES)
    .filter(c => cspFilter === 'all' || c.csp === cspFilter);

  if (!communes.length) {
    document.getElementById('right-content').innerHTML =
      '<div class="note">Aucune commune ne correspond au filtre sélectionné.</div>';
    return;
  }

  const avgAbs  = communes.reduce((s, c) => s + c.taux_abstention, 0) / communes.length;
  const avgL    = communes.reduce((s, c) => s + c.nb_listes, 0) / communes.length;
  const pctSrt  = communes.filter(c => c.sortant).length / communes.length * 100;
  const totalIns = communes.reduce((s, c) => s + c.inscrits, 0);
  const totalVot = communes.reduce((s, c) => s + c.votants, 0);

  // CSP breakdown
  const cspGroups = {};
  communes.forEach(c => {
    if (!cspGroups[c.csp]) cspGroups[c.csp] = [];
    cspGroups[c.csp].push(c.taux_abstention);
  });
  const cspAvg = Object.entries(cspGroups)
    .map(([k, arr]) => ({ csp: k, avg: arr.reduce((s, v) => s + v, 0) / arr.length }))
    .sort((a, b) => b.avg - a.avg);
  const maxCspAvg = Math.max(...cspAvg.map(x => x.avg), 1);

  // Corrélation abstention × nb listes
  const mx = communes.reduce((s, c) => s + c.nb_listes, 0) / communes.length;
  const my = avgAbs;
  const num = communes.reduce((s, c) => s + (c.nb_listes - mx) * (c.taux_abstention - my), 0);
  const den = communes.reduce((s, c) => s + (c.nb_listes - mx) ** 2, 0);
  const r   = den ? (num / Math.sqrt(den * communes.reduce((s, c) => s + (c.taux_abstention - my) ** 2, 0))) : 0;

  // Impact sortant
  const avecSortant = communes.filter(c => c.sortant);
  const sansSortant = communes.filter(c => !c.sortant);
  const aA = avecSortant.length ? avecSortant.reduce((s, c) => s + c.taux_abstention, 0) / avecSortant.length : 0;
  const sA = sansSortant.length ? sansSortant.reduce((s, c) => s + c.taux_abstention, 0) / sansSortant.length : 0;

  document.getElementById('right-content').innerHTML = `
    <div>
      <div class="section-title">Vue nationale · ${communes.length} communes</div>
      <div class="metrics-grid" style="margin-top:10px">
        <div class="metric">
          <div class="m-label">Abstention moy.</div>
          <div class="m-val" style="color:var(--orange)">${avgAbs.toFixed(1)}%</div>
        </div>
        <div class="metric">
          <div class="m-label">Moy. listes</div>
          <div class="m-val" style="color:var(--accent)">${avgL.toFixed(1)}</div>
        </div>
        <div class="metric">
          <div class="m-label">Inscrits</div>
          <div class="m-val" style="font-size:16px">${(totalIns / 1000).toFixed(0)}k</div>
        </div>
        <div class="metric">
          <div class="m-label">Participation</div>
          <div class="m-val" style="color:var(--green);font-size:16px">
            ${totalIns ? (totalVot / totalIns * 100).toFixed(1) : '—'}%
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="section-title">Abstention par CSP dominante</div>
      <div class="bar-rows" style="margin-top:8px">
        ${cspAvg.map(({ csp, avg }) => `
        <div class="bar-row">
          <span class="bar-lbl" style="color:${cspColor(csp)}">${csp.split('/')[0]}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(avg / maxCspAvg * 100).toFixed(0)}%;background:${cspColor(csp)}"></div>
          </div>
          <span class="bar-val">${avg.toFixed(1)}%</span>
        </div>`).join('')}
      </div>
    </div>

    <div>
      <div class="section-title">Corrélation abstention / nb listes</div>
      <canvas id="scatter-canvas" style="margin-top:6px;height:130px"></canvas>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
        <span style="font-size:9px;color:var(--muted)">Chaque point = 1 commune</span>
        <span class="corr-pill" style="background:${r < 0 ? 'rgba(52,208,122,.12)' : 'rgba(240,80,80,.12)'};color:${r < 0 ? 'var(--green)' : 'var(--red)'}">
          r = ${r.toFixed(2)}
        </span>
      </div>
    </div>

    <div>
      <div class="section-title">Impact du sortant sur l'abstention</div>
      <div class="bar-rows" style="margin-top:8px">
        <div class="bar-row">
          <span class="bar-lbl" style="color:var(--green)">Présent</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(aA/70*100).toFixed(0)}%;background:var(--green)"></div></div>
          <span class="bar-val">${aA.toFixed(1)}%</span>
        </div>
        <div class="bar-row">
          <span class="bar-lbl" style="color:var(--red)">Absent</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(sA/70*100).toFixed(0)}%;background:var(--red)"></div></div>
          <span class="bar-val">${sA.toFixed(1)}%</span>
        </div>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:6px">
        Δ = ${(sA - aA > 0 ? '+' : '')}${(sA - aA).toFixed(1)} pts quand le sortant est absent
      </div>
    </div>`;

  setTimeout(() => drawScatter(communes), 50);
}

function renderCommuneView(c) {
  setBreadcrumb([
    { label: 'France', action: 'goNational()' },
    { label: c.nom, active: true },
  ]);

  const minAbs = Math.min(...c.bureaux.map(b => b.taux_abstention));
  const maxAbs = Math.max(...c.bureaux.map(b => b.taux_abstention));

  // Profil CSP
  const cspEntries = Object.entries(c.csp_scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCsp = cspEntries[0] ? cspEntries[0][1] : 1;

  document.getElementById('right-content').innerHTML = `
    <div>
      <div class="section-title">${c.nom} · ${c.bureaux.length} bureaux de vote</div>
      <div class="metrics-grid" style="margin-top:10px">
        <div class="metric">
          <div class="m-label">Abstention</div>
          <div class="m-val" style="color:${absColor(c.taux_abstention)}">${c.taux_abstention.toFixed(1)}%</div>
          <div class="m-sub">BV : ${minAbs.toFixed(0)}%–${maxAbs.toFixed(0)}%</div>
        </div>
        <div class="metric">
          <div class="m-label">Participation</div>
          <div class="m-val" style="color:var(--green)">${(100 - c.taux_abstention).toFixed(1)}%</div>
        </div>
        <div class="metric">
          <div class="m-label">Inscrits</div>
          <div class="m-val" style="font-size:16px">${c.inscrits.toLocaleString('fr-FR')}</div>
        </div>
        <div class="metric">
          <div class="m-label">Votants</div>
          <div class="m-val" style="font-size:16px">${c.votants.toLocaleString('fr-FR')}</div>
        </div>
        <div class="metric">
          <div class="m-label">Listes</div>
          <div class="m-val" style="color:var(--accent)">${c.nb_listes}</div>
        </div>
        <div class="metric">
          <div class="m-label">Sortant</div>
          <div class="m-val" style="font-size:14px;color:${c.sortant ? 'var(--green)' : 'var(--red)'}">${c.sortant ? 'Oui' : 'Non'}</div>
        </div>
      </div>
    </div>

    <div>
      <div class="section-title">Profil CSP (INSEE RP2022)</div>
      <div class="bar-rows" style="margin-top:8px">
        ${cspEntries.map(([csp, val]) => `
        <div class="bar-row">
          <span class="bar-lbl" style="color:${cspColor(csp)}">${csp.split('/')[0]}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(val/maxCsp*100).toFixed(0)}%;background:${cspColor(csp)}"></div>
          </div>
          <span class="bar-val">${val.toFixed(1)}%</span>
        </div>`).join('')}
      </div>
    </div>

    <div>
      <div class="section-title">Bureaux de vote — cliquez pour le détail</div>
      <div class="bv-list" style="margin-top:8px">
        ${c.bureaux.map(b => `
        <div class="bv-item" id="bvi-${b.bv_id}" onclick="selectBV(RAW.find(x=>x.bv_id===${b.bv_id}), COMMUNES['${c.code}'])">
          <span class="bv-num">${b.num_bv}</span>
          <div class="bar-track" style="flex:1">
            <div class="bar-fill" style="width:${b.taux_abstention.toFixed(0)}%;background:${absColor(b.taux_abstention)}"></div>
          </div>
          <span class="bv-abs" style="color:${absColor(b.taux_abstention)}">${b.taux_abstention.toFixed(1)}%</span>
          <span class="bv-inscrits">${b.inscrits}</span>
        </div>`).join('')}
      </div>
    </div>`;
}

function renderBVView(b, c) {
  setBreadcrumb([
    { label: 'France', action: 'goNational()' },
    { label: c.nom,    action: `selectCommune('${c.code}')` },
    { label: `BV ${b.num_bv}`, active: true },
  ]);

  const maxVoix = Math.max(...b.voix_listes, 1);

  document.getElementById('right-content').innerHTML = `
    <div>
      <div class="section-title">${c.nom} · Bureau ${b.num_bv}</div>
      <div class="metrics-grid" style="margin-top:10px">
        <div class="metric">
          <div class="m-label">Abstention</div>
          <div class="m-val" style="color:${absColor(b.taux_abstention)}">${b.taux_abstention.toFixed(1)}%</div>
        </div>
        <div class="metric">
          <div class="m-label">Participation</div>
          <div class="m-val" style="color:var(--green)">${(100 - b.taux_abstention).toFixed(1)}%</div>
        </div>
        <div class="metric">
          <div class="m-label">Inscrits</div>
          <div class="m-val" style="font-size:15px">${b.inscrits.toLocaleString('fr-FR')}</div>
        </div>
        <div class="metric">
          <div class="m-label">Exprimés</div>
          <div class="m-val" style="font-size:15px">${b.exprimes.toLocaleString('fr-FR')}</div>
        </div>
        <div class="metric full">
          <div class="m-label">Blancs &amp; nuls</div>
          <div class="m-val" style="font-size:14px;color:var(--muted)">
            ${b.blancs_nuls}
            <span style="font-size:10px;font-weight:400"> (${b.votants ? (b.blancs_nuls/b.votants*100).toFixed(1) : 0}% des votants)</span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="section-title">Résultats par liste</div>
      <div class="voix-bars" style="margin-top:8px">
        ${b.voix_listes.slice(0, b.nb_listes).map((v, i) => `
        <div class="vb-row">
          <span class="vb-lbl">L${i + 1}</span>
          <div class="vb-track">
            <div class="vb-fill" style="width:${(v/maxVoix*100).toFixed(0)}%;background:${LIST_COLORS[i % LIST_COLORS.length]}">
              <span>${v} v.</span>
            </div>
          </div>
          <span style="font-size:9px;font-family:var(--mono);color:var(--muted);min-width:34px;text-align:right">
            ${b.exprimes ? (v/b.exprimes*100).toFixed(1) : 0}%
          </span>
        </div>`).join('')}
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric">
        <div class="m-label">Listes</div>
        <div class="m-val" style="color:var(--accent)">${b.nb_listes}</div>
      </div>
      <div class="metric">
        <div class="m-label">Sortant</div>
        <div class="m-val" style="font-size:13px;color:${b.sortant_present ? 'var(--green)' : 'var(--red)'}">
          ${b.sortant_present ? 'Présent' : 'Absent'}
        </div>
      </div>
    </div>

    <button onclick="selectCommune('${c.code}')"
      style="width:100%;padding:8px;background:var(--bg3);border:1px solid var(--border2);
             border-radius:8px;color:var(--text);font-family:var(--f);font-size:12px;cursor:pointer">
      ← Retour aux BV de ${c.nom}
    </button>`;
}

/* ══════════════════════════════════════════════════════
   SCATTER PLOT (corrélation abstention × nb listes)
   ══════════════════════════════════════════════════════ */

function drawScatter(communes) {
  const canvas = document.getElementById('scatter-canvas');
  if (!canvas) return;
  const W = canvas.offsetWidth, H = 130;
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  const pad = { l: 30, r: 8, t: 8, b: 22 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const xMin = 1, xMax = 9, yMin = 15, yMax = 75;
  const px = v => pad.l + (v - xMin) / (xMax - xMin) * pw;
  const py = v => pad.t + (1 - (v - yMin) / (yMax - yMin)) * ph;

  // Grille
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  [2,3,4,5,6,7,8].forEach(x => { ctx.beginPath(); ctx.moveTo(px(x), pad.t); ctx.lineTo(px(x), H - pad.b); ctx.stroke(); });
  [20,30,40,50,60,70].forEach(y => { ctx.beginPath(); ctx.moveTo(pad.l, py(y)); ctx.lineTo(W - pad.r, py(y)); ctx.stroke(); });

  // Axes labels
  ctx.font = '8px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(106,122,154,.8)';
  ctx.textAlign = 'center';
  [1,3,5,7,9].forEach(v => ctx.fillText(v, px(v), H - 5));
  ctx.textAlign = 'right';
  [20,40,60].forEach(v => ctx.fillText(v + '%', pad.l - 2, py(v) + 3));

  // Points
  communes.forEach(c => {
    ctx.beginPath();
    ctx.arc(px(c.nb_listes), py(c.taux_abstention), 4, 0, Math.PI * 2);
    ctx.fillStyle = (cspColor(c.csp) || '#3a4860') + 'bb';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });

  // Droite de régression
  const n = communes.length;
  if (n > 2) {
    const mx = communes.reduce((s, c) => s + c.nb_listes, 0) / n;
    const my = communes.reduce((s, c) => s + c.taux_abstention, 0) / n;
    const num = communes.reduce((s, c) => s + (c.nb_listes - mx) * (c.taux_abstention - my), 0);
    const den = communes.reduce((s, c) => s + (c.nb_listes - mx) ** 2, 0);
    const slope = den ? num / den : 0;
    const inter = my - slope * mx;
    ctx.beginPath();
    ctx.moveTo(px(xMin), py(slope * xMin + inter));
    ctx.lineTo(px(xMax), py(slope * xMax + inter));
    ctx.strokeStyle = 'rgba(245,200,66,.65)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/* ══════════════════════════════════════════════════════
   PANNEAU GAUCHE — LISTE COMMUNES & STATS
   ══════════════════════════════════════════════════════ */

const LIST_PAGE = 150;

function renderCommuneList() {
  const query = (document.getElementById('commune-search')?.value || '').toLowerCase().trim();
  const all = Object.values(COMMUNES)
    .filter(c => (cspFilter === 'all' || c.csp === cspFilter)
              && (!query || c.nom.toLowerCase().includes(query)))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const subset = all.slice(0, LIST_PAGE);

  document.getElementById('commune-list').innerHTML = subset.map(c => `
    <div class="commune-item ${selectedCommune === c.code ? 'active' : ''}"
         onclick="selectCommune('${c.code}')">
      <span class="ci-dot" style="background:${cspColor(c.csp)}"></span>
      <span class="ci-name">${c.nom}</span>
      <span class="ci-abs">${c.taux_abstention.toFixed(1)}%</span>
    </div>`).join('');

  const info = document.getElementById('commune-list-info');
  if (info) {
    info.textContent = all.length > LIST_PAGE
      ? `${subset.length} affichées sur ${all.length.toLocaleString()} — affinez la recherche`
      : `${all.length.toLocaleString()} commune${all.length > 1 ? 's' : ''}`;
  }
}

function updateGlobalStats() {
  const subset = Object.values(COMMUNES)
    .filter(c => cspFilter === 'all' || c.csp === cspFilter);
  if (!subset.length) return;

  const avgAbs = subset.reduce((s, c) => s + c.taux_abstention, 0) / subset.length;
  const avgL   = subset.reduce((s, c) => s + c.nb_listes, 0) / subset.length;
  const pctSrt = subset.filter(c => c.sortant).length / subset.length * 100;

  document.getElementById('m-abs-avg').textContent = avgAbs.toFixed(1) + '%';
  document.getElementById('m-lst-avg').textContent = avgL.toFixed(1);
  document.getElementById('m-srt-avg').textContent = pctSrt.toFixed(0) + '%';
}

/* ══════════════════════════════════════════════════════
   CONTRÔLES INTERACTIFS
   ══════════════════════════════════════════════════════ */

function setMapMode(mode) {
  mapMode = mode;
  document.querySelectorAll('#mode-filters .filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  // Mettre à jour les couleurs des markers existants
  if (selectedCommune) {
    const c = COMMUNES[selectedCommune];
    c.bureaux.forEach(b => {
      if (markers[b.bv_id]) {
        const color = mode === 'abstention' ? absColor(b.taux_abstention)
                    : mode === 'listes'     ? listColor(b.nb_listes)
                    : (b.sortant_present    ? '#34d07a' : '#f05050');
        markers[b.bv_id].setStyle({ fillColor: color });
      }
    });
  } else {
    Object.values(COMMUNES).forEach(c => {
      if (markers[c.code]) markers[c.code].setStyle({ fillColor: markerColor(c) });
    });
  }
  updateLegend();
}

function setCSP(csp) {
  cspFilter = csp;
  document.querySelectorAll('#csp-filters .filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.csp === csp);
  });
  if (!selectedCommune) drawCommuneMarkers();
  updateGlobalStats();
  renderCommuneList();
  if (!selectedCommune) setTimeout(() => drawScatter(
    Object.values(COMMUNES).filter(c => csp === 'all' || c.csp === csp)
  ), 50);
}

function setTour(tour) {
  tourFilter = tour;
  document.querySelectorAll('#round-filters .filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tour === tour);
  });
  map.stop(); // annule toute animation fly en cours
  const prevCommune = selectedCommune;
  selectedBV = null;
  buildCommuneIndex();

  if (prevCommune && COMMUNES[prevCommune]) {
    // La commune sélectionnée existe dans le nouveau tour — on la réaffiche
    selectedCommune = prevCommune;
    drawBVMarkers(COMMUNES[prevCommune]);
    renderCommuneList();
    renderCommuneView(COMMUNES[prevCommune]);
  } else {
    // La commune n'existe pas dans ce tour (ou rien n'était sélectionné)
    selectedCommune = null;
    drawCommuneMarkers();
    renderCommuneList();
    updateGlobalStats();
    renderNationalView();
  }
}

/* ── Branchement des événements (data-* attributes, pas de onclick inline) ── */
document.getElementById('commune-search').addEventListener('input', renderCommuneList);

document.getElementById('mode-filters').addEventListener('click', e => {
  const btn = e.target.closest('[data-mode]');
  if (btn) setMapMode(btn.dataset.mode);
});

document.getElementById('csp-filters').addEventListener('click', e => {
  const btn = e.target.closest('[data-csp]');
  if (btn) setCSP(btn.dataset.csp);
});

document.getElementById('round-filters').addEventListener('click', e => {
  const btn = e.target.closest('[data-tour]');
  if (btn) setTour(btn.dataset.tour);
});

document.getElementById('breadcrumb').addEventListener('click', e => {
  const item = e.target.closest('[data-action]');
  if (item && item.dataset.action === 'national') goNational();
});

/* ══════════════════════════════════════════════════════
   DÉMARRAGE
   ══════════════════════════════════════════════════════ */

loadData();
