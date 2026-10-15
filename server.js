require('dotenv').config({ quiet: true });

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const multer = require('multer');

const config = require('./config');
const store = require('./lib/store');
const h = require('./lib/helpers');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[aviso] ADMIN_PASSWORD não definida no .env: o painel de administração fica bloqueado.');
}
if (IS_PROD && !process.env.SESSION_SECRET) {
  console.error('[erro] Define SESSION_SECRET no .env antes de correr em produção.');
  process.exit(1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
if (IS_PROD) app.set('trust proxy', 1);

// Cabeçalhos de segurança básicos
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  next();
});

// Fontes servidas localmente (sem pedidos ao Google, mais simples para o RGPD)
app.use('/fonts', express.static(path.join(__dirname, 'node_modules', '@fontsource'), { maxAge: '30d' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: IS_PROD ? '7d' : 0 }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(session({
  name: 'caribi.sid',
  secret: process.env.SESSION_SECRET || 'dev-apenas-local',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: IS_PROD, maxAge: 1000 * 60 * 60 * 8 },
}));

app.use((req, res, next) => {
  Object.assign(res.locals, h, {
    config,
    currentPath: req.path,
    year: new Date().getFullYear(),
  });
  next();
});

/* ------------------------------------------------------------------ */
/* Site público                                                        */
/* ------------------------------------------------------------------ */

const visiveis = () => store.all().filter((c) => c.estado !== 'vendido');

app.get('/', (req, res) => {
  const lista = visiveis();
  const destaque = lista.find((c) => c.destaque) || lista[0] || null;
  const outras = lista.slice(0, 6);
  res.render('index', { destaque, outras });
});

app.get('/viaturas', (req, res) => {
  const todas = visiveis();
  const { marca = '', combustivel = '', ordem = 'recentes' } = req.query;

  let lista = todas.filter((c) =>
    (!marca || c.marca === marca) && (!combustivel || c.combustivel === combustivel));

  const preco = (c) => (c.preco == null ? Infinity : c.preco);
  if (ordem === 'preco-asc') lista = lista.sort((a, b) => preco(a) - preco(b));
  if (ordem === 'preco-desc') lista = lista.sort((a, b) => (b.preco ?? -1) - (a.preco ?? -1));
  if (ordem === 'km-asc') lista = lista.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));

  const marcas = [...new Set(todas.map((c) => c.marca))].sort();
  const combustiveis = [...new Set(todas.map((c) => c.combustivel).filter(Boolean))].sort();

  res.render('viaturas', {
    title: 'Viaturas',
    description: 'Automóveis premium selecionados à venda na Caribi.',
    lista, marcas, combustiveis, filtros: { marca, combustivel, ordem }, total: todas.length,
  });
});

app.get('/viaturas/:slug', (req, res, next) => {
  const car = store.findBySlug(req.params.slug);
  if (!car) return next();

  const url = `${config.siteUrl}/viaturas/${car.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: [car.marca, car.modelo, car.versao].filter(Boolean).join(' '),
    brand: { '@type': 'Brand', name: car.marca },
    model: car.modelo,
    url,
    ...(car.ano && { vehicleModelDate: String(car.ano) }),
    ...(car.km != null && { mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.km, unitCode: 'KMT' } }),
    ...(car.combustivel && { fuelType: car.combustivel }),
    ...(car.caixa && { vehicleTransmission: car.caixa }),
    ...(car.cor && { color: car.cor }),
    ...(car.fotos.length && { image: car.fotos.map((f) => `${config.siteUrl}/uploads/${f}`) }),
    ...(car.preco != null && {
      offers: {
        '@type': 'Offer',
        price: car.preco,
        priceCurrency: 'EUR',
        availability: car.estado === 'vendido' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/UsedCondition',
      },
    }),
  };

  const mensagem = `Olá! Tenho interesse no ${[car.marca, car.modelo, car.versao].filter(Boolean).join(' ')}: ${url}`;

  res.render('viatura', {
    title: [car.marca, car.modelo].join(' '),
    description: car.descricao ? car.descricao.slice(0, 155) : config.descricao,
    ogImage: car.fotos[0] ? `${config.siteUrl}/uploads/${car.fotos[0]}` : null,
    car, jsonLd, mensagem,
  });
});

app.get('/a-marca', (req, res) => res.render('marca', {
  title: 'A marca',
  description: 'Como a Caribi escolhe cada automóvel que vende.',
}));

app.get('/contactos', (req, res) => res.render('contactos', {
  title: 'Contactos',
  description: 'Fala com a Caribi por WhatsApp, telefone ou email.',
}));

app.get('/privacidade', (req, res) => res.render('privacidade', {
  title: 'Política de privacidade',
}));

/* ------------------------------------------------------------------ */
/* Administração                                                       */
/* ------------------------------------------------------------------ */

const admin = express.Router();

// Token CSRF só para quem entra no painel (o site público não cria cookies)
admin.use((req, res, next) => {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrf = req.session.csrf;
  res.locals.isAdmin = !!req.session.admin;
  next();
});

function checkCsrf(req, res, next) {
  const sent = Buffer.from(String(req.body?._csrf || ''));
  const expected = Buffer.from(String(req.session.csrf || ''));
  if (sent.length === 0 || sent.length !== expected.length || !crypto.timingSafeEqual(sent, expected)) {
    return res.status(403).send('Pedido inválido. Atualiza a página e tenta de novo.');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.admin) return next();
  res.redirect('/admin/entrar');
}

// Limite simples de tentativas de login por IP
const tentativas = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const rec = tentativas.get(ip);
  if (!rec || now - rec.inicio > 15 * 60 * 1000) return false;
  return rec.n >= 5;
}
function registerFail(ip) {
  const now = Date.now();
  const rec = tentativas.get(ip);
  if (!rec || now - rec.inicio > 15 * 60 * 1000) tentativas.set(ip, { inicio: now, n: 1 });
  else rec.n += 1;
}

function passwordOk(input) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = crypto.createHash('sha256').update(String(input)).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

admin.get('/entrar', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.render('admin/entrar', { title: 'Entrar', erro: null });
});

admin.post('/entrar', checkCsrf, (req, res) => {
  if (tooManyAttempts(req.ip)) {
    return res.status(429).render('admin/entrar', { title: 'Entrar', erro: 'Demasiadas tentativas. Espera 15 minutos e tenta de novo.' });
  }
  if (!passwordOk(req.body.password)) {
    registerFail(req.ip);
    const erro = process.env.ADMIN_PASSWORD ? 'Password incorreta.' : 'Define ADMIN_PASSWORD no ficheiro .env para ativar o painel.';
    return res.status(401).render('admin/entrar', { title: 'Entrar', erro });
  }
  tentativas.delete(req.ip);
  req.session.regenerate((err) => {
    if (err) return res.status(500).send('Erro ao iniciar sessão.');
    req.session.admin = true;
    res.redirect('/admin');
  });
});

admin.post('/sair', checkCsrf, (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

admin.get('/', requireAdmin, (req, res) => {
  res.render('admin/lista', { title: 'Viaturas', lista: store.all(), aviso: req.query.ok || null });
});

// Upload de fotografias
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 12 * 1024 * 1024, files: 30 },
  fileFilter: (req, file, cb) => cb(null, Boolean(EXT[file.mimetype])),
});

function handleUpload(req, res, next) {
  upload.array('fotos', 30)(req, res, (err) => {
    if (err) {
      req.uploadError = err.code === 'LIMIT_FILE_SIZE'
        ? 'Uma das fotografias tem mais de 12 MB. Reduz o tamanho e tenta de novo.'
        : 'Não foi possível carregar as fotografias.';
    }
    next();
  });
}

function deleteFiles(files) {
  for (const f of files) {
    if (!/^[\w-]+\.(jpg|png|webp|avif)$/.test(f)) continue;
    fs.rm(path.join(UPLOAD_DIR, f), { force: true }, () => {});
  }
}

const toNum = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};
const toLines = (v) => String(v || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

function carFromBody(b) {
  return {
    marca: String(b.marca || '').trim(),
    modelo: String(b.modelo || '').trim(),
    versao: String(b.versao || '').trim(),
    ano: toNum(b.ano),
    km: toNum(b.km),
    preco: toNum(b.preco),
    combustivel: h.COMBUSTIVEIS.includes(b.combustivel) ? b.combustivel : '',
    caixa: h.CAIXAS.includes(b.caixa) ? b.caixa : '',
    potencia: toNum(b.potencia),
    cor: String(b.cor || '').trim(),
    portas: toNum(b.portas),
    lugares: toNum(b.lugares),
    estado: h.ESTADOS[b.estado] ? b.estado : 'disponivel',
    destaque: b.destaque === 'on',
    descricao: String(b.descricao || '').trim(),
    equipamento: toLines(b.equipamento),
    historico: toLines(b.historico),
  };
}

function validate(car) {
  const erros = [];
  if (!car.marca) erros.push('Indica a marca.');
  if (!car.modelo) erros.push('Indica o modelo.');
  if (car.ano && (car.ano < 1950 || car.ano > new Date().getFullYear() + 1)) erros.push('O ano não parece correto.');
  return erros;
}

// Só uma viatura em destaque de cada vez
function clearOtherHighlights(id) {
  for (const c of store.all()) if (c.destaque && c.id !== id) store.update(c.id, { destaque: false });
}

admin.get('/viaturas/nova', requireAdmin, (req, res) => {
  res.render('admin/form', { title: 'Nova viatura', car: { fotos: [], equipamento: [], historico: [], estado: 'disponivel' }, erros: [] });
});

admin.post('/viaturas', requireAdmin, handleUpload, checkCsrf, (req, res) => {
  const novas = (req.files || []).map((f) => f.filename);
  const data = carFromBody(req.body);
  const erros = validate(data);
  if (req.uploadError) erros.push(req.uploadError);
  if (erros.length) {
    deleteFiles(novas);
    return res.status(400).render('admin/form', { title: 'Nova viatura', car: { ...data, fotos: [] }, erros });
  }
  const car = store.create({ ...data, fotos: novas });
  if (car.destaque) clearOtherHighlights(car.id);
  res.redirect('/admin?ok=criada');
});

admin.get('/viaturas/:id/editar', requireAdmin, (req, res, next) => {
  const car = store.findById(req.params.id);
  if (!car) return next();
  res.render('admin/form', { title: 'Editar viatura', car, erros: [] });
});

admin.post('/viaturas/:id', requireAdmin, handleUpload, checkCsrf, (req, res, next) => {
  const atual = store.findById(req.params.id);
  const novas = (req.files || []).map((f) => f.filename);
  if (!atual) { deleteFiles(novas); return next(); }

  const data = carFromBody(req.body);
  const erros = validate(data);
  if (req.uploadError) erros.push(req.uploadError);
  if (erros.length) {
    deleteFiles(novas);
    return res.status(400).render('admin/form', { title: 'Editar viatura', car: { ...atual, ...data }, erros });
  }

  const remover = toArray(req.body.remover).filter((f) => atual.fotos.includes(f));
  let fotos = atual.fotos.filter((f) => !remover.includes(f)).concat(novas);
  const capa = req.body.capa;
  if (capa && fotos.includes(capa)) fotos = [capa, ...fotos.filter((f) => f !== capa)];

  store.update(atual.id, { ...data, fotos });
  deleteFiles(remover);
  if (data.destaque) clearOtherHighlights(atual.id);
  res.redirect('/admin?ok=guardada');
});

admin.post('/viaturas/:id/apagar', requireAdmin, checkCsrf, (req, res) => {
  const car = store.remove(req.params.id);
  if (car) deleteFiles(car.fotos);
  res.redirect('/admin?ok=apagada');
});

app.use('/admin', admin);

/* ------------------------------------------------------------------ */

app.use((req, res) => {
  res.status(404).render('404', { title: 'Página não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Ocorreu um erro inesperado.');
});

app.listen(PORT, () => console.log(`Caribi a correr em http://localhost:${PORT}`));
