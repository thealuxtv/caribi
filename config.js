// Dados da empresa. Substitui os valores entre [ ] pelos dados reais antes de publicar.
module.exports = {
  nome: 'Caribi',
  slogan: 'Selected. Refined. Driven.',
  descricao: 'Automóveis premium usados, selecionados ao detalhe. Histórico claro, estado verificado e tudo explicado antes de decidir.',
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',

  // Contactos
  telefone: '+351 900 000 000',        // como aparece no site
  telefoneLink: '+351900000000',       // sem espaços, para o link tel:
  whatsapp: '351900000000',            // indicativo + número, sem + nem espaços
  email: 'geral@caribi.pt',
  instagram: 'https://www.instagram.com/caribi.portugal/',
  linktree: 'https://linktr.ee/CARIBIPT',
  zona: 'Vila Nova de Gaia, Porto',
  horario: 'Visitas por marcação, de segunda a sábado',

  // Dados legais (obrigatórios num site de venda ao consumidor)
  razaoSocial: '[Nome legal da empresa], Lda.',
  nif: '[NIF]',
  morada: '[Morada completa da sede]',

  // Entidade de Resolução Alternativa de Litígios (RAL).
  // Confirma qual a entidade adequada ao teu caso no Portal do Consumidor.
  ral: {
    nome: 'CASA — Centro de Arbitragem do Setor Automóvel',
    url: 'https://www.arbitragemauto.pt',
  },
};
