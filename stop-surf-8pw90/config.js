/* =====================================================================
   CONFIGURAÇÃO DO SITE — Stop Surf Select (DEMONSTRAÇÃO)
   ---------------------------------------------------------------------
   Dados tirados da ficha do Google, do Instagram @stopselect1 e do
   linktree da loja (19/10/2026). Tudo precisa ser conferido com a loja
   antes de publicar (veja CONVERSA.md).
   Dica: mantenha as aspas e as vírgulas exatamente como estão.
   ===================================================================== */

window.SITE = {
  nome: "Stop Surf Select",
  marca: "Stop Surf", // versão curta do nome, usada no topo da página
  slogan: "Loja de roupa no Jardim Pacaembu, em Jundiaí. Há mais de 10 anos na rua, e enviando para todo o Brasil.",
  bairro: "Jardim Pacaembu",
  cidade: "Jundiaí",

  // Fontes. Os arquivos ficam na pasta fontes/ (hospedados no próprio site).
  fontes: {
    titulo: "Big Shoulders Display", // títulos, com cara de letreiro
    texto: "Barlow"                  // textos e botões
  },

  // Cores do site (códigos hexadecimais): a loja à noite, com as luzes acesas
  cores: {
    fundo: "#121213",         // preto da fachada (fundo da página)
    superficie: "#1c1c1e",    // fundo das caixas destacadas
    texto: "#f2f0eb",         // texto principal, quase branco
    textoSuave: "#a9a7a1",    // textos secundários
    destaque: "#d6ad2b",      // dourado da coroa (botão principal)
    destaqueTexto: "#e2bd45", // dourado para texto sobre o fundo escuro
    escuro: "#0b0b0c",        // preto mais fundo (aviso de cookies)
    verde: "#6fdc8c"          // luz verde do "aberto agora"
  },

  contato: {
    whatsapp: "5511975104165", // 55 + DDD + número, só dígitos (é o mesmo da fachada)
    mensagemWhatsapp: "Oi! Vi o site da Stop e queria tirar uma dúvida.",
    telefoneExibicao: "(11) 97510-4165",
    instagram: "stopselect1", // só o @, sem o símbolo
    tiktok: "stopselect01"    // CONFIRMAR: o linktree aponta pra esse TikTok
  },

  endereco: {
    rua: "Av. dos Imigrantes Italianos, 2243",
    bairro: "Jardim Pacaembu",
    cidade: "Jundiaí",
    uf: "SP",
    cep: "13218-090",
    buscaMapa: "Stop surf, Av. dos Imigrantes Italianos, 2243 - Jardim Pacaembu, Jundiaí - SP, 13218-090",
    latitude: -23.1853402,
    longitude: -46.8546648
  },

  // Nota do Google (deixe nota: "" para esconder)
  avaliacao: {
    nota: "4,6",
    total: 79,
    link: "https://www.google.com/maps/place/Stop+surf/@-23.1853402,-46.8546648,17z/data=!4m6!3m5!1s0x94cf27b5f20ff1dd:0xcc13b7eca5623392!8m2!3d-23.1853402!4d-46.8546648!16s%2Fg%2F11rb3xqd9m"
  },

  fusoHorario: "America/Sao_Paulo",

  // Horários da ficha do Google: CONFIRMAR com a loja
  horarios: {
    segunda: ["10:00", "19:00"],
    terca:   ["10:00", "19:00"],
    quarta:  ["10:00", "19:00"],
    quinta:  ["10:00", "19:00"],
    sexta:   ["10:00", "19:00"],
    sabado:  ["09:00", "18:00"],
    domingo: "fechado"
  },
  horariosNota: "Pelo WhatsApp a gente responde também fora do horário da loja.",

  // Logo: sem arquivo por enquanto (aparece o texto de "marca")
  logo: { topo: "", src: "", alt: "" },

  // Foto principal (topo da página)
  fotoPrincipal: { src: "img/fachada.webp", alt: "Fachada preta da Stop Surf, com a coroa dourada e o letreiro em cima da porta de vidro" },

  // Vitrine: cada etiqueta abre o WhatsApp já perguntando daquela peça.
  // CONFIRMAR com a loja quais seções ela quer mostrar.
  vitrine: {
    intro: "Toque numa etiqueta e o WhatsApp abre já perguntando daquela peça. A gente manda as fotos do que tem na loja e os tamanhos.",
    mensagem: "Oi! Vi o site da Stop. Quero ver o que vocês têm de {item}.",
    itens: [
      { nome: "Camisetas", detalhe: "básicas e estampadas" },
      { nome: "Bermudas", detalhe: "tactel, jeans e moletom" },
      { nome: "Bonés", detalhe: "parede inteira de modelos" },
      { nome: "Tênis", detalhe: "corrida e casual" },
      { nome: "Calças", detalhe: "jeans e moletom" },
      { nome: "Conjuntos", detalhe: "pra sair já montado" },
      { nome: "Polos", detalhe: "lisas e listradas" },
      { nome: "Óculos", detalhe: "de sol" }
    ]
  },

  // Comprar sem vir à loja (CONFIRMAR as formas de pagamento e o envio)
  comoComprar: {
    titulo: "Comprar sem sair de casa",
    passos: [
      { titulo: "Chame no WhatsApp", texto: "Diga o que você procura ou mande o print de um post do Instagram." },
      { titulo: "Escolha com as fotos", texto: "O vendedor manda fotos da peça, os tamanhos que têm e o valor do frete." },
      { titulo: "Pague e receba", texto: "Em Jundiaí dá pra retirar na loja. Para o resto do Brasil, a gente envia." }
    ]
  },

  // Aviso sobre o Instagram oficial (o perfil antigo caiu). Deixe "" para esconder.
  avisoInstagram: "O perfil antigo da loja caiu, e o novo é o @stopselect1. Se aparecer outro perfil usando o nome da Stop pedindo Pix, desconfie. Na dúvida, chame no (11) 97510-4165: é o mesmo número que está na fachada da loja.",

  // Avaliações reais do Google (trechos curtos; o dono escolhe as definitivas)
  depoimentos: [
    { texto: "Fui muito bem atendido. Tem umas promoções bacanas e os materiais são de boa qualidade.", autor: "Lucas" },
    { texto: "Super recomendo essa loja: ótimo atendimento e produtos de primeira.", autor: "Sampa" }
  ],

  // Fotos da loja (as da demo são públicas, da ficha do Google)
  galeria: [
    { src: "img/salao-led.webp", alt: "Salão da loja com araras de roupa e luzes de LED no teto" },
    { src: "img/parede-bones.webp", alt: "Parede de bonés e araras de camisetas, com clientes no fundo" },
    { src: "img/corredor.webp", alt: "Corredor da loja com camisetas penduradas e o tapete com a coroa da Stop" },
    { src: "img/parede-coroa.webp", alt: "Parede de plantas ao lado do letreiro dourado da Stop Surf" },
    { src: "img/salao-jeans.webp", alt: "Mesas com calças jeans dobradas e araras ao fundo" },
    { src: "img/fachada-noite.webp", alt: "Fachada da loja à noite, com a coroa iluminada" }
  ],

  // Perguntas frequentes (deixe [] para esconder). ATENÇÃO: as mesmas
  // perguntas estão na ficha JSON-LD do index.html; se mudar aqui, mude lá.
  perguntas: [
    { p: "Vocês enviam para outras cidades?", r: "Enviamos para todo o Brasil. Chame no WhatsApp, diga a peça e o seu CEP, e a gente passa o valor do frete." },
    { p: "Quais formas de pagamento vocês aceitam?", r: "Pix, cartão de débito e cartão de crédito. Pergunte pelo parcelamento no WhatsApp." },
    { p: "Posso trocar se não servir?", r: "Pode. Guarde a etiqueta e chame no WhatsApp para combinar a troca." },
    { p: "Qual é o Instagram oficial da loja?", r: "É o @stopselect1. O perfil antigo caiu; desconfie de outros perfis usando o nome da Stop." },
    { p: "Dá para separar uma peça e buscar depois?", r: "Dá. Chame no WhatsApp com a foto da peça e o tamanho que a gente separa." }
  ],

  // Estatísticas de visitas (opcional, só depois de publicar).
  // Cole aqui os códigos das contas DA LOJA (não use as suas).
  // Vazio = nada é carregado e o aviso de cookies não aparece.
  // Ao preencher, troque também a linha da política de segurança (CSP)
  // no topo do index.html: a versão certa está num comentário logo abaixo dela.
  estatisticas: {
    googleAnalytics: "", // formato G-XXXXXXXXXX (Google Analytics 4)
    clarity: ""          // código do projeto no Microsoft Clarity (letras e números)
  },

  // Aviso no rodapé enquanto o site for só uma demonstração (deixe "" quando publicar)
  avisoDemo: "Demonstração feita para apresentar à loja. Ainda não é o site oficial."
};
