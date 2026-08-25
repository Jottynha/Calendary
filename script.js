
/* =========================================================================
   CONFIGURAÇÃO DO CALENDÁRIO COMPARTILHADO
   =========================================================================
   Crie um projeto no Supabase e preencha estes dois valores.
   A chave "anon" é própria para uso no navegador; a segurança fica nas
   políticas RLS do banco (arquivo supabase.sql).
   =========================================================================
   M@sterCobranca26
   */
const SUPABASE_URL = "https://uoyhnbjuihovbsdaitnj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rbpCapogsFPP3KlUDwFIcw_4ybwnwuJ";

const supabaseClient = (window.supabase && SUPABASE_URL.startsWith("http") && !SUPABASE_ANON_KEY.startsWith("COLE_"))
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

let excecoesCache = [];
let usuarioAdmin = null;
let ehAdmin = false;
let eventosModalCache = [];
// =========================================================================
// REGRAS OFICIAIS DA RÉGUA DE COBRANÇAS MASTER (LAYOUT COMPLETO)
// =========================================================================
const regrasRegua = [
    { dias: -10, titulo: "PDF E-mail", tipo: "ante", categoria: "fatura", desc: "10 dias antes do vencimento - Envio de PDF por E-mail." },
    { dias: 0, titulo: "Envio de Fatura", tipo: "vencimento", categoria: "fatura", desc: "No dia do vencimento - Envio da fatura por e-mail." },
    { dias: 2, titulo: "SMS de Aviso", tipo: "pos", categoria: "sms", desc: "02 dias após o vencimento - Disparo de SMS." },
    { dias: 4, titulo: "E-mail PDF", tipo: "pos", categoria: "fatura", desc: "04 dias após o vencimento - PDF por E-mail." },
    { dias: 10, titulo: "E-mail PDF", tipo: "pos", categoria: "fatura", desc: "10 dias após o vencimento - PDF por E-mail." },
    { dias: 14, titulo: "WhatsApp/E-mail", tipo: "pos", categoria: "fatura", desc: "14 dias após o vencimento - Fatura por WhatsApp e E-mail." },
    { dias: 15, titulo: "Bloqueio", tipo: "bloqueio", categoria: "bloqueio", desc: "Bloqueio de serviço (Fibra, Outros, Wireless e Parcial MVNO)." },
    { dias: 18, titulo: "Assessorias", tipo: "bloqueio", categoria: "bloqueio", desc: "Encaminhamento automático para as Assessorias Externas." },
    { dias: 30, titulo: "Serasa", tipo: "cancelamento", categoria: "cancelamento", desc: "Inclusão das mensalidades negativadas no Serasa." },
    { dias: 74.5, titulo: "Cancelamento", tipo: "cancelamento", categoria: "cancelamento", desc: "Cancelamento automático do serviço." },
    { dias: 75, titulo: "Desativação", tipo: "cancelamento", categoria: "cancelamento", desc: "Desativação definitiva (MVNO)." }
];

// =========================================================================
// REGRAS DA VISÃO ENXUTA
// =========================================================================
const regrasEnxutas = [
    { dias: 14, titulo: "WhatsApp/E-mail", tipo: "whatsapp", categoria: "fatura", desc: "14 dias após o vencimento - Fatura por WhatsApp e E-mail."},
    { dias: 15, titulo: "Bloqueio", tipo: "bloqueio", categoria: "bloqueio", desc: "15 dias após o vencimento - Bloqueio de serviço." }
];

const diasFaturamentoOficiais = [5, 8, 10, 12, 14, 15, 20, 25, 26];

let dataAtual = new Date();
let vencimentoFocoGlobal = null;
let filtroTipoGlobal = "";
let visualizacaoAtual = "calendario";
let modoVisaoEnxuta = false; // false = Layout Completo (Original) | true = Visão Enxuta

document.addEventListener("DOMContentLoaded", async () => {
    exibirDiaHoje();
    popularSeletoresMesAno();
    await carregarExcecoes();
    renderizarAcoesHoje();
    renderizarTudo();

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

function exibirDiaHoje() {
    const el = document.getElementById("infoHoje");
    if (!el) return;
    const hoje = new Date();
    el.textContent = `📅 Hoje é: ${hoje.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function popularSeletoresMesAno() {
    const selectMes = document.getElementById("selectMes");
    const selectAno = document.getElementById("selectAno");
    if (!selectMes || !selectAno) return;

    const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    selectMes.innerHTML = meses.map((m, i) => `<option value="${i}" ${i === dataAtual.getMonth() ? "selected" : ""}>${m}</option>`).join("");
    
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

function mudarFiltroVencimento() {
    vencimentoFocoGlobal = document.getElementById("selectFiltroVencimento").value ? parseInt(document.getElementById("selectFiltroVencimento").value) : null;
    renderizarTudo();
}

function mudarFiltroTipo() {
    filtroTipoGlobal = document.getElementById("selectFiltroTipo").value;
    renderizarTudo();
}

function mudarVisualizacao(view) {
    visualizacaoAtual = view;
    ["btnCalendario","btnLista","btnTimeline"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove("active");
    });
    
    const targetBtn = document.getElementById(view === "calendario" ? "btnCalendario" : view === "lista" ? "btnLista" : "btnTimeline");
    if (targetBtn) targetBtn.classList.add("active");

    document.getElementById("calendarView")?.classList.toggle("hidden", view !== "calendario");
    document.getElementById("listView")?.classList.toggle("hidden", view !== "lista");
    document.getElementById("timelineView")?.classList.toggle("hidden", view !== "timeline");

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
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function eventoCasaComExcecao(ev, exc) {
    return dataISO(ev.dataReal) === exc.original_date &&
           String(ev.tituloRegra) === String(exc.event_title) &&
           (exc.vencimento_original === null || exc.vencimento_original === undefined ||
            String(ev.vencimentoOriginal) === String(exc.vencimento_original));
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
    Object.keys(mapa).forEach(dia => {
        const novos = [];
        mapa[dia].forEach(ev => {
            const exc = excecoesCache.find(e => eventoCasaComExcecao(ev, e));
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
    excecoesCache.forEach(exc => {
        const novaData = new Date(`${exc.new_date}T12:00:00`);
        const originalData = new Date(`${exc.original_date}T12:00:00`);
        if (novaData.getFullYear() !== ano || novaData.getMonth() !== mes) return;
        if (originalData.getFullYear() === ano && originalData.getMonth() === mes) return;

        const regra = regrasRegua.find(r => r.titulo === exc.event_title) ||
                      regrasEnxutas.find(r => r.titulo === exc.event_title);

        const ev = {
            vencimentoOriginal: exc.vencimento_original ?? "Exceção",
            competenciaMes: originalData.getMonth() + 1,
            competenciaAno: originalData.getFullYear(),
            tituloRegra: exc.event_title,
            tipo: exc.tipo || regra?.tipo || "bloqueio",
            categoria: exc.categoria || regra?.categoria || "bloqueio",
            desc: (exc.descricao || regra?.desc || "Evento alterado por exceção.") +
                  ` ⚠️ Alterado excepcionalmente: ${exc.motivo}. Data original: ${originalData.toLocaleDateString("pt-BR")}.`,
            diasOffset: regra?.dias ?? 0,
            dataReal: novaData,
            excecao: true,
            motivoExcecao: exc.motivo,
            dataOriginalExcecao: exc.original_date,
            idExcecao: exc.id
        };

        if (!mapa[novaData.getDate()]) mapa[novaData.getDate()] = [];
        // Evita duplicar caso já exista.
        const duplicado = mapa[novaData.getDate()].some(x => x.idExcecao === exc.id);
        if (!duplicado) mapa[novaData.getDate()].push(ev);
    });

    return mapa;
}

function abrirLoginAdmin() {
    if (ehAdmin) {
        carregarExcecoes().then(() => {
            document.getElementById("modalAdmin").style.display = "flex";
            document.getElementById("adminUserLabel").textContent = `Logado como ${usuarioAdmin.email}`;
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
        document.getElementById("loginAdminStatus").textContent = "Configure o Supabase no script.js antes de usar o acesso administrativo.";
        return;
    }

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const status = document.getElementById("loginAdminStatus");
    status.textContent = "Entrando...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
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
    document.getElementById("adminUserLabel").textContent = `Logado como ${usuarioAdmin.email}`;
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

function preencherFormularioExcecao({ originalDate = "", eventTitle = "", vencimento = "", newDate = "", motivo = "", exceptionId = "" } = {}) {
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
    const motivo = ev.excecao ? (ev.motivoExcecao || "") : "";

    preencherFormularioExcecao({
        originalDate,
        eventTitle: ev.tituloRegra,
        vencimento: (ev.vencimentoOriginal === "N/A" || ev.vencimentoOriginal === "Geral" || ev.vencimentoOriginal === "Bloqueados") ? "" : ev.vencimentoOriginal,
        newDate: novaData,
        motivo,
        exceptionId: ev.idExcecao || ""
    });

    const titulo = document.getElementById("modalEditorTitulo");
    if (titulo) titulo.textContent = ev.excecao ? "✏️ Editar alteração excepcional" : "✏️ Criar alteração excepcional";
    const botao = document.getElementById("btnSalvarExcecaoModal");
    if (botao) botao.textContent = ev.excecao ? "Salvar alteração" : "Criar exceção";
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

async function salvarExcecaoDoModal() {
    if (!supabaseClient || !ehAdmin || !usuarioAdmin) return;

    const status = document.getElementById("modalExceptionStatus");
    const original = document.getElementById("modalExcOriginalDate").value;
    const titulo = document.getElementById("modalExcEventTitle").value.trim();
    const venc = document.getElementById("modalExcVencimento").value.trim() || null;
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

    const eventoRef = regrasRegua.find(r => r.titulo === titulo) || regrasEnxutas.find(r => r.titulo === titulo);
    const payload = {
        original_date: original,
        new_date: nova,
        event_title: titulo,
        vencimento_original: venc,
        tipo: eventoRef?.tipo || "bloqueio",
        categoria: eventoRef?.categoria || "bloqueio",
        descricao: eventoRef?.desc || null,
        motivo,
        ativo: true
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

    status.textContent = "Alteração salva. Atualizando calendário...";
    await carregarExcecoes();
    fecharEditorExcecaoNoModal();
    renderizarTudo();
    renderizarAdmin();

    // Reabre o mesmo dia para o administrador conferir a alteração imediatamente.
    const dataReabrir = new Date(`${nova}T12:00:00`);
    abrirModalEventos(dataReabrir.getFullYear(), dataReabrir.getMonth(), dataReabrir.getDate());
}

async function salvarExcecao() {
    const status = document.getElementById("exceptionStatus");
    if (!supabaseClient || !ehAdmin) {
        status.textContent = "Acesso administrativo não configurado.";
        return;
    }

    const original = document.getElementById("excOriginalDate").value;
    const titulo = document.getElementById("excEventTitle").value.trim();
    const venc = document.getElementById("excVencimento").value.trim() || null;
    const nova = document.getElementById("excNewDate").value;
    const motivo = document.getElementById("excMotivo").value.trim();

    if (!original || !titulo || !nova || !motivo) {
        status.textContent = "Preencha data original, evento, nova data e motivo.";
        return;
    }

    const eventoRef = regrasRegua.find(r => r.titulo === titulo) ||
                      regrasEnxutas.find(r => r.titulo === titulo);

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
        created_by: usuarioAdmin.id
    };

    status.textContent = "Salvando...";
    const { error } = await supabaseClient.from("excecoes_calendario").insert(payload);

    if (error) {
        console.error(error);
        status.textContent = "Erro ao salvar a exceção.";
        return;
    }

    status.textContent = "Exceção salva. Atualizando calendário...";
    await carregarExcecoes();
    renderizarTudo();
    renderizarAdmin();
    setTimeout(() => status.textContent = "", 2500);
}

async function excluirExcecao(id) {
    if (!supabaseClient || !ehAdmin) return;
    if (!confirm("Excluir esta exceção? O evento voltará à regra original.")) return;

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
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
}

function renderizarAdmin() {
    const lista = document.getElementById("exceptionList");
    const audit = document.getElementById("auditList");
    if (!lista || !audit) return;

    lista.innerHTML = excecoesCache.length ? excecoesCache.map(e => `
        <div class="admin-row">
            <div>
                <strong>${escapeHTML(e.event_title)}</strong>
                <span>${escapeHTML(e.original_date)} → <b>${escapeHTML(e.new_date)}</b></span>
                <small>${escapeHTML(e.motivo)}</small>
            </div>
            <button class="danger-btn" onclick="excluirExcecao('${e.id}')">Excluir</button>
        </div>
    `).join("") : `<p class="admin-empty">Nenhuma exceção cadastrada.</p>`;

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

    audit.innerHTML = data?.length ? data.map(h => `
        <div class="admin-row history-row">
            <div>
                <strong>${escapeHTML(h.acao)}</strong>
                <span>${new Date(h.created_at).toLocaleString("pt-BR")}</span>
                <small>${escapeHTML(h.detalhes || "")}</small>
            </div>
        </div>
    `).join("") : `<p class="admin-empty">Nenhuma alteração registrada.</p>`;
}

function coletarEventosDoMes(ano, mes) {
    const mapaEventos = {};

    const adicionarEvento = (dia, ev) => {
        if (!mapaEventos[dia]) mapaEventos[dia] = [];
        mapaEventos[dia].push(ev);
    };

    if (!modoVisaoEnxuta) {
        // =========================================================
        // MODO LAYOUT COMPLETO (SISTEMA ORIGINAL)
        // =========================================================
        const competencias = [
            { ano: mes === 0 ? ano - 1 : ano, mes: mes === 0 ? 11 : mes - 1 },
            { ano, mes },
            { ano: mes === 11 ? ano + 1 : ano, mes: mes === 11 ? 0 : mes + 1 }
        ];
        competencias.forEach(comp => {
            diasFaturamentoOficiais.forEach(diaVenc => {
                const dataVencimento = new Date(comp.ano, comp.mes, diaVenc);
                regrasRegua.forEach(regra => {
                    const dataEvento = new Date(dataVencimento);
                    dataEvento.setDate(dataVencimento.getDate() + Math.round(regra.dias));
                    if (dataEvento.getFullYear() === ano && dataEvento.getMonth() === mes) {
                        const dNum = dataEvento.getDate();
                        adicionarEvento(dNum, { 
                            vencimentoOriginal: diaVenc, 
                            competenciaMes: comp.mes + 1, 
                            competenciaAno: comp.ano, 
                            tituloRegra: regra.titulo, 
                            tipo: regra.tipo, 
                            categoria: regra.categoria, 
                            desc: regra.desc, 
                            diasOffset: regra.dias, 
                            dataReal: dataEvento 
                        });
                    }
                });
            });
        });
    } else {
        // =========================================================
        // MODO VISÃO ENXUTA (NOVAS REGRAS SOLICITADAS)
        // =========================================================
        
        // 1. WhatsApp (14d) e Bloqueio (15d) baseados nos vencimentos oficiais
        const competencias = [
            { ano: mes === 0 ? ano - 1 : ano, mes: mes === 0 ? 11 : mes - 1 },
            { ano, mes },
            { ano: mes === 11 ? ano + 1 : ano, mes: mes === 11 ? 0 : mes + 1 }
        ];
        competencias.forEach(comp => {
            diasFaturamentoOficiais.forEach(diaVenc => {
                const dataVencimento = new Date(comp.ano, comp.mes, diaVenc);
                regrasEnxutas.forEach(regra => {
                    const dataEvento = new Date(dataVencimento);
                    dataEvento.setDate(dataVencimento.getDate() + Math.round(regra.dias));
                    if (dataEvento.getFullYear() === ano && dataEvento.getMonth() === mes) {
                        const dNum = dataEvento.getDate();
                        adicionarEvento(dNum, { 
                            vencimentoOriginal: diaVenc, 
                            competenciaMes: comp.mes + 1, 
                            competenciaAno: comp.ano, 
                            tituloRegra: regra.titulo, 
                            tipo: regra.tipo, 
                            categoria: regra.categoria, 
                            desc: regra.desc, 
                            diasOffset: regra.dias, 
                            dataReal: dataEvento 
                        });
                    }
                });
            });
        });

        // 2. Datas Fixas de Faturamento
        const faturamentosFixos = [
            { dia: 16, titulo: "Faturamento Normal", desc: "Faturamento mensal normal da empresa." },
            { dia: 20, titulo: "Faturamento B2B", desc: "Faturamento mensal para clientes B2B." },
            { dia: 28, titulo: "Faturamento (Pós-16)", desc: "Faturamento para clientes ativados após o dia 16." }
        ];
        faturamentosFixos.forEach(fat => {
            const dataFat = new Date(ano, mes, fat.dia);
            adicionarEvento(fat.dia, {
                vencimentoOriginal: "Geral",
                competenciaMes: mes + 1,
                competenciaAno: ano,
                tituloRegra: fat.titulo,
                tipo: "vencimento",
                categoria: "fatura",
                desc: fat.desc,
                diasOffset: 0,
                dataReal: dataFat
            });
        });

        // 3. Data de Corte (Cancelamento) - Dia 12 de cada mês com CÁLCULO DINÂMICO
        const dataCorte = new Date(ano, mes, 12);
        
        // Bloqueio = Vencimento + 15 dias. Corte = Bloqueio + 74.5 dias (89.5 dias totais pós-vencimento)
        const msPorDia = 24 * 60 * 60 * 1000;
        const dataLimiteBloqueio = new Date(dataCorte.getTime() - (74.5 * msPorDia));
        const dataLimiteVencimento = new Date(dataCorte.getTime() - (89.5 * msPorDia));

        const anoRef = dataLimiteVencimento.getFullYear();
        const mesRef = dataLimiteVencimento.getMonth();
        const mesRefNome = dataLimiteVencimento.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const dataLimiteStr = dataLimiteVencimento.toLocaleDateString('pt-BR');

        // Filtrar quais vencimentos oficiais entram na regra de cancelamento neste mês
        const vencimentosEntrantes = diasFaturamentoOficiais.filter(diaVenc => {
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
            tipo: "cancelamento",
            categoria: "cancelamento",
            desc: `Cancelamento de clientes bloqueados há ≥ 74.5 dias (bloqueio até ${dataLimiteBloqueio.toLocaleDateString('pt-BR')}). ${detalheRegra}`,
            diasOffset: 74.5,
            dataReal: dataCorte
        });

        // 4. Relatórios Semanais (Segundas, Terças e Sextas)
        const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
        for (let d = 1; d <= totalDiasMes; d++) {
            const dataIterada = new Date(ano, mes, d);
            const diaSemana = dataIterada.getDay();

            if (diaSemana === 1) { // Segunda-feira
                adicionarEvento(d, {
                    vencimentoOriginal: "N/A",
                    competenciaMes: mes + 1,
                    competenciaAno: ano,
                    tituloRegra: "Relatório B2B",
                    tipo: "relatorio",
                    categoria: "relatorio",
                    desc: "Toda segunda-feira: Gerar relatório de inadimplência da base B2B de cobrança master.",
                    diasOffset: 0,
                    dataReal: dataIterada
                });
            } else if (diaSemana === 2 || diaSemana === 5) { // Terça ou Sexta-feira
                adicionarEvento(d, {
                    vencimentoOriginal: "N/A",
                    competenciaMes: mes + 1,
                    competenciaAno: ano,
                    tituloRegra: "Relatórios Assessorias / Diretoria",
                    tipo: "relatorio",
                    categoria: "relatorio",
                    desc: "Toda terça e sexta-feira: Gerar relatório para assessorias (com ranking) e relatório preventivo de inadimplência para diretoria.",
                    diasOffset: 0,
                    dataReal: dataIterada
                });
            }
        }
    }

    return aplicarExcecoesAoMapa(mapaEventos, ano, mes);
}

function eventoVisivel(ev) {
    return !filtroTipoGlobal || ev.categoria === filtroTipoGlobal;
}

function filtrarEventos(eventos) {
    return eventos.filter(eventoVisivel);
}

function obterEventosFiltradosMes(ano, mes) {
    const mapa = coletarEventosDoMes(ano, mes);
    Object.keys(mapa).forEach(dia => mapa[dia] = filtrarEventos(mapa[dia]));
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
    const eventosHoje = filtrarEventos(coletarEventosDoMes(hoje.getFullYear(), hoje.getMonth())[hoje.getDate()] || []);
    
    if (!eventosHoje.length) {
        containerHoje.innerHTML = `<p class="no-actions-today">Nenhuma ação operacional corresponde aos filtros para hoje.</p>`;
        return;
    }
    
    containerHoje.innerHTML = `<div class="today-actions-list">${eventosHoje.map(ev => `
        <div class="today-action-item">
            <span class="badge-type ${ev.tipo}">${ev.excecao ? "⚠️ " : ""}${ev.tituloRegra}</span>
            <div class="today-action-text">
                <strong>Vencimento base: ${ev.vencimentoOriginal === 'N/A' || ev.vencimentoOriginal === 'Geral' || ev.vencimentoOriginal === 'Bloqueados' ? ev.vencimentoOriginal : 'Dia ' + ev.vencimentoOriginal}</strong> (${labelTempo(ev)}) - ${ev.desc}
            </div>
        </div>`).join("")}</div>`;
}

function labelTempo(ev) {
    if (ev.categoria === "relatorio") return "Tarefa Recorrente";
    if (ev.diasOffset === 0) return "Data Fixa / Vencimento";
    return ev.diasOffset < 0 ? `${Math.abs(ev.diasOffset)} dias antes` : `${ev.diasOffset} dias após`;
}

function renderizarCalendario() {
    const grid = document.getElementById("calendarDays");
    if (!grid) return;

    const ano = dataAtual.getFullYear(), mes = dataAtual.getMonth();
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
        let focado = vencimentoFocoGlobal === null || dia === vencimentoFocoGlobal || eventosDoDia.some(ev => ev.vencimentoOriginal === vencimentoFocoGlobal);
        if (vencimentoFocoGlobal !== null) classesExtras += focado ? " focused" : " unfocused";

        let bolinhasHtml = `<div class="event-dots-container">`;
        eventosDoDia.slice(0, 6).forEach(ev => {
            const destaque = vencimentoFocoGlobal !== null && ev.vencimentoOriginal === vencimentoFocoGlobal ? " dot-highlight" : "";
            bolinhasHtml += `<span class="event-dot ${ev.tipo}${destaque}" title="${ev.vencimentoOriginal !== 'N/A' ? 'Venc. ' + ev.vencimentoOriginal + ': ' : ''}${ev.tituloRegra}${ev.excecao ? ' ⚠️ Alterado: ' + ev.motivoExcecao : ''}"></span>`;
        });
        if (eventosDoDia.length > 6) bolinhasHtml += `<span class="more-dots">+${eventosDoDia.length - 6}</span>`;
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
    const ano = dataAtual.getFullYear(), mes = dataAtual.getMonth();
    const mapa = obterEventosFiltradosMes(ano, mes);
    const eventos = [];
    Object.keys(mapa).forEach(dia => mapa[dia].forEach(ev => {
        if (vencimentoFocoGlobal === null || ev.vencimentoOriginal === vencimentoFocoGlobal || Number(dia) === vencimentoFocoGlobal) eventos.push(ev);
    }));
    return eventos.sort((a,b) => a.dataReal - b.dataReal || (typeof a.vencimentoOriginal === 'number' ? a.vencimentoOriginal - b.vencimentoOriginal : 0));
}

function renderizarVisualizacaoAlternativa() {
    const eventos = obterListaEventos();
    const lista = document.getElementById("listView");
    const timeline = document.getElementById("timelineView");
    if (!lista || !timeline) return;

    if (!eventos.length) {
        lista.innerHTML = timeline.innerHTML = `<div class="empty-view">Nenhum evento corresponde aos filtros selecionados.</div>`;
        return;
    }

    const itemHTML = ev => `
        <div class="list-event">
            <div class="list-date">
                <strong>${ev.dataReal.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</strong>
                <small>${labelTempo(ev)}</small>
            </div>
            <span class="badge-type ${ev.tipo}">${ev.excecao ? "⚠️ " : ""}${ev.tituloRegra}</span>
            <div class="event-info">
                <strong>Vencimento base: ${ev.vencimentoOriginal === 'N/A' || ev.vencimentoOriginal === 'Geral' || ev.vencimentoOriginal === 'Bloqueados' ? ev.vencimentoOriginal : 'Dia ' + ev.vencimentoOriginal}</strong>
                <p>${ev.desc}</p>
            </div>
        </div>`;

    lista.innerHTML = `<div class="view-heading"><h3>Lista operacional</h3><span>${eventos.length} eventos no período</span></div>${eventos.map(itemHTML).join("")}`;
    
    const grupos = {};
    eventos.forEach(ev => { const chave = ev.dataReal.toISOString().slice(0,10); if (!grupos[chave]) grupos[chave] = []; grupos[chave].push(ev); });
    timeline.innerHTML = `<div class="view-heading"><h3>Linha do tempo</h3><span>Sequência operacional do mês</span></div><div class="timeline">${Object.values(grupos).map(grupo => `<div class="timeline-group"><div class="timeline-date"><strong>${grupo[0].dataReal.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}</strong></div><div class="timeline-events">${grupo.map(itemHTML).join("")}</div></div>`).join("")}</div>`;
}

function atualizarKPIs() {
    const eventos = obterListaEventos();
    const qtd = categoria => eventos.filter(e => e.categoria === categoria).length;
    
    if (document.getElementById("kpiBloqueios")) document.getElementById("kpiBloqueios").textContent = qtd("bloqueio");
    if (document.getElementById("kpiSms")) document.getElementById("kpiSms").textContent = qtd("sms");
    if (document.getElementById("kpiFaturas")) document.getElementById("kpiFaturas").textContent = qtd("fatura");
    if (document.getElementById("kpiSerasa")) document.getElementById("kpiSerasa").textContent = qtd("cancelamento");
    if (document.getElementById("kpiTotal")) document.getElementById("kpiTotal").textContent = eventos.length;
}

function abrirModalEventos(ano, mes, dia) {
    const modal = document.getElementById("modalDetalhes"), corpo = document.getElementById("modalCorpo");
    if (!modal || !corpo) return;

    document.getElementById("modalTitulo").textContent = `Eventos Operacionais: ${new Date(ano, mes, dia).toLocaleDateString('pt-BR', { dateStyle: 'full' })}`;
    eventosModalCache = filtrarEventos(coletarEventosDoMes(ano, mes)[dia] || []).filter(ev => vencimentoFocoGlobal === null || ev.vencimentoOriginal === vencimentoFocoGlobal);

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

    const listaHtml = eventosModalCache.length ? `<ul class="modal-events-list">${eventosModalCache.map((ev, index) => `
        <li>
            <span class="badge-type ${ev.tipo}">${ev.excecao ? "⚠️ " : ""}${ev.tituloRegra}</span>
            <div class="event-info">
                <strong>Vencimento base: ${ev.vencimentoOriginal === 'N/A' || ev.vencimentoOriginal === 'Geral' || ev.vencimentoOriginal === 'Bloqueados' ? ev.vencimentoOriginal : 'Dia ' + ev.vencimentoOriginal}</strong> (${labelTempo(ev)})
                <p>${ev.desc}</p>
                ${ev.excecao ? `<p class="exception-note">⚠️ ${escapeHTML(ev.motivoExcecao || 'Alterado excepcionalmente')} — original: ${escapeHTML(ev.dataOriginalExcecao || '')}.</p>` : ''}
                ${ehAdmin ? `<button type="button" class="modal-edit-btn" onclick="abrirEditorExcecaoNoModal(${index})">✏️ ${ev.excecao ? 'Alterar esta exceção' : 'Alterar data excepcionalmente'}</button>` : ''}
            </div>
        </li>`).join('')}</ul>` : `<p class="no-events">Nenhum evento da régua corresponde aos filtros para este dia.</p>`;

    corpo.innerHTML = listaHtml + editorHtml;
    modal.style.display = "flex";
}

function exportarCSV() {
    const eventos = obterListaEventos();
    const mesNome = dataAtual.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    const linhas = [["Data","Evento","Categoria","Vencimento base","Offset","Descrição"]];
    eventos.forEach(ev => linhas.push([ev.dataReal.toLocaleDateString('pt-BR'), ev.tituloRegra, ev.categoria, ev.vencimentoOriginal, ev.diasOffset, ev.desc]));
    const csv = "\ufeff" + linhas.map(l => l.map(v => `"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = `regua-cobranca-${modoVisaoEnxuta ? 'enxuta-' : ''}${mesNome.replace(/ /g,'-')}.csv`; a.click(); URL.revokeObjectURL(url);
}

function exportarPDF() {
    const eventos = obterListaEventos();
    const mesNome = dataAtual.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    const printReport = document.getElementById("printReport");
    if (!printReport) return;

    printReport.innerHTML = `<h1>Master | Régua de Cobrança ${modoVisaoEnxuta ? '(Visão Enxuta)' : ''}</h1><h2>Relatório operacional — ${mesNome}</h2><p>Filtros: ${filtroTipoGlobal || 'Todos os eventos'}${vencimentoFocoGlobal ? ` | Vencimento: dia ${vencimentoFocoGlobal}` : ''}</p><div class="print-kpis"><b>Total: ${eventos.length}</b><b>Bloqueios: ${eventos.filter(e=>e.categoria==='bloqueio').length}</b><b>SMS: ${eventos.filter(e=>e.categoria==='sms').length}</b><b>Faturas/E-mails: ${eventos.filter(e=>e.categoria==='fatura').length}</b><b>Serasa/Cancel.: ${eventos.filter(e=>e.categoria==='cancelamento').length}</b></div><table><thead><tr><th>Data</th><th>Evento</th><th>Venc.</th><th>Descrição</th></tr></thead><tbody>${eventos.map(ev=>`<tr><td>${ev.dataReal.toLocaleDateString('pt-BR')}</td><td>${ev.tituloRegra}</td><td>${ev.vencimentoOriginal}</td><td>${ev.desc}</td></tr>`).join('')}</tbody></table>`;
    window.print();
}

function fecharModal() { const modal = document.getElementById("modalDetalhes"); if (modal) modal.style.display = "none"; }
function fecharModalFora(event) { if (event.target === document.getElementById("modalDetalhes")) fecharModal(); }