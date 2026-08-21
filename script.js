// =========================================================================
// REGRAS OFICIAIS DA RÉGUA DE COBRANÇAS MASTER
// =========================================================================
const regrasRegua = [
    { dias: -10, titulo: "PDF E-mail", tipo: "ante", desc: "10 dias antes do vencimento - Envio de PDF por E-mail." },
    { dias: 0,   titulo: "Faturamento", tipo: "vencimento", desc: "No dia do vencimento - Emissão de boletos, registros bancários e envio de faturas." },
    { dias: 2,   titulo: "SMS de Aviso", tipo: "pos", desc: "02 dias após o vencimento - Disparo de SMS." },
    { dias: 4,   titulo: "E-mail PDF", tipo: "pos", desc: "04 dias após o vencimento - PDF por E-mail." },
    { dias: 10,  titulo: "E-mail PDF", tipo: "pos", desc: "10 dias após o vencimento - PDF por E-mail." },
    { dias: 14,  titulo: "WhatsApp/E-mail", tipo: "pos", desc: "14 dias após o vencimento - Fatura por WhatsApp e E-mail." },
    { dias: 15,  titulo: "Bloqueio", tipo: "bloqueio", desc: "Bloqueio de serviço (Fibra, Outros, Wireless e Parcial MVNO)." },
    { dias: 18,  titulo: "Assessorias", tipo: "bloqueio", desc: "Encaminhamento automático para as Assessorias Externas." },
    { dias: 30,  titulo: "Serasa", tipo: "cancelamento", desc: "Inclusão das mensalidades negativadas no Serasa." },
    { dias: 74.5, titulo: "Cancelamento", tipo: "cancelamento", desc: "Cancelamento automático do serviço." },
    { dias: 75,  titulo: "Desativação", tipo: "cancelamento", desc: "Desativação definitiva (MVNO)." }
];

const diasFaturamentoOficiais = [5, 8, 10, 12, 14, 15, 20, 25, 26];

let dataAtual = new Date();
let vencimentoFocoGlobal = null; // Armazena o dia de vencimento selecionado para foco

document.addEventListener("DOMContentLoaded", () => {
    exibirDiaHoje();
    popularSeletoresMesAno();
    renderizarAcoesHoje();
    renderizarCalendario();
});

function exibirDiaHoje() {
    const el = document.getElementById("infoHoje");
    const hoje = new Date();
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    el.textContent = `📅 Hoje é: ${hoje.toLocaleDateString('pt-BR', opcoes)}`;
}

function popularSeletoresMesAno() {
    const selectMes = document.getElementById("selectMes");
    const selectAno = document.getElementById("selectAno");

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    selectMes.innerHTML = "";
    meses.forEach((m, index) => {
        let opt = document.createElement("option");
        opt.value = index;
        opt.textContent = m;
        if (index === dataAtual.getMonth()) opt.selected = true;
        selectMes.appendChild(opt);
    });

    const anoAtual = dataAtual.getFullYear();
    selectAno.innerHTML = "";
    for (let y = anoAtual - 2; y <= anoAtual + 3; y++) {
        let opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        if (y === anoAtual) opt.selected = true;
        selectAno.appendChild(opt);
    }
}

function mudarMesAno() {
    const selectMes = document.getElementById("selectMes");
    const selectAno = document.getElementById("selectAno");
    
    dataAtual.setFullYear(parseInt(selectAno.value));
    dataAtual.setMonth(parseInt(selectMes.value));
    
    renderizarCalendario();
}

function mudarFiltroVencimento() {
    const select = document.getElementById("selectFiltroVencimento");
    vencimentoFocoGlobal = select.value ? parseInt(select.value) : null;
    renderizarCalendario();
}

function coletarEventosDoMes(ano, mes) {
    let mapaEventos = {};

    let competencias = [
        { ano: mes === 0 ? ano - 1 : ano, mes: mes === 0 ? 11 : mes - 1 },
        { ano: ano, mes: mes },
        { ano: mes === 11 ? ano + 1 : ano, mes: mes === 11 ? 0 : mes + 1 }
    ];

    competencias.forEach(comp => {
        diasFaturamentoOficiais.forEach(diaVenc => {
            let dataVencimento = new Date(comp.ano, comp.mes, diaVenc);

            regrasRegua.forEach(regra => {
                let dataEvento = new Date(dataVencimento);
                let diasArredondados = Math.round(regra.dias);
                dataEvento.setDate(dataVencimento.getDate() + diasArredondados);

                if (dataEvento.getFullYear() === ano && dataEvento.getMonth() === mes) {
                    let dNum = dataEvento.getDate();
                    if (!mapaEventos[dNum]) {
                        mapaEventos[dNum] = [];
                    }
                    mapaEventos[dNum].push({
                        vencimentoOriginal: diaVenc,
                        competenciaMes: comp.mes + 1,
                        competenciaAno: comp.ano,
                        tituloRegra: regra.titulo,
                        tipo: regra.tipo,
                        desc: regra.desc,
                        diasOffset: regra.dias,
                        dataReal: dataEvento
                    });
                }
            });
        });
    });

    return mapaEventos;
}

// Renderiza o painel superior de ações para o dia atual do sistema
function renderizarAcoesHoje() {
    const containerHoje = document.getElementById("todayActionsContent");
    const hoje = new Date();
    const anoH = hoje.getFullYear();
    const mesH = hoje.getMonth();
    const diaH = hoje.getDate();

    let eventosMes = coletarEventosDoMes(anoH, mesH);
    let eventosHoje = eventosMes[diaH] || [];

    if (eventosHoje.length === 0) {
        containerHoje.innerHTML = `<p class="no-actions-today">Nenhuma ação operacional da régua programada para hoje.</p>`;
        return;
    }

    let html = `<div class="today-actions-list">`;
    eventosHoje.forEach(ev => {
        let labelTempo = ev.diasOffset === 0 ? "No dia do vencimento" : (ev.diasOffset < 0 ? `${Math.abs(ev.diasOffset)} dias antes` : `${ev.diasOffset} dias após`);
        html += `
            <div class="today-action-item">
                <span class="badge-type ${ev.tipo}">${ev.tituloRegra}</span>
                <div class="today-action-text">
                    <strong>Vencimento base: Dia ${ev.vencimentoOriginal}</strong> (${labelTempo}) - ${ev.desc}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    containerHoje.innerHTML = html;
}

function renderizarCalendario() {
    const grid = document.getElementById("calendarDays");
    grid.innerHTML = "";

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();

    const primeiroDiaIndex = new Date(ano, mes, 1).getDay();
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();

    let eventosDoMes = coletarEventosDoMes(ano, mes);
    let hojeStr = new Date().toDateString();

    let htmlGrid = "";

    // Dias do mês anterior
    for (let i = primeiroDiaIndex; i > 0; i--) {
        const diaNum = totalDiasMesAnterior - i + 1;
        htmlGrid += `<div class="calendar-day other-month"><span class="day-number">${diaNum}</span></div>`;
    }

    // Dias do mês atual
    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const dataIterada = new Date(ano, mes, dia);
        let eventosDoDia = eventosDoMes[dia] || [];
        
        let classesExtras = "";
        if (dataIterada.toDateString() === hojeStr) {
            classesExtras += " hoje";
        }

        // Lógica de Foco e Desfoque baseada no seletor de vencimento
        let focado = true;
        if (vencimentoFocoGlobal !== null) {
            // Verifica se este dia possui algum evento vinculado especificamente ao vencimento em foco
            let pertenceAoFoco = eventosDoDia.some(ev => ev.vencimentoOriginal === vencimentoFocoGlobal);
            // Também foca se o próprio dia for o dia do vencimento selecionado
            if (dia === vencimentoFocoGlobal || pertenceAoFoco) {
                focado = true;
            } else {
                focado = false;
            }
        }

        if (vencimentoFocoGlobal !== null && !focado) {
            classesExtras += " unfocused";
        } else if (vencimentoFocoGlobal !== null && focado) {
            classesExtras += " focused";
        }

        let bolinhasHtml = `<div class="event-dots-container">`;
        let maxBolinhas = 4;
        eventosDoDia.slice(0, maxBolinhas).forEach(ev => {
            let destaqueExtra = (vencimentoFocoGlobal !== null && ev.vencimentoOriginal === vencimentoFocoGlobal) ? " dot-highlight" : "";
            bolinhasHtml += `<span class="event-dot ${ev.tipo}${destaqueExtra}" title="Venc. ${ev.vencimentoOriginal}: ${ev.tituloRegra}"></span>`;
        });

        if (eventosDoDia.length > maxBolinhas) {
            bolinhasHtml += `<span class="more-dots">+${eventosDoDia.length - maxBolinhas}</span>`;
        }
        bolinhasHtml += `</div>`;

        let tagFaturamento = "";
        if (diasFaturamentoOficiais.includes(dia)) {
            let classeF = dia === 15 ? " principal" : "";
            tagFaturamento = `<span class="venc-indicator${classeF}" title="Dia de Faturamento Oficial">V${dia}</span>`;
        }

        htmlGrid += `
            <div class="calendar-day ${classesExtras}" onclick="abrirModalEventos(${ano}, ${mes}, ${dia})">
                <div class="day-header-line">
                    <span class="day-number">${dia}</span>
                    ${tagFaturamento}
                </div>
                ${bolinhasHtml}
            </div>
        `;
    }

    grid.innerHTML = htmlGrid;
}

function abrirModalEventos(ano, mes, dia) {
    const modal = document.getElementById("modalDetalhes");
    const titulo = document.getElementById("modalTitulo");
    const corpo = document.getElementById("modalCorpo");

    const dataFormatada = new Date(ano, mes, dia).toLocaleDateString('pt-BR', { dateStyle: 'full' });
    titulo.textContent = `Eventos Operacionais: ${dataFormatada}`;

    let eventosDoMes = coletarEventosDoMes(ano, mes);
    let eventosDoDia = eventosDoMes[dia] || [];

    if (eventosDoDia.length === 0) {
        corpo.innerHTML = `<p class="no-events">Nenhum evento da régua de cobrança programado para este dia.</p>`;
    } else {
        let htmlList = `<ul class="modal-events-list">`;
        eventosDoDia.forEach(ev => {
            let labelTempo = ev.diasOffset === 0 ? "No dia do vencimento" : (ev.diasOffset < 0 ? `${Math.abs(ev.diasOffset)} dias antes` : `${ev.diasOffset} dias após`);
            let destaqueItem = (vencimentoFocoGlobal !== null && ev.vencimentoOriginal === vencimentoFocoGlobal) ? " style='border-left: 3px solid #38bdf8; padding-left: 8px;'" : "";
            htmlList += `
                <li${destaqueItem}>
                    <span class="badge-type ${ev.tipo}">${ev.tituloRegra}</span>
                    <div class="event-info">
                        <strong>Vencimento base: Dia ${ev.vencimentoOriginal}</strong> (${labelTempo})
                        <p>${ev.desc}</p>
                    </div>
                </li>
            `;
        });
        htmlList += `</ul>`;
        corpo.innerHTML = htmlList;
    }

    modal.style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalDetalhes").style.display = "none";
}

function fecharModalFora(event) {
    const modal = document.getElementById("modalDetalhes");
    if (event.target === modal) {
        fecharModal();
    }
}