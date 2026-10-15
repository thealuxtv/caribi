// Dados da Caribi e contactos. Substitui os contactos pelos reais antes de publicar.
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
};
