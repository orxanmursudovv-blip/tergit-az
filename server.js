/**
 * TERGIT.AZ — Backend Server
 * Node.js + Express
 * Bütün API endpoint-ləri, JWT autentifikasiya, brute-force qorunması,
 * rate limiting, JSON fayl əsaslı verilənlər bazası.
 */

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sanitizeHtml from 'sanitize-html';
import validator from 'validator';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ============================================================
   KONFİQURASİYA
   ============================================================ */

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SITE_URL = process.env.SITE_URL || 'https://tergit.az';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'tergit-az-dev-secret-CHANGE-THIS-IN-PRODUCTION-' + Math.random().toString(36).slice(2);
const JWT_EXPIRES_IN = '24h';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'azadol2026';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 dəqiqə

if (!process.env.JWT_SECRET) {
  console.warn('[XƏBƏRDARLIQ] JWT_SECRET .env faylında təyin edilməyib. Production üçün .env faylına sabit bir JWT_SECRET əlavə edin.');
}

let ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;

/* ============================================================
   DATA QOVLUĞU VƏ FAYLLAR
   ============================================================ */

const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  messages: path.join(DATA_DIR, 'messages.json'),
  subscribers: path.join(DATA_DIR, 'subscribers.json'),
  posts: path.join(DATA_DIR, 'posts.json'),
  categories: path.join(DATA_DIR, 'categories.json'),
  blockedIps: path.join(DATA_DIR, 'blocked-ips.json'),
  pages: path.join(DATA_DIR, 'pages.json'),
  robotsTxt: path.join(DATA_DIR, 'robots.txt')
};

const SEED_CATEGORIES = [
  { id: 'cat_social', name: 'Sosial Media', slug: 'sosial-media', color: '#FFB703', createdAt: new Date().toISOString() },
  { id: 'cat_gaming', name: 'Oyun', slug: 'oyun', color: '#3FB950', createdAt: new Date().toISOString() },
  { id: 'cat_smoking', name: 'Siqaret', slug: 'siqaret', color: '#F85149', createdAt: new Date().toISOString() },
  { id: 'cat_caffeine', name: 'Kofein', slug: 'kofein', color: '#D97706', createdAt: new Date().toISOString() },
  { id: 'cat_fastfood', name: 'Fast Food', slug: 'fast-food', color: '#FB923C', createdAt: new Date().toISOString() },
  { id: 'cat_alcohol', name: 'Alkoqol', slug: 'alkoqol', color: '#60A5FA', createdAt: new Date().toISOString() },
  { id: 'cat_drugs', name: 'Narkotik', slug: 'narkotik', color: '#F472B6', createdAt: new Date().toISOString() }
];

const SEED_POSTS = [
  {
    id: 'post_1',
    title: 'Sosial Media Asılılığından Necə Qurtulmaq Olar?',
    slug: 'sosial-media-asililigindan-qurtulmaq',
    categoryId: 'cat_social',
    content:
      'Sosial media tətbiqləri bizim diqqətimizi cəlb etmək üçün xüsusi olaraq dizayn edilib. Bildiriş səsləri, sonsuz scroll funksiyası və bəyənmə sayğacları beynimizdə dopamin dövriyyəsini formalaşdırır.\n\nBirinci addım — problemi etiraf etməkdir. Telefon istifadə vaxtınızı izləyən tətbiqlərdən istifadə edərək real rəqəmləri görün. Çoxları gündə 4-5 saatdan çox sosial mediada vaxt keçirdiklərini biləndə təəccüblənir.\n\nKonkret addımlar: bildirişləri söndürün, telefonu yataq otağından kənarda saxlayın, gündəlik ekran vaxtı limiti qoyun və telefonsuz fəaliyyətlər üçün xüsusi vaxt ayırın — gəzinti, kitab oxumaq, dostlarla canlı görüş.\n\nUnutmayın: məqsəd sosial mediadan tam imtina etmək deyil, onunla sağlam münasibət qurmaqdır. Kiçik addımlarla başlayın və özünüzə qarşı mərhəmətli olun.',
    metaTitle: 'Sosial Media Asılılığından Necə Qurtulmaq Olar? | Tergit.az',
    metaDescription: 'Sosial media asılılığının səbəbləri və ondan qurtulmaq üçün praktiki addımlar. Ekran vaxtını azaltmaq üçün effektiv strategiyalar.',
    metaKeywords: 'sosial media asılılığı, ekran vaxtı, telefon asılılığı, instagram asılılığı',
    ogImage: 'https://picsum.photos/seed/tergit-social/1200/630',
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    views: 0
  },
  {
    id: 'post_2',
    title: 'Siqareti Tərk Etmənin Elmi Yolu',
    slug: 'siqareti-terk-etmenin-elmi-yolu',
    categoryId: 'cat_smoking',
    content:
      'Nikotin asılılığı bədəndə yalnız 8-12 saniyə ərzində beyinə çatır və bu sürətli effekt onu tərk etməyi xüsusilə çətinləşdirir. Lakin elmi tədqiqatlar göstərir ki, düzgün strategiya ilə uğur şansı kəskin artır.\n\nTərk etmə tarixi təyin edin və ona sadiq qalın. Siqaret çəkmək istəyini tetikləyən vəziyyətləri (stress, qəhvə, alkoqol) qabaqcadan müəyyən edin və həmin anlar üçün alternativ fəaliyyət planlaşdırın.\n\nNikotin əvəzedici terapiya (jiklət, plaster) çəkinmə əlamətlərini xeyli yumşalda bilər. İlk 72 saat ən çətin dövrdür — bədəndəki nikotin tam çıxır və bundan sonra fiziki istək azalmağa başlayır.\n\nDəstək sistemi qurun: ailə, dostlar və ya tərk etmə qrupları prosesi xeyli asanlaşdırır. Hər təkrar uğursuzluq son deyil, sadəcə təcrübədir — çoxları bir neçə cəhddən sonra tam tərk edə bilir.',
    metaTitle: 'Siqareti Tərk Etmənin Elmi Yolu | Tergit.az',
    metaDescription: 'Nikotin asılılığının elmi əsasları və siqareti uğurla tərk etmək üçün sübuta əsaslanan strategiyalar.',
    metaKeywords: 'siqareti tərk etmək, nikotin asılılığı, siqaretdən qurtulmaq',
    ogImage: 'https://picsum.photos/seed/tergit-smoking/1200/630',
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    views: 0
  }
];

function emptyArrayFile() {
  return '[]';
}

async function ensureDataFiles() {
  await fsp.mkdir(DATA_DIR, { recursive: true });

  const DEFAULT_ROBOTS = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${SITE_URL}/sitemap.xml`;

  const defaults = {
    [FILES.messages]: emptyArrayFile(),
    [FILES.subscribers]: emptyArrayFile(),
    [FILES.posts]: JSON.stringify(SEED_POSTS, null, 2),
    [FILES.categories]: JSON.stringify(SEED_CATEGORIES, null, 2),
    [FILES.blockedIps]: '{}',
    [FILES.pages]: emptyArrayFile(),
    [FILES.robotsTxt]: DEFAULT_ROBOTS
  };

  for (const [filePath, defaultContent] of Object.entries(defaults)) {
    try {
      await fsp.access(filePath, fs.constants.F_OK);
    } catch {
      await fsp.writeFile(filePath, defaultContent, 'utf-8');
      console.log(`[DATA] Yaradıldı: ${path.basename(filePath)}`);
    }
  }
}

/* ---------- Fayl oxuma/yazma (sıra ilə, race-condition qarşısının alınması) ---------- */

const writeQueues = new Map();

function queueWrite(filePath, task) {
  const prev = writeQueues.get(filePath) || Promise.resolve();
  const next = prev.then(task).catch((err) => {
    console.error(`[FAYL XƏTASI] ${filePath}:`, err.message);
    throw err;
  });
  writeQueues.set(filePath, next);
  return next;
}

async function readData(filePath) {
  try {
    const raw = await fsp.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[OXUMA XƏTASI] ${filePath}:`, err.message);
    return filePath === FILES.blockedIps ? {} : [];
  }
}

async function writeData(filePath, data) {
  return queueWrite(filePath, () => fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8'));
}

/* ============================================================
   KÖMƏKÇİ FUNKSİYALAR
   ============================================================ */

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeText(input, { multiline = false } = {}) {
  if (typeof input !== 'string') return '';
  const cleaned = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  const trimmed = cleaned.trim();
  return multiline ? trimmed : trimmed.replace(/\s+/g, ' ');
}

const AZ_TRANSLITERATION = {
  ə: 'e', Ə: 'e', ı: 'i', I: 'i', İ: 'i', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u',
  ş: 's', Ş: 's', ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g'
};

function slugify(input) {
  if (typeof input !== 'string') return '';
  let str = input;
  for (const [letter, replacement] of Object.entries(AZ_TRANSLITERATION)) {
    str = str.split(letter).join(replacement);
  }
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function success(res, data, message = '', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function failure(res, error, status = 400, message = '') {
  return res.status(status).json({ success: false, error, message: message || error });
}

function getClientIp(req) {
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

/* ============================================================
   BRUTE-FORCE QORUNMASI (login)
   ============================================================ */

async function getBruteForceRecord(ip) {
  const all = await readData(FILES.blockedIps);
  return { all, record: all[ip] || { attempts: 0, blockedUntil: null, lastAttempt: null } };
}

async function checkBruteForce(req, res, next) {
  const ip = getClientIp(req);
  const { record } = await getBruteForceRecord(ip);

  if (record.blockedUntil && record.blockedUntil > Date.now()) {
    const remainingMs = record.blockedUntil - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return failure(
      res,
      'TOO_MANY_ATTEMPTS',
      429,
      `Çox sayda yanlış cəhd. ${remainingMin} dəqiqə sonra yenidən cəhd edin.`
    );
  }
  next();
}

async function recordFailedLogin(ip) {
  const { all, record } = await getBruteForceRecord(ip);
  const now = Date.now();

  // Əgər əvvəlki blok müddəti bitibsə, sayğacı sıfırla
  if (record.blockedUntil && record.blockedUntil <= now) {
    record.attempts = 0;
    record.blockedUntil = null;
  }

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = now + LOGIN_BLOCK_DURATION_MS;
  }

  all[ip] = record;
  await writeData(FILES.blockedIps, all);
  return record;
}

async function clearFailedLogins(ip) {
  const { all } = await getBruteForceRecord(ip);
  delete all[ip];
  await writeData(FILES.blockedIps, all);
}

/* ============================================================
   JWT AUTENTİFİKASİYA MIDDLEWARE
   ============================================================ */

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return failure(res, 'NO_TOKEN', 401, 'Giriş tələb olunur. Token tapılmadı.');
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return failure(res, 'INVALID_TOKEN', 403, 'Token yanlışdır və ya müddəti bitib.');
    }
    req.user = payload;
    next();
  });
}

/* ============================================================
   EXPRESS APP
   ============================================================ */

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

app.use(compression());
app.use(express.json({ limit: '10kb' }));

/* ---------- Ümumi rate limit (100 sorğu / 15 dəq) ---------- */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => failure(res, 'RATE_LIMITED', 429, 'Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.')
});
app.use('/api', generalLimiter);

/* ---------- Forma limiti (5 / saat) ---------- */
const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => failure(res, 'FORM_RATE_LIMITED', 429, 'Saatda maksimum 5 mesaj göndərə bilərsiniz. Sonra yenidən cəhd edin.')
});

/* ---------- Login limiti (5 cəhd / 15 dəq) ---------- */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => failure(res, 'LOGIN_RATE_LIMITED', 429, 'Çox sayda giriş cəhdi. 15 dəqiqə sonra yenidən cəhd edin.')
});

/* ============================================================
   CANLI STATİSTİKA (yaddaşda saxlanılan ziyarət sayğacı)
   ============================================================ */

let liveVisitCounter = 0;
const serverStartTime = Date.now();

/* ============================================================
   ROUTES — SAĞLAMLIQ
   ============================================================ */

app.get('/api/health', (req, res) => {
  liveVisitCounter += 1;
  return success(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    liveVisits: liveVisitCounter
  }, 'Server işləkdir');
});

/* ============================================================
   ROUTES — AUTH
   ============================================================ */

app.post('/api/auth/login', loginLimiter, checkBruteForce, async (req, res) => {
  try {
    const username = sanitizeText(req.body?.username);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const ip = getClientIp(req);

    if (!username || !password) {
      return failure(res, 'MISSING_FIELDS', 400, 'İstifadəçi adı və şifrə tələb olunur.');
    }

    if (!ADMIN_PASSWORD_HASH) {
      ADMIN_PASSWORD_HASH = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
    }

    const validUsername = username === ADMIN_USERNAME;
    const validPassword = validUsername && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

    if (!validUsername || !validPassword) {
      const record = await recordFailedLogin(ip);
      const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - record.attempts);
      return failure(
        res,
        'INVALID_CREDENTIALS',
        401,
        remaining > 0
          ? `İstifadəçi adı və ya şifrə yanlışdır. Qalan cəhd sayı: ${remaining}.`
          : 'Çox sayda yanlış cəhd. Hesab 15 dəqiqə bloklandı.'
      );
    }

    await clearFailedLogins(ip);

    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return success(res, { token, expiresIn: JWT_EXPIRES_IN, username }, 'Giriş uğurludur.');
  } catch (err) {
    console.error(err);
    return failure(res, 'SERVER_ERROR', 500, 'Server xətası baş verdi.');
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // JWT stateless olduğu üçün server tərəfdə blacklist saxlanmır;
  // frontend tokeni localStorage-dan silməlidir. Bu endpoint audit/uyğunluq üçündür.
  return success(res, null, 'Çıxış edildi.');
});

/* ============================================================
   ROUTES — ƏLAQƏ MESAJLARI
   ============================================================ */

app.post('/api/contact', formLimiter, async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name);
    const email = sanitizeText(req.body?.email);
    const message = sanitizeText(req.body?.message, { multiline: true });

    if (!name || !email || !message) {
      return failure(res, 'MISSING_FIELDS', 400, 'Ad, e-mail və mesaj tələb olunur.');
    }
    if (!validator.isEmail(email)) {
      return failure(res, 'INVALID_EMAIL', 400, 'E-mail ünvanı yanlışdır.');
    }
    if (name.length > 100 || message.length > 3000) {
      return failure(res, 'TOO_LONG', 400, 'Daxil edilən mətn həddindən uzundur.');
    }

    const messages = await readData(FILES.messages);

    // Duplicate yoxlanması — eyni e-maildən son 10 dəqiqə ərzində mesaj varsa blok
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const duplicate = messages.find(
      (m) => m.email.toLowerCase() === email.toLowerCase() && new Date(m.createdAt).getTime() > tenMinutesAgo
    );
    if (duplicate) {
      return failure(res, 'DUPLICATE_MESSAGE', 429, 'Bu e-maildən artıq mesaj göndərilib. Bir az gözləyib yenidən cəhd edin.');
    }

    const newMessage = {
      id: generateId('msg'),
      name,
      email,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    await writeData(FILES.messages, messages);

    return success(res, { id: newMessage.id }, 'Mesajınız uğurla göndərildi.', 201);
  } catch (err) {
    console.error(err);
    return failure(res, 'SERVER_ERROR', 500, 'Server xətası baş verdi.');
  }
});

app.get('/api/messages', authenticateToken, async (req, res) => {
  const messages = await readData(FILES.messages);
  const sorted = [...messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return success(res, sorted, 'Mesajlar gətirildi.');
});

app.put('/api/messages/:id/read', authenticateToken, async (req, res) => {
  const messages = await readData(FILES.messages);
  const index = messages.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return failure(res, 'NOT_FOUND', 404, 'Mesaj tapılmadı.');
  }
  messages[index].read = true;
  await writeData(FILES.messages, messages);
  return success(res, messages[index], 'Mesaj oxundu olaraq işarələndi.');
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
  const messages = await readData(FILES.messages);
  const filtered = messages.filter((m) => m.id !== req.params.id);
  if (filtered.length === messages.length) {
    return failure(res, 'NOT_FOUND', 404, 'Mesaj tapılmadı.');
  }
  await writeData(FILES.messages, filtered);
  return success(res, null, 'Mesaj silindi.');
});

/* ============================================================
   ROUTES — ABUNƏLİK
   ============================================================ */

app.post('/api/subscribe', formLimiter, async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email);
    if (!email || !validator.isEmail(email)) {
      return failure(res, 'INVALID_EMAIL', 400, 'Düzgün e-mail ünvanı daxil edin.');
    }

    const subscribers = await readData(FILES.subscribers);
    const exists = subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return failure(res, 'ALREADY_SUBSCRIBED', 409, 'Bu e-mail artıq abunə olub.');
    }

    const newSubscriber = {
      id: generateId('sub'),
      email,
      createdAt: new Date().toISOString()
    };
    subscribers.push(newSubscriber);
    await writeData(FILES.subscribers, subscribers);

    return success(res, { id: newSubscriber.id }, 'Abunəlik uğurla tamamlandı.', 201);
  } catch (err) {
    console.error(err);
    return failure(res, 'SERVER_ERROR', 500, 'Server xətası baş verdi.');
  }
});

app.get('/api/subscribers', authenticateToken, async (req, res) => {
  const subscribers = await readData(FILES.subscribers);
  const sorted = [...subscribers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return success(res, sorted, 'Abunəçilər gətirildi.');
});

app.delete('/api/subscribers/:id', authenticateToken, async (req, res) => {
  const subscribers = await readData(FILES.subscribers);
  const filtered = subscribers.filter((s) => s.id !== req.params.id);
  if (filtered.length === subscribers.length) {
    return failure(res, 'NOT_FOUND', 404, 'Abunəçi tapılmadı.');
  }
  await writeData(FILES.subscribers, filtered);
  return success(res, null, 'Abunəçi silindi.');
});

/* ============================================================
   ROUTES — KATEQORİYALAR
   ============================================================ */

app.get('/api/categories', async (req, res) => {
  const categories = await readData(FILES.categories);
  return success(res, categories, 'Kateqoriyalar gətirildi.');
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name);
    const color = sanitizeText(req.body?.color) || '#FFB703';
    let slug = sanitizeText(req.body?.slug);

    if (!name) {
      return failure(res, 'MISSING_FIELDS', 400, 'Kateqoriya adı tələb olunur.');
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return failure(res, 'INVALID_COLOR', 400, 'Rəng HEX formatında olmalıdır (məs: #FFB703).');
    }

    slug = slug ? slugify(slug) : slugify(name);
    if (!slug) {
      return failure(res, 'INVALID_SLUG', 400, 'Slug yaradıla bilmədi, fərqli ad sınayın.');
    }

    const categories = await readData(FILES.categories);
    if (categories.find((c) => c.slug === slug)) {
      return failure(res, 'DUPLICATE_SLUG', 409, 'Bu slug artıq istifadə olunur.');
    }

    const newCategory = {
      id: generateId('cat'),
      name,
      slug,
      color,
      createdAt: new Date().toISOString()
    };
    categories.push(newCategory);
    await writeData(FILES.categories, categories);

    return success(res, newCategory, 'Kateqoriya əlavə edildi.', 201);
  } catch (err) {
    console.error(err);
    return failure(res, 'SERVER_ERROR', 500, 'Server xətası baş verdi.');
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  const categories = await readData(FILES.categories);
  const filtered = categories.filter((c) => c.id !== req.params.id);
  if (filtered.length === categories.length) {
    return failure(res, 'NOT_FOUND', 404, 'Kateqoriya tapılmadı.');
  }
  await writeData(FILES.categories, filtered);
  return success(res, null, 'Kateqoriya silindi.');
});

/* ============================================================
   ROUTES — BLOQ YAZILARI
   ============================================================ */

app.get('/api/posts', async (req, res) => {
  const posts = await readData(FILES.posts);
  const published = posts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return success(res, published, 'Məqalələr gətirildi.');
});

app.get('/api/posts/:slug', async (req, res) => {
  const posts = await readData(FILES.posts);
  const post = posts.find((p) => p.slug === req.params.slug && p.published);
  if (!post) {
    return failure(res, 'NOT_FOUND', 404, 'Məqalə tapılmadı.');
  }
  post.views = (post.views || 0) + 1;
  await writeData(FILES.posts, posts);
  return success(res, post, 'Məqalə gətirildi.');
});

app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const title = sanitizeText(req.body?.title);
    const content = sanitizeText(req.body?.content, { multiline: true });
    const categoryId = sanitizeText(req.body?.categoryId);
    let slug = sanitizeText(req.body?.slug);
    const metaTitle = sanitizeText(req.body?.metaTitle) || title;
    const metaDescription = sanitizeText(req.body?.metaDescription, { multiline: true });
    const metaKeywords = sanitizeText(req.body?.metaKeywords);
    const focusKeyword = sanitizeText(req.body?.focusKeyword);
    const canonicalUrl = sanitizeText(req.body?.canonicalUrl);
    const robotsMeta = req.body?.robotsMeta === 'noindex' ? 'noindex' : 'index';
    const inSitemap = req.body?.inSitemap !== false;
    const ogImage = sanitizeText(req.body?.ogImage);
    const featuredImage = sanitizeText(req.body?.featuredImage);
    const featuredImageAlt = sanitizeText(req.body?.featuredImageAlt);
    const useFeaturedAsOg = req.body?.useFeaturedAsOg !== false;
    const faqs = Array.isArray(req.body?.faqs) ? req.body.faqs : [];
    const showFaqOnPage = req.body?.showFaqOnPage !== false;
    const published = Boolean(req.body?.published);

    if (!title || !content || !categoryId) {
      return failure(res, 'MISSING_FIELDS', 400, 'Başlıq, məzmun və kateqoriya tələb olunur.');
    }

    const finalOgImage = useFeaturedAsOg ? featuredImage : ogImage;
    if (finalOgImage && !validator.isURL(finalOgImage, { require_protocol: true })) {
      return failure(res, 'INVALID_URL', 400, 'OG şəkil URL düzgün formatda olmalıdır.');
    }

    const categories = await readData(FILES.categories);
    if (!categories.find((c) => c.id === categoryId)) {
      return failure(res, 'INVALID_CATEGORY', 400, 'Seçilmiş kateqoriya mövcud deyil.');
    }

    slug = slug ? slugify(slug) : slugify(title);
    if (!slug) {
      return failure(res, 'INVALID_SLUG', 400, 'Slug yaradıla bilmədi, fərqli başlıq sınayın.');
    }

    const posts = await readData(FILES.posts);
    if (posts.find((p) => p.slug === slug)) {
      return failure(res, 'DUPLICATE_SLUG', 409, 'Bu slug artıq istifadə olunur.');
    }

    const now = new Date().toISOString();
    const newPost = {
      id: generateId('post'),
      title, slug, categoryId, content,
      metaTitle, metaDescription, metaKeywords,
      focusKeyword, canonicalUrl, robotsMeta, inSitemap,
      ogImage: finalOgImage, featuredImage, featuredImageAlt,
      useFeaturedAsOg, faqs, showFaqOnPage,
      published, createdAt: now, updatedAt: now, views: 0
    };

    posts.push(newPost);
    await writeData(FILES.posts, posts);
    return success(res, newPost, 'Məqalə əlavə edildi.', 201);
  } catch (err) {
    console.error(err);
    return failure(res, 'SERVER_ERROR', 500, 'Server xətası baş verdi.');
  }
});

app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const posts = await readData(FILES.posts);
    const index = posts.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return failure(res, 'NOT_FOUND', 404, 'Məqalə tapılmadı.');
    }

    const existing = posts[index];
    const title = req.body?.title !== undefined ? sanitizeText(req.body.title) : existing.title;
    const content = req.body?.content !== undefined ? sanitizeText(req.body.content, { multiline: true }) : existing.content;
    const categoryId = req.body?.categoryId !== undefined ? sanitizeText(req.body.categoryId) : existing.categoryId;
    let slug = req.body?.slug !== undefined ? slugify(sanitizeText(req.body.slug)) : existing.slug;
    const metaTitle = req.body?.metaTitle !== undefined ? sanitizeText(req.body.metaTitle) : existing.metaTitle;
    const metaDescription = req.body?.metaDescription !== undefined ? sanitizeText(req.body.metaDescription, { multiline: true }) : existing.metaDescription;
    const metaKeywords = req.body?.metaKeywords !== undefined ? sanitizeText(req.body.metaKeywords) : existing.metaKeywords;
    const focusKeyword = req.body?.focusKeyword !== undefined ? sanitizeText(req.body.focusKeyword) : existing.focusKeyword;
    const canonicalUrl = req.body?.canonicalUrl !== undefined ? sanitizeText(req.body.canonicalUrl) : existing.canonicalUrl;
    const robotsMeta = req.body?.robotsMeta !== undefined ? (req.body.robotsMeta === 'noindex' ? 'noindex' : 'index') : existing.robotsMeta;
    const inSitemap = req.body?.inSitemap !== undefined ? req.body.inSitemap !== false : existing.inSitemap;
    const featuredImage = req.body?.featuredImage !== undefined ? sanitizeText(req.body.featuredImage) : existing.featuredImage;
    const featuredImageAlt = req.body?.featuredImageAlt !== undefined ? sanitizeText(req.body.featuredImageAlt) : existing.featuredImageAlt;
    const useFeaturedAsOg = req.body?.useFeaturedAsOg !== undefined ? Boolean(req.body.useFeaturedAsOg) : existing.useFeaturedAsOg;
    const rawOgImage = req.body?.ogImage !== undefined ? sanitizeText(req.body.ogImage) : existing.ogImage;
    const ogImage = useFeaturedAsOg ? featuredImage : rawOgImage;
    const faqs = req.body?.faqs !== undefined ? (Array.isArray(req.body.faqs) ? req.body.faqs : []) : (existing.faqs || []);
    const showFaqOnPage = req.body?.showFaqOnPage !== undefined ? Boolean(req.body.showFaqOnPage) : existing.showFaqOnPage;
    const published = req.body?.published !== undefined ? Boolean(req.body.published) : existing.published;

    if (!title || !content || !categoryId) {
      return failure(res, 'MISSING_FIELDS', 400, 'Başlıq, məzmun və kateqoriya tələb olunur.');
    }
    if (!slug) {
      return failure(res, 'INVALID_SLUG', 400, 'Slug boş ola bilməz.');
    }

    const slugConflict = posts.find((p) => p.slug === slug && p.id !== existing.id);
    if (slugConflict) {
      return failure(res, 'DUPLICATE_SLUG', 409, 'Bu slug artıq istifadə olunur.');
    }

    const categories = await readData(FILES.categories);
    if (!categories.find((c) => c.id === categoryId)) {
      return failure(res, 'INVALID_CATEGORY', 400, 'Seçilmiş kateqoriya mövcud deyil.');
    }

    posts[index] = {
      ...existing,
      title, content, categoryId, slug,
      metaTitle, metaDescription, metaKeywords,
      focusKeyword, canonicalUrl, robotsMeta, inSitemap,
      ogImage, featuredImage, featuredImageAlt, useFeaturedAsOg,
      faqs, showFaqOnPage, published,
      updatedAt: new Date().toISOString()
    };

    await writeData(FILES.posts, posts);
    return success(res, posts[index], 'Məqalə yeniləndi.');
  } catch (err) {
    console.error(err);
    return failure(res, 'SERVER_ERROR', 500, 'Server xətası baş verdi.');
  }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const posts = await readData(FILES.posts);
  const filtered = posts.filter((p) => p.id !== req.params.id);
  if (filtered.length === posts.length) {
    return failure(res, 'NOT_FOUND', 404, 'Məqalə tapılmadı.');
  }
  await writeData(FILES.posts, filtered);
  return success(res, null, 'Məqalə silindi.');
});

/* ---------- Admin üçün BÜTÜN məqalələr (dərc olunmamışlar daxil) ---------- */
app.get('/api/admin/posts', authenticateToken, async (req, res) => {
  const posts = await readData(FILES.posts);
  const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return success(res, sorted, 'Bütün məqalələr gətirildi.');
});

/* ============================================================
   ROUTES — STATİSTİKA (admin)
   ============================================================ */

app.get('/api/stats', authenticateToken, async (req, res) => {
  const [posts, messages, subscribers, categories] = await Promise.all([
    readData(FILES.posts),
    readData(FILES.messages),
    readData(FILES.subscribers),
    readData(FILES.categories)
  ]);

  return success(
    res,
    {
      totalPosts: posts.length,
      publishedPosts: posts.filter((p) => p.published).length,
      draftPosts: posts.filter((p) => !p.published).length,
      totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
      totalCategories: categories.length,
      totalMessages: messages.length,
      unreadMessages: messages.filter((m) => !m.read).length,
      totalSubscribers: subscribers.length,
      liveVisits: liveVisitCounter,
      uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000)
    },
    'Statistika gətirildi.'
  );
});

/* ============================================================
   ROUTES — SEO: SITEMAP & ROBOTS
   ============================================================ */

app.get('/sitemap.xml', async (req, res) => {
  try {
    const [posts, categories] = await Promise.all([
      readData(FILES.posts),
      readData(FILES.categories)
    ]);

    const now = new Date().toISOString().split('T')[0];

    const staticUrls = [
      { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: now },
      { loc: '/asililiqlar', priority: '0.9', changefreq: 'weekly', lastmod: now },
      { loc: '/bloq', priority: '0.9', changefreq: 'daily', lastmod: now },
      { loc: '/elaqe', priority: '0.6', changefreq: 'monthly', lastmod: now }
    ];

    const urlEntries = staticUrls
      .map((u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

    // Yalnız dərc olunmuş və inSitemap:false olmayan məqalələr
    const publishedPosts = posts.filter((p) => p.published && p.inSitemap !== false);
    const postEntries = publishedPosts
      .map((p) => `  <url>
    <loc>${SITE_URL}/bloq/${p.slug}</loc>
    <lastmod>${(p.updatedAt || p.createdAt || now).split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

    // Kateqoriyalar
    const catEntries = categories
      .map((c) => `  <url>
    <loc>${SITE_URL}/bloq?cat=${c.slug}</loc>
    <lastmod>${(c.updatedAt || c.createdAt || now).split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
${postEntries}
${catEntries}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Sitemap yaradıla bilmədi.');
  }
});

app.get('/robots.txt', async (req, res) => {
  try {
    const content = await fsp.readFile(FILES.robotsTxt, 'utf-8');
    res.header('Content-Type', 'text/plain');
    return res.send(content);
  } catch {
    res.header('Content-Type', 'text/plain');
    return res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${SITE_URL}/sitemap.xml`);
  }
});

/* ============================================================
   ROUTES — SƏHİFƏ İDARƏSİ
   ============================================================ */

app.get('/api/pages', authenticateToken, async (req, res) => {
  try {
    const pages = await readData(FILES.pages);
    return success(res, pages, 'Səhifələr gətirildi.');
  } catch (err) {
    return failure(res, 'SERVER_ERROR', 500, 'Səhifələr yüklənə bilmədi.');
  }
});

app.post('/api/pages', authenticateToken, async (req, res) => {
  try {
    const { title, slug, content, active, showInMenu, menuOrder, featuredImage, metaTitle, metaDescription, canonicalUrl, robotsMeta, inSitemap, ogImage, ogTitle, ogDescription } = req.body;
    if (!title?.trim() || !slug?.trim()) return failure(res, 'VALIDATION', 400, 'Başlıq və slug tələb olunur.');
    const pages = await readData(FILES.pages);
    if (pages.find((p) => p.slug === slug.trim())) return failure(res, 'DUPLICATE', 409, 'Bu slug artıq mövcuddur.');
    const page = {
      id: `page_${Date.now()}`,
      title: title.trim(), slug: slug.trim(), content: content || '',
      active: active !== false, showInMenu: showInMenu !== false,
      menuOrder: parseInt(menuOrder) || 0,
      featuredImage: featuredImage || '', metaTitle: metaTitle || '',
      metaDescription: metaDescription || '', canonicalUrl: canonicalUrl || '',
      robotsMeta: robotsMeta || 'index', inSitemap: inSitemap !== false,
      ogImage: ogImage || '', ogTitle: ogTitle || '', ogDescription: ogDescription || '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    pages.push(page);
    await writeData(FILES.pages, pages);
    return success(res, page, 'Səhifə əlavə edildi.');
  } catch (err) {
    return failure(res, 'SERVER_ERROR', 500, 'Səhifə əlavə edilə bilmədi.');
  }
});

app.put('/api/pages/:id', authenticateToken, async (req, res) => {
  try {
    const pages = await readData(FILES.pages);
    const idx = pages.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return failure(res, 'NOT_FOUND', 404, 'Səhifə tapılmadı.');
    pages[idx] = { ...pages[idx], ...req.body, id: pages[idx].id, updatedAt: new Date().toISOString() };
    await writeData(FILES.pages, pages);
    return success(res, pages[idx], 'Səhifə yeniləndi.');
  } catch (err) {
    return failure(res, 'SERVER_ERROR', 500, 'Səhifə yenilənə bilmədi.');
  }
});

app.delete('/api/pages/:id', authenticateToken, async (req, res) => {
  try {
    const pages = await readData(FILES.pages);
    const filtered = pages.filter((p) => p.id !== req.params.id);
    if (filtered.length === pages.length) return failure(res, 'NOT_FOUND', 404, 'Səhifə tapılmadı.');
    await writeData(FILES.pages, filtered);
    return success(res, null, 'Səhifə silindi.');
  } catch (err) {
    return failure(res, 'SERVER_ERROR', 500, 'Səhifə silinə bilmədi.');
  }
});

/* ============================================================
   SEO: ROBOTS.TXT ADMIN API
   ============================================================ */

app.get('/api/seo/robots', authenticateToken, async (req, res) => {
  try {
    const content = await fsp.readFile(FILES.robotsTxt, 'utf-8');
    return success(res, { content }, 'robots.txt oxundu.');
  } catch {
    return failure(res, 'NOT_FOUND', 404, 'robots.txt tapılmadı.');
  }
});

app.put('/api/seo/robots', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') return failure(res, 'MISSING', 400, 'Məzmun tələb olunur.');
    await fsp.writeFile(FILES.robotsTxt, content, 'utf-8');
    return success(res, { content }, 'robots.txt saxlanıldı.');
  } catch (err) {
    return failure(res, 'SERVER_ERROR', 500, 'Server xətası.');
  }
});


/* ============================================================
   PRODUCTION: REACT BUILD-İNİ TƏQDİM ET
   ============================================================ */

const distPath = path.join(__dirname, 'dist');
if (NODE_ENV === 'production' && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/* ============================================================
   404 VƏ XƏTA HANDLER
   ============================================================ */

app.use('/api', (req, res) => {
  return failure(res, 'NOT_FOUND', 404, 'Endpoint tapılmadı.');
});

app.use((err, req, res, next) => {
  console.error('[XƏTA]', err);
  if (err.type === 'entity.too.large') {
    return failure(res, 'PAYLOAD_TOO_LARGE', 413, 'Göndərilən məlumat həcmi limiti aşır (maks. 10kb).');
  }
  return failure(res, 'SERVER_ERROR', 500, 'Server xətası baş verdi.');
});

/* ============================================================
   SERVERİ BAŞLAT
   ============================================================ */

async function start() {
  await ensureDataFiles();
  app.listen(PORT, () => {
    console.log(`\n🔗 Tergit.az server http://localhost:${PORT} ünvanında işləyir (${NODE_ENV})`);
    console.log(`   Admin giriş: ${ADMIN_USERNAME} / ${process.env.ADMIN_PASSWORD ? '(env-dən təyin edilib)' : DEFAULT_ADMIN_PASSWORD}`);
  });
}

start();
