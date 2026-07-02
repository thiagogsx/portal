/**
 * Monitor de Ofertas — protótipo
 * -------------------------------------------------------------
 * Este arquivo tem duas partes claramente separadas:
 *
 * 1) DADOS: hoje vêm de `gerarOfertasDemo()`. Quando a chave da
 *    Petronect/Vale estiver disponível, é só implementar
 *    `buscarOfertasReais()` (veja o bloco "INTEGRAÇÃO COM API REAL"
 *    abaixo) e trocar a chamada dentro de `sincronizar()`.
 *
 * 2) UI: renderização da tabela, filtros e cartões de resumo.
 *    Isso não muda quando a API real entrar — ela só espera
 *    receber um array de objetos no formato `Oferta` (descrito
 *    abaixo).
 * ------------------------------------------------------------- */

/**
 * Formato esperado de cada oferta (contrato entre API e UI):
 * {
 *   codigo: string,            // identificador do processo/oferta
 *   equipamento: string,       // nome do equipamento
 *   categoria: string,         // ex: "Bombas", "Válvulas"
 *   portal: "Petronect"|"Vale",
 *   publicadoEm: "YYYY-MM-DD",
 *   encerraEm: "YYYY-MM-DD",
 *   valorEstimado: number,     // em BRL
 *   status: "aberta"|"encerrando"|"encerrada",
 *   url: string                // link para o processo no portal
 * }
 */

let ofertas = [];
let config = {
  portal: 'petronect',
  apiBase: '',
  apiKey: '',
  usarDemo: true,
};

// ---------- Elementos ----------
const el = (id) => document.getElementById(id);
const offersBody = el('offersBody');
const emptyState = el('emptyState');
const scanline = el('scanline');
const modeTag = el('modeTag');

// ---------- Dados de demonstração ----------
function gerarOfertasDemo() {
  const categorias = ['Bombas centrífugas', 'Válvulas de segurança', 'Compressores', 'Motores elétricos', 'Instrumentação', 'Guindastes'];
  const hoje = new Date();

  const base = [
    ['PTN-48213', 'Bomba centrífuga API 610 8x10', 'Bombas centrífugas', 'Petronect', -1, 12, 842000],
    ['PTN-48227', 'Válvula de segurança 6" classe 900', 'Válvulas de segurança', 'Petronect', -3, 4, 156500],
    ['VLE-11094', 'Compressor de ar parafuso 350 CFM', 'Compressores', 'Vale', -2, 9, 398000],
    ['PTN-48250', 'Motor elétrico WEG 500cv IP55', 'Motores elétricos', 'Petronect', 0, 20, 274900],
    ['VLE-11108', 'Transmissor de pressão smart HART', 'Instrumentação', 'Vale', -6, 2, 41200],
    ['PTN-48266', 'Guindaste sobre esteiras 150t', 'Guindastes', 'Petronect', -1, 30, 3120000],
    ['VLE-11121', 'Bomba dosadora química API 675', 'Bombas centrífugas', 'Vale', -10, -2, 98500],
    ['PTN-48280', 'Válvula gaveta 12" classe 600', 'Válvulas de segurança', 'Petronect', -14, -5, 210000],
    ['VLE-11133', 'Compressor centrífugo multi-estágio', 'Compressores', 'Vale', -4, 6, 1875000],
    ['PTN-48299', 'Painel de instrumentação SDCD', 'Instrumentação', 'Petronect', -1, 15, 512300],
  ];

  return base.map(([codigo, equipamento, categoria, portal, publOffset, encOffset, valor]) => {
    const publicadoEm = addDias(hoje, publOffset);
    const encerraEm = addDias(hoje, encOffset);
    const diasParaEncerrar = Math.ceil((encerraEm - hoje) / 86400000);
    let status = 'aberta';
    if (diasParaEncerrar < 0) status = 'encerrada';
    else if (diasParaEncerrar <= 5) status = 'encerrando';

    return {
      codigo,
      equipamento,
      categoria,
      portal,
      publicadoEm: fmtISO(publicadoEm),
      encerraEm: fmtISO(encerraEm),
      valorEstimado: valor,
      status,
      url: '#',
    };
  });
}

function addDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}
function fmtISO(d) { return d.toISOString().slice(0, 10); }
function fmtData(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function fmtMoeda(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

// ---------- INTEGRAÇÃO COM API REAL (pendente da chave) ----------
async function buscarOfertasReais() {
  // Exemplo de como isso deve ficar quando a chave chegar.
  // Importante: chamar isso direto do navegador expõe a chave —
  // ver aviso no painel de configuração e no README.
  const resp = await fetch(`${config.apiBase}/ofertas?tipo=equipamentos`, {
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Accept': 'application/json',
    },
  });
  if (!resp.ok) throw new Error(`Falha na API (${resp.status})`);
  const json = await resp.json();

  // Ajuste este mapeamento para o formato real de resposta do portal.
  return json.items.map((item) => ({
    codigo: item.codigoProcesso,
    equipamento: item.descricaoItem,
    categoria: item.categoria ?? 'Não classificado',
    portal: config.portal === 'vale' ? 'Vale' : 'Petronect',
    publicadoEm: item.dataPublicacao,
    encerraEm: item.dataEncerramento,
    valorEstimado: Number(item.valorEstimado ?? 0),
    status: item.statusProcesso,
    url: item.linkPortal,
  }));
}

// ---------- Sincronização ----------
async function sincronizar() {
  const syncBtn = el('syncBtn');
  syncBtn.classList.add('syncing');
  syncBtn.disabled = true;
  scanline.classList.add('active');

  try {
    if (config.usarDemo || !config.apiKey || !config.apiBase) {
      await esperar(900); // simula latência de rede
      ofertas = gerarOfertasDemo();
      modeTag.textContent = 'MODO DEMONSTRAÇÃO';
      modeTag.classList.remove('live');
    } else {
      ofertas = await buscarOfertasReais();
      modeTag.textContent = `CONECTADO · ${config.portal.toUpperCase()}`;
      modeTag.classList.add('live');
    }
    popularCategorias();
    aplicarFiltros();
    el('statSync').textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    alert(`Não foi possível sincronizar: ${err.message}\n\nVerifique a URL base e a chave de API no painel de configuração.`);
  } finally {
    syncBtn.classList.remove('syncing');
    syncBtn.disabled = false;
    scanline.classList.remove('active');
  }
}
function esperar(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ---------- Renderização ----------
function renderTabela(lista) {
  offersBody.innerHTML = '';
  emptyState.hidden = lista.length !== 0;

  const statusLabel = { aberta: 'Aberta', encerrando: 'Encerrando', encerrada: 'Encerrada' };

  for (const o of lista) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="code-cell">${o.codigo}</td>
      <td class="equip-name">${o.equipamento}</td>
      <td>${o.categoria}</td>
      <td><span class="portal-badge ${o.portal.toLowerCase()}">${o.portal}</span></td>
      <td>${fmtData(o.publicadoEm)}</td>
      <td>${fmtData(o.encerraEm)}</td>
      <td class="value-cell">${fmtMoeda(o.valorEstimado)}</td>
      <td><span class="status-pill ${o.status}">${statusLabel[o.status]}</span></td>
      <td><a class="row-link" href="${o.url}" target="_blank" rel="noopener">Ver no portal →</a></td>
    `;
    offersBody.appendChild(tr);
  }
}

function renderStats(lista) {
  const hoje = new Date();
  const novasEm24h = lista.filter((o) => (hoje - new Date(o.publicadoEm)) / 86400000 <= 1).length;
  const encerrandoEm5 = lista.filter((o) => o.status === 'encerrando').length;

  el('statTotal').textContent = lista.length;
  el('statNew').textContent = novasEm24h;
  el('statClosing').textContent = encerrandoEm5;
}

function popularCategorias() {
  const select = el('filterCategory');
  const atual = select.value;
  const categorias = [...new Set(ofertas.map((o) => o.categoria))].sort();
  select.innerHTML = '<option value="">Todas as categorias</option>' +
    categorias.map((c) => `<option value="${c}">${c}</option>`).join('');
  select.value = atual;
}

// ---------- Filtros ----------
function aplicarFiltros() {
  const termo = el('searchInput').value.trim().toLowerCase();
  const portal = el('filterPortal').value;
  const status = el('filterStatus').value;
  const categoria = el('filterCategory').value;

  const filtradas = ofertas.filter((o) => {
    const bateTermo = !termo ||
      o.equipamento.toLowerCase().includes(termo) ||
      o.codigo.toLowerCase().includes(termo);
    const batePortal = !portal || o.portal === portal;
    const bateStatus = !status || o.status === status;
    const bateCategoria = !categoria || o.categoria === categoria;
    return bateTermo && batePortal && bateStatus && bateCategoria;
  });

  renderTabela(filtradas);
  renderStats(ofertas); // os cartões refletem o total monitorado, não o filtro
}

// ---------- Painel de configuração ----------
function abrirConfig() { el('configPanel').hidden = false; }
function fecharConfig() { el('configPanel').hidden = true; }

function salvarConfig() {
  config.portal = el('portalSelect').value;
  config.apiBase = el('apiBase').value.trim();
  config.apiKey = el('apiKey').value.trim();
  config.usarDemo = el('demoToggle').checked;
  fecharConfig();
  sincronizar();
}

// ---------- Eventos ----------
el('settingsBtn').addEventListener('click', abrirConfig);
el('closeConfig').addEventListener('click', fecharConfig);
el('saveConfig').addEventListener('click', salvarConfig);
el('syncBtn').addEventListener('click', sincronizar);
el('searchInput').addEventListener('input', aplicarFiltros);
el('filterPortal').addEventListener('change', aplicarFiltros);
el('filterStatus').addEventListener('change', aplicarFiltros);
el('filterCategory').addEventListener('change', aplicarFiltros);
el('clearFilters').addEventListener('click', () => {
  el('searchInput').value = '';
  el('filterPortal').value = '';
  el('filterStatus').value = '';
  el('filterCategory').value = '';
  aplicarFiltros();
});

// ---------- Início ----------
sincronizar();
