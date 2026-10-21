/* =====================================================================
   CONFIGURAÇÃO DO SITE — MB Imports (DEMONSTRAÇÃO)
   ---------------------------------------------------------------------
   Dados tirados da ficha do Google, do Instagram @mbimportss3, do
   linktree e do catálogo Kyte da loja (19 a 21/10/2026).
   As fotos da demo são do Instagram da própria loja (só para mostrar
   ao dono; não publicar sem autorização).
   Tudo precisa ser conferido com a loja antes de publicar (CONVERSA.md).
   Dica: mantenha as aspas e as vírgulas exatamente como estão.
   ===================================================================== */

window.SITE = {
  nome: "MB Imports",
  slogan: "Moda masculina premium e peças exclusivas, com loja física na Vila Maringá desde 2016.",

  // Cores do site (códigos hexadecimais), tiradas do logo da loja
  cores: {
    fundo: "#0b0b0c",      // preto do logo
    superficie: "#151517", // fundo das caixas
    texto: "#ececef",      // cromo claro (texto principal)
    textoSuave: "#9d9da5", // prata (textos secundários)
    destaque: "#d71f2b"    // vermelho da faixa "IMPORTS" do logo
  },

  contato: {
    whatsapp: "5511981004467", // 55 + DDD + número, só dígitos
    mensagemWhatsapp: "Oi! Vi o site da MB Imports e queria tirar uma dúvida.",
    telefoneExibicao: "(11) 98100-4467",
    instagram: "mbimportss3",                       // só o @, sem o símbolo
    catalogo: "https://mb-imports3.kyte.site/pt-BR" // catálogo on-line (Kyte)
  },

  endereco: {
    rua: "Av. Clemente Rosa, 1695",
    bairro: "Vila Maringá",
    cidade: "Jundiaí",
    uf: "SP",
    cep: "13210-000",
    buscaMapa: "MB Imports, Av. Clemente Rosa, 1695 - Vila Maringá, Jundiaí - SP, 13210-000"
  },

  fusoHorario: "America/Sao_Paulo",

  // Horários da ficha do Google: CONFIRMAR com a loja
  horarios: {
    segunda: ["08:00", "18:00"],
    terca:   ["08:00", "18:00"],
    quarta:  ["08:00", "18:00"],
    quinta:  ["08:00", "18:00"],
    sexta:   ["08:00", "18:00"],
    sabado:  ["08:00", "18:00"],
    domingo: "fechado"
  },

  // Fotos do topo (as três camisetas lado a lado; no celular aparece só a primeira)
  topo: [
    { src: "img/camiseta-preta.webp", alt: "Camiseta preta lisa vestida, com calça jeans" },
    { src: "img/camiseta-branca.webp", alt: "Camiseta branca lisa vestida, com calça jeans" },
    { src: "img/camiseta-verde.webp", alt: "Camiseta verde-musgo lisa vestida, com calça jeans" }
  ],

  // Categorias do catálogo (as mesmas seções do Kyte, agrupadas).
  // Cada linha abre o catálogo on-line.
  categorias: [
    { nome: "Camisetas", detalhe: "Lisas, estampadas e de time" },
    { nome: "Polos e regatas", detalhe: "Pro calor de Jundiaí" },
    { nome: "Calças", detalhe: "Jeans, cargo, alfaiataria e moletom" },
    { nome: "Bermudas", detalhe: "Tactel, jeans e de passeio" },
    { nome: "Conjuntos", detalhe: "Tactel, tricô e moletom" },
    { nome: "Moletons e jaquetas", detalhe: "Pros dias frios" },
    { nome: "Tênis e chinelos", detalhe: "Do dia a dia ao rolê" },
    { nome: "Bonés", detalhe: "Aba curva e aba reta" },
    { nome: "Óculos e relógios", detalhe: "De sol, de grau e relógios" },
    { nome: "Acessórios", detalhe: "Carteiras, cintos, shoulder bags e nécessaires" }
  ],

  // Vitrine: peças em destaque. O botão abre o WhatsApp perguntando da peça.
  destaques: [
    { src: "img/camiseta-preta.webp", alt: "Camiseta preta lisa vestida", nome: "Camiseta lisa", detalhe: "Preta" },
    { src: "img/cargo-bege.webp", alt: "Calça cargo bege com tênis branco", nome: "Calça cargo", detalhe: "Bege" },
    { src: "img/camiseta-branca.webp", alt: "Camiseta branca lisa vestida", nome: "Camiseta lisa", detalhe: "Branca" },
    { src: "img/cargo-jeans.webp", alt: "Calça cargo jeans claro com tênis branco", nome: "Calça cargo jeans", detalhe: "Azul claro" },
    { src: "img/camiseta-verde.webp", alt: "Camiseta verde-musgo lisa vestida", nome: "Camiseta lisa", detalhe: "Verde-musgo" },
    { src: "img/cargo-preta.webp", alt: "Calça cargo preta com tênis branco", nome: "Calça cargo", detalhe: "Preta" }
  ],
  mensagemPeca: "Oi! Vi no site da MB: {peca} ({cor}). Tem no meu tamanho?",

  // Como comprar (uma sequência de verdade, por isso numerada)
  passos: [
    { titulo: "Escolha", texto: "No catálogo on-line, no Instagram ou passando na loja." },
    { titulo: "Chame no WhatsApp", texto: "Mande o print da peça e o seu tamanho. A gente confirma se tem e passa o valor." },
    { titulo: "Receba", texto: "Motoboy próprio em Jundiaí e região, Sedex para todo o Brasil, ou retirada na loja." }
  ],

  // Entregas (texto do catálogo Kyte da loja)
  entregas: [
    { titulo: "Jundiaí e região", texto: "Motoboy próprio, com taxa de entrega." },
    { titulo: "Todo o Brasil", texto: "Envio pelos Correios, via Sedex." },
    { titulo: "Retirada", texto: "Na loja da Av. Clemente Rosa, assim que a peça chegar." }
  ],

  // Perguntas frequentes (deixe [] para esconder). ATENÇÃO: as mesmas
  // perguntas estão na ficha JSON-LD do index.html; se mudar aqui, mude lá.
  perguntas: [
    { p: "Vocês entregam em casa?", r: "Sim. Em Jundiaí e região com motoboy próprio, mediante taxa de entrega. Para o resto do Brasil, enviamos por Sedex." },
    { p: "Como sei se tem o meu tamanho?", r: "Mande o print da peça no WhatsApp com o seu tamanho. A gente confere no estoque e responde." },
    { p: "Quais formas de pagamento vocês aceitam?", r: "Pix, cartão de débito e cartão de crédito. Pergunte pelo parcelamento no WhatsApp." },
    { p: "Posso trocar se não servir?", r: "Pode. Guarde a etiqueta e chame no WhatsApp para combinar a troca." },
    { p: "Dá para ver as peças antes de comprar?", r: "Dá. A loja física fica na Av. Clemente Rosa, 1695, na Vila Maringá, aberta de segunda a sábado." }
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
