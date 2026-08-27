# Master | Régua de Cobrança

Calendário operacional dinâmico para visualização, acompanhamento e gestão da régua de cobrança.

O projeto foi desenvolvido para ser hospedado como aplicação estática, por exemplo no **GitHub Pages**, mantendo as regras de negócio no JavaScript e utilizando um backend externo (Supabase) para as funcionalidades compartilhadas de administração, exceções e histórico.

> **Importante:** este README documenta a arquitetura e o funcionamento da versão atual do projeto, incluindo as regras discutidas durante a evolução do calendário. Algumas funcionalidades de backend dependem da configuração do projeto Supabase descrita neste documento.

---

## 1. Objetivo do projeto

O sistema transforma a régua de cobrança em um calendário operacional.

A partir das **datas oficiais de vencimento**, o sistema calcula automaticamente as ações que devem ocorrer antes ou depois do vencimento.

O sistema possui dois modos:

- **Layout Completo:** apresenta toda a régua operacional.
- **Visão Enxuta:** apresenta somente as ações operacionais simplificadas definidas para esse modo.

Além disso, existem:

- Dashboard/KPIs;
- ações necessárias para hoje;
- filtros;
- seleção de mês e ano;
- filtro por vencimento;
- filtro por tipo de evento;
- calendário;
- modo lista;
- timeline;
- exportação CSV;
- exportação PDF;
- modal de detalhes;
- exceções administrativas;
- histórico de alterações;
- autenticação de administradores;
- guia de utilização.

---

# 2. Arquitetura

A arquitetura é dividida em duas partes principais.

```text
                    ┌──────────────────────────┐
                    │       GitHub Pages       │
                    │                          │
                    │ index.html               │
                    │ style.css                │
                    │ script.js                │
                    │ GUIA_CALENDARIO.pdf      │
                    └────────────┬─────────────┘
                                 │
                                 │ HTTPS / API
                                 ▼
                    ┌──────────────────────────┐
                    │         Supabase          │
                    │                          │
                    │ Authentication           │
                    │ Banco de dados            │
                    │ RLS / Policies            │
                    │ Histórico                 │
                    │ Exceções                  │
                    └──────────────────────────┘
```

### GitHub Pages

Responsável por disponibilizar a aplicação.

O GitHub Pages hospeda os arquivos estáticos:

```text
index.html
style.css
script.js
```

O navegador executa o JavaScript localmente.

### Supabase

Responsável pelas informações que precisam ser compartilhadas entre usuários:

- autenticação;
- administradores;
- exceções de calendário;
- histórico;
- permissões de alteração.

A regra geral da régua **não é alterada quando uma exceção é criada**.

---

# 3. Estrutura de arquivos

A estrutura recomendada é:

```text
/
├── index.html
├── script.js
├── style.css
├── supabase.sql
├── CONFIGURACAO.md
├── GUIA_CALENDARIO.pdf
└── README.md
```

## `index.html`

Responsável pela estrutura visual da aplicação.

Entre os principais elementos estão:

- cabeçalho;
- informação da data atual;
- painel de ações do dia;
- KPIs;
- filtros;
- seleção de mês/ano;
- alternância entre Layout Completo e Visão Enxuta;
- abas de Calendário, Lista e Timeline;
- exportação;
- legenda;
- calendário;
- modal de detalhes.

O arquivo atual carrega o CSS com:

```html
<link rel="stylesheet" href="style.css">
```

e o JavaScript com:

```html
<script src="script.js"></script>
```

---

# 4. `style.css`

Responsável pela apresentação visual.

O CSS possui seções para:

1. painel de KPIs;
2. controles;
3. barra de ferramentas;
4. calendário;
5. mapeamento de cores;
6. lista/timeline/modal;
7. responsividade;
8. impressão.

Exemplo da estrutura:

```css
.kpi-panel {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
}
```

Em telas menores, o layout passa para menos colunas:

```css
@media (max-width: 800px) {
    .kpi-panel {
        grid-template-columns: repeat(2, 1fr);
    }
}
```

Em dispositivos ainda menores, os controles e eventos passam para uma organização vertical.

---

# 5. `script.js`

É o principal arquivo da aplicação.

Ele contém:

- regras da régua;
- regras da Visão Enxuta;
- datas oficiais de faturamento;
- estado atual do calendário;
- filtros;
- cálculo dos eventos;
- renderização;
- KPIs;
- calendário;
- lista;
- timeline;
- modal;
- exportações;
- integração com as exceções.

---

# 6. Regras oficiais da régua

As regras do Layout Completo estão centralizadas no array:

```javascript
const regrasRegua = [
    {
        dias: -10,
        titulo: "PDF E-mail",
        tipo: "ante",
        categoria: "fatura",
        desc: "10 dias antes do vencimento - Envio de PDF por E-mail."
    },

    {
        dias: 0,
        titulo: "Envio de Fatura",
        tipo: "vencimento",
        categoria: "fatura",
        desc: "No dia do vencimento - Envio da fatura por e-mail."
    },

    {
        dias: 2,
        titulo: "SMS de Aviso",
        tipo: "pos",
        categoria: "sms",
        desc: "02 dias após o vencimento - Disparo de SMS."
    },

    {
        dias: 4,
        titulo: "E-mail PDF",
        tipo: "pos",
        categoria: "fatura",
        desc: "04 dias após o vencimento - PDF por E-mail."
    },

    {
        dias: 10,
        titulo: "E-mail PDF",
        tipo: "pos",
        categoria: "fatura",
        desc: "10 dias após o vencimento - PDF por E-mail."
    },

    {
        dias: 14,
        titulo: "WhatsApp/E-mail",
        tipo: "pos",
        categoria: "fatura",
        desc: "14 dias após o vencimento - Fatura por WhatsApp e E-mail."
    },

    {
        dias: 15,
        titulo: "Bloqueio",
        tipo: "bloqueio",
        categoria: "bloqueio",
        desc: "Bloqueio de serviço."
    },

    {
        dias: 18,
        titulo: "Assessorias",
        tipo: "bloqueio",
        categoria: "bloqueio",
        desc: "Encaminhamento automático para as Assessorias Externas."
    },

    {
        dias: 30,
        titulo: "Serasa",
        tipo: "cancelamento",
        categoria: "cancelamento",
        desc: "Inclusão das mensalidades negativadas no Serasa."
    },

    {
        dias: 74.5,
        titulo: "Cancelamento",
        tipo: "cancelamento",
        categoria: "cancelamento",
        desc: "Cancelamento automático do serviço."
    },

    {
        dias: 75,
        titulo: "Desativação",
        tipo: "cancelamento",
        categoria: "cancelamento",
        desc: "Desativação definitiva (MVNO)."
    }
];
```

## Regras resumidas

| Offset | Ação          |
| -----: | --------------- |
|   D-10 | PDF E-mail      |
|     D0 | Envio de Fatura |
|    D+2 | SMS de Aviso    |
|    D+4 | E-mail PDF      |
|   D+10 | E-mail PDF      |
|   D+14 | WhatsApp/E-mail |
|   D+15 | Bloqueio        |
|   D+18 | Assessorias     |
|   D+30 | Serasa          |
| D+74,5 | Cancelamento    |
|   D+75 | Desativação   |

---

# 7. Visão Enxuta

A Visão Enxuta possui regras próprias e não deve ser confundida com o Layout Completo.

```javascript
const regrasEnxutas = [
    {
        dias: 14,
        titulo: "WhatsApp/E-mail",
        tipo: "whatsapp",
        categoria: "fatura",
        desc: "14 dias após o vencimento - Fatura por WhatsApp e E-mail."
    },

    {
        dias: 15,
        titulo: "Bloqueio",
        tipo: "bloqueio",
        categoria: "bloqueio",
        desc: "15 dias após o vencimento - Bloqueio de serviço."
    }
];
```

Portanto:

```text
Visão Enxuta

Vencimento
    │
    ├── D+14 → WhatsApp/E-mail
    │
    └── D+15 → Bloqueio
```

**Não alterar as regras do Layout Completo ao modificar a Visão Enxuta.**

---

# 8. Datas oficiais de vencimento

As datas oficiais estão definidas em:

```javascript
const diasFaturamentoOficiais = [
    5, 8, 10, 12, 14, 15, 20, 25, 26
];
```

Esses valores representam os dias de vencimento utilizados pelo cálculo do calendário.

Se um novo dia oficial de vencimento for adicionado, deve-se alterar esse array.

Exemplo:

```javascript
const diasFaturamentoOficiais = [
    5, 8, 10, 12, 14, 15, 20, 25, 26, 28
];
```

Ao fazer isso, todas as regras dependentes do vencimento passarão a ser calculadas para o novo dia.

---

# 9. Como o calendário é calculado

O cálculo principal ocorre em:

```javascript
function coletarEventosDoMes(ano, mes)
```

Essa função cria um mapa:

```text
dia → eventos daquele dia
```

Exemplo conceitual:

```javascript
{
    14: [evento1, evento2],
    15: [evento3],
    18: [evento4]
}
```

---

# 10. Cálculo baseado no vencimento

Para cada mês são consideradas competências do:

- mês anterior;
- mês atual;
- mês seguinte.

Isso evita perder eventos que começam em um mês e terminam em outro.

A lógica é aproximadamente:

```javascript
const dataVencimento = new Date(
    competencia.ano,
    competencia.mes,
    diaVenc
);

const dataEvento = new Date(dataVencimento);

dataEvento.setDate(
    dataVencimento.getDate() + Math.round(regra.dias)
);
```

Depois o sistema verifica se o resultado pertence ao mês que está sendo exibido.

---

# 11. Cancelamento e desativação

No Layout Completo:

```text
Vencimento
   │
   ├── +30 dias → Serasa
   │
   ├── +74,5 dias → Cancelamento
   │
   └── +75 dias → Desativação
```

Essas ações devem ser contabilizadas individualmente.

## Atenção ao D+74,5

A regra de negócio possui:

```javascript
dias: 74.5
```

Porém, ao calcular uma data diária com `Date`, o código utiliza arredondamento:

```javascript
Math.round(regra.dias)
```

Isso significa que a representação operacional de uma data de calendário precisa ser tratada como um dia específico.

O projeto também possui lógica de Data de Corte na Visão Enxuta. Não se deve alterar essa lógica sem validar o impacto sobre a regra de bloqueio/corte.

---

# 12. Ações fixas

Além das ações calculadas pelo vencimento, a Visão Enxuta possui datas fixas de faturamento:

```javascript
const faturamentosFixos = [
    {
        dia: 16,
        titulo: "Faturamento Normal"
    },
    {
        dia: 20,
        titulo: "Faturamento B2B"
    },
    {
        dia: 28,
        titulo: "Faturamento (Pós-16)"
    }
];
```

Essas ações não são calculadas como D+N de um vencimento.

Elas pertencem diretamente ao mês exibido.

---

# 13. Relatórios recorrentes

Também existem tarefas recorrentes.

### Segunda-feira

```text
Relatório B2B
```

### Terça e sexta-feira

```text
Relatórios Assessorias / Diretoria
```

A lógica é:

```javascript
if (diaSemana === 1) {
    // Segunda
} else if (diaSemana === 2 || diaSemana === 5) {
    // Terça ou sexta
}
```

Esses eventos possuem:

```javascript
categoria: "relatorio"
```

e são tratados como:

```text
Tarefa Recorrente
```

---

# 14. Estado da aplicação

O JavaScript mantém algumas variáveis globais:

```javascript
let dataAtual = new Date();

let vencimentoFocoGlobal = null;

let filtroTipoGlobal = "";

let visualizacaoAtual = "calendario";

let modoVisaoEnxuta = false;
```

### `dataAtual`

Define o mês/ano atualmente exibido.

### `vencimentoFocoGlobal`

Define se um vencimento específico está em foco.

### `filtroTipoGlobal`

Define o tipo de evento selecionado.

### `visualizacaoAtual`

Pode ser:

```text
calendario
lista
timeline
```

### `modoVisaoEnxuta`

```text
false → Layout Completo
true  → Visão Enxuta
```

---

# 15. Fluxo de renderização

O sistema centraliza a atualização através de:

```javascript
function renderizarTudo() {
    renderizarAcoesHoje();
    renderizarCalendario();
    atualizarKPIs();

    if (visualizacaoAtual !== "calendario") {
        renderizarVisualizacaoAlternativa();
    }
}
```

Isso é importante.

Sempre que uma configuração que afeta o calendário for modificada, deve-se preferencialmente chamar:

```javascript
renderizarTudo();
```

em vez de atualizar componentes isolados manualmente.

---

# 16. Filtros

O filtro por vencimento é controlado por:

```javascript
function mudarFiltroVencimento()
```

O filtro por tipo é controlado por:

```javascript
function mudarFiltroTipo()
```

A filtragem final utiliza:

```javascript
function eventoVisivel(ev) {
    return !filtroTipoGlobal ||
           ev.categoria === filtroTipoGlobal;
}
```

e:

```javascript
function filtrarEventos(eventos) {
    return eventos.filter(eventoVisivel);
}
```

---

# 17. Tipos/categorias de evento

As categorias utilizadas pelo código incluem:

```text
fatura
sms
bloqueio
cancelamento
relatorio
```

O CSS também utiliza classes correspondentes para aplicar cores:

```css
.ante
.vencimento
.pos
.whatsapp
.bloqueio
.cancelamento
.relatorio
```

A classe visual é aplicada aos pontos do calendário e badges.

---

# 18. Dashboard / KPIs

O HTML possui um painel de indicadores:

```html
<div class="kpi-panel" id="kpiPanel">
```

A estrutura inclui indicadores para:

- bloqueios/assessorias;
- SMS;
- faturas/e-mails;
- Serasa/cancelamentos;
- total de eventos.

Na evolução do projeto, recomenda-se manter as ações individuais no dashboard quando a necessidade for operacional.

Exemplo de organização recomendada:

```text
WhatsApp
Bloqueio
Assessorias
Serasa
Cancelamento
Desativação
SMS
E-mail PDF
Envio de Fatura
```

Isso evita esconder ações diferentes dentro de uma única categoria.

---

# 19. Ações necessárias para hoje

O sistema possui um painel:

```text
⚡ Ações Necessárias para Hoje
```

A função responsável é:

```javascript
function renderizarAcoesHoje()
```

Ela:

1. pega a data atual;
2. calcula os eventos do mês;
3. pega os eventos do dia atual;
4. aplica os filtros;
5. renderiza a lista.

Quando não existem ações compatíveis com os filtros, aparece:

```text
Nenhuma ação operacional corresponde aos filtros para hoje.
```

---

# 20. Calendário

Cada dia do calendário é renderizado dinamicamente.

O evento:

```html
onclick="abrirModalEventos(ano, mes, dia)"
```

faz com que o clique no dia abra o modal.

O calendário também apresenta indicadores como:

```text
V5
V8
V10
V12
V14
V15
...
```

Além de:

```text
FAT
CORTE
```

quando aplicável.

---

# 21. Modal

O HTML possui:

```html
<div id="modalDetalhes" class="modal-overlay">
```

com:

```html
<h3 id="modalTitulo">
```

e:

```html
<div class="modal-body" id="modalCorpo">
```

O modal é utilizado para detalhar os eventos daquele dia.

Na versão com administração, o modal também deve permitir que um administrador crie/edite uma **exceção específica** para uma ocorrência.

---

# 22. Regra mais importante: exceção NÃO altera regra

O princípio central do sistema é:

```text
REGRA ORIGINAL
D+15 Bloqueio
       │
       ▼
EVENTO
15/09/2026
       │
       ▼
EXCEÇÃO
15/09 → 16/09
Motivo: Feriado
```

A regra continua:

```text
D+15
```

Somente aquele evento específico muda de data.

Isso evita que uma alteração de feriado modifique todo o calendário futuro.

---

# 23. Administração

A área administrativa deve ser utilizada apenas por usuários autorizados.

O administrador pode:

- consultar exceções;
- criar exceções;
- editar exceções;
- excluir/cancelar exceções;
- consultar histórico.

Usuários comuns continuam como visualizadores.

---

# 24. Autenticação

A autenticação é feita pelo Supabase.

O usuário administrador possui uma conta no:

```text
Supabase Authentication
```

e seu identificador é relacionado à tabela de administradores.

O conceito é:

```text
auth.users
    │
    │ user_id
    ▼
admin_users
    │
    ▼
administrador autorizado
```

A conta da administradora **não deve ser editada manualmente diretamente na tabela interna de autenticação** para atribuir permissões.

A autorização é feita pela estrutura administrativa do projeto.

---

# 25. Segurança

Nunca coloque no JavaScript:

```text
service_role
secret key
```

O navegador deve utilizar somente a chave pública apropriada para o cliente.

A proteção real das operações deve ser feita no Supabase utilizando:

- autenticação;
- Row Level Security (RLS);
- policies;
- verificação de administrador.

Não confie somente em:

```javascript
if (isAdmin) {
    mostrarBotao();
}
```

Isso controla a interface, mas não substitui a segurança do banco.

O banco precisa impedir que um usuário comum execute operações de escrita.

---

# 26. Banco de dados

A estrutura utilizada pelo projeto deve separar:

### Administradores

```text
admin_users
```

Relaciona usuários autenticados aos administradores.

### Exceções

Tabela destinada a armazenar alterações excepcionais do calendário.

Conceitualmente:

```text
id
data_original
data_nova
tipo_evento
motivo
criado_por
criado_em
ativo
```

### Histórico

Tabela destinada à auditoria das operações.

Conceitualmente:

```text
id
usuario
acao
dados_anteriores
dados_novos
data
```

Os nomes exatos das colunas devem ser conferidos no `supabase.sql` utilizado pelo projeto antes de escrever consultas novas.

---

# 27. Histórico

Toda alteração importante deve ser auditável.

Exemplo:

```text
25/08/2026 18:42

Usuário:
Maria

Ação:
ALTERAÇÃO DE EXCEÇÃO

Evento:
Bloqueio

Original:
15/09/2026

Novo:
16/09/2026

Motivo:
Feriado
```

O histórico não deve ser apagado quando uma exceção for desfeita.

O ideal é registrar uma nova operação:

```text
CRIADA
ALTERADA
DESFEITA
```

Isso mantém rastreabilidade.

---

# 28. Autocomplete na administração

Ao criar uma exceção, o administrador não deve precisar digitar livremente o nome da ação.

A interface deve utilizar o tipo de evento para sugerir as tarefas disponíveis.

Exemplo:

```text
Tipo:
[ Bloqueio ▼ ]

Ação:
[ Bloqueio ▼ ]
```

ou:

```text
Tipo:
[ Cancelamento ▼ ]

Ação:
[ Serasa ▼
  Cancelamento
  Desativação ]
```

Isso reduz erros.

Principalmente porque existem ações com nomes semelhantes, como:

```text
E-mail PDF — D+4
E-mail PDF — D+10
```

A identificação ideal deve considerar:

```text
titulo + offset + vencimento original
```

---

# 29. Identificação de uma exceção

Uma exceção não deve ser identificada apenas pela data.

O ideal é utilizar uma chave lógica semelhante a:

```text
competência
+
vencimento original
+
regra/tipo da ação
```

Exemplo:

```text
2026-09
+
vencimento dia 15
+
Bloqueio D+15
```

Isso evita alterar acidentalmente dois eventos diferentes que acontecem no mesmo dia.

---

# 30. Exemplo de alteração

Regra:

```text
Vencimento: 01/09
Bloqueio: D+15
```

Data calculada:

```text
16/09
```

Exceção:

```text
16/09 → 17/09
Motivo: Feriado
```

O calendário passa a mostrar:

```text
17/09
🔴 Bloqueio
⚠️ Exceção
```

Mas a regra continua:

```text
Bloqueio = D+15
```

---

# 31. Layout Completo x Visão Enxuta

Essa separação deve ser preservada.

## Layout Completo

Calcula toda a régua:

```text
D-10
D0
D+2
D+4
D+10
D+14
D+15
D+18
D+30
D+74,5
D+75
```

## Visão Enxuta

Mantém somente:

```text
D+14 WhatsApp/E-mail
D+15 Bloqueio
```

Além das regras específicas já existentes nessa visão, como faturamentos fixos e lógica de corte.

**Uma alteração feita no Layout Completo não deve alterar automaticamente a regra da Visão Enxuta.**

---

# 32. Exportação CSV

A interface possui:

```text
⬇ Exportar CSV
```

O objetivo é permitir análise externa dos eventos.

Ao modificar os campos do evento, deve-se atualizar também a função de exportação para que os novos campos sejam incluídos.

Campos recomendados:

```text
Data
Vencimento Base
Competência
Ação
Categoria
Offset
Data Original
Data Efetiva
É Exceção
Motivo
```

---

# 33. Exportação PDF

A interface possui:

```text
🖨 Exportar PDF
```

O projeto também possui uma área específica para impressão:

```html
<div id="printReport" class="print-report"></div>
```

e regras CSS:

```css
@media print
```

Isso permite montar uma versão específica para impressão sem modificar a aparência normal do sistema.

---

# 34. Guia do calendário

O projeto possui um arquivo:

```text
GUIA_CALENDARIO.pdf
```

Ele deve ficar na raiz do projeto quando o botão de download for utilizado.

Se o arquivo for renomeado, o caminho usado pelo botão de download também deverá ser atualizado.

---

# 35. Como alterar uma regra da régua

Se for realmente necessário mudar uma regra global, edite:

```javascript
const regrasRegua = [...]
```

Exemplo:

```javascript
{
    dias: 16,
    titulo: "Bloqueio",
    ...
}
```

Isso muda a regra para **todos os vencimentos** do Layout Completo.

### Não fazer isso para feriados.

Para feriados e alterações pontuais, usar uma exceção.

---

# 36. Como adicionar uma nova ação

Exemplo: adicionar uma ação D+20.

No Layout Completo:

```javascript
{
    dias: 20,
    titulo: "Nova Ação",
    tipo: "pos",
    categoria: "fatura",
    desc: "20 dias após o vencimento."
}
```

Depois verificar:

1. filtro;
2. legenda;
3. cores;
4. dashboard;
5. modal;
6. exportação;
7. autocomplete administrativo;
8. guia.

Não basta adicionar o objeto ao array se a ação também precisar aparecer individualmente no dashboard.

---

# 37. Como adicionar uma nova categoria

Se for criada uma categoria:

```text
negociacao
```

é necessário verificar:

### JavaScript

```javascript
categoria: "negociacao"
```

### HTML

Adicionar opção ao filtro:

```html
<option value="negociacao">
    Negociação
</option>
```

### CSS

Adicionar a classe visual:

```css
.negociacao,
.event-dot.negociacao,
.badge-type.negociacao {
    ...
}
```

### Legenda

Adicionar:

```html
<div class="legenda-item">
    ...
    Negociação
</div>
```

---

# 38. Como testar alterações no código

Antes de publicar:

## Teste 1 — Layout Completo

Verificar:

```text
D-10
D0
D+2
D+4
D+10
D+14
D+15
D+18
D+30
D+74,5
D+75
```

## Teste 2 — Visão Enxuta

Verificar:

```text
D+14
D+15
```

## Teste 3 — Mudança de mês

Verificar:

```text
Janeiro → Fevereiro
Dezembro → Janeiro
```

## Teste 4 — Mudança de ano

Verificar:

```text
2026 → 2027
```

## Teste 5 — Filtro por vencimento

Testar cada vencimento oficial.

## Teste 6 — Filtro por tipo

Testar:

```text
fatura
bloqueio
sms
cancelamento
relatorio
```

## Teste 7 — Exceção

Criar:

```text
Data original → nova data
```

e verificar se somente aquele evento muda.

## Teste 8 — Usuário comum

Confirmar que:

```text
não consegue criar/editar exceções
```

## Teste 9 — Administrador

Confirmar que:

```text
consegue criar
consegue editar
consegue consultar histórico
```

## Teste 10 — Histórico

Confirmar que toda alteração fica registrada.

---

# 39. Publicação no GitHub Pages

Fluxo recomendado:

```text
Alterar código
      ↓
Testar localmente
      ↓
Verificar console do navegador
      ↓
Commit
      ↓
Push
      ↓
GitHub Pages
      ↓
Testar produção
```

Exemplo:

```bash
git add .
git commit -m "Atualiza calendario"
git push
```

Depois aguarde a publicação do GitHub Pages.

---

# 40. Nunca testar uma mudança crítica diretamente em produção

Antes de modificar uma regra global:

1. faça backup;
2. teste localmente;
3. valide o calendário;
4. valide a Visão Enxuta;
5. valide exportações;
6. valide exceções;
7. publique.

---

# 41. Tratamento de datas

O projeto utiliza o objeto nativo:

```javascript
Date
```

Por isso deve-se ter cuidado com:

- horário;
- fuso;
- mudança de mês;
- mudança de ano;
- horário de verão em ambientes diferentes;
- datas com offsets fracionários.

Para operações de calendário, prefira trabalhar com datas normalizadas e evitar transformar uma data de negócio em timestamp UTC sem necessidade.

---

# 42. Performance

O calendário calcula eventos para:

```text
mês anterior
mês atual
mês seguinte
```

Isso é importante para que eventos derivados de vencimentos próximos às fronteiras dos meses apareçam corretamente.

Se o volume de regras crescer muito, recomenda-se futuramente:

- separar cálculo de regras da renderização;
- utilizar cache por mês;
- carregar exceções uma vez;
- evitar chamadas ao Supabase para cada célula do calendário.

O ideal é:

```text
Supabase
    ↓
carrega exceções do período
    ↓
JavaScript
    ↓
calcula eventos
    ↓
aplica exceções
    ↓
renderiza
```

e não:

```text
cada dia
    ↓
consulta banco
```

---

# 43. Arquitetura recomendada para evolução

À medida que o projeto crescer, recomenda-se separar o JavaScript em módulos:

```text
js/
├── config.js
├── regras.js
├── calendario.js
├── filtros.js
├── dashboard.js
├── modal.js
├── excecoes.js
├── historico.js
├── auth.js
├── exportacao.js
└── app.js
```

Hoje a lógica está concentrada principalmente no `script.js`.

Isso funciona bem para o projeto atual, mas a modularização reduzirá o risco de alterações futuras quebrarem outras partes.

---

# 44. Arquitetura futura recomendada

Uma evolução natural seria:

```text
src/
├── core/
│   ├── rules.js
│   ├── event-engine.js
│   └── dates.js
│
├── ui/
│   ├── calendar.js
│   ├── dashboard.js
│   ├── modal.js
│   └── filters.js
│
├── services/
│   ├── supabase.js
│   ├── exceptions.js
│   ├── history.js
│   └── auth.js
│
└── app.js
```

A ideia é separar:

```text
REGRA DE NEGÓCIO
```

de:

```text
INTERFACE
```

e de:

```text
BANCO DE DADOS
```

---

# 45. Princípio de desenvolvimento

Sempre preservar esta separação:

```text
REGRA
↓
EVENTO CALCULADO
↓
EXCEÇÃO
↓
EVENTO EFETIVO
↓
INTERFACE
```

Exemplo:

```text
Regra:
Bloqueio = D+15

Evento:
15/09/2026

Exceção:
15/09 → 16/09

Evento efetivo:
16/09/2026

Interface:
🔴 Bloqueio
⚠️ Alterado excepcionalmente
```

---

# 46. Funcionalidades recomendadas para próximas versões

Prioridade alta:

- próximas ações;
- exceções ativas;
- modo auditoria;
- desfazer alteração;
- alertas de inconsistência;
- histórico com filtros;
- impacto das exceções.

Prioridade média:

- visão semanal;
- busca global;
- tratamento de feriados;
- tratamento de finais de semana;
- permissões de operador/admin;
- dashboard gerencial.

---

# 47. Checklist antes de publicar

```text
[ ] Backup realizado
[ ] index.html validado
[ ] script.js validado
[ ] style.css validado
[ ] regras do Layout Completo testadas
[ ] Visão Enxuta testada
[ ] cancelamento testado
[ ] desativação testada
[ ] filtros testados
[ ] calendário testado
[ ] lista testada
[ ] timeline testada
[ ] CSV testado
[ ] PDF testado
[ ] modal testado
[ ] login testado
[ ] usuário comum testado
[ ] administrador testado
[ ] exceção criada
[ ] exceção editada
[ ] histórico conferido
[ ] guia baixado
[ ] GitHub Pages testado
```

---

# 48. Resumo da lógica de negócio

## Layout Completo

```text
Vencimento
│
├── D-10  → PDF E-mail
├── D0    → Envio de Fatura
├── D+2   → SMS
├── D+4   → E-mail PDF
├── D+10  → E-mail PDF
├── D+14  → WhatsApp/E-mail
├── D+15  → Bloqueio
├── D+18  → Assessorias
├── D+30  → Serasa
├── D+74,5→ Cancelamento
└── D+75  → Desativação
```

## Visão Enxuta

```text
Vencimento
│
├── D+14 → WhatsApp/E-mail
└── D+15 → Bloqueio
```

---

# 49. Regra de ouro para alterações excepcionais

Se a mudança for:

> "Somente este dia precisa mudar."

Use:

```text
EXCEÇÃO
```

Se a mudança for:

> "A partir de agora todos os clientes devem seguir uma nova regra."

Altere:

```text
REGRA GLOBAL
```

Não utilizar uma alteração global para resolver um problema pontual.

---

# 50. Conclusão

O projeto deve ser tratado como uma aplicação operacional, e não somente como um calendário.

A lógica central deve permanecer previsível:

```text
Vencimentos oficiais
        ↓
Regras da régua
        ↓
Eventos calculados
        ↓
Exceções
        ↓
Eventos efetivos
        ↓
Dashboard / Calendário / Lista / Timeline
        ↓
Exportação
```

O principal objetivo das exceções e do histórico é permitir flexibilidade operacional **sem perder a regra original nem a rastreabilidade das decisões**.

---

## Manutenção rápida

### Quero mudar um dia da régua

Editar:

```javascript
const regrasRegua = [...]
```

### Quero mudar somente um evento

Usar:

```text
Administração → Exceção
```

### Quero adicionar vencimento

Editar:

```javascript
const diasFaturamentoOficiais = [...]
```

### Quero mudar aparência

Editar:

```text
style.css
```

### Quero mudar textos/botões

Editar:

```text
index.html
```

### Quero mudar comportamento

Editar:

```text
script.js
```

### Quero alterar permissões

Alterar a configuração de autenticação/RLS no Supabase, não somente o botão da interface.

---

## Tecnologias

- HTML5
- CSS3
- JavaScript
- GitHub Pages
- Supabase
- Supabase Authentication
- PostgreSQL/RLS, quando configurado no projeto

---

## Autor / Projeto

Jottynha.
