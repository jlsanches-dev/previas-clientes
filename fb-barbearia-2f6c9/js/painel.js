/* Painel do barbeiro (painel.html): a agenda do dia, marcar cliente,
   bloquear horário, cancelar, "atendido" e "não veio".
   No modo de verdade, só entra quem tem usuário no Supabase ligado a um barbeiro.
   Não precisa mexer aqui. Segurança: todo texto entra como texto (textContent). */
(function () {
  "use strict";

  var R = window.Regras, Servidor = window.Servidor;
  if (!R || !Servidor) return;

  function $(s) { return document.querySelector(s); }
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }
  function limpar(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function botao(texto, aoClicar, classe) {
    var b = el("button", "item-botao" + (classe ? " " + classe : ""), texto);
    b.type = "button";
    b.addEventListener("click", aoClicar);
    return b;
  }

  var telaEntrar = $("[data-entrar]"), telaPainel = $("[data-painel]");
  var A = null, G = null, itens = [];
  var dia = R.agora().dia, filtro = "todos";
  var timerAviso = null;

  function aviso(texto) {
    var p = $("[data-aviso]");
    p.textContent = texto || "";
    clearTimeout(timerAviso);
    if (texto) timerAviso = setTimeout(function () { p.textContent = ""; }, 6000);
  }
  function tratarErro(e) {
    if (e && e.codigo === "sem_sessao") { mostrarEntrar(); return; }
    aviso(Servidor.mensagem(e));
  }
  function nomeBarbeiro(id) { var b = G.barbeiro(id); return b ? b.curto : id; }
  function minutosDoCampo(v) { return /^\d{2}:\d{2}/.test(v) ? R.paraMinutos(v.slice(0, 5)) : -1; }

  /* ---------- Entrar e sair ---------- */

  function mostrarEntrar() {
    telaPainel.hidden = true;
    telaEntrar.hidden = false;
    $("#entrar-email").focus();
  }

  $("[data-form-entrar]").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var erro = $("[data-erro-entrar]"), enviar = this.querySelector("button");
    var email = $("#entrar-email").value.trim(), senha = $("#entrar-senha").value;
    if (!email || !senha) { erro.textContent = "Escreva o e-mail e a senha."; return; }
    enviar.disabled = true;
    erro.textContent = "";
    Servidor.entrar(email, senha).then(function () {
      $("#entrar-senha").value = "";
      abrirPainel();
    }, function (e) {
      erro.textContent = Servidor.mensagem(e);
    }).then(function () { enviar.disabled = false; });
  });

  $("[data-sair]").addEventListener("click", function () {
    Servidor.sair().then(function () { location.reload(); });
  });

  /* ---------- Dia escolhido ---------- */

  function tituloDia(d) {
    var hoje = R.agora().dia, t = R.diaLongo(d);
    var antes = d === hoje ? "Hoje" : d === R.somarDias(hoje, 1) ? "Amanhã" : d === R.somarDias(hoje, -1) ? "Ontem" : "";
    return antes ? antes + ", " + t.charAt(0).toLowerCase() + t.slice(1) : t;
  }
  function irParaDia(d) { dia = d; carregar(); }

  document.querySelectorAll("[data-dia-mudar]").forEach(function (b) {
    b.addEventListener("click", function () { irParaDia(R.somarDias(dia, Number(b.getAttribute("data-dia-mudar")))); });
  });
  $("[data-dia-hoje]").addEventListener("click", function () { irParaDia(R.agora().dia); });
  $("[data-dia-escolher]").addEventListener("change", function () { if (this.value) irParaDia(this.value); });

  /* ---------- Lista do dia ---------- */

  function carregar() {
    $("[data-dia-titulo]").textContent = tituloDia(dia);
    $("[data-dia-escolher]").value = dia;
    return Servidor.listar(dia, dia).then(function (lista) { itens = lista; desenhar(); }, tratarErro);
  }

  function desenhar() {
    var ol = $("[data-lista]");
    limpar(ol);
    var visiveis = itens.filter(function (i) { return filtro === "todos" || i.barbeiro === filtro; })
      .sort(function (x, y) { return x.inicio - y.inicio || (x.barbeiro < y.barbeiro ? -1 : 1); });
    var marcados = visiveis.filter(function (i) { return i.tipo === "agendamento" && i.status !== "cancelado"; });
    var total = marcados.reduce(function (t, i) { return t + (i.preco || 0); }, 0);
    $("[data-dia-resumo]").textContent = marcados.length
      ? marcados.length + (marcados.length === 1 ? " horário, " : " horários, ") + R.reais(total) + " previstos"
      : "Nenhum cliente marcado neste dia.";
    visiveis.forEach(function (i) { ol.appendChild(i.tipo === "bloqueio" ? itemBloqueio(i) : itemAgendamento(i)); });
  }

  function itemAgendamento(i) {
    var li = el("li", "item" + (i.status !== "marcado" ? " item-" + i.status : ""));
    li.appendChild(el("p", "item-hora", R.paraHora(i.inicio) + " às " + R.paraHora(i.fim)));
    var corpo = el("div", "item-corpo");
    corpo.appendChild(el("p", "item-nome", i.nome));
    var detalhe = G.nomesServicos(i.servicos) + ", " + R.reais(i.preco || 0);
    if (filtro === "todos") detalhe += ", com " + nomeBarbeiro(i.barbeiro);
    if (i.origem === "painel") detalhe += ". Marcado no painel";
    corpo.appendChild(el("p", "item-detalhe", detalhe));
    var etiquetas = { cancelado: "Cancelado", faltou: "Não veio", atendido: "Atendido" };
    if (etiquetas[i.status]) corpo.appendChild(el("p", "item-status", etiquetas[i.status]));

    var acoes = el("div", "item-acoes");
    if (i.whatsapp) {
      var primeiroNome = String(i.nome).split(" ")[0];
      var w = el("a", "item-botao", "WhatsApp");
      w.href = "https://wa.me/55" + i.whatsapp + "?text=" + encodeURIComponent("Olá, " + primeiroNome + "! Aqui é da FB Barbearia, sobre o seu horário " + R.quando(i.dia, i.inicio) + ".");
      w.target = "_blank"; w.rel = "noopener noreferrer";
      acoes.appendChild(w);
    }
    if (i.status === "marcado") {
      acoes.appendChild(botao("Atendido", function () { mudar(i, "atendido"); }));
      acoes.appendChild(botao("Não veio", function () { mudar(i, "faltou"); }));
      acoes.appendChild(botao("Cancelar", function () {
        if (window.confirm("Cancelar o horário de " + i.nome + "? Ele fica livre na agenda.")) mudar(i, "cancelado");
      }, "perigo"));
    } else {
      acoes.appendChild(botao("Desfazer", function () { mudar(i, "marcado"); }));
    }
    corpo.appendChild(acoes);
    li.appendChild(corpo);
    return li;
  }

  function itemBloqueio(i) {
    var li = el("li", "item item-bloqueio");
    li.appendChild(el("p", "item-hora", i.inicio === 0 && i.fim >= 1440 ? "Dia inteiro" : R.paraHora(i.inicio) + " às " + R.paraHora(Math.min(i.fim, 1439))));
    var corpo = el("div", "item-corpo");
    corpo.appendChild(el("p", "item-nome", "Bloqueado" + (i.motivo ? ": " + i.motivo : "")));
    if (filtro === "todos") corpo.appendChild(el("p", "item-detalhe", nomeBarbeiro(i.barbeiro)));
    var acoes = el("div", "item-acoes");
    acoes.appendChild(botao("Tirar bloqueio", function () {
      Servidor.desbloquear(i.id).then(carregar, tratarErro);
    }));
    corpo.appendChild(acoes);
    li.appendChild(corpo);
    return li;
  }

  function mudar(i, status) {
    Servidor.status(i.id, status).then(carregar, tratarErro);
  }

  /* ---------- Filtro por barbeiro ---------- */

  function montarFiltro() {
    var caixa = $("[data-filtro]");
    [{ id: "todos", curto: "Todos" }].concat(A.barbeiros).forEach(function (b) {
      var rotulo = el("label", "filtro-opcao");
      var entrada = el("input");
      entrada.type = "radio"; entrada.name = "filtro"; entrada.value = b.id; entrada.checked = b.id === filtro;
      entrada.addEventListener("change", function () { filtro = b.id; desenhar(); });
      rotulo.appendChild(entrada);
      rotulo.appendChild(el("span", "", b.curto));
      caixa.appendChild(rotulo);
    });
  }

  /* ---------- Formulários ---------- */

  var formMarcar = $('[data-form="marcar"]'), formBloquear = $('[data-form="bloquear"]');

  function abrir(form) {
    [formMarcar, formBloquear].forEach(function (f) { f.hidden = f !== form; });
    form.querySelector("[data-erro-form]").textContent = "";
    if (form === formMarcar) { $("[data-marcar-dia]").value = dia; atualizarHorasMarcar(); }
    if (form === formBloquear) $("[data-bloq-dia]").value = dia;
    form.querySelector("h2").scrollIntoView({ block: "nearest" });
    var primeiro = form.querySelector("input, select");
    if (primeiro) primeiro.focus();
  }
  function fechar(form) { form.hidden = true; }

  document.querySelectorAll("[data-abrir]").forEach(function (b) {
    b.addEventListener("click", function () { abrir(b.getAttribute("data-abrir") === "marcar" ? formMarcar : formBloquear); });
  });
  document.querySelectorAll("[data-fechar]").forEach(function (b) {
    b.addEventListener("click", function () { fechar(b.closest("form")); });
  });

  function montarForms() {
    var checks = $("[data-marcar-servicos]");
    A.servicos.forEach(function (s) {
      var rotulo = el("label", "check-linha");
      var entrada = el("input");
      entrada.type = "checkbox"; entrada.value = s.id;
      entrada.addEventListener("change", atualizarHorasMarcar);
      rotulo.appendChild(entrada);
      rotulo.appendChild(document.createTextNode(" " + s.nome + " (" + R.duracao(s.minutos) + ", " + R.reais(s.preco) + ")"));
      checks.appendChild(rotulo);
    });
    var selMarcar = $("[data-marcar-barbeiro]"), selBloq = $("[data-bloq-barbeiro]");
    selBloq.appendChild(new Option("Todos os barbeiros", "todos"));
    A.barbeiros.forEach(function (b) {
      selMarcar.appendChild(new Option(b.nome, b.id));
      selBloq.appendChild(new Option(b.nome, b.id));
    });
    selMarcar.addEventListener("change", atualizarHorasMarcar);
    $("[data-marcar-dia]").addEventListener("change", atualizarHorasMarcar);
    $("#marcar-whats").addEventListener("blur", function () { this.value = R.formatarWhats(this.value); });
    $("[data-bloq-inteiro]").addEventListener("change", function () { $("[data-bloq-horas]").hidden = this.checked; });
  }

  function servicosMarcados() {
    return Array.prototype.filter.call(document.querySelectorAll("[data-marcar-servicos] input"), function (c) { return c.checked; })
      .map(function (c) { return c.value; });
  }

  // Os horários livres do barbeiro no dia escolhido (o barbeiro pode marcar para agora)
  function atualizarHorasMarcar() {
    var sel = $("[data-marcar-hora]"), d = $("[data-marcar-dia]").value, ids = servicosMarcados();
    limpar(sel);
    if (!ids.length) { sel.appendChild(new Option("Escolha os serviços", "")); return; }
    if (!d) { sel.appendChild(new Option("Escolha o dia", "")); return; }
    sel.appendChild(new Option("Carregando…", ""));
    var pedido = d === dia ? Promise.resolve(itens) : Servidor.listar(d, d);
    pedido.then(function (lista) {
      G.guardarOcupados(lista.filter(function (i) { return i.tipo === "bloqueio" || i.status === "marcado"; }));
      var b = G.barbeiro($("[data-marcar-barbeiro]").value);
      var horas = G.livresDoBarbeiro(b, d, G.totalMinutos(ids), true);
      limpar(sel);
      if (!horas.length) { sel.appendChild(new Option("Sem horário livre neste dia", "")); return; }
      horas.forEach(function (m) { sel.appendChild(new Option(R.paraHora(m), String(m))); });
    }, tratarErro);
  }

  formMarcar.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var erro = formMarcar.querySelector("[data-erro-form]"), enviar = formMarcar.querySelector('button[type="submit"]');
    var ids = servicosMarcados(), hora = $("[data-marcar-hora]").value;
    var nome = $("#marcar-nome").value.trim(), whats = R.whatsLimpo($("#marcar-whats").value);
    if (!ids.length) { erro.textContent = "Escolha pelo menos um serviço."; return; }
    if (hora === "") { erro.textContent = "Escolha um horário livre."; return; }
    if (nome.length < 2) { erro.textContent = "Escreva o nome do cliente."; return; }
    if (whats && !/^\d{10,11}$/.test(whats)) { erro.textContent = "Confira o WhatsApp com DDD (ou deixe em branco)."; return; }
    var d = $("[data-marcar-dia]").value;
    enviar.disabled = true;
    Servidor.marcarPainel({ servicos: ids, barbeiro: $("[data-marcar-barbeiro]").value, dia: d, inicio: Number(hora), nome: nome, whatsapp: whats })
      .then(function () {
        fechar(formMarcar);
        $("#marcar-nome").value = ""; $("#marcar-whats").value = "";
        document.querySelectorAll("[data-marcar-servicos] input").forEach(function (c) { c.checked = false; });
        aviso("Marcado: " + nome + ", " + R.quando(d, Number(hora)) + ".");
        irParaDia(d);
      }, function (e) {
        erro.textContent = Servidor.mensagem(e);
        if (e.codigo === "ocupado") atualizarHorasMarcar();
      }).then(function () { enviar.disabled = false; });
  });

  formBloquear.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var erro = formBloquear.querySelector("[data-erro-form]"), enviar = formBloquear.querySelector('button[type="submit"]');
    var inteiro = $("[data-bloq-inteiro]").checked;
    var ini = inteiro ? 0 : minutosDoCampo($("[data-bloq-inicio]").value);
    var fim = inteiro ? 1440 : minutosDoCampo($("[data-bloq-fim]").value);
    var d = $("[data-bloq-dia]").value, quem = $("[data-bloq-barbeiro]").value;
    if (!d) { erro.textContent = "Escolha o dia."; return; }
    if (ini < 0 || fim < 0 || fim <= ini) { erro.textContent = "O horário final precisa ser depois do inicial."; return; }
    var pedido = { barbeiro: quem, dia: d, inicio: ini, fim: fim, motivo: $("#bloq-motivo").value.trim() };
    enviar.disabled = true;
    // Avisa se já tem cliente marcado no meio do bloqueio (o horário dele continua marcado)
    Servidor.listar(d, d).then(function (lista) {
      var conflito = lista.filter(function (i) {
        return i.tipo === "agendamento" && i.status === "marcado" && (quem === "todos" || i.barbeiro === quem) && i.inicio < fim && i.fim > ini;
      });
      if (conflito.length && !window.confirm("Já tem " + conflito.length + (conflito.length === 1 ? " cliente marcado" : " clientes marcados") +
        " nesse horário. Bloquear mesmo assim? O horário deles continua marcado.")) return false;
      return Servidor.bloquear(pedido).then(function () { return true; });
    }).then(function (feito) {
      if (!feito) return;
      fechar(formBloquear);
      $("#bloq-motivo").value = "";
      aviso("Horário bloqueado.");
      irParaDia(d);
    }, function (e) {
      erro.textContent = Servidor.mensagem(e);
    }).then(function () { enviar.disabled = false; });
  });

  $("[data-apagar-teste]").addEventListener("click", function () {
    if (!window.confirm("Apagar todos os dados de teste deste navegador?")) return;
    Servidor.apagarTeste();
    carregar();
  });

  /* ---------- Abrir o painel ---------- */

  function abrirPainel() {
    telaEntrar.hidden = true;
    Servidor.base().then(function (base) {
      A = base;
      G = R.criar(base);
      if (!$("[data-filtro] input")) { montarFiltro(); montarForms(); }
      var s = Servidor.sessao();
      $("[data-email]").textContent = s && s.email ? s.email : "";
      telaPainel.hidden = false;
      return carregar();
    }).catch(tratarErro);
  }

  // Atualiza sozinho a cada minuto (se nenhum formulário estiver aberto)
  setInterval(function () {
    if (G && !telaPainel.hidden && document.visibilityState === "visible" && formMarcar.hidden && formBloquear.hidden) carregar();
  }, 60000);

  var teste = Servidor.modo === "teste";
  $("[data-faixa-teste]").hidden = !teste;
  $("[data-apagar-teste]").hidden = !teste;
  $("[data-sair]").hidden = teste;
  if (!teste && !Servidor.sessao()) mostrarEntrar();
  else abrirPainel();
})();
