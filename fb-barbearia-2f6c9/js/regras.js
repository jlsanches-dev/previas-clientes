/* Regras da agenda da FB Barbearia: datas, preços, tempos e horários livres.
   Usado pela página inicial (a "senha"), pela agenda e pelo painel.
   Não precisa mexer aqui: os dados vêm do banco (ou do config.js, no modo teste). */
(function () {
  "use strict";

  var DIAS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  var NOMES = { domingo: "domingo", segunda: "segunda", terca: "terça", quarta: "quarta", quinta: "quinta", sexta: "sexta", sabado: "sábado" };
  var FUSO = (window.SITE && window.SITE.fusoHorario) || "America/Sao_Paulo";

  /* ---------- Datas e horas ---------- */

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function paraMinutos(t) { var p = String(t).split(":"); return Number(p[0]) * 60 + Number(p[1]); }
  function paraHora(m) { return pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  function horaCurta(m) { return m % 60 ? paraHora(m).replace(":", "h") : (m / 60) + "h"; }

  function dataUTC(dia) { var p = dia.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function somarDias(dia, n) { var d = dataUTC(dia); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function nomeDoDia(dia) { return DIAS[dataUTC(dia).getUTCDay()]; }

  var fmtSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
  var fmtMes = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
  var fmtLongo = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  function semana(dia) { return fmtSemana.format(dataUTC(dia)).replace(".", ""); }
  function mes(dia) { return fmtMes.format(dataUTC(dia)).replace(".", ""); }
  function diaCurto(dia) { var d = dataUTC(dia); return semana(dia) + ", " + pad(d.getUTCDate()) + "/" + pad(d.getUTCMonth() + 1); }
  function diaLongo(dia) { var t = fmtLongo.format(dataUTC(dia)); return t.charAt(0).toUpperCase() + t.slice(1); }

  // Data e hora de agora no relógio da barbearia (não no do celular de quem visita)
  function agora() {
    var o = {};
    new Intl.DateTimeFormat("en-CA", {
      timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    return { dia: o.year + "-" + o.month + "-" + o.day, minutos: Number(o.hour) * 60 + Number(o.minute) };
  }

  function nomeDoDiaRelativo(dia) {
    var hoje = agora().dia;
    return dia === hoje ? "hoje" : dia === somarDias(hoje, 1) ? "amanhã" : diaCurto(dia);
  }
  function quando(dia, m) { return nomeDoDiaRelativo(dia) + " às " + paraHora(m); }

  function reais(v) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency", currency: "BRL", minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2
    }).format(v);
  }
  function duracao(m) {
    var h = Math.floor(m / 60), r = m % 60;
    return h ? h + "h" + (r ? pad(r) : "") : r + " min";
  }
  function soDigitos(t) { return String(t || "").replace(/\D/g, ""); }
  function whatsLimpo(t) {
    var d = soDigitos(t);
    if (d.length === 13 && d.indexOf("55") === 0) d = d.slice(2);
    return d;
  }
  function formatarWhats(t) {
    var d = whatsLimpo(t);
    if (d.length < 10) return t;
    var meio = d.length === 11 ? 7 : 6;
    return "(" + d.slice(0, 2) + ") " + d.slice(2, meio) + "-" + d.slice(meio, 11);
  }

  /* ---------- Regras de uma agenda (base = barbeiros, serviços, horários...) ---------- */

  function criar(base) {
    var A = base;
    var ocupados = {}; // ocupados[barbeiro][dia] = [[início, fim], ...] em minutos

    function servico(id) { return A.servicos.filter(function (s) { return s.id === id; })[0]; }
    function barbeiro(id) { return A.barbeiros.filter(function (b) { return b.id === id; })[0]; }
    function chave(ids) { return ids.slice().sort().join("+"); }
    function combinacao(ids) {
      return (A.combinacoes || []).filter(function (c) { return chave(c.servicos) === chave(ids); })[0];
    }
    function totalMinutos(ids) {
      var c = combinacao(ids);
      if (c && c.minutos) return c.minutos;
      return ids.reduce(function (t, id) { return t + servico(id).minutos; }, 0);
    }
    function totalPreco(ids) {
      var c = combinacao(ids);
      if (c && c.preco != null) return c.preco;
      return ids.reduce(function (t, id) { return t + servico(id).preco; }, 0);
    }
    function nomesServicos(ids) {
      var nomes = A.servicos.filter(function (s) { return ids.indexOf(s.id) >= 0; }).map(function (s) { return s.nome.toLowerCase(); });
      var texto = nomes.length > 1 ? nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1] : nomes[0] || "";
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function periodos(b, dia) {
      var h = ((b && b.horarios) || A.horarios)[nomeDoDia(dia)] || [];
      return h.map(function (p) { return [paraMinutos(p[0]), paraMinutos(p[1])]; });
    }

    // lista = [{ barbeiro, dia, inicio, fim }] vinda do servidor
    function guardarOcupados(lista) {
      ocupados = {};
      lista.forEach(function (o) {
        var porDia = ocupados[o.barbeiro] = ocupados[o.barbeiro] || {};
        (porDia[o.dia] = porDia[o.dia] || []).push([o.inicio, o.fim]);
      });
    }
    function ocupadosDe(b, dia) { return (ocupados[b.id] && ocupados[b.id][dia]) || []; }

    // Horários em que o barbeiro pode começar um atendimento desta duração.
    // painel: true = o barbeiro marcando pelo painel (pode ser agora, sem antecedência)
    function livresDoBarbeiro(b, dia, dur, painel) {
      var a = agora();
      if (dia < a.dia) return [];
      var minimo = dia === a.dia ? a.minutos + (painel ? 0 : A.antecedenciaMinutos) : 0;
      var ocup = ocupadosDe(b, dia);
      var lista = [];
      periodos(b, dia).forEach(function (p) {
        for (var s = p[0]; s + dur <= p[1]; s += A.intervalo) {
          if (s < minimo) continue;
          var bate = ocup.some(function (o) { return s < o[1] && s + dur > o[0]; });
          if (!bate) lista.push(s);
        }
      });
      return lista;
    }

    // Junta os horários livres de vários barbeiros: [{ inicio, barbeiros: [...] }]
    function livres(barbeiros, dia, dur, painel) {
      var mapa = {};
      barbeiros.forEach(function (b) {
        livresDoBarbeiro(b, dia, dur, painel).forEach(function (s) { (mapa[s] = mapa[s] || []).push(b); });
      });
      return Object.keys(mapa).map(Number).sort(function (x, y) { return x - y; })
        .map(function (s) { return { inicio: s, barbeiros: mapa[s] }; });
    }

    // Minutos já ocupados no dia (para "tanto faz" ficar com o menos cheio)
    function carga(b, dia) {
      return ocupadosDe(b, dia).reduce(function (t, o) { return t + o[1] - o[0]; }, 0);
    }
    function menosOcupado(barbeiros, dia) {
      return barbeiros.slice().sort(function (x, y) { return carga(x, dia) - carga(y, dia); })[0];
    }

    // O primeiro horário livre (de qualquer barbeiro da lista) para estes serviços
    function proximo(ids, barbeiros) {
      var dur = totalMinutos(ids), hoje = agora().dia, lista = barbeiros || A.barbeiros;
      for (var i = 0; i < A.diasAFrente; i++) {
        var dia = somarDias(hoje, i);
        var l = livres(lista, dia, dur);
        if (l.length) {
          var b = menosOcupado(l[0].barbeiros, dia);
          return { servicos: ids.slice(), dia: dia, inicio: l[0].inicio, barbeiro: b.id, curto: b.curto, minutos: dur };
        }
      }
      return null;
    }

    // "Aberto agora, fecha às 20h", "Fechado agora, abre amanhã às 9h"...
    function situacao() {
      var a = agora(), hoje = periodos(null, a.dia);
      for (var i = 0; i < hoje.length; i++) {
        var p = hoje[i];
        if (a.minutos >= p[0] && a.minutos < p[1]) {
          return { aberto: true, texto: hoje[i + 1] ? "Aberto agora, para o almoço às " + horaCurta(p[1]) : "Aberto agora, fecha às " + horaCurta(p[1]) };
        }
        if (a.minutos < p[0]) return { aberto: false, texto: (i ? "No almoço, volta às " : "Fechado agora, abre hoje às ") + horaCurta(p[0]) };
      }
      for (var d = 1; d <= 7; d++) {
        var dia = somarDias(a.dia, d), ps = periodos(null, dia);
        if (ps.length) return { aberto: false, texto: "Fechado agora, abre " + (d === 1 ? "amanhã" : NOMES[nomeDoDia(dia)]) + " às " + horaCurta(ps[0][0]) };
      }
      return { aberto: false, texto: "" };
    }

    function horariosDaSemana() {
      var hoje = nomeDoDia(agora().dia);
      return ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"].map(function (d) {
        var ps = A.horarios[d] || [];
        return {
          dia: NOMES[d].charAt(0).toUpperCase() + NOMES[d].slice(1), hoje: d === hoje,
          texto: ps.length ? ps.map(function (p) { return horaCurta(paraMinutos(p[0])) + " às " + horaCurta(paraMinutos(p[1])); }).join(" e ") : "Fechado"
        };
      });
    }

    return {
      base: A, servico: servico, barbeiro: barbeiro, totalMinutos: totalMinutos, totalPreco: totalPreco,
      nomesServicos: nomesServicos, periodos: periodos, guardarOcupados: guardarOcupados,
      livresDoBarbeiro: livresDoBarbeiro, livres: livres, carga: carga, menosOcupado: menosOcupado,
      proximo: proximo, situacao: situacao, horariosDaSemana: horariosDaSemana
    };
  }

  window.Regras = {
    criar: criar, agora: agora, somarDias: somarDias, nomeDoDia: nomeDoDia, dataUTC: dataUTC,
    semana: semana, mes: mes, diaCurto: diaCurto, diaLongo: diaLongo, nomeDoDiaRelativo: nomeDoDiaRelativo,
    quando: quando, reais: reais, duracao: duracao, paraHora: paraHora, paraMinutos: paraMinutos,
    horaCurta: horaCurta, soDigitos: soDigitos, whatsLimpo: whatsLimpo, formatarWhats: formatarWhats
  };
})();
