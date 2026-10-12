// Armazenamento simples em ficheiro JSON. Chega para um stock pequeno;
// se o negócio crescer, troca por SQLite ou PostgreSQL mantendo estas funções.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { slugify } = require('./helpers');

const FILE = path.join(__dirname, '..', 'data', 'viaturas.json');

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function write(list) {
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, FILE);
}

function uniqueSlug(base, list, ignoreId) {
  let slug = base;
  let i = 2;
  while (list.some((c) => c.slug === slug && c.id !== ignoreId)) slug = `${base}-${i++}`;
  return slug;
}

function slugBase(data) {
  return slugify([data.marca, data.modelo, data.versao, data.ano].filter(Boolean).join(' '));
}

function all() {
  return read().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

function findBySlug(slug) {
  return read().find((c) => c.slug === slug) || null;
}

function findById(id) {
  return read().find((c) => c.id === id) || null;
}

function create(data) {
  const list = read();
  const now = new Date().toISOString();
  const car = {
    id: crypto.randomUUID(),
    ...data,
    slug: uniqueSlug(slugBase(data), list),
    criadoEm: now,
    atualizadoEm: now,
  };
  list.push(car);
  write(list);
  return car;
}

function update(id, data) {
  const list = read();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const merged = { ...list[idx], ...data, atualizadoEm: new Date().toISOString() };
  merged.slug = uniqueSlug(slugBase(merged), list, id);
  list[idx] = merged;
  write(list);
  return merged;
}

function remove(id) {
  const list = read();
  const car = list.find((c) => c.id === id);
  if (!car) return null;
  write(list.filter((c) => c.id !== id));
  return car;
}

module.exports = { all, findBySlug, findById, create, update, remove };
