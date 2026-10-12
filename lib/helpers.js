const config = require('../config');

const ESTADOS = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  brevemente: 'Chega em breve',
  vendido: 'Vendido',
};

const COMBUSTIVEIS = ['Gasolina', 'Gasóleo', 'Híbrido', 'Híbrido plug-in', 'Elétrico', 'GPL'];
const CAIXAS = ['Automática', 'Manual'];

function slugify(text) {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'viatura';
}

const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('pt-PT');

function formatPrice(v) {
  return v == null ? 'Preço sob consulta' : eur.format(v);
}

function formatKm(v) {
  return v == null ? null : `${num.format(v)} km`;
}

function estadoLabel(e) {
  return ESTADOS[e] || e;
}

function carTitle(car) {
  return [car.marca, car.modelo].filter(Boolean).join(' ');
}

function waLink(message) {
  const base = `https://wa.me/${config.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

module.exports = { ESTADOS, COMBUSTIVEIS, CAIXAS, slugify, formatPrice, formatKm, estadoLabel, carTitle, waLink };
