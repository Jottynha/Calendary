// CONFIGURAÇÃO DO SUPABASE (BASE DE DADOS E AUTENTICAÇÃO)
const SUPABASE_URL = "https://uoyhnbjuihovbsdaitnj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rbpCapogsFPP3KlUDwFIcw_4ybwnwuJ";
const supabaseClient =
  window.supabase &&
  SUPABASE_URL.startsWith("http") &&
  !SUPABASE_ANON_KEY.startsWith("COLE_")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
let excecoesCache = [];
let usuarioAdmin = null;
let ehAdmin = false;
let eventosModalCache = [];
// REGRAS OFICIAIS DA RÉGUA DE COBRANÇAS MASTER [LAYOUT COMPLETO]
const regrasRegua = [
  {
    dias: -10,
    titulo: "PDF E-mail",
    tipo: "ante",
    categoria: "fatura",
    actionKey: "pdf_antes",
    desc: "10 dias antes do vencimento - Envio de PDF por E-mail.",
  },
  {
    dias: 0,
    titulo: "Envio de Fatura",
    tipo: "vencimento",
    categoria: "fatura",
    actionKey: "fatura_dia",
    desc: "No dia do vencimento - Envio da fatura por e-mail.",
  },
  {
    dias: 2,
    titulo: "SMS de Aviso",
    tipo: "pos",
    categoria: "sms",
    actionKey: "sms_2",
    desc: "02 dias após o vencimento - Disparo de SMS.",
  },
  {
    dias: 4,
    titulo: "E-mail PDF",
    tipo: "pos",
    categoria: "fatura",
    actionKey: "email_4",
    desc: "04 dias após o vencimento - PDF por E-mail.",
  },
  {
    dias: 10,
    titulo: "E-mail PDF",
    tipo: "pos",
    categoria: "fatura",
    actionKey: "email_10",
    desc: "10 dias após o vencimento - PDF por E-mail.",
  },
  {
    dias: 14,
    titulo: "WhatsApp/E-mail",
    tipo: "pos",
    categoria: "fatura",
    actionKey: "whatsapp_14",
    vencimentosPermitidos: [10, 15, 20],
    desc: "14 dias após o vencimento - Fatura por WhatsApp e E-mail.",
  },
  {
    dias: 15,
    titulo: "Bloqueio",
    tipo: "bloqueio",
    categoria: "bloqueio",
    actionKey: "bloqueio_15",
    desc: "Bloqueio de serviço (Fibra, Outros, Wireless e Parcial MVNO).",
  },
  {
    dias: 18,
    titulo: "Assessorias",
    tipo: "bloqueio",
    categoria: "bloqueio",
    actionKey: "assessorias_18",
    desc: "Encaminhamento automático para as Assessorias Externas.",
  },
  {
    dias: 30,
    titulo: "Serasa",
    tipo: "cancelamento",
    categoria: "cancelamento",
    actionKey: "serasa_30",
    desc: "Inclusão das mensalidades negativadas no Serasa.",
  },
  {
    dias: 74.5,
    titulo: "Cancelamento",
    tipo: "cancelamento",
    categoria: "cancelamento",
    actionKey: "cancelamento_745",
    desc: "Cancelamento automático do serviço, calculado a partir da data de vencimento.",
  },
  {
    dias: 75,
    titulo: "Desativação",
    tipo: "cancelamento",
    categoria: "cancelamento",
    actionKey: "desativacao_75",
    desc: "Desativação definitiva (MVNO), calculada a partir da data de vencimento.",
  },
];
// REGRAS DA VISÃO ENXUTA
const regrasEnxutas = [
  {
    dias: 14,
    titulo: "WhatsApp/E-mail",
    tipo: "whatsapp",
    categoria: "fatura",
    actionKey: "whatsapp_14",
    vencimentosPermitidos: [10, 15, 20],
    desc: "14 dias após o vencimento - Fatura por WhatsApp e E-mail.",
  },
  {
    dias: 15,
    titulo: "Bloqueio",
    tipo: "bloqueio",
    categoria: "bloqueio",
    actionKey: "bloqueio_15",
    desc: "15 dias após o vencimento - Bloqueio de serviço.",
  },
];
const diasFaturamentoOficiais = [5, 8, 10, 12, 14, 15, 20, 25, 26];
const catalogoAcoes = [
  {
    actionKey: "pdf_antes",
    titulo: "PDF E-mail",
    grupo: "ante",
    categoria: "fatura",
    tipoEvento: "ante",
    descricao: "10 dias antes do vencimento.",
  },
  {
    actionKey: "fatura_dia",
    titulo: "Envio de Fatura",
    grupo: "vencimento",
    categoria: "fatura",
    tipoEvento: "vencimento",
    descricao: "No dia do vencimento.",
  },
  {
    actionKey: "sms_2",
    titulo: "SMS de Aviso",
    grupo: "pos",
    categoria: "sms",
    tipoEvento: "pos",
    descricao: "2 dias após o vencimento.",
  },
  {
    actionKey: "email_4",
    titulo: "E-mail PDF",
    grupo: "pos",
    categoria: "fatura",
    tipoEvento: "pos",
    descricao: "4 dias após o vencimento.",
  },
  {
    actionKey: "email_10",
    titulo: "E-mail PDF",
    grupo: "pos",
    categoria: "fatura",
    tipoEvento: "pos",
    descricao: "10 dias após o vencimento.",
  },
  {
    actionKey: "whatsapp_14",
    titulo: "WhatsApp/E-mail",
    grupo: "whatsapp",
    categoria: "fatura",
    tipoEvento: "pos",
    descricao: "14 dias após o vencimento.",
  },
  {
    actionKey: "bloqueio_15",
    titulo: "Bloqueio",
    grupo: "bloqueio",
    categoria: "bloqueio",
    tipoEvento: "bloqueio",
    descricao: "15 dias após o vencimento.",
  },
  {
    actionKey: "assessorias_18",
    titulo: "Assessorias",
    grupo: "bloqueio",
    categoria: "bloqueio",
    tipoEvento: "bloqueio",
    descricao: "18 dias após o vencimento.",
  },
  {
    actionKey: "serasa_30",
    titulo: "Serasa",
    grupo: "cancelamento",
    categoria: "cancelamento",
    tipoEvento: "cancelamento",
    descricao: "30 dias após o vencimento.",
  },
  {
    actionKey: "cancelamento_745",
    titulo: "Cancelamento",
    grupo: "cancelamento",
    categoria: "cancelamento",
    tipoEvento: "cancelamento",
    descricao: "74,5 dias após o vencimento.",
  },
  {
    actionKey: "desativacao_75",
    titulo: "Desativação",
    grupo: "cancelamento",
    categoria: "cancelamento",
    tipoEvento: "cancelamento",
    descricao: "75 dias após o vencimento.",
  },
  {
    actionKey: "fat_normal",
    titulo: "Faturamento Normal",
    grupo: "vencimento",
    categoria: "fatura",
    tipoEvento: "vencimento",
    descricao: "Faturamento mensal normal.",
  },
  {
    actionKey: "fat_b2b",
    titulo: "Faturamento B2B",
    grupo: "vencimento",
    categoria: "fatura",
    tipoEvento: "vencimento",
    descricao: "Faturamento mensal B2B.",
  },
  {
    actionKey: "fat_pos16",
    titulo: "Faturamento (Pós-16)",
    grupo: "vencimento",
    categoria: "fatura",
    tipoEvento: "vencimento",
    descricao: "Faturamento para clientes ativados após o dia 16.",
  },
  {
    actionKey: "corte_12",
    titulo: "Data de Corte (Cancelamento)",
    grupo: "cancelamento",
    categoria: "cancelamento",
    tipoEvento: "cancelamento",
    descricao: "Corte mensal de clientes bloqueados.",
  },
  {
    actionKey: "relatorio_b2b",
    titulo: "Relatório B2B",
    grupo: "relatorio",
    categoria: "relatorio",
    tipoEvento: "relatorio",
    descricao: "Relatório semanal B2B.",
  },
  {
    actionKey: "relatorio_assessorias",
    titulo: "Relatórios Assessorias / Diretoria",
    grupo: "relatorio",
    categoria: "relatorio",
    tipoEvento: "relatorio",
    descricao: "Relatórios para assessorias e diretoria.",
  },
];
function obterAcaoCatalogo(titulo, tipoEvento = null) {
  return (
    catalogoAcoes.find(
      (a) =>
        a.titulo === titulo && (!tipoEvento || a.tipoEvento === tipoEvento),
    ) ||
    catalogoAcoes.find((a) => a.titulo === titulo) ||
    null
  );
}
function obterRotuloAutocomplete(acao) {
  const detalhes =
    {
      pdf_antes: "D-10",
      fatura_dia: "D0",
      sms_2: "D+2",
      email_4: "D+4",
      email_10: "D+10",
      whatsapp_14: "D+14",
      bloqueio_15: "D+15",
      assessorias_18: "D+18",
      serasa_30: "D+30",
      cancelamento_745: "D+74,5",
      desativacao_75: "D+75",
    }[acao.actionKey] || "Data fixa";
  return `${acao.titulo} — ${detalhes}`;
}
function atualizarAutocompleteAcoes() {
  const tipo = document.getElementById("excTipoAcao")?.value || "";
  const input = document.getElementById("excEventTitle");
  const datalist = document.getElementById("excEventOptions");
  const hint = document.getElementById("excEventHint");
  const hiddenKey = document.getElementById("excActionKey");
  if (!input || !datalist) return;

  const opcoes = catalogoAcoes.filter((a) => !tipo || a.grupo === tipo);
  datalist.innerHTML = opcoes
    .map(
      (a) =>
        `<option value="${escapeHTML(obterRotuloAutocomplete(a))}">${escapeHTML(a.descricao)}</option>`,
    )
    .join("");
  if (hint)
    hint.textContent = tipo
      ? "Digite ou escolha uma sugestão. D-10, D+4, D+10 etc. diferenciam ações com o mesmo nome."
      : "Escolha uma ação da lista para manter o tipo e a regra corretos.";
  input.placeholder = tipo
    ? "Digite para pesquisar a ação..."
    : "Selecione um tipo primeiro";

  if (
    hiddenKey &&
    tipo &&
    hiddenKey.value &&
    !opcoes.some((a) => a.actionKey === hiddenKey.value)
  )
    hiddenKey.value = "";
}

function sincronizarTipoComEvento() {
  const input = document.getElementById("excEventTitle");
  const select = document.getElementById("excTipoAcao");
  const hiddenKey = document.getElementById("excActionKey");
  if (!input || !select) return;
  const texto = input.value.trim();
  let acao = catalogoAcoes.find((a) => obterRotuloAutocomplete(a) === texto);
  if (!acao)
    acao = catalogoAcoes.find(
      (a) => a.titulo === texto && (!select.value || a.grupo === select.value),
    );
  if (acao) {
    select.value = acao.grupo;
    if (hiddenKey) hiddenKey.value = acao.actionKey;
    const hint = document.getElementById("excEventHint");
    if (hint)
      hint.textContent = `Selecionado: ${acao.titulo} — ${acao.descricao}`;
    atualizarAutocompleteAcoes();
    input.value = obterRotuloAutocomplete(acao);
  } else if (hiddenKey) {
    hiddenKey.value = "";
  }
}

const acoesDashboardCompleto = [
  "pdf_antes",
  "fatura_dia",
  "sms_2",
  "email_4",
  "email_10",
  "whatsapp_14",
  "bloqueio_15",
  "assessorias_18",
  "serasa_30",
  "cancelamento_745",
  "desativacao_75",
];
const catalogoDashboardCompleto = acoesDashboardCompleto
  .map((key) => catalogoAcoes.find((a) => a.actionKey === key))
  .filter(Boolean);
const catalogoDashboardEnxuto = catalogoAcoes.filter((a) =>
  [
    "whatsapp_14",
    "bloqueio_15",
    "fat_normal",
    "fat_b2b",
    "fat_pos16",
    "corte_12",
    "relatorio_b2b",
    "relatorio_assessorias",
  ].includes(a.actionKey),
);

let dataAtual = new Date();
let vencimentoFocoGlobal = null;
let filtroTipoGlobal = "";
let filtroAcaoGlobal = null;
let visualizacaoAtual = "calendario";
let modoVisaoEnxuta = false; // false = Layout Completo (Original) | true = Visão Enxuta

document.addEventListener("DOMContentLoaded", async () => {
  exibirDiaHoje();
  popularSeletoresMesAno();
  await carregarExcecoes();
  renderizarAcoesHoje();
  renderizarTudo();
  inicializarNotificacoes();

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      usuarioAdmin = session?.user || null;
      if (usuarioAdmin) await verificarAdmin();
      else {
        ehAdmin = false;
        atualizarBotaoAdmin();
      }
    });
  }
});
// NOTIFICAÇÕES NATIVAS DO NAVEGADOR
const CHAVE_NOTIFICACAO_DIA = "reguaCobranca_notificacaoDia";
let intervaloNotificacaoMs = 5 * 60 * 1000;
let proximoAvisoTimestamp = null;
let notificationTimer = null;
let countdownTimer = null;
let ultimoDiaNotificado = null;
let timerNotificacoes = null;

function alterarIntervaloNotificacao() {
  const select = document.getElementById("notificationInterval");

  if (!select) return;

  const minutos = Number(select.value);

  intervaloNotificacaoMs = minutos * 60 * 1000;

  // Reinicia a contagem
  proximoAvisoTimestamp = Date.now() + intervaloNotificacaoMs;

  atualizarContadorNotificacao();

  console.log(
    `Intervalo de notificações alterado para ${minutos} minuto(s).`
  );
}

function atualizarContadorNotificacao() {
  const contador = document.getElementById("notificationCountdown");

  if (!contador || !proximoAvisoTimestamp) return;

  const restante = Math.max(
    0,
    proximoAvisoTimestamp - Date.now()
  );

  const totalSegundos = Math.ceil(restante / 1000);

  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  contador.textContent =
    `${String(minutos).padStart(2, "0")}:` +
    `${String(segundos).padStart(2, "0")}`;

  if (restante <= 0) {
    executarAvisoNotificacao();

    proximoAvisoTimestamp =
      Date.now() + intervaloNotificacaoMs;
  }
}

function executarAvisoNotificacao() {
  console.log("🔔 Executando aviso de notificação...");

  // Coloque aqui sua lógica atual de notificação.

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      const { hoje, filtrados, acoes, excecoes } = obterResumoTarefasHoje();
      if (!filtrados.length) return;

      const dataFormatada = hoje.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const principais = acoes
        .slice(0, 4)
        .map((a) => `${a.quantidade} ${a.titulo}`)
        .join(" • ");
      const extra = acoes.length > 4 ? ` • +${acoes.length - 4} tipos` : "";

      const titulo = excecoes.length
        ? `⚠️ Régua de Cobrança — ${excecoes.length} exceção(ões)`
        : `🔔 Régua de Cobrança — tarefas de hoje`;

      const corpo = `📅 ${dataFormatada}\n${principais}${extra}\nTotal: ${formatarNumero(filtrados.length)} ações`;

      try {
        const notificacao = new Notification(titulo, {
          body: corpo,
          icon: "img/icon-192.png",
          badge: "img/icon-32.png",
          tag: "regua-cobranca-tarefas-hoje",
          renotify: true,
        });

        notificacao.onclick = () => {
          window.focus();
          notificacao.close();
          const painel = document.querySelector(".today-actions-panel");
          if (painel) painel.scrollIntoView({ behavior: "smooth", block: "start" });
        };
      } catch (erro) {
        console.error("Erro ao criar notificação nativa:", erro);
      }
      }
  }
}

function dataLocalISO(data = new Date()) {
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatarNumero(n) {
  return Number(n || 0).toLocaleString("pt-BR");
}

function obterResumoTarefasHoje() {
  const hoje = new Date();
  const eventos =
    coletarEventosDoMes(hoje.getFullYear(), hoje.getMonth())[hoje.getDate()] ||
    [];
  const filtrados = filtrarEventos(eventos).filter(
    (ev) =>
      vencimentoFocoGlobal === null ||
      ev.vencimentoOriginal === vencimentoFocoGlobal,
  );
  const mapa = new Map();

  filtrados.forEach((ev) => {
    const key = ev.actionKey || ev.tituloRegra;
    if (!mapa.has(key))
      mapa.set(key, { titulo: ev.tituloRegra, quantidade: 0, eventos: [] });
    const item = mapa.get(key);
    item.quantidade += 1;
    item.eventos.push(ev);
  });

  const acoes = Array.from(mapa.values()).sort(
    (a, b) => b.quantidade - a.quantidade,
  );
  const excecoes = filtrados.filter((ev) => ev.excecao);
  return { hoje, filtrados, acoes, excecoes };
}

function atualizarStatusNotificacoes() {
  const btn = document.getElementById("btnNotificacoes");
  const status = document.getElementById("notificationStatus");
  if (!btn) return;

  if (!("Notification" in window)) {
    btn.textContent = "🔕 Notificações indisponíveis";
    btn.disabled = true;
    if (status)
      status.textContent = "Seu navegador não oferece notificações nativas.";
    return;
  }

  if (Notification.permission === "granted") {
    btn.textContent = "🔔 Notificações ativadas";
    btn.classList.add("notification-active");
    if (status) status.textContent = "Avisos de tarefas de hoje ativos.";
  } else if (Notification.permission === "denied") {
    btn.textContent = "🔕 Notificações bloqueadas";
    btn.classList.remove("notification-active");
    if (status)
      status.textContent =
        "Permita notificações nas configurações do navegador.";
  } else {
    btn.textContent = "🔔 Ativar notificações";
    btn.classList.remove("notification-active");
    if (status) status.textContent = "";
  }
}

async function solicitarNotificacoes() {
  if (!("Notification" in window)) {
    atualizarStatusNotificacoes();
    return;
  }

  try {
    const permissao = await Notification.requestPermission();
    atualizarStatusNotificacoes();
    if (permissao === "granted") {
      // Notifica imediatamente após a autorização para o usuário confirmar
      // que a funcionalidade está funcionando.
      notificarTarefasHoje(true);
      if (!timerNotificacoes) {
        timerNotificacoes = setInterval(
          () => notificarTarefasHoje(false),
          INTERVALO_NOTIFICACAO_MS,
        );
      }
    }
  } catch (erro) {
    console.error("Não foi possível solicitar permissão de notificação:", erro);
  }
}

function inicializarNotificacoes() {
  atualizarStatusNotificacoes();
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    setTimeout(() => notificarTarefasHoje(false), 1500);
    timerNotificacoes = setInterval(
      () => notificarTarefasHoje(false),
      INTERVALO_NOTIFICACAO_MS,
    );
  }
}

function notificarTarefasHoje(forcar = false) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  const { hoje, filtrados, acoes, excecoes } = obterResumoTarefasHoje();
  if (!filtrados.length) return;

  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const principais = acoes
    .slice(0, 4)
    .map((a) => `${a.quantidade} ${a.titulo}`)
    .join(" • ");
  const extra = acoes.length > 4 ? ` • +${acoes.length - 4} tipos` : "";

  const titulo = excecoes.length
    ? `⚠️ Régua de Cobrança — ${excecoes.length} exceção(ões)`
    : `🔔 Régua de Cobrança — tarefas de hoje`;

  const corpo = `📅 ${dataFormatada}\n${principais}${extra}\nTotal: ${formatarNumero(filtrados.length)} ações`;

  try {
    const notificacao = new Notification(titulo, {
      body: corpo,
      icon: "img/icon-192.png",
      badge: "img/icon-32.png",
      tag: "regua-cobranca-tarefas-hoje",
      renotify: true,
    });

    notificacao.onclick = () => {
      window.focus();
      notificacao.close();
      const painel = document.querySelector(".today-actions-panel");
      if (painel) painel.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  } catch (erro) {
    console.error("Erro ao criar notificação nativa:", erro);
  }
}

function exibirDiaHoje() {
  const el = document.getElementById("infoHoje");
  if (!el) return;
  const hoje = new Date();
  el.textContent = `📅 Hoje é: ${hoje.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
}

function popularSeletoresMesAno() {
  const selectMes = document.getElementById("selectMes");
  const selectAno = document.getElementById("selectAno");
  if (!selectMes || !selectAno) return;

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  selectMes.innerHTML = meses
    .map(
      (m, i) =>
        `<option value="${i}" ${i === dataAtual.getMonth() ? "selected" : ""}>${m}</option>`,
    )
    .join("");

  const anoAtual = dataAtual.getFullYear();
  selectAno.innerHTML = "";
  for (let y = anoAtual - 2; y <= anoAtual + 3; y++) {
    selectAno.innerHTML += `<option value="${y}" ${y === anoAtual ? "selected" : ""}>${y}</option>`;
  }
}

function mudarMesAno() {
  dataAtual.setFullYear(parseInt(document.getElementById("selectAno").value));
  dataAtual.setMonth(parseInt(document.getElementById("selectMes").value));
  renderizarTudo();
}

function mudarMes(direcao) {
    let mes = parseInt(document.getElementById("selectMes").value);
    let ano = parseInt(document.getElementById("selectAno").value);

    const novaData = new Date(ano, mes + direcao, 1);

    const novoMes = novaData.getMonth();
    const novoAno = novaData.getFullYear();

    document.getElementById("selectMes").value = novoMes;
    document.getElementById("selectAno").value = novoAno;

    mudarMesAno();

    atualizarLabelMes();
}

function atualizarLabelMes() {
    const mes = parseInt(document.getElementById("selectMes").value);
    const ano = parseInt(document.getElementById("selectAno").value);

    const data = new Date(ano, mes, 1);

    const texto = data.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });

    const label = document.getElementById("calendarMonthLabel");

    if (label) {
        label.textContent =
            texto.charAt(0).toUpperCase() + texto.slice(1);
    }
}

function mudarFiltroVencimento() {
  vencimentoFocoGlobal = document.getElementById("selectFiltroVencimento").value
    ? parseInt(document.getElementById("selectFiltroVencimento").value)
    : null;
  renderizarTudo();
}

function mudarFiltroTipo() {
  filtroTipoGlobal = document.getElementById("selectFiltroTipo").value;
  renderizarTudo();
}

function mudarVisualizacao(view) {
  visualizacaoAtual = view;
  ["btnCalendario", "btnLista", "btnTimeline"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove("active");
  });

  const targetBtn = document.getElementById(
    view === "calendario"
      ? "btnCalendario"
      : view === "lista"
        ? "btnLista"
        : "btnTimeline",
  );
  if (targetBtn) targetBtn.classList.add("active");

  document
    .getElementById("calendarView")
    ?.classList.toggle("hidden", view !== "calendario");
  document
    .getElementById("listView")
    ?.classList.toggle("hidden", view !== "lista");
  document
    .getElementById("timelineView")
    ?.classList.toggle("hidden", view !== "timeline");

  if (view !== "calendario") renderizarVisualizacaoAlternativa();
}

// Alternar entre Layout Completo e Visão Enxuta
function alternarLayout() {
  modoVisaoEnxuta = !modoVisaoEnxuta;
  const btn = document.getElementById("btnToggleLayout");
  if (btn) {
    if (modoVisaoEnxuta) {
      btn.classList.add("enxuto-active");
      btn.innerHTML = `⚡ Modo Atual: <strong>Visão Enxuta</strong> (Clique p/ Completo)`;
    } else {
      btn.classList.remove("enxuto-active");
      btn.innerHTML = `📋 Modo Atual: <strong>Layout Completo</strong> (Clique p/ Enxuta)`;
    }
  }
  renderizarTudo();
}

function dataISO(data) {
  const d = new Date(data);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function eventoCasaComExcecao(ev, exc) {
  return (
    dataISO(ev.dataReal) === exc.original_date &&
    String(ev.tituloRegra) === String(exc.event_title) &&
    (exc.vencimento_original === null ||
      exc.vencimento_original === undefined ||
      String(ev.vencimentoOriginal) === String(exc.vencimento_original))
  );
}

async function carregarExcecoes() {
  if (!supabaseClient) {
    excecoesCache = [];
    return;
  }
  const { data, error } = await supabaseClient
    .from("excecoes_calendario")
    .select("*")
    .eq("ativo", true)
    .order("original_date", { ascending: true });

  if (error) {
    console.error("Erro ao carregar exceções:", error);
    excecoesCache = [];
    return;
  }
  excecoesCache = data || [];
}

function aplicarExcecoesAoMapa(mapa, ano, mes) {
  if (!excecoesCache.length) return mapa;

  // 1) Remove/move eventos cuja data original pertence a este mês.
  Object.keys(mapa).forEach((dia) => {
    const novos = [];
    mapa[dia].forEach((ev) => {
      const exc = excecoesCache.find((e) => eventoCasaComExcecao(ev, e));
      if (!exc) {
        novos.push(ev);
        return;
      }

      const novaData = new Date(`${exc.new_date}T12:00:00`);
      if (novaData.getFullYear() === ano && novaData.getMonth() === mes) {
        ev.dataReal = novaData;
        ev.excecao = true;
        ev.motivoExcecao = exc.motivo;
        ev.dataOriginalExcecao = exc.original_date;
        ev.idExcecao = exc.id;
        if (!mapa[novaData.getDate()]) mapa[novaData.getDate()] = [];
        mapa[novaData.getDate()].push(ev);
      }
      // Se a nova data for outro mês, o evento simplesmente não aparece neste mês.
    });
    mapa[dia] = novos;
  });

  // 2) Se uma exceção trouxe um evento de outro mês para este mês,
  // recria uma representação do evento no novo dia.
  excecoesCache.forEach((exc) => {
    const novaData = new Date(`${exc.new_date}T12:00:00`);
    const originalData = new Date(`${exc.original_date}T12:00:00`);
    if (novaData.getFullYear() !== ano || novaData.getMonth() !== mes) return;
    if (originalData.getFullYear() === ano && originalData.getMonth() === mes)
      return;

    const regra =
      regrasRegua.find((r) => r.titulo === exc.event_title) ||
      regrasEnxutas.find((r) => r.titulo === exc.event_title);

    const ev = {
      vencimentoOriginal: exc.vencimento_original ?? "Exceção",
      competenciaMes: originalData.getMonth() + 1,
      competenciaAno: originalData.getFullYear(),
      tituloRegra: exc.event_title,
      actionKey:
        regra?.actionKey ||
        obterAcaoCatalogo(exc.event_title)?.actionKey ||
        exc.event_title,
      tipo: exc.tipo || regra?.tipo || "bloqueio",
      categoria: exc.categoria || regra?.categoria || "bloqueio",
      desc:
        (exc.descricao || regra?.desc || "Evento alterado por exceção.") +
        ` ⚠️ Alterado excepcionalmente: ${exc.motivo}. Data original: ${originalData.toLocaleDateString("pt-BR")}.`,
      diasOffset: regra?.dias ?? 0,
      dataReal: novaData,
      excecao: true,
      motivoExcecao: exc.motivo,
      dataOriginalExcecao: exc.original_date,
      idExcecao: exc.id,
    };

    if (!mapa[novaData.getDate()]) mapa[novaData.getDate()] = [];
    // Evita duplicar caso já exista.
    const duplicado = mapa[novaData.getDate()].some(
      (x) => x.idExcecao === exc.id,
    );
    if (!duplicado) mapa[novaData.getDate()].push(ev);
  });

  return mapa;
}

function abrirLoginAdmin() {
  if (ehAdmin) {
    carregarExcecoes().then(() => {
      document.getElementById("modalAdmin").style.display = "flex";
      document.getElementById("adminUserLabel").textContent =
        `Logado como ${usuarioAdmin.email}`;
      renderizarAdmin();
    });
  } else {
    document.getElementById("modalLoginAdmin").style.display = "flex";
    document.getElementById("loginAdminStatus").textContent = "";
  }
}

function fecharLoginAdmin() {
  document.getElementById("modalLoginAdmin").style.display = "none";
}

function fecharAdmin() {
  document.getElementById("modalAdmin").style.display = "none";
}

async function loginAdmin() {
  if (!supabaseClient) {
    document.getElementById("loginAdminStatus").textContent =
      "Configure o Supabase no script.js antes de usar o acesso administrativo.";
    return;
  }

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  const status = document.getElementById("loginAdminStatus");
  status.textContent = "Entrando...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    status.textContent = "Não foi possível entrar. Confira e-mail e senha.";
    return;
  }

  usuarioAdmin = data.user;
  const ok = await verificarAdmin();
  if (!ok) {
    await supabaseClient.auth.signOut();
    status.textContent = "Este usuário não possui permissão administrativa.";
    return;
  }

  fecharLoginAdmin();
  document.getElementById("adminUserLabel").textContent =
    `Logado como ${usuarioAdmin.email}`;
  document.getElementById("modalAdmin").style.display = "flex";
  await carregarExcecoes();
  renderizarAdmin();
}

async function verificarAdmin() {
  if (!supabaseClient || !usuarioAdmin) return false;
  const { data, error } = await supabaseClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", usuarioAdmin.id)
    .maybeSingle();

  ehAdmin = !error && !!data;
  atualizarBotaoAdmin();
  return ehAdmin;
}

function atualizarBotaoAdmin() {
  const btn = document.getElementById("btnAdmin");
  if (btn) btn.textContent = ehAdmin ? "⚙️ Administração" : "🔐 Administração";
}

async function logoutAdmin() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  usuarioAdmin = null;
  ehAdmin = false;
  fecharAdmin();
  atualizarBotaoAdmin();
}

function preencherFormularioExcecao({
  originalDate = "",
  eventTitle = "",
  vencimento = "",
  newDate = "",
  motivo = "",
  exceptionId = "",
} = {}) {
  const originalEl = document.getElementById("modalExcOriginalDate");
  const titleEl = document.getElementById("modalExcEventTitle");
  const vencEl = document.getElementById("modalExcVencimento");
  const newEl = document.getElementById("modalExcNewDate");
  const motivoEl = document.getElementById("modalExcMotivo");
  if (!originalEl || !titleEl || !vencEl || !newEl || !motivoEl) return;

  originalEl.value = originalDate || "";
  titleEl.value = eventTitle || "";
  vencEl.value = vencimento ?? "";
  newEl.value = newDate || "";
  motivoEl.value = motivo || "";
  originalEl.readOnly = true;
  titleEl.readOnly = true;
  vencEl.readOnly = true;
  document.getElementById("modalExceptionEditingId").value = exceptionId || "";
}

function limparFormularioExcecao() {
  preencherFormularioExcecao();
  const originalEl = document.getElementById("modalExcOriginalDate");
  const titleEl = document.getElementById("modalExcEventTitle");
  const vencEl = document.getElementById("modalExcVencimento");
  if (originalEl) originalEl.readOnly = false;
  if (titleEl) titleEl.readOnly = false;
  if (vencEl) vencEl.readOnly = false;
  const status = document.getElementById("modalExceptionStatus");
  if (status) status.textContent = "";
}

function abrirEditorExcecaoNoModal(indice) {
  if (!ehAdmin) {
    abrirLoginAdmin();
    return;
  }

  const ev = eventosModalCache[indice];
  if (!ev) return;

  const originalDate = ev.dataOriginalExcecao || dataISO(ev.dataReal);
  const novaData = ev.excecao ? dataISO(ev.dataReal) : dataISO(ev.dataReal);
  const motivo = ev.excecao ? ev.motivoExcecao || "" : "";

  preencherFormularioExcecao({
    originalDate,
    eventTitle: ev.tituloRegra,
    vencimento:
      ev.vencimentoOriginal === "N/A" ||
      ev.vencimentoOriginal === "Geral" ||
      ev.vencimentoOriginal === "Bloqueados"
        ? ""
        : ev.vencimentoOriginal,
    newDate: novaData,
    motivo,
    exceptionId: ev.idExcecao || "",
  });

  const titulo = document.getElementById("modalEditorTitulo");
  if (titulo)
    titulo.textContent = ev.excecao
      ? "✏️ Editar alteração excepcional"
      : "✏️ Criar alteração excepcional";
  const botao = document.getElementById("btnSalvarExcecaoModal");
  if (botao)
    botao.textContent = ev.excecao ? "Salvar alteração" : "Criar exceção";
  const editor = document.getElementById("modalEditorExcecao");
  if (editor) editor.style.display = "block";
  const corpo = document.getElementById("modalCorpo");
  if (corpo) editor?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function fecharEditorExcecaoNoModal() {
  const editor = document.getElementById("modalEditorExcecao");
  if (editor) editor.style.display = "none";
  limparFormularioExcecao();
}
// SINCRONIZAÇÃO: BLOQUEIO → WHATSAPP
function ehBloqueio(ev) {
  return ev?.actionKey === "bloqueio_15" || ev?.tituloRegra === "Bloqueio";
}

function vencimentoTemWhatsApp(vencimento) {
  return [10, 15, 20].includes(Number(vencimento));
}

function somarDiasDataISO(dataISOString, quantidadeDias) {
  const data = new Date(`${dataISOString}T12:00:00`);
  data.setDate(data.getDate() + quantidadeDias);
  return dataISO(data);
}

async function sincronizarWhatsAppComBloqueio({
  bloqueioOriginal,
  bloqueioNovo,
  vencimento,
  usuarioId,
  excecaoBloqueioId = null,
}) {
  // WhatsApp só existe para estes vencimentos.
  if (!vencimentoTemWhatsApp(vencimento)) {
    return {
      sincronizado: false,
      motivo: "Este vencimento não possui disparo de WhatsApp.",
    };
  }

  const whatsappOriginal = somarDiasDataISO(bloqueioOriginal, -1);

  const whatsappNovo = somarDiasDataISO(bloqueioNovo, -1);

  if (whatsappOriginal === whatsappNovo) {
    return {
      sincronizado: false,
      motivo: "A data do WhatsApp não precisou ser alterada.",
    };
  }

  const { data: existente, error: buscaError } = await supabaseClient
    .from("excecoes_calendario")
    .select("*")
    .eq("ativo", true)
    .eq("event_title", "WhatsApp/E-mail")
    .eq("original_date", whatsappOriginal)
    .eq("vencimento_original", vencimento)
    .maybeSingle();

  if (buscaError) {
    console.error("Erro procurando exceção de WhatsApp:", buscaError);

    return {
      sincronizado: false,
      erro: buscaError,
    };
  }

  const motivoAutomatico = `🔗 Movido automaticamente devido à alteração do Bloqueio associado (${bloqueioOriginal} → ${bloqueioNovo}).`;

  if (existente) {
    const motivoAnterior = existente.motivo || "";

    const motivoFinal = motivoAnterior.includes("🔗 Movido automaticamente")
      ? motivoAnterior
      : `${motivoAnterior} | ${motivoAutomatico}`;

    const { error } = await supabaseClient
      .from("excecoes_calendario")
      .update({
        new_date: whatsappNovo,
        motivo: motivoFinal,
        ativo: true,
      })
      .eq("id", existente.id);

    if (error) {
      console.error("Erro atualizando WhatsApp associado:", error);

      return {
        sincronizado: false,
        erro: error,
      };
    }

    return {
      sincronizado: true,
      atualizado: true,
      original: whatsappOriginal,
      novaData: whatsappNovo,
    };
  }

  const payloadWhatsApp = {
    original_date: whatsappOriginal,
    new_date: whatsappNovo,
    event_title: "WhatsApp/E-mail",
    vencimento_original: vencimento,
    tipo: "pos",
    categoria: "fatura",
    descricao:
      "14 dias após o vencimento - Fatura por WhatsApp e E-mail. " +
      "Movido automaticamente junto com o Bloqueio associado.",
    motivo: motivoAutomatico,
    ativo: true,
    created_by: usuarioId,
  };

  const { error: insertError } = await supabaseClient
    .from("excecoes_calendario")
    .insert(payloadWhatsApp);

  if (insertError) {
    console.error("Erro criando exceção automática de WhatsApp:", insertError);

    return {
      sincronizado: false,
      erro: insertError,
    };
  }

  return {
    sincronizado: true,
    criado: true,
    original: whatsappOriginal,
    novaData: whatsappNovo,
  };
}

async function salvarExcecaoDoModal() {
  if (!supabaseClient || !ehAdmin || !usuarioAdmin) return;

  const status = document.getElementById("modalExceptionStatus");
  const original = document.getElementById("modalExcOriginalDate").value;
  const titulo = document.getElementById("modalExcEventTitle").value.trim();
  const venc =
    document.getElementById("modalExcVencimento").value.trim() || null;
  const nova = document.getElementById("modalExcNewDate").value;
  const motivo = document.getElementById("modalExcMotivo").value.trim();
  const exceptionId = document.getElementById("modalExceptionEditingId").value;

  if (!original || !titulo || !nova || !motivo) {
    status.textContent = "Preencha a nova data e o motivo.";
    return;
  }

  if (original === nova) {
    status.textContent = "A nova data precisa ser diferente da data original.";
    return;
  }

  const eventoRef =
    regrasRegua.find((r) => r.titulo === titulo) ||
    regrasEnxutas.find((r) => r.titulo === titulo);
  const payload = {
    original_date: original,
    new_date: nova,
    event_title: titulo,
    vencimento_original: venc,
    tipo: eventoRef?.tipo || "bloqueio",
    categoria: eventoRef?.categoria || "bloqueio",
    descricao: eventoRef?.desc || null,
    motivo,
    ativo: true,
  };

  status.textContent = "Salvando...";
  let result;
  if (exceptionId) {
    result = await supabaseClient
      .from("excecoes_calendario")
      .update(payload)
      .eq("id", exceptionId);
  } else {
    result = await supabaseClient
      .from("excecoes_calendario")
      .insert({ ...payload, created_by: usuarioAdmin.id });
  }

  if (result.error) {
    console.error(result.error);
    status.textContent = "Não foi possível salvar a alteração.";
    return;
  }

  let resultadoWhatsApp = null;

  if (titulo === "Bloqueio" && venc && vencimentoTemWhatsApp(venc)) {
    resultadoWhatsApp = await sincronizarWhatsAppComBloqueio({
      bloqueioOriginal: original,
      bloqueioNovo: nova,
      vencimento: Number(venc),
      usuarioId: usuarioAdmin.id,
      excecaoBloqueioId: exceptionId || null,
    });

    if (resultadoWhatsApp?.erro) {
      status.textContent =
        "⚠️ Bloqueio alterado, mas houve erro ao mover o WhatsApp. Verifique o histórico.";

      console.error(
        "Bloqueio salvo, mas WhatsApp não foi sincronizado:",
        resultadoWhatsApp.erro,
      );

      await carregarExcecoes();
      renderizarTudo();
      renderizarAdmin();

      return;
    }
  }

  status.textContent = "Alteração salva. Atualizando calendário...";
  await carregarExcecoes();
  fecharEditorExcecaoNoModal();
  renderizarTudo();
  renderizarAdmin();

  // Reabre o mesmo dia para o administrador conferir a alteração imediatamente.
  const dataReabrir = new Date(`${nova}T12:00:00`);
  abrirModalEventos(
    dataReabrir.getFullYear(),
    dataReabrir.getMonth(),
    dataReabrir.getDate(),
  );
}

async function salvarExcecao() {
  const status = document.getElementById("exceptionStatus");
  if (!supabaseClient || !ehAdmin) {
    status.textContent = "Acesso administrativo não configurado.";
    return;
  }

  const original = document.getElementById("excOriginalDate").value;
  const tipoSelecionado = document.getElementById("excTipoAcao")?.value || "";
  const tituloDigitado = document.getElementById("excEventTitle").value.trim();
  const actionKeySelecionado =
    document.getElementById("excActionKey")?.value || "";
  const acaoPorChave = catalogoAcoes.find(
    (a) => a.actionKey === actionKeySelecionado,
  );
  const titulo =
    acaoPorChave?.titulo ||
    catalogoAcoes.find((a) => obterRotuloAutocomplete(a) === tituloDigitado)
      ?.titulo ||
    tituloDigitado;
  const venc = document.getElementById("excVencimento").value.trim() || null;
  const nova = document.getElementById("excNewDate").value;
  const motivo = document.getElementById("excMotivo").value.trim();

  if (!original || !tipoSelecionado || !titulo || !nova || !motivo) {
    status.textContent =
      "Preencha data original, tipo, evento, nova data e motivo.";
    return;
  }

  const acaoCatalogo =
    catalogoAcoes.find(
      (a) =>
        a.actionKey === actionKeySelecionado && a.grupo === tipoSelecionado,
    ) ||
    catalogoAcoes.find(
      (a) => a.titulo === titulo && a.grupo === tipoSelecionado,
    );
  if (!acaoCatalogo) {
    status.textContent = "Escolha uma ação válida para o tipo selecionado.";
    atualizarAutocompleteAcoes();
    return;
  }

  const eventoRef =
    regrasRegua.find((r) => r.actionKey === acaoCatalogo.actionKey) ||
    regrasEnxutas.find((r) => r.actionKey === acaoCatalogo.actionKey) ||
    acaoCatalogo;

  const payload = {
    original_date: original,
    new_date: nova,
    event_title: titulo,
    vencimento_original: venc,
    tipo: eventoRef?.tipoEvento || eventoRef?.tipo || "bloqueio",
    categoria: eventoRef?.categoria || "bloqueio",
    descricao: eventoRef?.desc || eventoRef?.descricao || null,
    motivo,
    ativo: true,
    created_by: usuarioAdmin.id,
  };

  status.textContent = "Salvando...";
  const { error } = await supabaseClient
    .from("excecoes_calendario")
    .insert(payload);

  if (error) {
    console.error(error);
    status.textContent = "Erro ao salvar a exceção.";
    return;
  }

  if (titulo === "Bloqueio" && venc && vencimentoTemWhatsApp(venc)) {
    const resultadoWhatsApp = await sincronizarWhatsAppComBloqueio({
      bloqueioOriginal: original,
      bloqueioNovo: nova,
      vencimento: Number(venc),
      usuarioId: usuarioAdmin.id,
    });

    if (resultadoWhatsApp?.erro) {
      status.textContent =
        "⚠️ Bloqueio salvo, mas não foi possível mover o WhatsApp.";

      console.error(
        "Erro na sincronização do WhatsApp:",
        resultadoWhatsApp.erro,
      );

      return;
    }
  }

  status.textContent = "Exceção salva. Atualizando calendário...";
  document.getElementById("excActionKey").value = "";
  document.getElementById("excEventTitle").value = "";
  document.getElementById("excTipoAcao").value = "";
  atualizarAutocompleteAcoes();
  await carregarExcecoes();
  renderizarTudo();
  renderizarAdmin();
  setTimeout(() => (status.textContent = ""), 2500);
}

async function excluirExcecao(id) {
  if (!supabaseClient || !ehAdmin) return;
  if (!confirm("Excluir esta exceção? O evento voltará à regra original."))
    return;

  const { error } = await supabaseClient
    .from("excecoes_calendario")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Não foi possível excluir a exceção.");
    return;
  }

  await carregarExcecoes();
  renderizarTudo();
  renderizarAdmin();
}

function escapeHTML(valor) {
  return String(valor ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}

function renderizarAdmin() {
  const lista = document.getElementById("exceptionList");
  const audit = document.getElementById("auditList");
  if (!lista || !audit) return;

  atualizarAutocompleteAcoes();
  const inputEvento = document.getElementById("excEventTitle");
  if (inputEvento) inputEvento.oninput = sincronizarTipoComEvento;

  lista.innerHTML = excecoesCache.length
    ? excecoesCache
        .map(
          (e) => `
        <div class="admin-row">
            <div>
                <strong>${escapeHTML(e.event_title)}</strong>
                <span>${escapeHTML(e.original_date)} → <b>${escapeHTML(e.new_date)}</b></span>
                <small>${escapeHTML(e.motivo)}</small>
            </div>
            <button class="danger-btn" onclick="excluirExcecao('${e.id}')">Excluir</button>
        </div>
    `,
        )
        .join("")
    : `<p class="admin-empty">Nenhuma exceção cadastrada.</p>`;

  carregarHistorico();
}

async function carregarHistorico() {
  if (!supabaseClient || !ehAdmin) return;
  const audit = document.getElementById("auditList");
  const { data, error } = await supabaseClient
    .from("historico_alteracoes")
    .select("id, acao, created_at, detalhes")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    audit.innerHTML = `<p class="admin-empty">Não foi possível carregar o histórico.</p>`;
    return;
  }

  audit.innerHTML = data?.length
    ? data
        .map(
          (h) => `
        <div class="admin-row history-row">
            <div>
                <strong>${escapeHTML(h.acao)}</strong>
                <span>${new Date(h.created_at).toLocaleString("pt-BR")}</span>
                <small>${escapeHTML(h.detalhes || "")}</small>
            </div>
        </div>
    `,
        )
        .join("")
    : `<p class="admin-empty">Nenhuma alteração registrada.</p>`;
}

function calcularDataEventoExata(dataBase, dias) {
  const dataEvento = new Date(dataBase);
  const diasInteiros = Math.trunc(dias);
  const fracao = Math.abs(dias - diasInteiros);

  // Mantém a data do calendário fiel ao offset, inclusive para regras como D+74,5.
  dataEvento.setDate(dataEvento.getDate() + diasInteiros);
  if (fracao > 0) {
    dataEvento.setTime(
      dataEvento.getTime() +
        (Math.sign(dias) || 1) * fracao * 24 * 60 * 60 * 1000,
    );
  }
  return dataEvento;
}

function coletarEventosDoMes(ano, mes) {
  const mapaEventos = {};

  const adicionarEvento = (dia, ev) => {
    if (!mapaEventos[dia]) mapaEventos[dia] = [];
    mapaEventos[dia].push(ev);
  };

  if (!modoVisaoEnxuta) {
    const competencias = [];
    for (let deslocamento = -3; deslocamento <= 1; deslocamento++) {
      const dataCompetencia = new Date(ano, mes + deslocamento, 1);

      competencias.push({
        ano: dataCompetencia.getFullYear(),
        mes: dataCompetencia.getMonth(),
      });
    }
    competencias.forEach((comp) => {
      diasFaturamentoOficiais.forEach((diaVenc) => {
        const dataVencimento = new Date(comp.ano, comp.mes, diaVenc);
        regrasRegua.forEach((regra) => {
          if (
            regra.vencimentosPermitidos &&
            !regra.vencimentosPermitidos.includes(diaVenc)
          )
            return;
          const dataEvento = calcularDataEventoExata(
            dataVencimento,
            regra.dias,
          );
          if (
            dataEvento.getFullYear() === ano &&
            dataEvento.getMonth() === mes
          ) {
            const dNum = dataEvento.getDate();
            adicionarEvento(dNum, {
              vencimentoOriginal: diaVenc,
              competenciaMes: comp.mes + 1,
              competenciaAno: comp.ano,
              tituloRegra: regra.titulo,
              actionKey:
                regra.actionKey ||
                obterAcaoCatalogo(regra.titulo)?.actionKey ||
                regra.titulo,
              tipo: regra.tipo,
              categoria: regra.categoria,
              desc: regra.desc,
              diasOffset: regra.dias,
              dataReal: dataEvento,
            });
          }
        });
      });
    });
  } else {
    const competencias = [
      { ano: mes === 0 ? ano - 1 : ano, mes: mes === 0 ? 11 : mes - 1 },
      { ano, mes },
      { ano: mes === 11 ? ano + 1 : ano, mes: mes === 11 ? 0 : mes + 1 },
    ];
    competencias.forEach((comp) => {
      diasFaturamentoOficiais.forEach((diaVenc) => {
        const dataVencimento = new Date(comp.ano, comp.mes, diaVenc);
        regrasEnxutas.forEach((regra) => {
          if (
            regra.vencimentosPermitidos &&
            !regra.vencimentosPermitidos.includes(diaVenc)
          )
            return;
          const dataEvento = new Date(dataVencimento);
          dataEvento.setDate(dataVencimento.getDate() + Math.round(regra.dias));
          if (
            dataEvento.getFullYear() === ano &&
            dataEvento.getMonth() === mes
          ) {
            const dNum = dataEvento.getDate();
            adicionarEvento(dNum, {
              vencimentoOriginal: diaVenc,
              competenciaMes: comp.mes + 1,
              competenciaAno: comp.ano,
              tituloRegra: regra.titulo,
              actionKey:
                regra.actionKey ||
                obterAcaoCatalogo(regra.titulo)?.actionKey ||
                regra.titulo,
              tipo: regra.tipo,
              categoria: regra.categoria,
              desc: regra.desc,
              diasOffset: regra.dias,
              dataReal: dataEvento,
            });
          }
        });
      });
    });

    const faturamentosFixos = [
      {
        dia: 16,
        titulo: "Faturamento Normal",
        desc: "Faturamento mensal normal da empresa.",
      },
      {
        dia: 20,
        titulo: "Faturamento B2B",
        desc: "Faturamento mensal para clientes B2B.",
      },
      {
        dia: 28,
        titulo: "Faturamento (Pós-16)",
        desc: "Faturamento para clientes ativados após o dia 16.",
      },
    ];
    faturamentosFixos.forEach((fat) => {
      const dataFat = new Date(ano, mes, fat.dia);
      adicionarEvento(fat.dia, {
        vencimentoOriginal: "Geral",
        competenciaMes: mes + 1,
        competenciaAno: ano,
        tituloRegra: fat.titulo,
        actionKey:
          fat.titulo === "Faturamento Normal"
            ? "fat_normal"
            : fat.titulo === "Faturamento B2B"
              ? "fat_b2b"
              : "fat_pos16",
        tipo: "vencimento",
        categoria: "fatura",
        desc: fat.desc,
        diasOffset: 0,
        dataReal: dataFat,
      });
    });
    const dataCorte = new Date(ano, mes, 12);
    const msPorDia = 24 * 60 * 60 * 1000;
    const dataLimiteBloqueio = new Date(dataCorte.getTime() - 74.5 * msPorDia);
    const dataLimiteVencimento = new Date(
      dataCorte.getTime() - 89.5 * msPorDia,
    );

    const anoRef = dataLimiteVencimento.getFullYear();
    const mesRef = dataLimiteVencimento.getMonth();
    const mesRefNome = dataLimiteVencimento.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const dataLimiteStr = dataLimiteVencimento.toLocaleDateString("pt-BR");
    const vencimentosEntrantes = diasFaturamentoOficiais.filter((diaVenc) => {
      const dataVenc = new Date(anoRef, mesRef, diaVenc);
      return dataVenc <= dataLimiteVencimento;
    });

    let detalheRegra = "";
    if (vencimentosEntrantes.length > 0) {
      detalheRegra = `Vencimentos afetados deste ciclo: dias ${vencimentosEntrantes.join(", ")} de ${mesRefNome} (e todos os anteriores a ${dataLimiteStr}).`;
    } else {
      detalheRegra = `Aplica-se a todos os vencimentos até ${dataLimiteStr}.`;
    }
    adicionarEvento(12, {
      vencimentoOriginal: "Bloqueados",
      competenciaMes: mes + 1,
      competenciaAno: ano,
      tituloRegra: "Data de Corte (Cancelamento)",
      actionKey: "corte_12",
      tipo: "cancelamento",
      categoria: "cancelamento",
      desc: `Cancelamento de clientes bloqueados há ≥ 74.5 dias (bloqueio até ${dataLimiteBloqueio.toLocaleDateString("pt-BR")}). ${detalheRegra}`,
      diasOffset: 74.5,
      dataReal: dataCorte,
    });
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    for (let d = 1; d <= totalDiasMes; d++) {
      const dataIterada = new Date(ano, mes, d);
      const diaSemana = dataIterada.getDay();
      if (diaSemana === 1) {
        adicionarEvento(d, {
          vencimentoOriginal: "N/A",
          competenciaMes: mes + 1,
          competenciaAno: ano,
          tituloRegra: "Relatório B2B",
          actionKey: "relatorio_b2b",
          tipo: "relatorio",
          categoria: "relatorio",
          desc: "Toda segunda-feira: Gerar relatório de inadimplência da base B2B de cobrança master.",
          diasOffset: 0,
          dataReal: dataIterada,
        });
      } else if (diaSemana === 2 || diaSemana === 5) {
        adicionarEvento(d, {
          vencimentoOriginal: "N/A",
          competenciaMes: mes + 1,
          competenciaAno: ano,
          tituloRegra: "Relatórios Assessorias / Diretoria",
          actionKey: "relatorio_assessorias",
          tipo: "relatorio",
          categoria: "relatorio",
          desc: "Toda terça e sexta-feira: Gerar relatório para assessorias (com ranking) e relatório preventivo de inadimplência para diretoria.",
          diasOffset: 0,
          dataReal: dataIterada,
        });
      }
    }
  }

  return aplicarExcecoesAoMapa(mapaEventos, ano, mes);
}

function filtrarPorAcaoDashboard(actionKey) {
  if (!actionKey) return;
  if (filtroAcaoGlobal === actionKey) {
    filtroAcaoGlobal = null;
  } else {
    filtroAcaoGlobal = actionKey;
  }

  renderizarTudo();
}

function eventoVisivel(ev) {
  const passaTipo = !filtroTipoGlobal || ev.categoria === filtroTipoGlobal;

  const passaAcao =
    !filtroAcaoGlobal || (ev.actionKey || ev.tituloRegra) === filtroAcaoGlobal;

  return passaTipo && passaAcao;
}

function filtrarEventos(eventos) {
  return eventos.filter(eventoVisivel);
}

function obterEventosFiltradosMes(ano, mes) {
  const mapa = coletarEventosDoMes(ano, mes);
  Object.keys(mapa).forEach((dia) => (mapa[dia] = filtrarEventos(mapa[dia])));
  return mapa;
}

function renderizarTudo() {
  renderizarAcoesHoje();
  renderizarCalendario();
  atualizarKPIs();
  if (visualizacaoAtual !== "calendario") renderizarVisualizacaoAlternativa();
}

function renderizarAcoesHoje() {
  const containerHoje = document.getElementById("todayActionsContent");
  if (!containerHoje) return;

  const hoje = new Date();

  const eventosHoje = filtrarEventos(
    coletarEventosDoMes(hoje.getFullYear(), hoje.getMonth())[hoje.getDate()] ||
      [],
  );

  if (!eventosHoje.length) {
    containerHoje.innerHTML = `
            <p class="no-actions-today">
                Nenhuma ação operacional corresponde aos filtros para hoje.
            </p>
        `;
    return;
  }
  function formatarVencimentoHoje(ev) {
    if (
      ev.vencimentoOriginal === "N/A" ||
      ev.vencimentoOriginal === "Geral" ||
      ev.vencimentoOriginal === "Bloqueados"
    ) {
      return ev.vencimentoOriginal;
    }

    const dia = Number(ev.vencimentoOriginal);
    const mes = Number(ev.competenciaMes);
    const ano = Number(ev.competenciaAno);

    if (!dia || !mes || !ano) {
      return `Dia ${ev.vencimentoOriginal}`;
    }

    const dataVencimento = new Date(ano, mes - 1, dia);

    return dataVencimento.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  function resumoOffset(ev) {
    if (ev.categoria === "relatorio") {
      return "Tarefa recorrente";
    }

    if (ev.diasOffset === 0) {
      return "Data fixa";
    }

    if (ev.diasOffset < 0) {
      return `D-${Math.abs(ev.diasOffset)}`;
    }

    return `D+${ev.diasOffset}`;
  }

  containerHoje.innerHTML = `
        <div class="today-actions-list">

            ${eventosHoje
              .map((ev) => {
                const vencimento = formatarVencimentoHoje(ev);
                const offset = resumoOffset(ev);

                return `
                    <div class="today-action-item">

                        <span class="badge-type ${ev.tipo}">
                            ${ev.excecao ? "⚠️ " : ""}
                            ${ev.tituloRegra}
                        </span>

                        <div class="today-action-text">

                            <strong>
                                Vencimento: ${vencimento}
                            </strong>

                            <span class="today-action-offset">
                                ${offset}
                            </span>

                        </div>

                    </div>
                `;
              })
              .join("")}

        </div>
    `;
}

function labelTempo(ev) {
  if (ev.categoria === "relatorio") return "Tarefa Recorrente";
  if (ev.diasOffset === 0) return "Data Fixa / Vencimento";
  return ev.diasOffset < 0
    ? `${Math.abs(ev.diasOffset)} dias antes`
    : `${ev.diasOffset} dias após`;
}

function renderizarCalendario() {
  const indicador = document.getElementById("dashboardActionFilter");
  if (indicador) {
    if (filtroAcaoGlobal) {
      const acao = catalogoAcoes.find((a) => a.actionKey === filtroAcaoGlobal);

      indicador.innerHTML = `
                <span>
                    🔎 Filtrando por:
                    <strong>${escapeHTML(acao?.titulo || filtroAcaoGlobal)}</strong>
                </span>

                <button
                    type="button"
                    onclick="limparFiltroAcaoDashboard()"
                >
                    Limpar filtro
                </button>
            `;

      indicador.classList.remove("hidden");
    } else {
      indicador.classList.add("hidden");
      indicador.innerHTML = "";
    }
  }
  const grid = document.getElementById("calendarDays");
  if (!grid) return;

  const ano = dataAtual.getFullYear(),
    mes = dataAtual.getMonth();
  const primeiroDiaIndex = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();
  const eventosDoMes = obterEventosFiltradosMes(ano, mes);
  const hojeStr = new Date().toDateString();
  let htmlGrid = "";

  for (let i = primeiroDiaIndex; i > 0; i--) {
    htmlGrid += `<div class="calendar-day other-month"><span class="day-number">${totalDiasMesAnterior - i + 1}</span></div>`;
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const dataIterada = new Date(ano, mes, dia);
    const eventosDoDia = eventosDoMes[dia] || [];
    let classesExtras = dataIterada.toDateString() === hojeStr ? " hoje" : "";
    const focoVencimentoAtivo = vencimentoFocoGlobal !== null;

    const diaTemVencimentoFocado =
      focoVencimentoAtivo &&
      (dia === vencimentoFocoGlobal ||
        eventosDoDia.some(
          (ev) => ev.vencimentoOriginal === vencimentoFocoGlobal,
        ));

    const focoAcaoAtivo = !!filtroAcaoGlobal;

    const diaTemAcaoFocada =
      focoAcaoAtivo &&
      eventosDoDia.some(
        (ev) => (ev.actionKey || ev.tituloRegra) === filtroAcaoGlobal,
      );
    const algumFocoAtivo = focoVencimentoAtivo || focoAcaoAtivo;

    const diaTemFoco =
      (!focoVencimentoAtivo || diaTemVencimentoFocado) &&
      (!focoAcaoAtivo || diaTemAcaoFocada);

    if (algumFocoAtivo) {
      classesExtras += diaTemFoco ? " focused" : " unfocused";
    }

    let bolinhasHtml = `<div class="event-dots-container">`;
    eventosDoDia.slice(0, 6).forEach((ev) => {
      const destaqueVencimento =
        focoVencimentoAtivo && ev.vencimentoOriginal === vencimentoFocoGlobal;

      const destaqueAcao =
        focoAcaoAtivo && (ev.actionKey || ev.tituloRegra) === filtroAcaoGlobal;

      const destaque =
        destaqueVencimento || destaqueAcao ? " dot-highlight" : "";
      bolinhasHtml += `
                <span
                    class="event-dot ${ev.tipo}${destaque}"
                    title="${
                      ev.vencimentoOriginal !== "N/A"
                        ? "Vencimento: " +
                          formatarVencimentoCompleto(ev) +
                          " | "
                        : ""
                    }${ev.tituloRegra} | Data da ação: ${formatarDataCompleta(ev.dataReal)}${
                      ev.diasOffset !== undefined && ev.diasOffset !== 0
                        ? " | D+" + ev.diasOffset
                        : ""
                    }"{
                        ev.excecao
                            ? ' ⚠️ Alterado: ' + ev.motivoExcecao
                            : ''
                    }"
                ></span>
            `;
    });
    if (eventosDoDia.length > 6)
      bolinhasHtml += `<span class="more-dots">+${eventosDoDia.length - 6}</span>`;
    bolinhasHtml += `</div>`;

    // Tags visuais no canto superior direito (Unificadas para ficarem sempre visíveis)
    let tagsHeader = `<div class="indicators-wrapper">`;

    if (diasFaturamentoOficiais.includes(dia)) {
      tagsHeader += `<span class="venc-indicator${dia === 15 ? " principal" : ""}">V${dia}</span>`;
    }
    if ([16, 20, 28].includes(dia)) {
      tagsHeader += `<span class="venc-indicator fat">FAT</span>`;
    }
    if (dia === 12) {
      tagsHeader += `<span class="venc-indicator corte">CORTE</span>`;
    }

    tagsHeader += `</div>`;

    htmlGrid += `
            <div class="calendar-day ${classesExtras}" onclick="abrirModalEventos(${ano}, ${mes}, ${dia})">
                <div class="day-header-line">
                    <span class="day-number">${dia}</span>
                    ${tagsHeader}
                </div>
                ${bolinhasHtml}
                <span class="event-count">${eventosDoDia.length ? eventosDoDia.length + (eventosDoDia.length === 1 ? " evento" : " eventos") : ""}</span>
            </div>`;
  }
  grid.innerHTML = htmlGrid;
}

function obterListaEventos() {
  const ano = dataAtual.getFullYear(),
    mes = dataAtual.getMonth();
  const mapa = obterEventosFiltradosMes(ano, mes);
  const eventos = [];
  Object.keys(mapa).forEach((dia) =>
    mapa[dia].forEach((ev) => {
      if (
        vencimentoFocoGlobal === null ||
        ev.vencimentoOriginal === vencimentoFocoGlobal ||
        Number(dia) === vencimentoFocoGlobal
      )
        eventos.push(ev);
    }),
  );
  return eventos.sort(
    (a, b) =>
      a.dataReal - b.dataReal ||
      (typeof a.vencimentoOriginal === "number"
        ? a.vencimentoOriginal - b.vencimentoOriginal
        : 0),
  );
}

function renderizarVisualizacaoAlternativa() {
  const eventos = obterListaEventos();
  const lista = document.getElementById("listView");
  const timeline = document.getElementById("timelineView");
  if (!lista || !timeline) return;

  if (!eventos.length) {
    lista.innerHTML =
      timeline.innerHTML = `<div class="empty-view">Nenhum evento corresponde aos filtros selecionados.</div>`;
    return;
  }

  const itemHTML = (ev) => `
        <div class="list-event">
            <div class="list-date">
                <strong>${ev.dataReal.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</strong>
                <small>${labelTempo(ev)}</small>
            </div>
            <span class="badge-type ${ev.tipo}">${ev.excecao ? "⚠️ " : ""}${ev.tituloRegra}</span>
            <div class="event-info">
                <strong>Vencimento base: ${ev.vencimentoOriginal === "N/A" || ev.vencimentoOriginal === "Geral" || ev.vencimentoOriginal === "Bloqueados" ? ev.vencimentoOriginal : "Dia " + ev.vencimentoOriginal}</strong>
                <p>${ev.desc}</p>
            </div>
        </div>`;

  lista.innerHTML = `<div class="view-heading"><h3>Lista operacional</h3><span>${eventos.length} eventos no período</span></div>${eventos.map(itemHTML).join("")}`;

  const grupos = {};
  eventos.forEach((ev) => {
    const chave = ev.dataReal.toISOString().slice(0, 10);
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(ev);
  });
  timeline.innerHTML = `<div class="view-heading"><h3>Linha do tempo</h3><span>Sequência operacional do mês</span></div><div class="timeline">${Object.values(
    grupos,
  )
    .map(
      (grupo) =>
        `<div class="timeline-group"><div class="timeline-date"><strong>${grupo[0].dataReal.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</strong></div><div class="timeline-events">${grupo.map(itemHTML).join("")}</div></div>`,
    )
    .join("")}</div>`;
}

function atualizarKPIs() {
  const eventos = obterListaEventos();
  const catalogo = modoVisaoEnxuta
    ? catalogoDashboardEnxuto
    : catalogoDashboardCompleto;
  const painel = document.getElementById("kpiPanel");
  const periodo = document.getElementById("dashboardPeriodLabel");
  if (!painel) return;

  if (periodo) {
    const nomeMes = dataAtual.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    periodo.textContent = `${modoVisaoEnxuta ? "Visão enxuta" : "Layout completo"} • ${nomeMes}`;
  }

  const icones = {
    ante: `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 6v6l4 2"/>
            <circle cx="12" cy="12" r="9"/>
        </svg>`,

    vencimento: `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2"/>
            <path d="M16 3v4M8 3v4M3 10h18"/>
        </svg>`,

    pos: `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11.5a8 8 0 0 1-8 8H6l-3 2v-5a8 8 0 1 1 17-5z"/>
        </svg>`,

    whatsapp: `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z"/>
            <path d="M9 9.5c.3 1.5 1.5 3 3.5 4"/>
        </svg>`,

    bloqueio: `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="10" width="14" height="11" rx="2"/>
            <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
        </svg>`,

    cancelamento: `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="m9 9 6 6M15 9l-6 6"/>
        </svg>`,

    relatorio: `<svg class="action-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 19V5M4 19h16"/>
            <path d="M8 16v-5M12 16V8M16 16v-7"/>
        </svg>`,
  };
  painel.innerHTML = catalogo
    .map((acao) => {
      const quantidade = eventos.filter(
        (ev) => (ev.actionKey || ev.tituloRegra) === acao.actionKey,
      ).length;
      const classe = acao.tipoEvento || acao.grupo;
      const descricaoDashboard =
        acao.actionKey === "whatsapp_14"
          ? "D+14 • somente vencimentos 10, 15 e 20."
          : acao.descricao;
      return `<div
                    class="kpi-card action-kpi ${quantidade ? "has-events" : "is-zero"} ${filtroAcaoGlobal === acao.actionKey ? "dashboard-selected" : ""}"
                    onclick="filtrarPorAcaoDashboard('${acao.actionKey}')"
                    title="${filtroAcaoGlobal === acao.actionKey ? "Clique para remover este filtro" : "Clique para filtrar o calendário por esta ação"}"
                >
            <span class="kpi-icon ${classe}">${icones[acao.grupo] || "•"}</span>
            <div class="kpi-card-content"><strong>${quantidade}</strong><small>${escapeHTML(acao.titulo)}</small><em>${escapeHTML(descricaoDashboard)}</em></div>
        </div>`;
    })
    .join("");
  painel.innerHTML += `<div class="kpi-card action-kpi total-kpi has-events"><span class="kpi-icon">Σ</span><div class="kpi-card-content"><strong>${eventos.length}</strong><small>Total de ações</small><em>Respeitando os filtros atuais.</em></div></div>`;
}

function abrirModalEventos(ano, mes, dia) {
  const modal = document.getElementById("modalDetalhes"),
    corpo = document.getElementById("modalCorpo");
  if (!modal || !corpo) return;

  document.getElementById("modalTitulo").textContent =
    `Eventos Operacionais: ${new Date(ano, mes, dia).toLocaleDateString("pt-BR", { dateStyle: "full" })}`;
  eventosModalCache = filtrarEventos(
    coletarEventosDoMes(ano, mes)[dia] || [],
  ).filter(
    (ev) =>
      vencimentoFocoGlobal === null ||
      ev.vencimentoOriginal === vencimentoFocoGlobal,
  );

  const editorHtml = `
        <div id="modalEditorExcecao" class="modal-exception-editor" style="display:none;">
            <div class="modal-editor-header">
                <div>
                    <h4 id="modalEditorTitulo">✏️ Alterar data</h4>
                    <p>A regra original continua igual. A alteração vale somente para esta ocorrência.</p>
                </div>
                <button type="button" class="modal-editor-close" onclick="fecharEditorExcecaoNoModal()">Cancelar</button>
            </div>
            <input id="modalExceptionEditingId" type="hidden" value="">
            <label>Data original</label>
            <input id="modalExcOriginalDate" type="date" readonly>
            <label>Evento</label>
            <input id="modalExcEventTitle" type="text" readonly>
            <label>Vencimento base</label>
            <input id="modalExcVencimento" type="text" readonly>
            <label>Nova data</label>
            <input id="modalExcNewDate" type="date">
            <label>Motivo</label>
            <input id="modalExcMotivo" type="text" placeholder="Ex.: Feriado">
            <button id="btnSalvarExcecaoModal" type="button" class="admin-primary" onclick="salvarExcecaoDoModal()">Salvar alteração</button>
            <p id="modalExceptionStatus" class="admin-status"></p>
        </div>`;

  const listaHtml = eventosModalCache.length
    ? `<ul class="modal-events-list">${eventosModalCache
        .map(
          (ev, index) => `
                <li>
                    <span class="badge-type ${ev.tipo}">${ev.excecao ? "⚠️ " : ""}${ev.tituloRegra}</span>
                    <div class="event-info">
                        <div class="event-date-info">

            <strong>
                Vencimento de referência:
                ${
                  ev.vencimentoOriginal === "N/A" ||
                  ev.vencimentoOriginal === "Geral" ||
                  ev.vencimentoOriginal === "Bloqueados"
                    ? ev.vencimentoOriginal
                    : formatarVencimentoCompleto(ev)
                }
            </strong>

            <strong>
                Data da ação:
                ${formatarDataCompleta(ev.dataReal)}
            </strong>

            <span>
                ${labelTempo(ev)}
            </span>

        </div>

        <p>${ev.desc}</p>
                ${ev.excecao ? `<p class="exception-note">⚠️ ${escapeHTML(ev.motivoExcecao || "Alterado excepcionalmente")} — original: ${escapeHTML(ev.dataOriginalExcecao || "")}.</p>` : ""}
                ${ehAdmin ? `<button type="button" class="modal-edit-btn" onclick="abrirEditorExcecaoNoModal(${index})">✏️ ${ev.excecao ? "Alterar esta exceção" : "Alterar data excepcionalmente"}</button>` : ""}
            </div>
        </li>`,
        )
        .join("")}</ul>`
    : `<p class="no-events">Nenhum evento da régua corresponde aos filtros para este dia.</p>`;

  corpo.innerHTML = listaHtml + editorHtml;
  modal.style.display = "flex";
}

function baixarGuiaCalendario() {
  const link = document.createElement("a");
  link.href = "docs/GUIA_CALENDARIO.pdf";
  link.download = "Guia_Calendario_Regua_Cobranca.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function exportarCSV() {
  const eventos = obterListaEventos();
  const mesNome = dataAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const linhas = [
    ["Data", "Evento", "Categoria", "Vencimento base", "Offset", "Descrição"],
  ];
  eventos.forEach((ev) =>
    linhas.push([
      ev.dataReal.toLocaleDateString("pt-BR"),
      ev.tituloRegra,
      ev.categoria,
      ev.vencimentoOriginal,
      ev.diasOffset,
      ev.desc,
    ]),
  );
  const csv =
    "\ufeff" +
    linhas
      .map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `regua-cobranca-${modoVisaoEnxuta ? "enxuta-" : ""}${mesNome.replace(/ /g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportarPDF() {
  const eventos = obterListaEventos();

  const mesNome = dataAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const printReport = document.getElementById("printReport");
  if (!printReport) return;

  const totalBloqueios = eventos.filter(
    (e) => e.categoria === "bloqueio"
  ).length;

  const totalSMS = eventos.filter(
    (e) => e.categoria === "sms"
  ).length;

  const totalFaturas = eventos.filter(
    (e) => e.categoria === "fatura"
  ).length;

  const totalCancelamentos = eventos.filter(
    (e) => e.categoria === "cancelamento"
  ).length;

  printReport.innerHTML = `
    <div class="print-header">
      <div>
        <div class="print-brand">MASTER</div>
        <h1>Régua de Cobrança</h1>
        <p class="print-subtitle">
          Relatório operacional — ${mesNome}
        </p>
      </div>

      <div class="print-header-info">
        <strong>${modoVisaoEnxuta ? "VISÃO ENXUTA" : "VISÃO COMPLETA"}</strong>
        <span>Gerado em ${new Date().toLocaleDateString("pt-BR")}</span>
      </div>
    </div>

    <div class="print-divider"></div>

    <div class="print-filters">
      <strong>Filtros aplicados:</strong>
      ${filtroTipoGlobal || "Todos os eventos"}
      ${
        vencimentoFocoGlobal
          ? ` | Vencimento: dia ${vencimentoFocoGlobal}`
          : ""
      }
    </div>

    <div class="print-kpis">

      <div class="print-kpi total">
        <span class="print-kpi-label">TOTAL</span>
        <strong>${eventos.length}</strong>
        <small>Eventos</small>
      </div>

      <div class="print-kpi bloqueio">
        <span class="print-kpi-label">BLOQUEIOS</span>
        <strong>${totalBloqueios}</strong>
        <small>Ações</small>
      </div>

      <div class="print-kpi sms">
        <span class="print-kpi-label">SMS</span>
        <strong>${totalSMS}</strong>
        <small>Notificações</small>
      </div>

      <div class="print-kpi fatura">
        <span class="print-kpi-label">FATURAS / E-MAILS</span>
        <strong>${totalFaturas}</strong>
        <small>Comunicações</small>
      </div>

      <div class="print-kpi cancelamento">
        <span class="print-kpi-label">SERASA / CANCEL.</span>
        <strong>${totalCancelamentos}</strong>
        <small>Ações</small>
      </div>

    </div>

    <div class="print-section-title">
      Cronograma de ações e notificações
    </div>

    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Evento</th>
          <th>Venc.</th>
          <th>Descrição</th>
        </tr>
      </thead>

      <tbody>
        ${
          eventos.length
            ? eventos
                .map(
                  (ev) => `
                    <tr>
                      <td class="print-date">
                        ${ev.dataReal.toLocaleDateString("pt-BR")}
                      </td>

                      <td class="print-event">
                        ${ev.tituloRegra}
                      </td>

                      <td class="print-venc">
                        ${ev.vencimentoOriginal}
                      </td>

                      <td>
                        ${ev.desc}
                      </td>
                    </tr>
                  `
                )
                .join("")
            : `
              <tr>
                <td colspan="4" class="print-empty">
                  Nenhum evento encontrado para os filtros selecionados.
                </td>
              </tr>
            `
        }
      </tbody>
    </table>

    <div class="print-footer">
      <span>Master | Régua de Cobrança</span>
      <span>Relatório operacional</span>
    </div>
  `;

  window.print();
}

function fecharModal() {
  const modal = document.getElementById("modalDetalhes");
  if (modal) modal.style.display = "none";
}
function fecharModalFora(event) {
  if (event.target === document.getElementById("modalDetalhes")) fecharModal();
}
function limparFiltroAcaoDashboard() {
  filtroAcaoGlobal = null;
  renderizarTudo();
}
function formatarDataCompleta(data) {
  if (!data) return "N/A";

  const d = data instanceof Date ? data : new Date(data);

  if (isNaN(d.getTime())) return "N/A";

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarVencimentoCompleto(ev) {
  if (
    ev.vencimentoOriginal === undefined ||
    ev.vencimentoOriginal === null ||
    ev.vencimentoOriginal === "N/A" ||
    ev.vencimentoOriginal === "Geral"
  ) {
    return ev.vencimentoOriginal || "N/A";
  }

  const mes = Number(ev.competenciaMes);
  const ano = Number(ev.competenciaAno);

  if (!mes || !ano) {
    return String(ev.vencimentoOriginal);
  }

  const dataVencimento = new Date(ano, mes - 1, Number(ev.vencimentoOriginal));

  return formatarDataCompleta(dataVencimento);
}

function alternarTema() {
  const body = document.body;
  const modoEscuro = body.classList.toggle("dark-theme");

  localStorage.setItem("temaCalendario", modoEscuro ? "dark" : "light");

  atualizarBotaoTema();
}

function atualizarBotaoTema() {
  const body = document.body;
  const icon = document.getElementById("themeIcon");
  const text = document.getElementById("themeText");

  if (!icon || !text) return;

  if (body.classList.contains("dark-theme")) {
    icon.textContent = "☀";
    text.textContent = "Modo claro";
  } else {
    icon.textContent = "☾";
    text.textContent = "Modo escuro";
  }
}

function carregarTema() {
  const temaSalvo = localStorage.getItem("temaCalendario");

  if (temaSalvo === "dark") {
    document.body.classList.add("dark-theme");
  }

  atualizarBotaoTema();
}

document.addEventListener("DOMContentLoaded", () => {
  carregarTema();
  const select = document.getElementById("notificationInterval");
  if (select) {
    select.addEventListener(
      "change",
      alterarIntervaloNotificacao
    );
  }
  // Primeiro aviso
  proximoAvisoTimestamp =
    Date.now() + intervaloNotificacaoMs;
  countdownTimer = setInterval(
    atualizarContadorNotificacao,
    1000
  );
  atualizarContadorNotificacao();
});
