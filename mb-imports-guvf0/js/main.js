/* Monta o site a partir do config.js. Normalmente não é preciso mexer aqui.
   Segurança: todo texto do config entra na página como TEXTO (textContent),
   nunca como HTML, e só links https:// são aceitos. */
(function () {
  "use strict";
  const S = window.SITE;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  // Só aceita endereços https:// (bloqueia "javascript:" e afins)
  const urlSegura = (u) => {
    try { const x = new URL(u, location.href); return x.protocol === "https:" ? x.href : ""; }
    catch (e) { return ""; }
  };
  // Só aceita imagens do próprio site (pasta img/)
  const imgSegura = (u) => (typeof u === "string" && /^img\/[\w.\-]+$/.test(u) ? u : "");
  const linkExterno = (href, cls, txt) => {
    const a = el("a", cls, txt);
    a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
    return a;
  };
  const novaImg = (f, cls, extra) => {
    const src = f && imgSegura(f.src);
    if (!src) return null;
    const img = el("img", cls);
    img.src = src; img.alt = f.alt || "";
    Object.assign(img, extra || {});
    return img;
  };
  const sumir = (bloco) => { const n = $(`[data-bloco="${bloco}"]`); if (n) n.remove(); };

  // ---------- Cores ----------
  const raiz = document.documentElement.style;
  const mapaCores = { fundo: "--fundo", superficie: "--superficie", texto: "--texto", textoSuave: "--texto-suave", destaque: "--destaque" };
  for (const k in mapaCores) {
    const c = S.cores && S.cores[k];
    if (c && /^#[0-9a-fA-F]{3,8}$/.test(c)) raiz.setProperty(mapaCores[k], c);
  }

  // ---------- Links ----------
  const fone = String(S.contato.whatsapp || "").replace(/\D/g, "");
  const whatsCom = (msg) => `https://wa.me/${fone}?text=${encodeURIComponent(msg || "")}`;
  const whats = whatsCom(S.contato.mensagemWhatsapp);
  const catalogo = urlSegura(S.contato.catalogo) || whats;
  const rota = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(S.endereco.buscaMapa)}`;
  const links = { whatsapp: whats, rota: rota, catalogo: catalogo };
  $$("[data-link]").forEach((a) => { a.href = links[a.dataset.link]; });

  // ---------- Textos simples ----------
  $$("[data-campo]").forEach((n) => {
    const t = { slogan: S.slogan }[n.dataset.campo];
    if (t) n.textContent = t;
  });

  // ---------- Fotos do topo ----------
  const fotosTopo = $('[data-bloco="fotos-topo"]');
  (S.topo || []).forEach((f, i) => {
    const img = novaImg(f, "capa-foto", i === 0
      ? { fetchPriority: "high", width: 640, height: 640 }
      : { loading: "lazy", decoding: "async", width: 640, height: 640 });
    if (img) fotosTopo.append(img);
  });

  // ---------- Horários e "aberto agora" ----------
  const dias = [
    ["domingo", "Domingo"], ["segunda", "Segunda"], ["terca", "Terça"], ["quarta", "Quarta"],
    ["quinta", "Quinta"], ["sexta", "Sexta"], ["sabado", "Sábado"]
  ];
  const min = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const fmt = (h) => h.replace(/^0/, "").replace(":00", "h").replace(":", "h");
  const faixa = (d) => S.horarios[d];
  const agoraNaLoja = () => {
    try { return new Date(new Date().toLocaleString("en-US", { timeZone: S.fusoHorario || "America/Sao_Paulo" })); }
    catch (e) { return new Date(); }
  };
  const intervalos = [];
  dias.forEach(([chave], i) => {
    const h = faixa(chave);
    if (!Array.isArray(h)) return;
    const ini = i * 1440 + min(h[0]);
    let fim = i * 1440 + min(h[1]);
    if (fim <= ini) fim += 1440;
    intervalos.push({ ini, fim, fecha: h[1] });
  });
  function status() {
    const agora = agoraNaLoja();
    const t = agora.getDay() * 1440 + agora.getHours() * 60 + agora.getMinutes();
    for (const iv of intervalos) {
      for (const desl of [0, -10080]) {
        if (t >= iv.ini + desl && t < iv.fim + desl) return { aberto: true, texto: `Loja aberta agora, até as ${fmt(iv.fecha)}` };
      }
    }
    let melhor = null;
    for (const iv of intervalos) {
      let delta = iv.ini - t;
      if (delta < 0) delta += 10080;
      if (!melhor || delta < melhor.delta) melhor = { delta, iv };
    }
    if (!melhor) return { aberto: false, texto: "Loja fechada" };
    const diaAbre = Math.floor((melhor.iv.ini % 10080) / 1440);
    const hora = fmt(faixa(dias[diaAbre][0])[0]);
    const quando = diaAbre === agora.getDay() ? "hoje" : diaAbre === (agora.getDay() + 1) % 7 ? "amanhã" : dias[diaAbre][1].toLowerCase();
    return { aberto: false, texto: `Loja fechada agora, abre ${quando} às ${hora}` };
  }
  const st = $('[data-bloco="status"]');
  const pintarStatus = () => { const s = status(); st.textContent = s.texto; st.classList.toggle("aberto", s.aberto); };
  pintarStatus();
  setInterval(pintarStatus, 60000);

  const tabela = $('[data-bloco="horarios"]');
  const tbody = el("tbody");
  const hoje = agoraNaLoja().getDay();
  [1, 2, 3, 4, 5, 6, 0].forEach((i) => {
    const [chave, nomeDia] = dias[i];
    const h = faixa(chave);
    const tr = el("tr");
    if (i === hoje) { tr.className = "hoje"; tr.setAttribute("aria-current", "date"); }
    const th = el("th", null, nomeDia + (i === hoje ? " (hoje)" : ""));
    th.scope = "row";
    tr.append(th, el("td", null, Array.isArray(h) ? `${fmt(h[0])} às ${fmt(h[1])}` : "Fechado"));
    tbody.append(tr);
  });
  tabela.append(tbody);

  // ---------- Catálogo: lista de categorias ----------
  const listaCat = $('[data-bloco="categorias"]');
  (S.categorias || []).forEach((c) => {
    const li = el("li");
    const a = linkExterno(catalogo, "categoria");
    a.setAttribute("aria-label", `${c.nome}: abrir o catálogo on-line`);
    a.append(el("span", "categoria-nome", c.nome));
    if (c.detalhe) a.append(el("span", "categoria-detalhe", c.detalhe));
    const seta = el("span", "categoria-seta", "↗");
    seta.setAttribute("aria-hidden", "true");
    a.append(seta);
    li.append(a);
    listaCat.append(li);
  });

  // ---------- Vitrine: peças em destaque ----------
  const pecas = $('[data-bloco="pecas"]');
  (S.destaques || []).forEach((p) => {
    const img = novaImg(p, null, { loading: "lazy", decoding: "async", width: 640, height: 800 });
    if (!img) return;
    const li = el("li", "peca");
    const foto = el("div", "peca-foto");
    foto.append(img);
    const info = el("div", "peca-info");
    const titulo = el("p", "peca-nome", p.nome);
    const cor = el("p", "peca-cor", p.detalhe);
    const msg = String(S.mensagemPeca || "").replace("{peca}", p.nome).replace("{cor}", p.detalhe || "");
    const pedir = linkExterno(whatsCom(msg), "peca-pedir", "Perguntar tamanho");
    pedir.setAttribute("aria-label", `Perguntar tamanho: ${p.nome}, ${p.detalhe}`);
    info.append(titulo, cor, pedir);
    li.append(foto, info);
    pecas.append(li);
  });
  $$("[data-seta]").forEach((b) => {
    b.addEventListener("click", () => {
      const passo = pecas.querySelector(".peca");
      const largura = passo ? passo.getBoundingClientRect().width + 16 : 300;
      pecas.scrollBy({ left: Number(b.dataset.seta) * largura, behavior: "smooth" });
    });
  });

  // ---------- Como comprar ----------
  const ol = $('[data-bloco="passos"]');
  (S.passos || []).forEach((p, i) => {
    const li = el("li", "passo");
    li.append(el("span", "passo-num", String(i + 1).padStart(2, "0")));
    li.append(el("h3", null, p.titulo), el("p", null, p.texto));
    ol.append(li);
  });
  const ent = $('[data-bloco="entregas"]');
  if (S.entregas && S.entregas.length) {
    ent.append(el("h3", "entregas-titulo", "Entregas"));
    const ul = el("ul", "entregas-lista");
    S.entregas.forEach((e) => {
      const li = el("li");
      li.append(el("strong", null, e.titulo), el("span", null, e.texto));
      ul.append(li);
    });
    ent.append(ul);
  } else ent.remove();

  // ---------- Perguntas frequentes ----------
  const perguntas = S.perguntas || [];
  if (perguntas.length) {
    const caixa = $('[data-bloco="lista-perguntas"]');
    perguntas.forEach((q) => {
      const d = el("details", "pergunta");
      d.append(el("summary", null, q.p), el("p", null, q.r));
      caixa.append(d);
    });
  } else sumir("perguntas");

  // ---------- Endereço e mapa ----------
  const E = S.endereco;
  $('[data-bloco="endereco"]').append(
    E.rua, el("br"), `${E.bairro}, ${E.cidade} - ${E.uf}`, el("br"), `CEP ${E.cep}`
  );
  const iframe = el("iframe");
  iframe.title = `Mapa: ${S.nome}`;
  iframe.loading = "lazy";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  // o mapa roda isolado: não consegue mexer na página nem navegar por ela
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox");
  iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(E.buscaMapa)}&output=embed`;
  $('[data-bloco="mapa"]').append(iframe);

  // ---------- Rodapé ----------
  const rod = $('[data-bloco="rodape"]');
  const ig = String(S.contato.instagram || "").replace(/[^\w.]/g, "");
  const grade = el("div", "rodape-grade");
  const col1 = el("div");
  col1.append(el("p", "rodape-titulo", "Contato"));
  const ul = el("ul", "rodape-links");
  const item = (a) => { const li = el("li"); li.append(a); ul.append(li); };
  item(linkExterno(whats, null, `WhatsApp ${S.contato.telefoneExibicao}`));
  if (ig) item(linkExterno(`https://instagram.com/${ig}`, null, `Instagram @${ig}`));
  if (catalogo !== whats) item(linkExterno(catalogo, null, "Catálogo on-line"));
  col1.append(ul);
  const col2 = el("div");
  col2.append(el("p", "rodape-titulo", "Endereço"), el("p", "rodape-end", `${E.rua}, ${E.bairro}, ${E.cidade} - ${E.uf}`));
  grade.append(col1, col2);
  rod.append(grade);
  const pe = el("div", "rodape-pe");
  pe.append(el("p", null, `© ${new Date().getFullYear()} ${S.nome}`));
  if (S.avisoDemo) pe.append(el("p", "rodape-aviso", S.avisoDemo));
  rod.append(pe);

  // ---------- Estatísticas: só carregam se quem visita aceitar (LGPD) ----------
  const est = S.estatisticas || {};
  const gaId = /^G-[A-Z0-9]{4,15}$/.test(est.googleAnalytics || "") ? est.googleAnalytics : "";
  const clId = /^[a-z0-9]{6,15}$/.test(est.clarity || "") ? est.clarity : "";
  if (gaId || clId) {
    const CHAVE = "cookies-estatisticas";
    const ler = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
    const gravar = (v) => { try { localStorage.setItem(CHAVE, v); } catch (e) { /* navegador sem armazenamento */ } };
    const carregar = () => {
      if (gaId) {
        const s = el("script"); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.append(s);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", gaId);
      }
      if (clId) {
        window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
        const s = el("script"); s.async = true; s.src = `https://www.clarity.ms/tag/${clId}`;
        document.head.append(s);
      }
    };
    const quem = [gaId && "Google Analytics", clId && "Microsoft Clarity"].filter(Boolean).join(" e o ");
    const aviso = el("div", "aviso-cookies");
    aviso.setAttribute("role", "region");
    aviso.setAttribute("aria-label", "Aviso de cookies");
    aviso.append(el("p", null, `Podemos usar cookies para contar as visitas e melhorar o site? Os dados vão para o ${quem}.`));
    const botoes = el("div", "aviso-cookies-botoes");
    const sim = el("button", "botao botao-principal", "Aceitar"); sim.type = "button";
    const nao = el("button", "botao botao-contorno", "Recusar"); nao.type = "button";
    botoes.append(sim, nao);
    aviso.append(botoes);
    const escolher = (v) => { gravar(v); aviso.remove(); if (v === "sim") carregar(); };
    sim.addEventListener("click", () => escolher("sim"));
    nao.addEventListener("click", () => escolher("nao"));
    const escolha = ler();
    if (escolha === "sim") carregar();
    else if (escolha !== "nao") document.body.append(aviso);
    const mudar = el("button", "rodape-cookies", "Preferências de cookies");
    mudar.type = "button";
    mudar.addEventListener("click", () => { try { localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento */ } location.reload(); });
    pe.append(mudar);
  }

  // ---------- Barra do topo: fica sólida depois que sai da capa ----------
  const nav = $(".nav");
  const marcarNav = () => nav.classList.toggle("solida", window.scrollY > 40);
  marcarNav();
  window.addEventListener("scroll", marcarNav, { passive: true });

  // ---------- Botão flutuante: aparece depois que os botões da capa saem da tela ----------
  const flutuante = $(".whats-flutuante");
  const acoes = $(".capa .acoes");
  if ("IntersectionObserver" in window && acoes) {
    flutuante.classList.add("escondido");
    new IntersectionObserver(([e]) => {
      const esconder = e.isIntersecting || e.boundingClientRect.top > 0;
      flutuante.classList.toggle("escondido", esconder);
      flutuante.tabIndex = esconder ? -1 : 0;
    }).observe(acoes);
  }

  // marca a página como pronta: libera a animação de entrada do topo
  requestAnimationFrame(() => document.documentElement.classList.add("pronto"));
})();
