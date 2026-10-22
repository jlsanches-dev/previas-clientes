/* Página da agenda (agenda.html).
   4 passos: serviço, barbeiro, dia e horário, seus dados. Também mostra
   "Seus horários" e a tela de ver/cancelar um horário (link com #t=...).
   Os dados vêm do banco (js/servidor.js) e as contas de js/regras.js.
   Não precisa mexer aqui. Segurança: todo texto entra como texto (textContent). */
(function () {
  "use strict";

  var S = window.SITE || {};
  var R = window.Regras;
  var Servidor = window.Servidor;
  var form = document.querySelector("[data-agenda]");
  if (!form || !R || !Servidor) return;

  var PASSOS = ["servicos", "barbeiro", "horario", "dados"];
  var QUALQUER = { id: "qualquer", nome: "Tanto faz", curto: "o primeiro livre" };
  var CHAVE_MEUS = "fb-meus-horarios";

  var A = null;  // barbeiros, serviços, horários... (vêm do banco)
  var G = null;  // regras da agenda
  var estado = { passo: 0, servicos: [], barbeiro: "", dia: "", hora: -1 };

  var paraHora = R.paraHora, reais = R.reais, duracao = R.duracao, quando = R.quando;

  /* ---------- Ajudantes ---------- */

  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }
  function limpar(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function barbeiro(id) { return id === QUALQUER.id ? QUALQUER : G.barbeiro(id); }
  function escolhidos() { return estado.barbeiro === QUALQUER.id ? A.barbeiros : [barbeiro(estado.barbeiro)]; }
  function livres(dia) { return G.livres(escolhidos(), dia, G.totalMinutos(estado.servicos)); }
  function rolagemSuave() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"; }

  function carregarOcupados() {
    var hoje = R.agora().dia;
    return Servidor.ocupados(hoje, R.somarDias(hoje, A.diasAFrente)).then(G.guardarOcupados);
  }

  /* ---------- Elementos da página ---------- */

  var passos = PASSOS.map(function (nome) {
    var s = form.querySelector('[data-passo="' + nome + '"]');
    return {
      nome: nome, caixa: s, titulo: s.querySelector("h2"),
      escolha: s.querySelector("[data-escolha]"), trocar: s.querySelector("[data-trocar]"),
      corpo: s.querySelector("[data-corpo]")
    };
  });
  var botaoAcao = form.querySelector("[data-acao]");
  var erro = form.querySelector("[data-erro]");
  var campoNome = form.querySelector("#agenda-nome");
  var campoWhats = form.querySelector("#agenda-whats");
  var campoIsca = form.querySelector("#agenda-site");
  var painelFeito = document.querySelector("[data-feito]");
  var painelSeu = document.querySelector("[data-seu]");
  var caixaMeus = document.querySelector("[data-meus]");
  var aviso = document.querySelector("[data-carregando]");

  function avisar(texto) { erro.textContent = texto || ""; }

  function opcao(tipo, nome, valor, marcado, classe) {
    var rotulo = el("label", classe);
    var entrada = el("input");
    entrada.type = tipo; entrada.name = nome; entrada.value = valor; entrada.checked = !!marcado;
    rotulo.appendChild(entrada);
    return { rotulo: rotulo, entrada: entrada, por: function (filho) { // põe um pedaço no rótulo, com espaço (para leitores de tela)
      rotulo.appendChild(filho); rotulo.appendChild(document.createTextNode(" ")); return filho;
    } };
  }

  /* ---------- Passo 1: serviços (dá para escolher mais de um) ---------- */

  function montarServicos() {
    var corpo = passos[0].corpo;
    limpar(corpo);
    var grupo = el("fieldset", "lista");
    grupo.appendChild(el("legend", "so-leitor", "Escolha um ou mais serviços"));
    A.servicos.forEach(function (s) {
      var o = opcao("checkbox", "servico", s.id, estado.servicos.indexOf(s.id) >= 0, "linha");
      o.entrada.addEventListener("change", function () { trocarServico(s.id, o.entrada.checked); });
      o.por(el("span", "marca", ""));
      o.por(el("span", "linha-nome", s.nome));
      o.por(el("span", "linha-detalhe", duracao(s.minutos)));
      o.por(el("span", "linha-preco", reais(s.preco)));
      grupo.appendChild(o.rotulo);
    });
    corpo.appendChild(grupo);
    corpo.appendChild(el("p", "nota", "")).setAttribute("data-nota", "");
  }

  function trocarServico(id, marcado) {
    var nota = passos[0].corpo.querySelector("[data-nota]") || {};
    nota.textContent = "";
    var lista = estado.servicos.filter(function (x) { return x !== id; });
    function desmarcar(outro) {
      lista = lista.filter(function (x) { return x !== outro; });
      var caixa = passos[0].corpo.querySelector('input[value="' + outro + '"]');
      if (caixa) caixa.checked = false;
    }
    if (marcado) {
      var entra = true;
      (A.jaIncluso || []).forEach(function (regra) {
        // marcou o que já vem incluso (ex.: pezinho com corte): não entra
        if (regra.inclui === id && lista.indexOf(regra.servico) >= 0) { entra = false; desmarcar(id); nota.textContent = regra.aviso; }
        // marcou o serviço maior (ex.: corte com pezinho): o incluso sai
        if (regra.servico === id && lista.indexOf(regra.inclui) >= 0) { desmarcar(regra.inclui); nota.textContent = regra.aviso; }
      });
      if (entra) lista.push(id);
    }
    estado.servicos = lista;
    estado.hora = -1; // a duração mudou: o horário precisa ser escolhido de novo
    avisar("");
    atualizarResumo();
  }

  /* ---------- Passo 2: barbeiro, com o próximo horário livre de cada um ---------- */

  function montarBarbeiros() {
    var corpo = passos[1].corpo;
    limpar(corpo);
    var grupo = el("fieldset", "lista");
    grupo.appendChild(el("legend", "so-leitor", "Escolha o barbeiro"));
    A.barbeiros.concat([QUALQUER]).forEach(function (b) {
      var o = opcao("radio", "barbeiro", b.id, estado.barbeiro === b.id, "linha linha-barbeiro");
      o.entrada.addEventListener("change", function () {
        estado.barbeiro = b.id; estado.hora = -1; avisar(""); atualizarResumo();
      });
      o.por(el("span", "avatar", b.id === QUALQUER.id ? "?" : b.curto.charAt(0))).setAttribute("aria-hidden", "true");
      o.por(el("span", "linha-nome", b.nome));
      var p = G.proximo(estado.servicos, b.id === QUALQUER.id ? A.barbeiros : [b]);
      var detalhe = p ? "Livre " + quando(p.dia, p.inicio) : "Sem horário nas próximas " + Math.round(A.diasAFrente / 7) + " semanas";
      if (b.id === QUALQUER.id) detalhe = "O primeiro que estiver livre. " + detalhe;
      o.por(el("span", "linha-detalhe", detalhe));
      grupo.appendChild(o.rotulo);
    });
    corpo.appendChild(grupo);
  }

  /* ---------- Passo 3: dias (faixa que desliza) e horários livres do dia ---------- */

  function montarHorarios() {
    var corpo = passos[2].corpo;
    limpar(corpo);
    var hoje = R.agora().dia, dias = [];
    for (var i = 0; i < A.diasAFrente; i++) {
      var dia = R.somarDias(hoje, i);
      var aberto = escolhidos().some(function (b) { return G.periodos(b, dia).length; });
      dias.push({ dia: dia, aberto: aberto, livres: aberto ? livres(dia).length : 0 });
    }
    var temLivre = dias.filter(function (d) { return d.livres; });
    if (!temLivre.some(function (d) { return d.dia === estado.dia; })) {
      estado.dia = temLivre.length ? temLivre[0].dia : "";
      estado.hora = -1;
    }

    var faixa = el("fieldset", "dias");
    faixa.appendChild(el("legend", "so-leitor", "Escolha o dia"));
    var mesAnterior = "";
    dias.forEach(function (d) {
      var o = opcao("radio", "dia", d.dia, d.dia === estado.dia, "dia");
      o.entrada.disabled = !d.livres;
      o.entrada.addEventListener("change", function () {
        estado.dia = d.dia; estado.hora = -1; avisar(""); montarHoras(); atualizarResumo();
      });
      var m = R.mes(d.dia);
      o.por(el("span", "dia-mes", m !== mesAnterior ? m : ""));
      mesAnterior = m;
      o.por(el("span", "dia-semana", d.dia === hoje ? "hoje" : R.semana(d.dia)));
      o.por(el("span", "dia-numero", String(R.dataUTC(d.dia).getUTCDate())));
      o.por(el("span", "dia-situacao", !d.aberto ? "fechado" : !d.livres ? "lotado" : ""));
      faixa.appendChild(o.rotulo);
    });
    corpo.appendChild(faixa);
    corpo.appendChild(el("div", "horas")).setAttribute("data-horas", "");
    montarHoras();
    // deixa o dia escolhido à vista na faixa (sem mexer na rolagem da página)
    var marcado = faixa.querySelector("input:checked");
    if (marcado) {
      var chip = marcado.parentNode;
      faixa.scrollLeft = chip.offsetLeft - (faixa.clientWidth - chip.offsetWidth) / 2;
    }
  }

  function montarHoras() {
    var caixa = passos[2].corpo.querySelector("[data-horas]");
    limpar(caixa);
    if (!estado.dia) {
      caixa.appendChild(el("p", "nota", "Não tem horário livre nos próximos dias. Chame a barbearia no WhatsApp."));
      return;
    }
    var turnos = [["Manhã", 0, 720], ["Tarde", 720, 1080], ["Noite", 1080, 1440]];
    var lista = livres(estado.dia);
    var grupo = el("fieldset", "horas-grupo");
    grupo.appendChild(el("legend", "so-leitor", "Horários livres em " + R.diaCurto(estado.dia)));
    turnos.forEach(function (t) {
      var doTurno = lista.filter(function (h) { return h.inicio >= t[1] && h.inicio < t[2]; });
      if (!doTurno.length) return;
      var bloco = el("div", "turno");
      bloco.setAttribute("role", "group");
      bloco.setAttribute("aria-label", t[0]);
      bloco.appendChild(el("p", "turno-nome", t[0])).setAttribute("aria-hidden", "true");
      var grade = el("div", "turno-horas");
      doTurno.forEach(function (h) {
        var o = opcao("radio", "hora", String(h.inicio), h.inicio === estado.hora, "hora");
        o.entrada.addEventListener("change", function () { estado.hora = h.inicio; avisar(""); atualizarResumo(); });
        o.por(el("span", "", paraHora(h.inicio)));
        grade.appendChild(o.rotulo);
      });
      bloco.appendChild(grade);
      grupo.appendChild(bloco);
    });
    caixa.appendChild(grupo);
  }

  /* ---------- Resumo e passos ---------- */

  function textoEscolha(i) {
    if (i === 0) return estado.servicos.length ? G.nomesServicos(estado.servicos) : "";
    if (i === 1) return estado.barbeiro ? (estado.barbeiro === QUALQUER.id ? "Tanto faz" : barbeiro(estado.barbeiro).curto) : "";
    if (i === 2) return estado.dia && estado.hora >= 0 ? quando(estado.dia, estado.hora) : "";
    return "";
  }

  function atualizarResumo() {
    var tem = estado.servicos.length;
    form.querySelector("[data-resumo-servicos]").textContent = tem ? G.nomesServicos(estado.servicos) : "Nenhum ainda";
    form.querySelector("[data-resumo-barbeiro]").textContent = textoEscolha(1) || "A escolher";
    form.querySelector("[data-resumo-quando]").textContent = textoEscolha(2) || "A escolher";
    form.querySelector("[data-total-preco]").textContent = tem ? reais(G.totalPreco(estado.servicos)) : "";
    form.querySelector("[data-total-tempo]").textContent = tem ? duracao(G.totalMinutos(estado.servicos)) : "Nenhum serviço ainda";
    passos.forEach(function (p, i) {
      if (p.escolha) p.escolha.textContent = i < estado.passo ? textoEscolha(i) : "";
    });
  }

  function irPara(n, focar) {
    estado.passo = n;
    passos.forEach(function (p, i) {
      p.caixa.classList.toggle("atual", i === n);
      p.caixa.classList.toggle("concluido", i < n);
      p.corpo.hidden = i !== n;
      if (p.trocar) p.trocar.hidden = i >= n;
    });
    if (n === 0) montarServicos();
    if (n === 1) montarBarbeiros();
    if (n === 2) montarHorarios();
    botaoAcao.textContent = n === PASSOS.length - 1 ? "Confirmar horário" : "Continuar";
    avisar("");
    atualizarResumo();
    if (focar) {
      passos[n].titulo.focus({ preventScroll: true });
      passos[n].caixa.scrollIntoView({ behavior: rolagemSuave(), block: "start" });
    }
  }

  passos.forEach(function (p, i) {
    if (p.trocar) p.trocar.addEventListener("click", function () { irPara(i, true); });
  });

  campoWhats.addEventListener("blur", function () { campoWhats.value = R.formatarWhats(campoWhats.value); });

  /* ---------- Continuar / confirmar ---------- */

  var enviando = false;

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (enviando || !G) return;
    var n = estado.passo;
    if (n === 0 && !estado.servicos.length) return avisar("Escolha pelo menos um serviço.");
    if (n === 1 && !estado.barbeiro) return avisar("Escolha com quem você quer cortar.");
    if (n === 2 && estado.hora < 0) return avisar(estado.dia ? "Escolha um horário." : "Não tem horário livre. Chame a barbearia no WhatsApp.");
    if (n < PASSOS.length - 1) return irPara(n + 1, true);
    confirmar();
  });

  function confirmar() {
    var nome = campoNome.value.trim().replace(/\s+/g, " ");
    var whats = R.whatsLimpo(campoWhats.value);
    if (nome.length < 2) { avisar("Escreva seu nome."); campoNome.focus(); return; }
    if (!/^\d{10,11}$/.test(whats)) {
      avisar("Confira o WhatsApp com DDD, por exemplo (11) 91234-5678.");
      campoWhats.focus(); return;
    }
    var vaga = livres(estado.dia).filter(function (h) { return h.inicio === estado.hora; })[0];
    if (!vaga) {
      irPara(2, true);
      avisar("Esse horário acabou de ser ocupado. Escolha outro.");
      return;
    }
    // "Tanto faz": fica com o barbeiro livre que tem menos atendimentos no dia
    var b = G.menosOcupado(vaga.barbeiros, estado.dia);
    var pedido = { servicos: estado.servicos.slice(), barbeiro: b.id, dia: estado.dia, inicio: estado.hora, nome: nome, whatsapp: whats };

    if (campoIsca.value) { mostrarFeito({ token: "", barbeiro: b.id, dia: pedido.dia, inicio: pedido.inicio, minutos: G.totalMinutos(pedido.servicos), preco: G.totalPreco(pedido.servicos) }, pedido); return; } // robô: finge que deu certo

    enviando = true;
    botaoAcao.disabled = true;
    botaoAcao.textContent = "Marcando…";
    Servidor.marcar(pedido).then(function (r) {
      mostrarFeito(r, pedido);
      return carregarOcupados();
    }, function (e) {
      if (e.codigo === "ocupado" || e.codigo === "cedo_demais") {
        return carregarOcupados().then(function () { irPara(2, true); avisar(Servidor.mensagem(e)); });
      }
      avisar(Servidor.mensagem(e));
    }).then(function () {
      enviando = false;
      botaoAcao.disabled = false;
      botaoAcao.textContent = "Confirmar horário";
    });
  }

  /* ---------- Horário marcado ---------- */

  var ultimo = null;

  function lerMeus() { try { return JSON.parse(localStorage.getItem(CHAVE_MEUS)) || []; } catch (e) { return []; } }
  function guardarMeu(item) {
    try {
      var hoje = R.agora().dia;
      var lista = lerMeus().filter(function (m) { return m.dia >= hoje && m.token !== item.token; });
      lista.push(item);
      localStorage.setItem(CHAVE_MEUS, JSON.stringify(lista.slice(-5)));
    } catch (e) { /* sem espaço ou bloqueado: segue sem guardar */ }
  }

  function mostrarFeito(r, pedido) {
    var b = barbeiro(r.barbeiro);
    ultimo = { dia: r.dia, inicio: r.inicio, minutos: r.minutos, servicos: pedido.servicos, curto: b.curto };
    painelFeito.querySelector("[data-feito-quando]").textContent = R.diaLongo(r.dia) + ", às " + paraHora(r.inicio);
    painelFeito.querySelector("[data-feito-detalhe]").textContent =
      G.nomesServicos(pedido.servicos) + " com " + b.curto + ". " + reais(Number(r.preco)) + ", cerca de " + duracao(r.minutos) + ".";
    painelFeito.querySelector("[data-feito-teste]").hidden = Servidor.modo !== "teste";

    var link = painelFeito.querySelector("[data-link-horario]");
    link.hidden = !r.token;
    if (r.token) {
      link.href = "#t=" + encodeURIComponent(r.token);
      guardarMeu({ token: r.token, dia: r.dia, inicio: r.inicio, curto: b.curto });
    }

    var avisarLink = painelFeito.querySelector("[data-avisar]");
    var numero = R.soDigitos(S.contato && S.contato.whatsapp);
    avisarLink.hidden = !numero;
    if (numero) {
      var msg = "Olá! Marquei pelo site: " + G.nomesServicos(pedido.servicos).toLowerCase() + ", " +
        R.diaCurto(r.dia) + " às " + paraHora(r.inicio) + ", com " + b.curto + ". Meu nome é " + pedido.nome + ".";
      avisarLink.href = "https://wa.me/" + numero + "?text=" + encodeURIComponent(msg);
    }

    form.hidden = true;
    painelFeito.hidden = false;
    painelFeito.focus({ preventScroll: true });
    painelFeito.scrollIntoView({ behavior: rolagemSuave(), block: "start" });
  }

  // Arquivo .ics: o celular abre e pergunta se quer salvar na agenda dele
  function salvarNoCelular(p) {
    function utc(dia, m) { // horário de Brasília (UTC-3, sem horário de verão)
      var d = R.dataUTC(dia); d.setUTCMinutes(m + 180);
      return d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    }
    function seguro(t) { return t.replace(/[\\;,]/g, " ").replace(/[\r\n]+/g, " "); }
    var nomeLoja = S.nome || "barbearia";
    var linhas = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FB Barbearia//Agenda//PT", "BEGIN:VEVENT",
      "UID:" + Date.now() + "-" + Math.random().toString(36).slice(2) + "@fbbarbearia",
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART:" + utc(p.dia, p.inicio), "DTEND:" + utc(p.dia, p.inicio + p.minutos),
      "SUMMARY:" + seguro(G.nomesServicos(p.servicos) + " na " + nomeLoja),
      "DESCRIPTION:" + seguro("Com " + p.curto),
      "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:" + seguro("Horário na " + nomeLoja), "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ];
    var arquivo = new Blob([linhas.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    var link = el("a");
    link.href = URL.createObjectURL(arquivo);
    link.download = "horario-fb-barbearia.ics";
    document.body.appendChild(link);
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); link.remove(); }, 1000);
  }
  painelFeito.querySelector("[data-salvar]").addEventListener("click", function () { if (ultimo) salvarNoCelular(ultimo); });

  function recomecar() {
    estado = { passo: 0, servicos: [], barbeiro: "", dia: "", hora: -1 };
    campoNome.value = ""; campoWhats.value = "";
    painelFeito.hidden = true;
    painelSeu.hidden = true;
    form.hidden = false;
    mostrarMeus();
    irPara(0, true);
  }
  painelFeito.querySelector("[data-novo]").addEventListener("click", recomecar);

  /* ---------- Seus horários (guardados neste aparelho) ---------- */

  function mostrarMeus() {
    var hoje = R.agora().dia;
    var lista = lerMeus().filter(function (m) { return m.dia >= hoje; });
    var ul = caixaMeus.querySelector("ul");
    limpar(ul);
    lista.forEach(function (m) {
      var li = el("li");
      li.appendChild(el("span", "", R.quando(m.dia, m.inicio) + ", com " + m.curto));
      var a = el("a", "", "Ver ou cancelar");
      a.href = "#t=" + encodeURIComponent(m.token);
      li.appendChild(a);
      ul.appendChild(li);
    });
    caixaMeus.hidden = !lista.length;
  }

  /* ---------- Ver ou cancelar um horário (link #t=...) ---------- */

  var tokenAberto = "";

  function mostrarSeu(token) {
    tokenAberto = token;
    form.hidden = true; painelFeito.hidden = true; caixaMeus.hidden = true;
    painelSeu.hidden = false;
    var quandoEl = painelSeu.querySelector("[data-seu-quando]");
    var detalhe = painelSeu.querySelector("[data-seu-detalhe]");
    var situacao = painelSeu.querySelector("[data-seu-situacao]");
    var cancelar = painelSeu.querySelector("[data-seu-cancelar]");
    quandoEl.textContent = "Carregando…"; detalhe.textContent = ""; situacao.textContent = ""; cancelar.hidden = true;
    painelSeu.focus({ preventScroll: true });
    Servidor.ver(token).then(function (a) {
      quandoEl.textContent = R.diaLongo(a.dia) + ", às " + paraHora(a.inicio);
      detalhe.textContent = G.nomesServicos(a.servicos) + " com " + a.barbeiro_nome + ". " + reais(Number(a.preco)) + ", cerca de " + duracao(a.minutos) + ".";
      var textos = { marcado: "Marcado.", cancelado: "Este horário foi cancelado.", faltou: "Este horário já passou.", atendido: "Atendimento feito. Volte sempre." };
      situacao.textContent = textos[a.status] || "";
      if (a.status === "marcado" && !a.pode_cancelar) situacao.textContent = "Marcado. Falta pouco para o horário: para cancelar, chame a barbearia no WhatsApp.";
      cancelar.hidden = !a.pode_cancelar;
    }, function (e) {
      quandoEl.textContent = Servidor.mensagem(e);
    });
  }

  painelSeu.querySelector("[data-seu-cancelar]").addEventListener("click", function () {
    var botao = this;
    if (!window.confirm("Cancelar este horário? Ele fica livre para outra pessoa.")) return;
    botao.disabled = true;
    botao.textContent = "Cancelando…";
    Servidor.cancelar(tokenAberto).then(function () {
      return carregarOcupados();
    }).then(function () {
      mostrarSeu(tokenAberto);
    }, function (e) {
      painelSeu.querySelector("[data-seu-situacao]").textContent = Servidor.mensagem(e);
    }).then(function () {
      botao.disabled = false;
      botao.textContent = "Cancelar horário";
    });
  });

  painelSeu.querySelector("[data-seu-novo]").addEventListener("click", function () {
    history.replaceState(null, "", location.pathname + location.search);
    recomecar();
  });

  function lerToken() {
    var m = /[#&]t=([0-9a-fA-F-]{16,64})/.exec(location.hash);
    return m ? m[1] : "";
  }
  window.addEventListener("hashchange", function () {
    var t = lerToken();
    if (t && G) mostrarSeu(t);
  });

  /* ---------- Início: link vindo do site (?servico=...&barbeiro=...&dia=...&hora=...) ---------- */

  function aplicarLink() {
    var q = new URLSearchParams(location.search);
    var servico = q.get("servico"), b = q.get("barbeiro"), dia = q.get("dia"), hora = Number(q.get("hora"));
    if (servico && G.servico(servico)) estado.servicos = [servico];
    if (b && G.barbeiro(b)) estado.barbeiro = b;
    var pronto = estado.servicos.length && estado.barbeiro && dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) && hora >= 0 &&
      G.livresDoBarbeiro(G.barbeiro(estado.barbeiro), dia, G.totalMinutos(estado.servicos)).indexOf(hora) >= 0;
    if (pronto) { estado.dia = dia; estado.hora = hora; irPara(3, false); campoNome.focus(); return; }
    irPara(estado.servicos.length && estado.barbeiro ? 2 : estado.servicos.length ? 1 : 0, false);
  }

  var faixa = document.querySelector("[data-faixa-teste]");
  if (faixa) faixa.hidden = Servidor.modo !== "teste";

  Servidor.base().then(function (base) {
    A = base;
    G = R.criar(base);
    return carregarOcupados();
  }).then(function () {
    aviso.hidden = true;
    var t = lerToken();
    if (t) { mostrarSeu(t); return; }
    form.hidden = false;
    mostrarMeus();
    aplicarLink();
  }, function (e) {
    aviso.textContent = "A agenda não carregou. " + Servidor.mensagem(e);
  });
})();
