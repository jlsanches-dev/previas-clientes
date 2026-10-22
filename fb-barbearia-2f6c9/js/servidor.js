/* Ligação da agenda com o banco de dados.
   Modo "teste": tudo fica guardado só neste navegador (com clientes de exemplo).
   Modo "supabase": a agenda de verdade, no banco do Supabase (veja LEIAME-AGENDA.md).
   O modo e as chaves ficam no config.js (agenda.servidor). Não precisa mexer aqui. */
(function () {
  "use strict";

  var S = window.SITE || {};
  var A = S.agenda || {};
  var cfg = A.servidor || {};
  var R = window.Regras;

  function erro(codigo) { var e = new Error(codigo); e.codigo = codigo; return e; }
  function esperar(ms, valor) { return new Promise(function (ok) { setTimeout(function () { ok(valor); }, ms); }); }

  var MENSAGENS = {
    ocupado: "Esse horário acabou de ser ocupado. Escolha outro.",
    cedo_demais: "Esse horário já passou ou está muito em cima. Escolha outro.",
    longe_demais: "Ainda não dá para marcar tão para a frente.",
    horario_invalido: "Esse horário está fora do atendimento.",
    servico_invalido: "Confira os serviços escolhidos.",
    nome_invalido: "Escreva seu nome.",
    whatsapp_invalido: "Confira o WhatsApp com DDD, por exemplo (11) 91234-5678.",
    limite_whatsapp: "Este WhatsApp já tem 2 horários marcados. Para marcar outro, chame a barbearia.",
    muitos_pedidos: "Muita gente marcando agora. Tente de novo em alguns minutos.",
    tarde_para_cancelar: "Falta pouco para o horário. Para cancelar agora, chame a barbearia no WhatsApp.",
    nao_encontrado: "Não achamos esse horário. Confira o link.",
    sem_conexao: "Sem internet ou o servidor não respondeu. Tente de novo.",
    login_invalido: "E-mail ou senha errados.",
    sem_sessao: "Entre de novo com seu e-mail e senha.",
    sem_permissao: "Este usuário não está ligado a um barbeiro da FB."
  };
  function mensagem(e) { return MENSAGENS[e && e.codigo] || "Não deu certo. Tente de novo."; }

  /* =====================================================================
     MODO TESTE: um "banco" de mentira guardado no navegador
     ===================================================================== */
  function criarTeste() {
    var CHAVE = "fb-agenda-teste-v1";
    var base = {
      intervalo: A.intervalo || 15, antecedenciaMinutos: A.antecedenciaMinutos || 60,
      diasAFrente: A.diasAFrente || 14, cancelarAteMinutos: A.cancelarAteMinutos || 120,
      horarios: A.horarios || {}, barbeiros: A.barbeiros || [], servicos: A.servicos || [],
      combinacoes: A.combinacoes || [], jaIncluso: A.jaIncluso || []
    };
    var regras = R.criar(base);

    function vazio() { return { ag: [], bl: [], seq: 1, semeadoAte: "" }; }
    function ler() {
      try { return JSON.parse(localStorage.getItem(CHAVE)) || vazio(); } catch (e) { return vazio(); }
    }
    function gravar(d) { try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) { /* sem espaço: segue só na memória */ } }

    // Sorteio "fixo" por barbeiro e dia, para a agenda de teste parecer de verdade
    function sorteio(texto) {
      var h = 1779033703 ^ texto.length;
      for (var i = 0; i < texto.length; i++) { h = Math.imul(h ^ texto.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
      return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
      };
    }

    // Coloca clientes de exemplo nos dias que ainda não têm
    function semear(d) {
      var hoje = R.agora().dia;
      var curto = base.servicos[0] ? [base.servicos[0].id] : [];
      var longo = base.servicos.length > 1 ? [base.servicos[0].id, base.servicos[1].id] : curto;
      for (var i = 0; i < base.diasAFrente; i++) {
        var dia = R.somarDias(hoje, i);
        if (d.semeadoAte && dia <= d.semeadoAte) continue;
        base.barbeiros.forEach(function (b) {
          var r = sorteio(b.id + dia);
          var chance = 0.42 - i * 0.02 + (R.nomeDoDia(dia) === "sabado" ? 0.15 : 0);
          regras.periodos(b, dia).forEach(function (p) {
            var t = p[0];
            while (t < p[1]) {
              var ids = r() < 0.6 ? curto : longo, dur = regras.totalMinutos(ids);
              if (r() < chance && t + dur <= p[1]) {
                d.ag.push({ id: d.seq++, token: "", barbeiro: b.id, dia: dia, inicio: t, fim: t + dur, servicos: ids,
                  preco: regras.totalPreco(ids), nome: "Cliente de exemplo", whatsapp: "", status: "marcado", origem: "site" });
                t += dur;
              } else t += base.intervalo * 2;
            }
          });
        });
        d.semeadoAte = dia;
      }
      return d;
    }

    function dados() { var d = semear(ler()); gravar(d); return d; }
    function ocupadosDe(d) {
      return d.ag.filter(function (a) { return a.status === "marcado"; })
        .concat(d.bl).map(function (o) { return { barbeiro: o.barbeiro, dia: o.dia, inicio: o.inicio, fim: o.fim }; });
    }
    function token() {
      var b = new Uint8Array(16); crypto.getRandomValues(b);
      return Array.prototype.map.call(b, function (x) { return (x < 16 ? "0" : "") + x.toString(16); }).join("");
    }
    function minutosAte(dia, inicio) {
      var a = R.agora();
      return Math.round((R.dataUTC(dia) - R.dataUTC(a.dia)) / 60000) + inicio - a.minutos;
    }
    function validarServicos(ids) {
      if (!ids || !ids.length || ids.some(function (id) { return !regras.servico(id); })) throw erro("servico_invalido");
      base.jaIncluso.forEach(function (j) { if (ids.indexOf(j.servico) >= 0 && ids.indexOf(j.inclui) >= 0) throw erro("servico_invalido"); });
    }
    function bate(d, barbeiro, dia, ini, fim) {
      return ocupadosDe(d).some(function (o) { return o.barbeiro === barbeiro && o.dia === dia && ini < o.fim && fim > o.inicio; });
    }

    function marcar(p, doPainel) {
      return esperar(500).then(function () {
        var d = dados();
        validarServicos(p.servicos);
        var nome = String(p.nome || "").trim().replace(/\s+/g, " ").slice(0, 60);
        var whats = R.whatsLimpo(p.whatsapp);
        if (nome.length < 2) throw erro("nome_invalido");
        if (!doPainel || whats) { if (!/^\d{10,11}$/.test(whats)) throw erro("whatsapp_invalido"); }
        var dur = regras.totalMinutos(p.servicos);
        regras.guardarOcupados(ocupadosDe(d));
        var candidatos = p.barbeiro === "qualquer" ? base.barbeiros : base.barbeiros.filter(function (b) { return b.id === p.barbeiro; });
        var livres;
        if (doPainel) {
          livres = candidatos.filter(function (b) { return !bate(d, b.id, p.dia, p.inicio, p.inicio + dur); });
        } else {
          if (minutosAte(p.dia, p.inicio) < base.antecedenciaMinutos) throw erro("cedo_demais");
          var futuros = d.ag.filter(function (a) { return a.whatsapp === whats && a.status === "marcado" && minutosAte(a.dia, a.inicio) > 0; });
          if (futuros.length >= 2) throw erro("limite_whatsapp");
          livres = candidatos.filter(function (b) { return regras.livresDoBarbeiro(b, p.dia, dur).indexOf(p.inicio) >= 0; });
        }
        if (!livres.length) throw erro("ocupado");
        var b = regras.menosOcupado(livres, p.dia);
        var novo = { id: d.seq++, token: token(), barbeiro: b.id, dia: p.dia, inicio: p.inicio, fim: p.inicio + dur,
          servicos: p.servicos.slice(), preco: regras.totalPreco(p.servicos), nome: nome, whatsapp: whats,
          status: "marcado", origem: doPainel ? "painel" : "site" };
        d.ag.push(novo);
        gravar(d);
        return { id: novo.id, token: novo.token, barbeiro: novo.barbeiro, dia: novo.dia, inicio: novo.inicio, minutos: dur, preco: novo.preco };
      });
    }

    function acharPorToken(t) {
      var d = dados();
      var a = t && d.ag.filter(function (x) { return x.token === t; })[0];
      if (!a) throw erro("nao_encontrado");
      return { d: d, a: a };
    }

    return {
      modo: "teste",
      base: function () { return Promise.resolve(base); },
      ocupados: function (de, ate) {
        var d = dados();
        return Promise.resolve(ocupadosDe(d).filter(function (o) { return o.dia >= de && o.dia <= ate; }));
      },
      marcar: function (p) { return marcar(p, false); },
      ver: function (t) {
        return esperar(200).then(function () {
          var a = acharPorToken(t).a, b = regras.barbeiro(a.barbeiro);
          return { barbeiro: a.barbeiro, barbeiro_nome: b ? b.curto : a.barbeiro, dia: a.dia, inicio: a.inicio, minutos: a.fim - a.inicio,
            servicos: a.servicos, preco: a.preco, status: a.status,
            pode_cancelar: a.status === "marcado" && minutosAte(a.dia, a.inicio) >= base.cancelarAteMinutos };
        });
      },
      cancelar: function (t) {
        return esperar(400).then(function () {
          var r = acharPorToken(t);
          if (r.a.status !== "marcado") return r.a.status;
          if (minutosAte(r.a.dia, r.a.inicio) < base.cancelarAteMinutos) throw erro("tarde_para_cancelar");
          r.a.status = "cancelado"; gravar(r.d);
          return "cancelado";
        });
      },

      // Painel (no modo teste não tem senha)
      sessao: function () { return { email: "modo de teste" }; },
      entrar: function () { return Promise.resolve({ email: "modo de teste" }); },
      sair: function () { return Promise.resolve(); },
      listar: function (de, ate) {
        var d = dados();
        var lista = d.ag.filter(function (a) { return a.dia >= de && a.dia <= ate; }).map(function (a) {
          return { tipo: "agendamento", id: a.id, barbeiro: a.barbeiro, dia: a.dia, inicio: a.inicio, fim: a.fim, servicos: a.servicos,
            preco: a.preco, nome: a.nome, whatsapp: a.whatsapp, status: a.status, origem: a.origem };
        }).concat(d.bl.filter(function (b) { return b.dia >= de && b.dia <= ate; }).map(function (b) {
          return { tipo: "bloqueio", id: b.id, barbeiro: b.barbeiro, dia: b.dia, inicio: b.inicio, fim: b.fim, motivo: b.motivo };
        }));
        return Promise.resolve(lista);
      },
      status: function (id, status) {
        var d = dados();
        d.ag.forEach(function (a) { if (a.id === id) a.status = status; });
        gravar(d);
        return esperar(200);
      },
      bloquear: function (p) {
        var d = dados();
        var quem = p.barbeiro === "todos" ? base.barbeiros.map(function (b) { return b.id; }) : [p.barbeiro];
        quem.forEach(function (id) { d.bl.push({ id: d.seq++, barbeiro: id, dia: p.dia, inicio: p.inicio, fim: p.fim, motivo: p.motivo || "" }); });
        gravar(d);
        return esperar(200);
      },
      desbloquear: function (id) {
        var d = dados();
        d.bl = d.bl.filter(function (b) { return b.id !== id; });
        gravar(d);
        return esperar(200);
      },
      marcarPainel: function (p) { return marcar(p, true); },
      apagarTeste: function () { try { localStorage.removeItem(CHAVE); } catch (e) { /* nada */ } }
    };
  }

  /* =====================================================================
     MODO SUPABASE: a agenda de verdade
     ===================================================================== */
  function criarSupabase() {
    var url = String(cfg.url).replace(/\/+$/, "");
    var chave = String(cfg.chave);
    var CHAVE_SESSAO = "fb-painel-sessao";
    var DIAS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

    function lerSessao() { try { return JSON.parse(localStorage.getItem(CHAVE_SESSAO)); } catch (e) { return null; } }
    function gravarSessao(s) {
      try { if (s) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s)); else localStorage.removeItem(CHAVE_SESSAO); } catch (e) { /* nada */ }
    }
    function guardarSessao(d) {
      var s = { acesso: d.access_token, renovar: d.refresh_token, email: d.user && d.user.email,
        expira: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600) };
      gravarSessao(s);
      return s;
    }

    function traduzir(dados, status) {
      var m = dados && (dados.message || dados.msg || dados.error_description || dados.error || "");
      if (MENSAGENS[m]) return m;
      if (dados && dados.code === "23P01") return "ocupado";
      if (/invalid login|invalid_grant|credentials/i.test(m)) return "login_invalido";
      if (status === 401 || /jwt/i.test(m)) return "sem_sessao";
      return "desconhecido";
    }

    function pedir(metodo, caminho, corpo, acesso) {
      var cab = { apikey: chave, "Content-Type": "application/json" };
      if (acesso) cab.Authorization = "Bearer " + acesso;
      else if (chave.indexOf("eyJ") === 0) cab.Authorization = "Bearer " + chave; // chave "anon" antiga
      return fetch(url + caminho, { method: metodo, headers: cab, body: corpo ? JSON.stringify(corpo) : undefined })
        .then(function (r) {
          return r.text().then(function (t) {
            var dados = null;
            try { dados = t ? JSON.parse(t) : null; } catch (e) { dados = null; }
            if (!r.ok) throw erro(traduzir(dados, r.status));
            return dados;
          });
        }, function () { throw erro("sem_conexao"); });
    }
    function rpc(nome, args, acesso) { return pedir("POST", "/rest/v1/rpc/" + nome, args || {}, acesso); }
    function primeiro(lista) { return Array.isArray(lista) ? lista[0] || null : lista; }

    function sessaoValida() {
      var s = lerSessao();
      if (!s) return Promise.reject(erro("sem_sessao"));
      if (s.expira - 60 > Date.now() / 1000) return Promise.resolve(s);
      return pedir("POST", "/auth/v1/token?grant_type=refresh_token", { refresh_token: s.renovar })
        .then(guardarSessao, function () { gravarSessao(null); throw erro("sem_sessao"); });
    }
    function rpcPainel(nome, args) { return sessaoValida().then(function (s) { return rpc(nome, args, s.acesso); }); }

    function hhmm(t) { return String(t).slice(0, 5); }

    return {
      modo: "supabase",
      base: function () {
        return Promise.all([
          pedir("GET", "/rest/v1/barbeiros?select=id,nome,curto,ordem&ativo=is.true&order=ordem"),
          pedir("GET", "/rest/v1/servicos?select=id,nome,preco,minutos,ordem&ativo=is.true&order=ordem"),
          pedir("GET", "/rest/v1/combinacoes?select=chave,minutos,preco"),
          pedir("GET", "/rest/v1/ja_incluso?select=servico,inclui,aviso"),
          pedir("GET", "/rest/v1/horarios?select=barbeiro,dia_semana,inicio,fim&order=dia_semana,inicio"),
          pedir("GET", "/rest/v1/regras?select=*&id=eq.1")
        ]).then(function (r) {
          var regras = r[5][0] || {};
          var geral = {}, proprios = {};
          DIAS.forEach(function (d) { geral[d] = []; });
          r[4].forEach(function (h) {
            var alvo = geral;
            if (h.barbeiro) {
              if (!proprios[h.barbeiro]) { proprios[h.barbeiro] = {}; DIAS.forEach(function (d) { proprios[h.barbeiro][d] = []; }); }
              alvo = proprios[h.barbeiro];
            }
            alvo[DIAS[h.dia_semana]].push([hhmm(h.inicio), hhmm(h.fim)]);
          });
          return {
            intervalo: regras.intervalo || 15, antecedenciaMinutos: regras.antecedencia_minutos || 60,
            diasAFrente: regras.dias_a_frente || 14, cancelarAteMinutos: regras.cancelar_ate_minutos || 120,
            horarios: geral,
            barbeiros: r[0].map(function (b) { return { id: b.id, nome: b.nome, curto: b.curto, horarios: proprios[b.id] }; }),
            servicos: r[1].map(function (s) { return { id: s.id, nome: s.nome, preco: Number(s.preco), minutos: s.minutos }; }),
            combinacoes: r[2].map(function (c) { return { servicos: c.chave.split("+"), minutos: c.minutos, preco: c.preco == null ? null : Number(c.preco) }; }),
            jaIncluso: r[3]
          };
        });
      },
      ocupados: function (de, ate) { return rpc("agenda_ocupados", { p_de: de, p_ate: ate }); },
      marcar: function (p) {
        return rpc("agenda_marcar", { p_servicos: p.servicos, p_barbeiro: p.barbeiro, p_dia: p.dia, p_minuto: p.inicio,
          p_nome: p.nome, p_whatsapp: p.whatsapp }).then(primeiro);
      },
      ver: function (t) {
        return rpc("agenda_ver", { p_token: t }).then(function (l) { var a = primeiro(l); if (!a) throw erro("nao_encontrado"); return a; });
      },
      cancelar: function (t) { return rpc("agenda_cancelar", { p_token: t }); },

      sessao: lerSessao,
      entrar: function (email, senha) {
        return pedir("POST", "/auth/v1/token?grant_type=password", { email: email, password: senha }).then(guardarSessao);
      },
      sair: function () {
        var s = lerSessao();
        gravarSessao(null);
        return s ? pedir("POST", "/auth/v1/logout", {}, s.acesso).catch(function () { /* já saiu */ }) : Promise.resolve();
      },
      listar: function (de, ate) {
        return rpcPainel("painel_listar", { p_de: de, p_ate: ate }).then(function (l) {
          return l.map(function (x) {
            return { tipo: x.tipo, id: x.id, barbeiro: x.barbeiro, dia: x.dia, inicio: x.inicio, fim: x.fim, servicos: x.servicos || [],
              preco: x.preco == null ? null : Number(x.preco), nome: x.cliente_nome, whatsapp: x.cliente_whatsapp,
              status: x.status, origem: x.origem, motivo: x.motivo };
          });
        });
      },
      status: function (id, status) { return rpcPainel("painel_status", { p_id: id, p_status: status }); },
      bloquear: function (p) {
        return rpcPainel("painel_bloquear", { p_barbeiro: p.barbeiro, p_dia: p.dia, p_inicio: p.inicio, p_fim: p.fim, p_motivo: p.motivo || "" });
      },
      desbloquear: function (id) { return rpcPainel("painel_desbloquear", { p_id: id }); },
      marcarPainel: function (p) {
        return rpcPainel("painel_marcar", { p_servicos: p.servicos, p_barbeiro: p.barbeiro, p_dia: p.dia, p_minuto: p.inicio,
          p_nome: p.nome, p_whatsapp: p.whatsapp || "" }).then(primeiro);
      }
    };
  }

  var real = cfg.modo === "supabase" && cfg.url && cfg.chave;
  window.Servidor = real ? criarSupabase() : criarTeste();
  window.Servidor.mensagem = mensagem;
})();
