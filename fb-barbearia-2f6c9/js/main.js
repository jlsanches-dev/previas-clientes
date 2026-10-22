/* Página inicial da FB Barbearia: a "senha" com o próximo horário livre,
   o "aberto agora" e a tabela de horários. A agenda fica em agenda.html
   (abre em outra aba). Não precisa mexer aqui.
   Segurança: todo texto entra como texto (textContent), nunca como código. */
(function () {
  "use strict";

  var R = window.Regras, Servidor = window.Servidor;
  if (!R || !Servidor) return;

  var senha = document.querySelector("[data-senha]");
  var semSenha = document.querySelector("[data-sem-senha]");
  var status = document.querySelector("[data-status]");
  var tabela = document.querySelector("[data-horarios]");

  function montarHorarios(G) {
    var corpo = document.createElement("tbody");
    G.horariosDaSemana().forEach(function (d) {
      var linha = document.createElement("tr");
      if (d.hoje) linha.className = "hoje";
      var dia = document.createElement("th");
      dia.scope = "row";
      dia.textContent = d.dia + (d.hoje ? " (hoje)" : "");
      var hora = document.createElement("td");
      hora.textContent = d.texto;
      linha.appendChild(dia);
      linha.appendChild(hora);
      corpo.appendChild(linha);
    });
    tabela.appendChild(corpo);
  }

  function mostrarStatus(G) {
    var s = G.situacao();
    status.textContent = s.texto;
    status.classList.toggle("aberto", s.aberto);
  }

  // A senha mostra o primeiro horário livre para o serviço principal (o corte)
  // e o botão abre a agenda (em outra aba) já com tudo escolhido.
  function mostrarSenha(G) {
    var principal = G.base.servicos[0];
    var p = principal ? G.proximo([principal.id]) : null;
    senha.hidden = !p;
    semSenha.hidden = !!p;
    if (!p) return;
    senha.querySelector("[data-senha-dia]").textContent = R.nomeDoDiaRelativo(p.dia);
    senha.querySelector("[data-senha-hora]").textContent = R.paraHora(p.inicio);
    senha.querySelector("[data-senha-detalhe]").textContent = "com " + p.curto + ", " + G.nomesServicos(p.servicos).toLowerCase() + " de " + R.duracao(p.minutos);
    var botao = senha.querySelector("[data-senha-marcar]");
    botao.textContent = "Marcar às " + R.paraHora(p.inicio);
    botao.href = "agenda.html?" + new URLSearchParams({ servico: principal.id, barbeiro: p.barbeiro, dia: p.dia, hora: String(p.inicio) }).toString();
  }

  Servidor.base().then(function (base) {
    var G = R.criar(base);
    montarHorarios(G);
    mostrarStatus(G);
    setInterval(function () { mostrarStatus(G); }, 60000);
    var hoje = R.agora().dia;
    return Servidor.ocupados(hoje, R.somarDias(hoje, base.diasAFrente)).then(function (lista) {
      G.guardarOcupados(lista);
      mostrarSenha(G);
      // quando a pessoa volta da aba da agenda, a senha se atualiza
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState !== "visible") return;
        Servidor.ocupados(hoje, R.somarDias(hoje, base.diasAFrente)).then(function (l) { G.guardarOcupados(l); mostrarSenha(G); });
      });
    });
  }).catch(function () { /* sem a agenda, o site continua com o botão "Marcar horário" */ });
})();
