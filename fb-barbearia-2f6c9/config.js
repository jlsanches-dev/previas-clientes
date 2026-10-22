/* =====================================================================
   CONFIGURAÇÃO DO SITE DA FB BARBEARIA
   ---------------------------------------------------------------------
   Por enquanto só tem a AGENDA, em modo de teste. O resto do site
   (fotos, serviços, mapa...) entra depois.
   Dica: mantenha as aspas e as vírgulas exatamente como estão.
   ===================================================================== */

window.SITE = {
  nome: "FB Barbearia",
  fusoHorario: "America/Sao_Paulo",

  contato: {
    // TROCAR: WhatsApp da barbearia. 55 + DDD + número, só dígitos.
    // Vazio ("") esconde o botão "Avisar no WhatsApp".
    whatsapp: ""
  },

  agenda: {
    // Onde ficam os agendamentos:
    // modo "teste" = num banco de mentira, só neste navegador (com clientes de exemplo).
    // modo "supabase" = no banco de verdade. Veja o passo a passo em LEIAME-AGENDA.md.
    // A chave do Supabase que vai aqui é a "publishable" (pública). NUNCA cole a "secret".
    servidor: {
      modo: "teste",
      url: "",    // ex.: "https://abcdefgh.supabase.co"
      chave: ""   // ex.: "sb_publishable_..."
    },

    // No modo "supabase", as regras, os serviços e os horários abaixo ficam no banco
    // (tabelas regras, servicos, horarios...). Aqui valem só para o modo teste.
    intervalo: 15,            // os horários começam de 15 em 15 minutos (igual à SalonSoft)
    antecedenciaMinutos: 60,  // dá pra marcar para daqui a pelo menos 1 hora
    diasAFrente: 14,          // mostra as próximas 2 semanas
    cancelarAteMinutos: 120,  // o cliente cancela pelo link até 2 horas antes

    // TROCAR: horários de EXEMPLO. Confirmar com o Fernando (e o almoço).
    // Cada dia tem uma lista de períodos ["início", "fim"]. [] = fechado.
    // Um barbeiro pode ter horário próprio: é só colocar "horarios" nele.
    horarios: {
      segunda: [],
      terca:   [["09:00", "12:00"], ["13:00", "20:00"]],
      quarta:  [["09:00", "12:00"], ["13:00", "20:00"]],
      quinta:  [["09:00", "12:00"], ["13:00", "20:00"]],
      sexta:   [["09:00", "12:00"], ["13:00", "20:00"]],
      sabado:  [["08:00", "17:00"]],
      domingo: []
    },

    barbeiros: [
      { id: "fernando", nome: "Fernando Silva", curto: "Fernando" },
      { id: "diego", nome: "Diego Antunes", curto: "Diego" }
    ],

    // Serviços, preços e tempos copiados da SalonSoft em 22/10/2026.
    // Lá aparece "a partir de". Confirmar com o Fernando se o preço é fixo.
    servicos: [
      { id: "corte", nome: "Corte", preco: 40, minutos: 30 },
      { id: "barba", nome: "Barba", preco: 30, minutos: 30 },
      { id: "sobrancelha", nome: "Sobrancelha", preco: 10, minutos: 10 },
      { id: "pezinho", nome: "Pezinho", preco: 10, minutos: 10 }
    ],

    // Combinações que levam menos tempo que a soma (também vieram da SalonSoft).
    // As outras combinações somam preço e tempo normalmente.
    combinacoes: [
      { servicos: ["corte", "sobrancelha"], minutos: 30 },
      { servicos: ["barba", "sobrancelha"], minutos: 30 },
      { servicos: ["corte", "barba", "sobrancelha"], minutos: 60 }
    ],

    // Serviço que já vem dentro de outro: o site não deixa marcar os dois.
    // CONFIRMAR com o Fernando.
    jaIncluso: [
      { servico: "corte", inclui: "pezinho", aviso: "O pezinho já vem no corte." }
    ]
  }
};
