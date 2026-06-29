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
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const FILES = {
  messages: path.join(DATA_DIR, 'messages.json'),
  subscribers: path.join(DATA_DIR, 'subscribers.json'),
  posts: path.join(DATA_DIR, 'posts.json'),
  categories: path.join(DATA_DIR, 'categories.json'),
  blockedIps: path.join(DATA_DIR, 'blocked-ips.json'),
  pages: path.join(DATA_DIR, 'pages.json')
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

const SEED_PAGES = [
  {
    id: 'page_sosial', slug: 'sosial-media', icon: '📱', title: 'Sosial Media Asılılığı',
    level: 'orta', levelLabel: 'ORTA RİSK',
    shortDesc: 'Sosial media platformaları beynimizdə dopamin dövriyyəsini formalaşdıraraq asılılığa yol açır.',
    content: 'Sosial media asılılığı müasir dünyanın ən geniş yayılmış asılılıq formalarından biridir. Instagram, TikTok, Facebook kimi platformalar istifadəçilərin diqqətini maksimum saxlamaq üçün xüsusi alqoritmlər tətbiq edir.\n\nBeynimizdəki dopamin sistemi hər "bəyənmə" və ya bildirişlə aktivləşir — bu isə müsbət güclənmə dövriyyəsi yaradır. Zamanla beyin daha çox stimula ehtiyac duyur.\n\nSosial media asılılığının əlamətləri: gündə 4+ saat ekran vaxtı, narahatlıq hissi olmadan telefonsuz qala bilməmək, sosial müqayisə nəticəsində özünə hörmətin azalması, real münasibətlərin zəifləməsi.',
    tips: [
      'Telefon istifadə vaxtını izləyən tətbiq quraşdırın (Screen Time, Digital Wellbeing)',
      'Bildirişləri söndürün — yalnız vacib tətbiqlər üçün saxlayın',
      'Yatmadan 1 saat əvvəl telefonu bağlayın',
      'Yeməkdə, söhbətdə telefonsuz olun',
      'Sosial mediaya alternativ hobbilər tapın — kitab, idman, yaradıcılıq'
    ],
    metaTitle: 'Sosial Media Asılılığı — Əlamətlər, Səbəblər və Həll Yolları | Tergit.az',
    metaDescription: 'Sosial media asılılığından azad olmaq üçün praktiki tövsiyələr, əlamətlər və müalicə yolları. Ekran vaxtınızı azaldın.',
    metaKeywords: 'sosial media asılılığı, instagram asılılığı, telefon asılılığı, ekran vaxtı, tiktok asılılığı',
    heroImage: '', updatedAt: new Date().toISOString()
  },
  {
    id: 'page_oyun', slug: 'oyun', icon: '🎮', title: 'Oyun (Gaming) Asılılığı',
    level: 'orta', levelLabel: 'ORTA RİSK',
    shortDesc: 'Video oyunlar güclü ödül mexanizmləri vasitəsilə kompulsiv istifadəyə sürükləyir.',
    content: 'Oyun asılılığı 2018-ci ildən etibarən DSM-5 (Psixiatriya Diaqnostika Kitabçası) tərəfindən rəsmi pozuntu kimi tanınıb. Video oyunlar xüsusi olaraq motivasiya psixologiyasına əsaslanan mükəmməl ödül sistemi ilə layihələndirilir.\n\nBaşarı hissi, rəqabət, sosial mənsub olmaq, fasilə olmadan oxunan süjet — bunlar oyunçunu məşğul saxlayan əsas elementlərdir. MMO (massively multiplayer online) oyunlar xüsusilə güclü asılılıq potensialına malikdir.\n\nDünya Səhiyyə Təşkilatı məlumatlarına görə oyunçuların 3-4%-i klinik asılılıq meyarlarına cavab verir.',
    tips: [
      'Gündəlik oyun vaxtı limiti qoyun (maks. 2 saat)',
      'Gecə yarısından sonra oynamayın',
      'Hər saat başı 10 dəqiqə fasilə verin',
      'Real həyatda sosial fəaliyyətlərə zaman ayırın',
      'Oyun dostlarınızla real həyatda da görüşün'
    ],
    metaTitle: 'Oyun Asılılığı — Əlamətlər və Müalicə | Tergit.az',
    metaDescription: 'Video oyun asılılığından necə qurtulmaq olar? Əlamətlər, səbəblər və praktiki tövsiyələr.',
    metaKeywords: 'oyun asılılığı, gaming asılılığı, video oyun, kompüter oyun asılılığı',
    heroImage: '', updatedAt: new Date().toISOString()
  },
  {
    id: 'page_siqaret', slug: 'siqaret', icon: '🚬', title: 'Siqaret (Nikotin) Asılılığı',
    level: 'yuksek', levelLabel: 'YÜKSƏK RİSK',
    shortDesc: 'Nikotin bir neçə saniyə ərzində beyinə çataraq güclü fiziki və psixoloji asılılıq yaradır.',
    content: 'Siqaret asılılığı həm fiziki (nikotin), həm də psixoloji komponentlərə malikdir. Nikotin tüstü vasitəsilə qan dövranına keçdikdən sonra 10-20 saniyə ərzində beyinə çatır — bu sürət heroindən belə daha sürətlidir.\n\nNikotin dopamin, serotonin və norepinefrin kimi neyrotransmitterləri stimullaşdırır. Zamanla beyin bu stimulasiyaya öyrəşir və onsuz normal işləyə bilmir.\n\nDünyada hər il 8 milyondan çox insan tütün istifadəsinə bağlı xəstəliklərdən həyatını itirir. Siqareti tərk etmək çətin olsa da tamamilə mümkündür — 60%-dən çox siqaret çəkən insan ömrü boyu tərk etməyə nail olur.',
    tips: [
      'Nikotin əvəzedicilərindən istifadə edin (patch, gum, inhaler)',
      'Siqareti tərk etmə tarixini müəyyən edin və buna sadiq qalın',
      'Tetikleyicilər tapın: nə vaxt, harada, hansı hisslə içirsiniz?',
      'Tibb mütəxəssisindən dəstək alın — dərman müalicəsi mövcuddur',
      'Siqaret çəkmədən keçirdiginiz hər günü qeyd edin'
    ],
    metaTitle: 'Siqareti Tərk Etmək — Praktiki Tövsiyələr | Tergit.az',
    metaDescription: 'Siqaret asılılığından azad olmaq üçün effektiv üsullar, nikotin əvəziciləri və müalicə yolları.',
    metaKeywords: 'siqareti tərk etmək, nikotin asılılığı, siqaret asılılığı, tütün asılılığı',
    heroImage: '', updatedAt: new Date().toISOString()
  },
  {
    id: 'page_kofein', slug: 'kofein', icon: '☕', title: 'Kofein Asılılığı',
    level: 'asagi', levelLabel: 'AŞAĞI RİSK',
    shortDesc: 'Kofein dünyada ən geniş istifadə olunan psixoaktiv maddədir, asılılıq potensialı aşağıdır.',
    content: 'Kofein adenozin reseptorlarını bloklayaraq yorğunluq hissini azaldır. Gündə 400mg-a qədər kofein (4 fincan qəhvə) əksər sağlam yetkinlər üçün təhlükəsiz hesab edilir.\n\nAsılılıq, yüksək dozada kofein istifadəsi zamanı beynin kofeinə adaptasiya etməsi nəticəsidnər. Kəskin dayandırıldıqda baş ağrısı, yorğunluq, əhval pozulması kimi geri çəkilmə simptomları 1-2 gün davam edə bilər.\n\nKofein asılılığı digər asılılıqlara nisbətən zərərsizdir, lakin ürək döyünməsi, narahatlıq, yuxu problemlərinə yol aça bilər.',
    tips: [
      'Günlük kofein qəbulunu tədricən azaldın (ani dayandırma baş ağrısına yol açır)',
      'Saat 14:00-dan sonra kofeinli içkilərdən çəkinin',
      'Kofein mənbəyini müəyyən edin — çay, şokolad, enerji içkiləri',
      'Su içməyi artırın — dehidrasiya yorğunluğu artırır',
      'Qısa gəzinti ilə enerji artırın'
    ],
    metaTitle: 'Kofein Asılılığı — Əlamətlər və Azaltma Yolları | Tergit.az',
    metaDescription: 'Kofein asılılığının əlamətləri, qəhvə istifadəsini azaltmaq üçün praktiki tövsiyələr.',
    metaKeywords: 'kofein asılılığı, qəhvə asılılığı, kofein geri çəkilməsi',
    heroImage: '', updatedAt: new Date().toISOString()
  },
  {
    id: 'page_fastfood', slug: 'fast-food', icon: '🍔', title: 'Fast Food Asılılığı',
    level: 'orta', levelLabel: 'ORTA RİSK',
    shortDesc: 'Şəkər, yağ və duz kombinasiyası beyni stimullaşdıraraq kompulsiv yemə davranışına yol açır.',
    content: 'Fast food məhsulları şəkər, yağ və duzun elmi cəhətdən hesablanmış kombinasiyası ilə hazırlanır — bu "bliss point" adlanır. Bu kombinasiya beyinin ödül sistemini yüksək dozada stimullaşdırır.\n\nTədqiqatlar göstərir ki, yüksək emal edilmiş qidalar narkotik maddələrə bənzər neyrokimyəvi reaksiyalar yaradır. Bəzi insanlarda bu maddi kompulsiv yemə davranışına — yeməyi dayandırmaqda çətinliyə — yol açır.\n\nObesite, diabet, ürək-damar xəstəlikləri ilə birbaşa əlaqəli olan fast food asılılığı həm fiziki, həm psixoloji müdaxilə tələb edir.',
    tips: [
      'Tam qidaları artırın: tərəvəz, meyvə, tam taxıl, zülallar',
      'Fast food restoranlarına getmə tezliyini hər həftə 1-ə endirin',
      'Evdə yeməkdən həzz alma öyrənin — sadə sağlam reseptlər axtarın',
      'Emosional yemə tetikleyicilərini tanıyın',
      'Qida gündəliyi yazın'
    ],
    metaTitle: 'Fast Food Asılılığı — Səbəblər və Həll Yolları | Tergit.az',
    metaDescription: 'Fast food asılılığından azad olmaq, sağlam qidalanma vərdişləri qazanmaq üçün tövsiyələr.',
    metaKeywords: 'fast food asılılığı, qida asılılığı, kompulsiv yemə, şəkər asılılığı',
    heroImage: '', updatedAt: new Date().toISOString()
  },
  {
    id: 'page_alkoqol', slug: 'alkoqol', icon: '🍷', title: 'Alkoqol Asılılığı',
    level: 'yuksek', levelLabel: 'YÜKSƏK RİSK',
    shortDesc: 'Alkoqol mərkəzi sinir sistemini birbaşa depressiya edir, fiziki asılılıq ciddi tibbi müdaxilə tələb edir.',
    content: 'Alkoqol asılılığı (alkoqolizm) dünyada ən geniş yayılmış madde asılılığı formalarından biridir. Alkoqol GABA reseptorlarını gücləndirir və glutamat reseptorlarını bloklayır — bu relaxasiya hissi verir, lakin zamanla beyin bu effektə öyrəşir.\n\nFiziki alkoqol asılılığı inkişaf etdikdə kəsilmə sindromu həyati təhlükə yarada bilər — tibbi nəzarət olmadan alkoqoldan imtina etmək tövsiyə edilmir.\n\nAlkoqol qaraciyər xəstəliyi, ürək problemləri, sinir sistemi zədələnməsi, psixiatrik pozuntular və onlarca xərçəng növü ilə əlaqəlidir. Erkən müdaxilə son dərəcə vacibdir.',
    tips: [
      'Mütləq mütəxəssisə müraciət edin — kəskin imtina təhlükəlidir',
      'Dəstək qruplarına qoşulun (Anonim Alkoqollar AA)',
      'Tetikleyicilər müəyyən edin: insanlar, yerlər, hisslər',
      'Alkoqolsuz içkilərlə əvəz edin — soda, limonlu su',
      'Ailə dəstəyi çox vacibdir — yaxınlarınızla açıq danışın'
    ],
    metaTitle: 'Alkoqol Asılılığı — Müalicə və Dəstək | Tergit.az',
    metaDescription: 'Alkoqol asılılığının əlamətləri, müalicə yolları, dəstək qrupları haqqında məlumat.',
    metaKeywords: 'alkoqol asılılığı, alkoqolizm, içki asılılığı, alkoqoldan imtina',
    heroImage: '', updatedAt: new Date().toISOString()
  },
  {
    id: 'page_narkotik', slug: 'narkotik', icon: '💊', title: 'Narkotik Asılılığı',
    level: 'yuksek', levelLabel: 'YÜKSƏK RİSK',
    shortDesc: 'Narkotik asılılığı ən ağır asılılıq formasıdır, mütləq peşəkar tibbi müdaxilə tələb edir.',
    content: 'Narkotik asılılığı beyin strukturunu fiziki olaraq dəyişdirən xroniki, proqressiv bir xəstəlikdir. Narkotiklər — eroin, kokain, metamfetamin, opioidlər — dopamin sistemini normal stimulların onlarla dəfəsi qədər aktivləşdirir.\n\nZamanla beyin artıq normal həzz hiss edə bilmir — yalnız narkotik istifadəsi zamanı "normal" hiss edir. Bu dövr asılılığın ən dərin fazasıdır.\n\nNarkotik asılılığı ilə mübarizə uzunmüddətli, hərtərəfli müalicə tələb edir: detoks, rehabilitasiya, psixoterapiya, dəstək qrupları. Tək başına bu yola çıxmaq son dərəcə çətindir.',
    tips: [
      'Dərhal professional yardım alın — həyatınız risk altındadır',
      'Tibbi detoks proqramına müraciət edin',
      'Ailənizi bu prosesə cəlb edin',
      'Rehabilitasiya mərkəzləri haqqında məlumat alın',
      'Krizis anında 152 nömrəsinə zəng edin'
    ],
    metaTitle: 'Narkotik Asılılığı — Kömək və Müalicə | Tergit.az',
    metaDescription: 'Narkotik asılılığında professional yardım, müalicə mərhələləri və dəstək haqqında məlumat.',
    metaKeywords: 'narkotik asılılığı, narkomaniya, narkotikdən imtina, rehabilitasiya',
    heroImage: '', updatedAt: new Date().toISOString()
  }
];

async function ensureDataFiles() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(UPLOADS_DIR, { recursive: true });

  const defaults = {
    [FILES.messages]: emptyArrayFile(),
    [FILES.subscribers]: emptyArrayFile(),
    [FILES.posts]: JSON.stringify(SEED_POSTS, null, 2),
    [FILES.categories]: JSON.stringify(SEED_CATEGORIES, null, 2),
    [FILES.blockedIps]: '{}',
    [FILES.pages]: JSON.stringify(SEED_PAGES, null, 2)
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
    const ogImage = sanitizeText(req.body?.ogImage);
    const published = Boolean(req.body?.published);

    if (!title || !content || !categoryId) {
      return failure(res, 'MISSING_FIELDS', 400, 'Başlıq, məzmun və kateqoriya tələb olunur.');
    }
    if (ogImage && !validator.isURL(ogImage, { require_protocol: true })) {
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
      title,
      slug,
      categoryId,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      published,
      createdAt: now,
      updatedAt: now,
      views: 0
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
    const ogImage = req.body?.ogImage !== undefined ? sanitizeText(req.body.ogImage) : existing.ogImage;
    const published = req.body?.published !== undefined ? Boolean(req.body.published) : existing.published;

    if (!title || !content || !categoryId) {
      return failure(res, 'MISSING_FIELDS', 400, 'Başlıq, məzmun və kateqoriya tələb olunur.');
    }
    if (ogImage && !validator.isURL(ogImage, { require_protocol: true })) {
      return failure(res, 'INVALID_URL', 400, 'OG şəkil URL düzgün formatda olmalıdır.');
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
      title,
      content,
      categoryId,
      slug,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      published,
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
    const posts = await readData(FILES.posts);
    const publishedPosts = posts.filter((p) => p.published);

    const staticUrls = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/asililiqlar', priority: '0.9', changefreq: 'weekly' },
      { loc: '/bloq', priority: '0.9', changefreq: 'daily' },
      { loc: '/elaqe', priority: '0.6', changefreq: 'monthly' }
    ];

    const urlEntries = staticUrls
      .map(
        (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
      )
      .join('\n');

    const postEntries = publishedPosts
      .map(
        (p) => `  <url>
    <loc>${SITE_URL}/bloq/${p.slug}</loc>
    <lastmod>${p.updatedAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
      .join('\n');

    const pages = await readData(FILES.pages);
    const pageEntries = pages
      .map(
        (p) => `  <url>
    <loc>${SITE_URL}/asililiqlar/${p.slug}</loc>
    <lastmod>${p.updatedAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
${postEntries}
${pageEntries}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Sitemap yaradıla bilmədi.');
  }
});

/* ============================================================
   UPLOADS — Statik fayl xidməti
   ============================================================ */

app.use('/uploads', express.static(UPLOADS_DIR));

/* ============================================================
   UPLOAD API — Şəkil yükləmə
   ============================================================ */

app.post('/api/upload', authenticateToken, async (req, res) => {
  try {
    // Base64 şəkil qəbul edir: { name, data, type }
    const { name, data, type } = req.body || {};

    if (!data || !type) {
      return failure(res, 'MISSING_DATA', 400, 'Fayl adı, məlumatı və növü tələb olunur.');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(type)) {
      return failure(res, 'INVALID_TYPE', 400, 'Yalnız JPEG, PNG, WebP və GIF formatları dəstəklənir.');
    }

    const ext = type.split('/')[1].replace('jpeg', 'jpg');
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Base64-dən buffer-ə çevir
    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Ölçü yoxlaması (maks. 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return failure(res, 'FILE_TOO_LARGE', 400, 'Fayl ölçüsü 5MB-dan çox ola bilməz.');
    }

    await fsp.writeFile(filePath, buffer);

    const url = `${SITE_URL}/uploads/${fileName}`;
    return success(res, { url, fileName }, 'Şəkil uğurla yükləndi.');
  } catch (err) {
    console.error('[UPLOAD XƏTASI]', err);
    return failure(res, 'UPLOAD_ERROR', 500, 'Şəkil yüklənərkən xəta baş verdi.');
  }
});

/* ============================================================
   PAGES API — Asılılıq səhifələri
   ============================================================ */

// GET /api/pages — Bütün səhifələr (açıq)
app.get('/api/pages', async (req, res) => {
  try {
    const pages = await readData(FILES.pages);
    return success(res, pages);
  } catch (err) {
    return failure(res, 'SERVER_ERROR', 500);
  }
});

// GET /api/pages/:slug — Tək səhifə (açıq)
app.get('/api/pages/:slug', async (req, res) => {
  try {
    const pages = await readData(FILES.pages);
    const page = pages.find((p) => p.slug === req.params.slug);
    if (!page) return failure(res, 'NOT_FOUND', 404, 'Səhifə tapılmadı.');
    return success(res, page);
  } catch (err) {
    return failure(res, 'SERVER_ERROR', 500);
  }
});

// PUT /api/pages/:id — Səhifəni yenilə (JWT)
app.put('/api/pages/:id', authenticateToken, async (req, res) => {
  try {
    const pages = await readData(FILES.pages);
    const idx = pages.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return failure(res, 'NOT_FOUND', 404, 'Səhifə tapılmadı.');

    const allowed = ['title', 'shortDesc', 'content', 'tips', 'heroImage',
                     'metaTitle', 'metaDescription', 'metaKeywords'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'tips') {
          updates[key] = Array.isArray(req.body[key]) ? req.body[key].map((t) => sanitizeText(t)) : [];
        } else {
          updates[key] = sanitizeText(req.body[key], { multiline: key === 'content' });
        }
      }
    }

    pages[idx] = { ...pages[idx], ...updates, updatedAt: new Date().toISOString() };
    await writeData(FILES.pages, pages);

    return success(res, pages[idx], 'Səhifə yeniləndi.');
  } catch (err) {
    return failure(res, 'SERVER_ERROR', 500);
  }
});

app.get('/robots.txt', (req, res) => {
  const content = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${SITE_URL}/sitemap.xml`;
  res.header('Content-Type', 'text/plain');
  return res.send(content);
});

/* ============================================================
   PRODUCTION: REACT BUILD-İNİ TƏQDİM ET
   ============================================================ */

const distPath = path.join(__dirname, 'dist');
if (NODE_ENV === 'production' && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use('/uploads', express.static(UPLOADS_DIR));
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
