// =========================================================================
// REGRAS OFICIAIS DA RÉGUA DE COBRANÇAS MASTER
// =========================================================================
const regrasRegua = [
    { dias: -10, titulo: "PDF E-mail", tipo: "ante", categoria: "fatura", desc: "10 dias antes do vencimento - Envio de PDF por E-mail." },
    { dias: 0, titulo: "Faturamento", tipo: "vencimento", categoria: "vencimento", desc: "No dia do vencimento - Emissão de boletos, registros bancários e envio de faturas." },
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

const diasFaturamentoOficiais = [5, 8, 10, 12, 14, 15, 20, 25, 26];
let dataAtual = new Date();
let vencimentoFocoGlobal = null;
let filtroTipoGlobal = "";
let visualizacaoAtual = "calendario";

document.addEventListener("DOMContentLoaded", () => {
    exibirDiaHoje();
    popularSeletoresMesAno();
    renderizarAcoesHoje();
    renderizarTudo();
});

function exibirDiaHoje() {
    const el = document.getElementById("infoHoje");
    const hoje = new Date();
    el.textContent = `📅 Hoje é: ${hoje.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function popularSeletoresMesAno() {
    const selectMes = document.getElementById("selectMes");
    const selectAno = document.getElementById("selectAno");
    const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    selectMes.innerHTML = meses.map((m, i) => `<option value="${i}" ${i === dataAtual.getMonth() ? "selected" : ""}>${m}</option>`).join("");
    const anoAtual = dataAtual.getFullYear();
    selectAno.innerHTML = "";
    for (let y = anoAtual - 2; y <= anoAtual + 3; y++) selectAno.innerHTML += `<option value="${y}" ${y === anoAtual ? "selected" : ""}>${y}</option>`;
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
    ["btnCalendario","btnLista","btnTimeline"].forEach(id => document.getElementById(id).classList.remove("active"));
    document.getElementById(view === "calendario" ? "btnCalendario" : view === "lista" ? "btnLista" : "btnTimeline").classList.add("active");
    document.getElementById("calendarView").classList.toggle("hidden", view !== "calendario");
    document.getElementById("listView").classList.toggle("hidden", view !== "lista");
    document.getElementById("timelineView").classList.toggle("hidden", view !== "timeline");
    if (view !== "calendario") renderizarVisualizacaoAlternativa();
}

function coletarEventosDoMes(ano, mes) {
    const mapaEventos = {};
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
                    if (!mapaEventos[dNum]) mapaEventos[dNum] = [];
                    mapaEventos[dNum].push({ vencimentoOriginal: diaVenc, competenciaMes: comp.mes + 1, competenciaAno: comp.ano, tituloRegra: regra.titulo, tipo: regra.tipo, categoria: regra.categoria, desc: regra.desc, diasOffset: regra.dias, dataReal: dataEvento });
                }
            });
        });
    });
    return mapaEventos;
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
    const hoje = new Date();
    const eventosHoje = filtrarEventos(coletarEventosDoMes(hoje.getFullYear(), hoje.getMonth())[hoje.getDate()] || []);
    if (!eventosHoje.length) {
        containerHoje.innerHTML = `<p class="no-actions-today">Nenhuma ação operacional da régua corresponde aos filtros para hoje.</p>`;
        return;
    }
    containerHoje.innerHTML = `<div class="today-actions-list">${eventosHoje.map(ev => `<div class="today-action-item"><span class="badge-type ${ev.tipo}">${ev.tituloRegra}</span><div class="today-action-text"><strong>Vencimento base: Dia ${ev.vencimentoOriginal}</strong> (${labelTempo(ev)}) - ${ev.desc}</div></div>`).join("")}</div>`;
}

function labelTempo(ev) {
    return ev.diasOffset === 0 ? "No dia do vencimento" : (ev.diasOffset < 0 ? `${Math.abs(ev.diasOffset)} dias antes` : `${ev.diasOffset} dias após`);
}

function renderizarCalendario() {
    const grid = document.getElementById("calendarDays");
    const ano = dataAtual.getFullYear(), mes = dataAtual.getMonth();
    const primeiroDiaIndex = new Date(ano, mes, 1).getDay();
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();
    const eventosDoMes = obterEventosFiltradosMes(ano, mes);
    const hojeStr = new Date().toDateString();
    let htmlGrid = "";

    for (let i = primeiroDiaIndex; i > 0; i--) htmlGrid += `<div class="calendar-day other-month"><span class="day-number">${totalDiasMesAnterior - i + 1}</span></div>`;
    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const dataIterada = new Date(ano, mes, dia);
        const eventosDoDia = eventosDoMes[dia] || [];
        let classesExtras = dataIterada.toDateString() === hojeStr ? " hoje" : "";
        let focado = vencimentoFocoGlobal === null || dia === vencimentoFocoGlobal || eventosDoDia.some(ev => ev.vencimentoOriginal === vencimentoFocoGlobal);
        if (vencimentoFocoGlobal !== null) classesExtras += focado ? " focused" : " unfocused";
        let bolinhasHtml = `<div class="event-dots-container">`;
        eventosDoDia.slice(0, 6).forEach(ev => {
            const destaque = vencimentoFocoGlobal !== null && ev.vencimentoOriginal === vencimentoFocoGlobal ? " dot-highlight" : "";
            bolinhasHtml += `<span class="event-dot ${ev.tipo}${destaque}" title="Venc. ${ev.vencimentoOriginal}: ${ev.tituloRegra}"></span>`;
        });
        if (eventosDoDia.length > 6) bolinhasHtml += `<span class="more-dots">+${eventosDoDia.length - 6}</span>`;
        bolinhasHtml += `</div>`;
        const tagFaturamento = diasFaturamentoOficiais.includes(dia) ? `<span class="venc-indicator${dia === 15 ? " principal" : ""}">V${dia}</span>` : "";
        htmlGrid += `<div class="calendar-day ${classesExtras}" onclick="abrirModalEventos(${ano}, ${mes}, ${dia})"><div class="day-header-line"><span class="day-number">${dia}</span>${tagFaturamento}</div>${bolinhasHtml}<span class="event-count">${eventosDoDia.length ? eventosDoDia.length + (eventosDoDia.length === 1 ? " evento" : " eventos") : ""}</span></div>`;
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
    return eventos.sort((a,b) => a.dataReal - b.dataReal || a.vencimentoOriginal - b.vencimentoOriginal);
}

function renderizarVisualizacaoAlternativa() {
    const eventos = obterListaEventos();
    const lista = document.getElementById("listView");
    const timeline = document.getElementById("timelineView");
    if (!eventos.length) {
        lista.innerHTML = timeline.innerHTML = `<div class="empty-view">Nenhum evento corresponde aos filtros selecionados.</div>`;
        return;
    }
    const itemHTML = ev => `<div class="list-event"><div class="list-date"><strong>${ev.dataReal.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</strong><small>${labelTempo(ev)}</small></div><span class="badge-type ${ev.tipo}">${ev.tituloRegra}</span><div class="event-info"><strong>Vencimento base: Dia ${ev.vencimentoOriginal}</strong><p>${ev.desc}</p></div></div>`;
    lista.innerHTML = `<div class="view-heading"><h3>Lista operacional</h3><span>${eventos.length} eventos no período</span></div>${eventos.map(itemHTML).join("")}`;
    const grupos = {};
    eventos.forEach(ev => { const chave = ev.dataReal.toISOString().slice(0,10); if (!grupos[chave]) grupos[chave] = []; grupos[chave].push(ev); });
    timeline.innerHTML = `<div class="view-heading"><h3>Linha do tempo</h3><span>Sequência operacional do mês</span></div><div class="timeline">${Object.values(grupos).map(grupo => `<div class="timeline-group"><div class="timeline-date"><strong>${grupo[0].dataReal.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}</strong></div><div class="timeline-events">${grupo.map(itemHTML).join("")}</div></div>`).join("")}</div>`;
}

function atualizarKPIs() {
    const eventos = obterListaEventos();
    const qtd = categoria => eventos.filter(e => e.categoria === categoria).length;
    document.getElementById("kpiBloqueios").textContent = qtd("bloqueio");
    document.getElementById("kpiSms").textContent = qtd("sms");
    document.getElementById("kpiFaturas").textContent = qtd("fatura");
    document.getElementById("kpiSerasa").textContent = qtd("cancelamento");
    document.getElementById("kpiTotal").textContent = eventos.length;
}

function abrirModalEventos(ano, mes, dia) {
    const modal = document.getElementById("modalDetalhes"), corpo = document.getElementById("modalCorpo");
    document.getElementById("modalTitulo").textContent = `Eventos Operacionais: ${new Date(ano, mes, dia).toLocaleDateString('pt-BR', { dateStyle: 'full' })}`;
    const eventosDoDia = filtrarEventos(coletarEventosDoMes(ano, mes)[dia] || []).filter(ev => vencimentoFocoGlobal === null || ev.vencimentoOriginal === vencimentoFocoGlobal);
    corpo.innerHTML = eventosDoDia.length ? `<ul class="modal-events-list">${eventosDoDia.map(ev => `<li><span class="badge-type ${ev.tipo}">${ev.tituloRegra}</span><div class="event-info"><strong>Vencimento base: Dia ${ev.vencimentoOriginal}</strong> (${labelTempo(ev)})<p>${ev.desc}</p></div></li>`).join("")}</ul>` : `<p class="no-events">Nenhum evento da régua corresponde aos filtros para este dia.</p>`;
    modal.style.display = "flex";
}

function exportarCSV() {
    const eventos = obterListaEventos();
    const mesNome = dataAtual.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    const linhas = [["Data","Evento","Categoria","Vencimento base","Offset","Descrição"]];
    eventos.forEach(ev => linhas.push([ev.dataReal.toLocaleDateString('pt-BR'), ev.tituloRegra, ev.categoria, `Dia ${ev.vencimentoOriginal}`, ev.diasOffset, ev.desc]));
    const csv = "\ufeff" + linhas.map(l => l.map(v => `"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = `regua-cobranca-${mesNome.replace(/ /g,'-')}.csv`; a.click(); URL.revokeObjectURL(url);
}

function exportarPDF() {
    const eventos = obterListaEventos();
    const mesNome = dataAtual.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    const printReport = document.getElementById("printReport");
    printReport.innerHTML = `<h1>Master | Régua de Cobrança</h1><h2>Relatório operacional — ${mesNome}</h2><p>Filtros: ${filtroTipoGlobal || 'Todos os eventos'}${vencimentoFocoGlobal ? ` | Vencimento: dia ${vencimentoFocoGlobal}` : ''}</p><div class="print-kpis"><b>Total: ${eventos.length}</b><b>Bloqueios: ${eventos.filter(e=>e.categoria==='bloqueio').length}</b><b>SMS: ${eventos.filter(e=>e.categoria==='sms').length}</b><b>Faturas/E-mails: ${eventos.filter(e=>e.categoria==='fatura').length}</b><b>Serasa/Cancel.: ${eventos.filter(e=>e.categoria==='cancelamento').length}</b></div><table><thead><tr><th>Data</th><th>Evento</th><th>Venc.</th><th>Descrição</th></tr></thead><tbody>${eventos.map(ev=>`<tr><td>${ev.dataReal.toLocaleDateString('pt-BR')}</td><td>${ev.tituloRegra}</td><td>Dia ${ev.vencimentoOriginal}</td><td>${ev.desc}</td></tr>`).join('')}</tbody></table>`;
    window.print();
}

function fecharModal() { document.getElementById("modalDetalhes").style.display = "none"; }
function fecharModalFora(event) { if (event.target === document.getElementById("modalDetalhes")) fecharModal(); }
