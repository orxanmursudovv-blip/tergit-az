import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, Link, NavLink, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Tergit.az';
const SITE_URL = 'https://tergit.az';

/* ============================================================
   TOAST SİSTEMİ
   ============================================================ */

const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4200);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? '✓' : '⚠'} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast ToastProvider daxilində istifadə olunmalıdır');
  return ctx;
}

/* ============================================================
   SERVER STATUS HOOK
   ============================================================ */

function useServerStatus() {
  const [status, setStatus] = useState('checking');
  const [liveVisits, setLiveVisits] = useState(null);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const res = await fetch('/api/health');
        const json = await res.json();
        if (!active) return;
        if (json.success) {
          setStatus('online');
          setLiveVisits(json.data.liveVisits);
        } else {
          setStatus('offline');
        }
      } catch {
        if (active) setStatus('offline');
      }
    }

    check();
    const interval = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return { status, liveVisits };
}

/* ============================================================
   CHAIN-BREAK LOGO
   ============================================================ */

function ChainLogo({ size = 38 }) {
  return (
    <svg className="chain-logo brand-logo" width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g className="chain-link left">
        <rect x="6" y="16" width="16" height="11" rx="5.5" stroke="#FFB703" strokeWidth="3" />
      </g>
      <g className="chain-link right">
        <rect x="26" y="21" width="16" height="11" rx="5.5" stroke="#E6EDF3" strokeWidth="3" />
      </g>
      <g className="chain-spark">
        <path d="M22 18 L26 15 M23 22 L28 20 M22 26 L27 28" stroke="#FFB703" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge() {
  const { status, liveVisits } = useServerStatus();
  const labels = {
    checking: 'Server yoxlanılır…',
    online: 'Server aktivdir',
    offline: 'Server əlçatan deyil'
  };
  return (
    <span className={`status-badge ${status}`}>
      <span className="status-dot" />
      {labels[status]}
      {status === 'online' && liveVisits ? ` · ${liveVisits} canlı baxış` : ''}
    </span>
  );
}

/* ============================================================
   SEO KOMPONENTİ
   ============================================================ */

function SEO({ title, description, keywords, path = '/', ogType = 'website', ogImage, jsonLd, noindex = false }) {
  const canonical = `${SITE_URL}${path}`;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Asılılıqdan azad olmağın yolu`;
  const desc = description || 'Tergit.az — sosial media, oyun, siqaret, kofein, fast food, alkoqol və narkotik asılılığından azad olmaq üçün məsləhətlər, bloq və dəstək platforması.';
  const image = ogImage || `${SITE_URL}/og-default.png`;

  return (
    <Helmet htmlAttributes={{ lang: 'az' }}>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="az_AZ" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}

/* ============================================================
   ASILILIQLAR — STATİK MƏZMUN
   ============================================================ */

const ADDICTIONS = [
  {
    id: 'sosial-media',
    name: 'Sosial Media',
    icon: '📱',
    level: 'orta',
    description: 'Sonsuz scroll, bildirişlər və bəyənmə sayğacları diqqətimizi tutsaq saxlamaq üçün dizayn edilib.',
    tips: [
      'Tətbiq bildirişlərini söndürün, yalnız vacib olanları aktiv saxlayın',
      'Gündəlik ekran vaxtı limiti təyin edin və izləyin',
      'Telefonu yataq otağından kənarda, başqa otaqda şarj edin',
      'Sosial mediasız "rejimlər" üçün konkret saatlar ayırın',
      'Real həyatda görüşləri planlaşdıraraq virtual əlaqəni əvəz edin'
    ]
  },
  {
    id: 'oyun',
    name: 'Oyun',
    icon: '🎮',
    level: 'orta',
    description: 'Mükafat sistemləri və davamlı irəliləyiş hissi oyunlardan uzaqlaşmağı çətinləşdirir.',
    tips: [
      'Oyun üçün gündəlik konkret vaxt çərçivəsi qoyun və ona əməl edin',
      'Zəngli saat ilə "oyun vaxtının bitdiyini" özünüzə xatırladın',
      'Oyunu fiziki fəaliyyətlə (idman, gəzinti) əvəzləyən günlər planlayın',
      'Online icma təzyiqindən (FOMO) zərər çəkdiyinizi hiss etsəniz fasilə verin',
      'Oyun konsolunu/PC-ni ümumi otaqda saxlayaraq şəffaflığı artırın'
    ]
  },
  {
    id: 'siqaret',
    name: 'Siqaret',
    icon: '🚬',
    level: 'yuksek',
    description: 'Nikotin bir neçə saniyə ərzində beyinə təsir edir, bu da onu ən sürətli asılılıq edənlərdən biri edir.',
    tips: [
      'Konkret tərk etmə tarixi təyin edin və ailənizə bildirin',
      'Çəkmək istəyini tetikləyən vəziyyətləri (stress, qəhvə) qabaqcadan müəyyənləşdirin',
      'Nikotin əvəzedici terapiyadan (jiklət, plaster) həkim məsləhəti ilə istifadə edin',
      'İlk 72 saatı keçməyə fokuslanın — bu ən çətin mərhələdir',
      'Tərk etmə qrupuna və ya dəstək xəttinə qoşulun'
    ]
  },
  {
    id: 'kofein',
    name: 'Kofein',
    icon: '☕',
    level: 'asagi',
    description: 'Kofein nisbətən yüngül asılılıq yaradır, lakin həddindən artıq istifadə yuxu və narahatlığa təsir edir.',
    tips: [
      'Gündəlik kofein qəbulunu tədricən, kəskin yox, mərhələli azaldın',
      'Günortadan sonra kofeinli içkilərdən çəkinin ki, yuxuya təsir etməsin',
      'Susuzluğu kofeinli içki istəyi ilə qarışdırmayın — əvvəlcə su için',
      'Kofeinsiz alternativlər (bitki çayı) sınayın',
      'Baş ağrısı kimi çəkinmə əlamətlərinə hazır olun, tədricən azaldın'
    ]
  },
  {
    id: 'fast-food',
    name: 'Fast Food',
    icon: '🍔',
    level: 'orta',
    description: 'Yüksək şəkər, duz və yağ məzmunu beyində mükafat hissi yaradaraq təkrar istəyi gücləndirir.',
    tips: [
      'Həftəlik yemək planı hazırlayaraq impulsiv qərarların qarşısını alın',
      'Evdə tez hazırlanan sağlam alternativlər (qab əvvəlcədən hazır) saxlayın',
      'Fast food sifarişini tam qadağan etmək əvəzinə tezliyini azaldın',
      'Yemək vaxtı diqqəti telefon/televizordan çəkərək doyma siqnalını hiss edin',
      'Tələbatı emosional vəziyyətlə (stress, kefsizlik) qarışdırmadığınızı yoxlayın'
    ]
  },
  {
    id: 'alkoqol',
    name: 'Alkoqol',
    icon: '🍷',
    level: 'yuksek',
    description: 'Alkoqol mərkəzi sinir sistemini birbaşa təsir edir və fiziki asılılığa səbəb ola bilər.',
    tips: [
      'Real istehlak miqdarınızı qeyd edərək obyektiv mənzərə görün',
      'Alkoqolsuz günlər təyin edib ardıcıl izləyin',
      'Sosial tədbirlərdə alkoqolsuz içki seçimini əvvəlcədən planlaşdırın',
      'Ailə tarixində asılılıq varsa, peşəkar qiymətləndirmə üçün həkimə müraciət edin',
      'Kəskin tərk etmə fiziki riskli ola bilər — ciddi asılılıqda mütəxəssis nəzarəti vacibdir'
    ]
  },
  {
    id: 'narkotik',
    name: 'Narkotik',
    icon: '💊',
    level: 'yuksek',
    description: 'Narkotik maddələr beynin mükafat sistemini kəskin şəkildə dəyişdirir və tək başına tərk etmək çox vaxt təhlükəlidir.',
    tips: [
      'Tək başına kəskin tərk etməyə çalışmayın — peşəkar tibbi nəzarət axtarın',
      'Etibarlı bir yaxınınıza vəziyyəti bildirərək dəstək şəbəkəsi qurun',
      'Reabilitasiya mərkəzləri və anonim dəstək qrupları ilə əlaqə saxlayın',
      'Tetikləyici mühit və insanlardan mümkün qədər uzaqlaşın',
      'Geri dönüşü uğursuzluq kimi deyil, müalicə prosesinin hissəsi kimi qəbul edin'
    ]
  }
];

const LEVEL_LABELS = { yuksek: 'Yüksək', orta: 'Orta', asagi: 'Aşağı' };

/* ============================================================
   ADDICTION CARD
   ============================================================ */

function AddictionCard({ addiction }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="addiction-card">
      <div className="addiction-card__top">
        <div className="addiction-card__icon" aria-hidden="true">{addiction.icon}</div>
        <span className={`level-pill level-${addiction.level}`}>{LEVEL_LABELS[addiction.level]} risk</span>
      </div>
      <h3>{addiction.name}</h3>
      <p>{addiction.description}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <button className="addiction-card__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? '▲ Məsləhətləri gizlət' : '▼ Məsləhətlər'}
        </button>
        <Link to={`/asililiqlar/${addiction.id}`} className="btn btn-ghost btn-sm">
          Ətraflı oxu →
        </Link>
      </div>
      {open && (
        <ul className="addiction-card__tips">
          {addiction.tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================================================
   HEADER
   ============================================================ */

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/', label: 'Ana Səhifə' },
    { to: '/asililiqlar', label: 'Asılılıqlar' },
    { to: '/bloq', label: 'Bloq' },
    { to: '/elaqe', label: 'Əlaqə' }
  ];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="Tergit.az logo" className="brand-logo" />
          Tergit<span style={{ color: 'var(--accent)' }}>.az</span>
        </Link>

        <nav className="nav-links" aria-label="Əsas naviqasiya">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button className="nav-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="Menyu" aria-expanded={menuOpen}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="container mobile-menu">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setMenuOpen(false)}>
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */

function Footer() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubscribe(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const json = await res.json();
      if (json.success) {
        addToast(json.message || 'Abunəlik uğurludur.', 'success');
        setEmail('');
      } else {
        addToast(json.message || 'Xəta baş verdi.', 'error');
      }
    } catch {
      addToast('Server ilə əlaqə qurulmadı.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div style={{ maxWidth: 320 }}>
            <div className="brand" style={{ marginBottom: 14 }}>
              <img src="/logo.png" alt="Tergit.az logo" className="brand-logo" style={{ width: 30, height: 30 }} />
              Tergit<span style={{ color: 'var(--accent)' }}>.az</span>
            </div>
            <p>Asılılıqlardan azad olmaq üçün məlumat, məsləhət və dəstək platforması.</p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="E-mail ünvanınız"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Abunəlik üçün e-mail"
              />
              <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
                {submitting ? '...' : 'Abunə ol'}
              </button>
            </form>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <h4>Naviqasiya</h4>
              <Link to="/">Ana Səhifə</Link>
              <Link to="/asililiqlar">Asılılıqlar</Link>
              <Link to="/bloq">Bloq</Link>
              <Link to="/elaqe">Əlaqə</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Tergit.az — Bütün hüquqlar qorunur.</span>
          <span>Azərbaycanda hazırlanıb 🇦🇿</span>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   HOME PAGE
   ============================================================ */

const RECOVERY_STEPS = [
  { icon: '🪞', emoji: 'g', title: 'Qəbul', desc: 'Problemin varlığını tanımaq ən cəsarətli addımdır' },
  { icon: '🔍', emoji: 'b', title: 'Qiymətləndirmə', desc: 'Asılılığın dərəcəsini mütəxəssislə müəyyən et' },
  { icon: '💊', emoji: 'a', title: 'Detoks', desc: 'Tibbi nəzarətdə cismani asılılıqdan azad olmaq' },
  { icon: '🧠', emoji: 'p', title: 'Terapiya', desc: 'Psixoloji köklərə ünvanlanan intensiv müalicə' },
  { icon: '🌱', emoji: 'c', title: 'Yeni həyat', desc: 'Davamlı sağalma üçün yeni vərdişlər' },
];

const SIGNS = [
  { title: 'Nəzarəti itirmək', desc: 'İstəsən də dayana bilmirsən, dəfələrlə cəhd edirsən amma bacarmırsan' },
  { title: 'Dözümlülük artması', desc: 'Eyni təsiri almaq üçün getdikcə daha çox istifadə etməlisən' },
  { title: 'Kəsilmə sindromu', desc: 'İstifadəni dayandıranda fiziki və ya psixi narahatçılıq hiss edirsən' },
  { title: 'Sosial geri çəkilmə', desc: 'Əvvəllər sevdiyin işlərdən, insanlardan uzaqlaşırsan' },
  { title: 'Problemlərə baxmayaraq davam', desc: 'Sağlamlığına, ailəyə, işə zərər verdiyi baxmayaraq davam edirsən' },
  { title: 'Gizlətmə və yalan', desc: 'Yaxınlarından gizlədir, istifadə barədə yalan danışırsan' },
];

const ADDICTION_TYPES_EXT = [
  { icon: '🎰', bg: '#EEF2FF', title: 'Qumar asılılığı', desc: 'Kumar, beyin ödül sistemini maddə kimi stimullaşdırır. Maliyyə böhranına, ailə problemlərinə səbəb olur.', tags: [{ label: 'Davranış asılılığı', cls: 'tag-blue' }, { label: 'Maliyyə riski', cls: 'tag-amber' }] },
  { icon: '📱', bg: '#F5F3FF', title: 'Texnologiya / İnternet', desc: 'Sosial media, oyun, internet asılılığı xüsusilə gənclər arasında sürətlə artır. Real həyatdan uzaqlaşma ciddi nəticələr verir.', tags: [{ label: 'Müasir asılılıq', cls: 'tag-purple' }, { label: 'Proqramlar mövcud', cls: 'tag-green' }] },
  { icon: '🍔', bg: '#FFF1F2', title: 'Yemək / Qida asılılığı', desc: 'Şəkər, yağlı qidalar beyin dopamin sistemini aktivləşdirir. Kompulsiv yemək davranışı cismani və psixoloji problemlər yaradır.', tags: [{ label: 'Davranış', cls: 'tag-coral' }, { label: 'Terapiya effektivdir', cls: 'tag-blue' }] },
  { icon: '💪', bg: '#ECFDF5', title: 'İdman / Egzersiz asılılığı', desc: 'Həddindən artıq məşq endorfin asılılığına çevrilə bilər. Travma, zədə və sosial izolyasiyaya yol aça bilər.', tags: [{ label: 'Az tanınan', cls: 'tag-green' }, { label: 'Diqqət tələb edir', cls: 'tag-amber' }] },
  { icon: '🛍️', bg: '#FEF9C3', title: 'Alış-veriş asılılığı', desc: 'Kompulsiv alış-veriş emosional boşluğu doldurmaq cəhdidir. Ciddi maliyyə böhranına gətirib çıxarır.', tags: [{ label: 'Maliyyə', cls: 'tag-amber' }, { label: 'Psixoloji köklər', cls: 'tag-purple' }] },
  { icon: '❤️', bg: '#F0F9FF', title: 'Münasibət / Sevgi asılılığı', desc: 'Kodependensiya real münasibətdir. İnsanlar başqaları vasitəsilə öz dəyərlərini axtarırlar, bu isə tükenmişliyə yol açır.', tags: [{ label: 'Emosional', cls: 'tag-coral' }, { label: 'Terapiya vacibdir', cls: 'tag-blue' }] },
];

function QuizWidget() {
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState('');
  const opts = [
    'Dayanmağa cəhd etdim, amma bacarmadım',
    'Ailə və ya dostlar narahatçılıqlarını bildirdi',
    'İşimə, oxumağıma mane oldu',
    'Güclü istək hiss etdim, düşüncəm buraya bağlandı',
    'Bunları gizlətdim, özümü utandım',
  ];

  function toggle(i) {
    setSelected((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
    setResult('');
  }

  function showResult() {
    const n = selected.length;
    if (n === 0) setResult('Heç bir əlamət seçmədiniz. Mövcud vəziyyətini izləməyə davam et.');
    else if (n <= 2) setResult('Bəzi risk əlamətləri var. Bir mütəxəssislə söhbət etmək faydalı ola bilər.');
    else setResult('Mütəxəssisə müraciət etmək tövsiyə olunur. Kömək almaq güc əlamətidir.');
  }

  return (
    <div className="home-quiz">
      <h3>Sürətli özqiymət testi</h3>
      <p>Son 30 gün içində bunlardan hansıları yaşadın?</p>
      <div className="home-quiz__opts">
        {opts.map((o, i) => (
          <div
            key={i}
            className={`home-quiz__opt${selected.includes(i) ? ' active' : ''}`}
            onClick={() => toggle(i)}
          >
            <span className="home-quiz__check" />
            <span>{o}</span>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={showResult}>
        Nəticəni gör
      </button>
      {result && <div className="home-quiz__result">{result}</div>}
    </div>
  );
}

function DayTracker() {
  const [type, setType] = useState('sosial-media');
  const [date, setDate] = useState('');
  const [days, setDays] = useState(null);

  function calc() {
    if (!date) return;
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    setDays(diff >= 0 ? diff : 0);
  }

  let msg = '';
  if (days !== null) {
    if (days === 0) msg = 'Bu gün başladın — hər böyük yol bir addımla başlayır! 🌱';
    else if (days < 7) msg = `${days} gün! Çox gözəl başlanğıc. Davam et! 💪`;
    else if (days < 30) msg = `${days} gün! İlk həftəni keçdin. Möhtəşəmsən! 🔥`;
    else if (days < 100) msg = `${days} gün azad! Bu cəsarətin sənə həyatını qaytarır. ⭐`;
    else msg = `${days} gün azad! Sən artıq başqasına ilham mənbəyisən. 🏆`;
  }

  return (
    <div className="home-tracker">
      <div className="home-tracker__header">
        <h3>Azadlıq saydacı</h3>
        <p>Asılılığı nə vaxt tərk etdin?</p>
      </div>
      <div className="home-tracker__form">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="home-tracker__select"
          aria-label="Asılılıq növü seçin"
        >
          <option value="sosial-media">📱 Sosial Media</option>
          <option value="oyun">🎮 Oyun</option>
          <option value="siqaret">🚬 Siqaret</option>
          <option value="kofein">☕ Kofein</option>
          <option value="fast-food">🍔 Fast Food</option>
          <option value="alkoqol">🍺 Alkoqol</option>
          <option value="narkotik">💊 Narkotik</option>
        </select>
        <div className="home-tracker__date-row">
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setDays(null); }}
            className="home-tracker__input"
            max={new Date().toISOString().split('T')[0]}
            aria-label="Asılılığı tərk etdiyiniz tarix"
          />
          <button className="btn btn-primary btn-sm" onClick={calc}>Hesabla</button>
        </div>
        {days !== null && (
          <div className="home-tracker__result">
            <div className="home-tracker__big">{days}</div>
            <div className="home-tracker__sub">gün azad</div>
            <div className="home-tracker__msg">{msg}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function HomePage() {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Asılılıqlardan azad olmaq üçün məlumat və dəstək platforması.',
    areaServed: 'AZ'
  };

  return (
    <div className="page-enter home-page">
      <SEO
        title="Asılılıqdan azad olmağın yolu"
        description="Tergit.az — sosial media, oyun, siqaret, kofein, fast food, alkoqol və narkotik asılılığından azad olmaq üçün praktiki məsləhətlər və bloq."
        keywords="asılılıq, sosial media asılılığı, siqareti tərk etmək, alkoqol asılılığı, narkotik asılılığı, Tergit"
        path="/"
        jsonLd={orgJsonLd}
      />

      {/* ── HERO ── */}
      <section className="home-hero">
        <div className="container home-hero__grid">
          <div className="home-hero__left">
            <div className="home-hero__badge">
              <span className="home-hero__dot" />
              Azərbaycanda ilk asılılıq məlumat platforması
            </div>
            <h1 className="home-hero__title">
              Asılılıqdan <em>azad olmağın</em> yolunu birlikdə tapaq
            </h1>
            <p className="home-hero__sub">
              Tergit.az sosial media, oyun, siqaret, kofein, fast food, alkoqol və narkotik asılılığı ilə
              mübarizədə sənə praktiki məsləhətlər, real bilgi və dəstək təklif edir.
            </p>
            <div className="home-hero__btns">
              <Link to="/asililiqlar" className="btn btn-primary">7 asılılığı kəşf et →</Link>
              <Link to="/bloq" className="btn btn-ghost">Bloqu oxu</Link>
            </div>
            <div className="home-hero__stats">
              <div className="home-hero__stat">
                <span className="home-hero__stat-num">7</span>
                <span className="home-hero__stat-lbl">Asılılıq növü</span>
              </div>
              <div className="home-hero__stat">
                <span className="home-hero__stat-num">100%</span>
                <span className="home-hero__stat-lbl">Pulsuz məlumat</span>
              </div>
              <div className="home-hero__stat">
                <span className="home-hero__stat-num">24/7</span>
                <span className="home-hero__stat-lbl">Onlayn dəstək</span>
              </div>
            </div>
          </div>

          <div className="home-hero__right">
            <div className="home-hero__card">
              <h3 className="home-hero__card-title">Sağalma yolunun mərhələləri</h3>
              <ul className="home-recovery-steps">
                {RECOVERY_STEPS.map((s, i) => (
                  <li key={i} className="home-recovery-step">
                    <span className={`home-step-icon home-step-icon--${s.emoji}`}>{s.icon}</span>
                    <div>
                      <div className="home-step-title">{s.title}</div>
                      <div className="home-step-desc">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── ASİLİLIQ NÖVLƏRİ ── */}
      <section className="home-section home-section--gray">
        <div className="container">
          <div className="home-section__label">Asılılıq növləri</div>
          <h2 className="home-section__title">Hansı asılılıqla mübarizə aparırsan?</h2>
          <p className="home-section__sub">Hər kateqoriya üçün konkret, tətbiq edilə bilən məsləhətlər hazırladıq.</p>
          <div className="home-types-grid">
            {ADDICTIONS.map((a) => (
              <AddictionCard key={a.id} addiction={a} />
            ))}
          </div>
          <div className="home-types-grid" style={{ marginTop: 24 }}>
            {ADDICTION_TYPES_EXT.map((t, i) => (
              <div key={i} className="home-type-card">
                <div className="home-type-icon" style={{ background: t.bg }}>{t.icon}</div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <div className="home-type-tags">
                  {t.tags.map((tg, j) => (
                    <span key={j} className={`home-tag ${tg.cls}`}>{tg.label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/asililiqlar" className="btn btn-ghost">Bütün asılılıqları gör</Link>
          </div>
        </div>
      </section>

      {/* ── ƏLAMƏTLƏr + TEST ── */}
      <section className="home-section">
        <div className="container">
          <div className="home-section__label">Əlamətlər və test</div>
          <h2 className="home-section__title">Asılılığın əlamətlərini tanı</h2>
          <p className="home-section__sub">Erkən tanıma — erkən müalicə. Bu əlamətlərdən biri sənə tanış gəlirsə, kömək almağı düşün.</p>
          <div className="home-signs-layout">
            <div className="home-signs-list">
              {SIGNS.map((s, i) => (
                <div key={i} className="home-sign-item">
                  <div className="home-sign-num">{i + 1}</div>
                  <div>
                    <div className="home-sign-title">{s.title}</div>
                    <div className="home-sign-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <QuizWidget />
          </div>
        </div>
      </section>

      {/* ── SAĞALMA YOLU ── */}
      <section className="home-section home-section--gray">
        <div className="container">
          <div className="home-section__label">Sağalma yolu</div>
          <h2 className="home-section__title">Sağalma yolunun 5 mərhələsi</h2>
          <p className="home-section__sub">Sağalma bir gecədə olmur — bu bir yol, bir proses, hər addımda özünü kəşf etməkdir.</p>
          <div className="home-path-steps">
            {RECOVERY_STEPS.map((s, i) => (
              <div key={i} className="home-path-step">
                <div className="home-path-circle">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AZADLIQ SAYDACI ── */}
      <section className="home-section home-section--dark">
        <div className="container">
          <div className="home-section__label home-section__label--light">Azadlıq saydacı</div>
          <h2 className="home-section__title home-section__title--light">Azad günlərini say</h2>
          <p className="home-section__sub home-section__sub--light">Asılılığı tərk etdiyin günü daxil et, neçə gündür azad olduğunu gör.</p>
          <div className="home-tracker-layout">
            <DayTracker />
            <div className="home-milestones">
              {[
                { icon: '🌱', title: '1 həftə', desc: 'Fiziki simptomlar azalmağa başlayır', days: '7 gün' },
                { icon: '⭐', title: '1 ay', desc: 'Beyin kimyası normallaşmağa başlayır', days: '30 gün' },
                { icon: '🔥', title: '3 ay', desc: 'Yeni vərdişlər möhkəmlənir', days: '90 gün' },
                { icon: '🏆', title: '1 il', desc: 'Tam yeni bir həyat tərzi', days: '365 gün' },
              ].map((m, i) => (
                <div key={i} className="home-milestone">
                  <span className="home-milestone__icon">{m.icon}</span>
                  <div className="home-milestone__info">
                    <div className="home-milestone__title">{m.title}</div>
                    <div className="home-milestone__desc">{m.desc}</div>
                  </div>
                  <span className="home-milestone__badge">{m.days}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── KƏMƏk XƏTTI ── */}
      <section className="home-section home-section--darkblue">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="home-section__label home-section__label--light">Kömək xətti</div>
          <h2 className="home-section__title home-section__title--light">Kömək almaq güc əlamətidir</h2>
          <p className="home-section__sub home-section__sub--light" style={{ margin: '0 auto 48px' }}>
            Əgər özün üçün yardıma ehtiyacın varsa, lütfən müraciət et. Bir addım ataraq hər şeyi dəyişdirə bilərsən.
          </p>
          <div className="home-hotline-cards">
            {[
              { icon: '📞', title: 'Xüsusi yardım xətti', desc: 'Azərbaycan Respublikasında narkologiya yardım xətti', num: '152', avail: '24/7 pulsuz' },
              { icon: '🏥', title: 'Narkologiya Mərkəzi', desc: 'Bakı Narkologiya Mərkəzinə müraciət et', num: '012 595 30 05', avail: 'İş günləri' },
              { icon: '💬', title: 'Psixoloji dəstək', desc: 'Psixoloji Sağlamlıq Mərkəzi ilə əlaqə', num: '012 492 92 10', avail: 'Həftəiçi' },
            ].map((h, i) => (
              <div key={i} className="home-hotline-card">
                <div className="home-hotline-icon">{h.icon}</div>
                <h4>{h.title}</h4>
                <p>{h.desc}</p>
                <div className="home-hotline-num">{h.num}</div>
                <div className="home-hotline-avail">{h.avail}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40 }}>
            <Link to="/elaqe" className="btn btn-primary">Bizə yazın →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   ADDICTIONS PAGE
   ============================================================ */

function AddictionsPage() {
  const [filter, setFilter] = useState('hamisi');

  const filtered = useMemo(() => {
    if (filter === 'hamisi') return ADDICTIONS;
    return ADDICTIONS.filter((a) => a.level === filter);
  }, [filter]);

  const filters = [
    { id: 'hamisi', label: 'Hamısı' },
    { id: 'yuksek', label: 'Yüksək risk' },
    { id: 'orta', label: 'Orta risk' },
    { id: 'asagi', label: 'Aşağı risk' }
  ];

  return (
    <div className="page-enter">
      <SEO
        title="Asılılıqlar — 7 Növ və Məsləhətlər"
        description="Sosial media, oyun, siqaret, kofein, fast food, alkoqol və narkotik asılılığı haqqında məlumat və praktiki məsləhətlər."
        keywords="asılılıq növləri, sosial media asılılığı, oyun asılılığı, siqaret, kofein, fast food, alkoqol, narkotik"
        path="/asililiqlar"
      />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-head__eyebrow">Asılılıqlar</span>
            <h2>7 əsas asılılıq növü</h2>
            <p>Risk səviyyəsinə görə filtrlə və hər biri üçün konkret məsləhətlərə bax.</p>
          </div>

          <div className="filter-row">
            {filters.map((f) => (
              <button
                key={f.id}
                className={`filter-chip ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="addiction-grid">
            {filtered.map((a) => (
              <AddictionCard key={a.id} addiction={a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   BLOG LIST PAGE
   ============================================================ */

function PostCard({ post, category }) {
  const excerpt = post.content.split('\n')[0].slice(0, 130);
  return (
    <Link to={`/bloq/${post.slug}`} className="post-card">
      {post.ogImage && <img className="post-card__image" src={post.ogImage} alt={post.title} loading="lazy" />}
      <div className="post-card__body">
        {category && (
          <span className="post-card__cat" style={{ background: `${category.color}22`, color: category.color }}>
            {category.name}
          </span>
        )}
        <h3 className="post-card__title">{post.title}</h3>
        <p className="post-card__excerpt">{excerpt}{post.content.length > 130 ? '…' : ''}</p>
        <div className="post-card__meta">
          <span>{new Date(post.createdAt).toLocaleDateString('az-AZ')}</span>
          <span>· {post.views || 0} baxış</span>
        </div>
      </div>
    </Link>
  );
}

function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('hamisi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [postsRes, catRes] = await Promise.all([
          fetch('/api/posts').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json())
        ]);
        if (!active) return;
        if (postsRes.success) setPosts(postsRes.data);
        if (catRes.success) setCategories(catRes.data);
        setError(!postsRes.success || !catRes.success);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'hamisi') return posts;
    return posts.filter((p) => p.categoryId === activeCategory);
  }, [posts, activeCategory]);

  return (
    <div className="page-enter">
      <SEO
        title="Bloq"
        description="Asılılıqdan qurtulma, davranış dəyişikliyi və sağlam həyat tərzi haqqında bloq məqalələri."
        keywords="asılılıq bloqu, motivasiya, sağlam həyat, tərgit"
        path="/bloq"
      />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-head__eyebrow">Bloq</span>
            <h2>Məqalələr və məsləhətlər</h2>
            <p>Asılılıqdan azad olma prosesini asanlaşdıran praktiki yazılar.</p>
          </div>

          {categories.length > 0 && (
            <div className="filter-row">
              <button
                className={`filter-chip ${activeCategory === 'hamisi' ? 'active' : ''}`}
                onClick={() => setActiveCategory('hamisi')}
              >
                Hamısı
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`filter-chip ${activeCategory === c.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {loading && <div className="empty-state">Məqalələr yüklənir…</div>}
          {!loading && error && <div className="empty-state">Məqalələr yüklənərkən xəta baş verdi. Server işlədiyinə əmin olun.</div>}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className="empty-state">Bu kateqoriyada hələ məqalə yoxdur.</div>
          )}

          {!loading && !error && filteredPosts.length > 0 && (
            <div className="blog-grid">
              {filteredPosts.map((p) => (
                <PostCard key={p.id} post={p} category={categoryMap[p.categoryId]} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   BLOG POST PAGE
   ============================================================ */

function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/posts/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json.success) {
          setPost(json.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container section">
        <div className="empty-state">Məqalə yüklənir…</div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="container section">
        <div className="empty-state">
          <p>Məqalə tapılmadı.</p>
          <button className="btn btn-ghost" onClick={() => navigate('/bloq')}>Bloqa qayıt</button>
        </div>
      </div>
    );
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    image: post.ogImage ? [post.ogImage] : undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME }
  };

  return (
    <div className="page-enter">
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription}
        keywords={post.metaKeywords}
        path={`/bloq/${post.slug}`}
        ogType="article"
        ogImage={post.ogImage}
        jsonLd={articleJsonLd}
      />

      <article className="section">
        <div className="container post-detail">
          {post.ogImage && <img className="post-detail__cover" src={post.ogImage} alt={post.title} />}
          <h1>{post.title}</h1>
          <div className="post-detail__meta">
            <span>{new Date(post.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>· {post.views || 0} baxış</span>
          </div>
          <div className="post-detail__content">
            {post.content.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

/* ============================================================
   CONTACT PAGE
   ============================================================ */

function ContactPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Ad tələb olunur.';
    if (!form.email.trim()) errors.email = 'E-mail tələb olunur.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'E-mail formatı yanlışdır.';
    if (!form.message.trim()) errors.message = 'Mesaj tələb olunur.';
    else if (form.message.trim().length < 10) errors.message = 'Mesaj ən az 10 simvol olmalıdır.';
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        addToast(json.message || 'Mesajınız göndərildi.', 'success');
        setForm({ name: '', email: '', message: '' });
      } else {
        addToast(json.message || 'Mesaj göndərilə bilmədi.', 'error');
      }
    } catch {
      addToast('Server ilə əlaqə qurulmadı.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Tergit.az ilə əlaqə',
    url: `${SITE_URL}/elaqe`
  };

  return (
    <div className="page-enter">
      <SEO
        title="Əlaqə"
        description="Suallarınız, təklifləriniz və ya dəstək üçün Tergit.az komandası ilə əlaqə saxlayın."
        keywords="əlaqə, dəstək, tergit"
        path="/elaqe"
        jsonLd={contactJsonLd}
      />

      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="section-head">
            <span className="section-head__eyebrow">Əlaqə</span>
            <h2>Bizimlə əlaqə saxlayın</h2>
            <p>Sualların, təklifin və ya dəstək ehtiyacın varsa, aşağıdaki formu doldur.</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <StatusBadge />
          </div>

          <form className="form-card" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Ad</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
              />
              {fieldErrors.name && <div className="field-hint" style={{ color: 'var(--danger)' }}>{fieldErrors.name}</div>}
            </div>

            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {fieldErrors.email && <div className="field-hint" style={{ color: 'var(--danger)' }}>{fieldErrors.email}</div>}
            </div>

            <div className="field">
              <label htmlFor="message">Mesaj</label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                maxLength={3000}
              />
              {fieldErrors.message && <div className="field-hint" style={{ color: 'var(--danger)' }}>{fieldErrors.message}</div>}
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Göndərilir…' : 'Mesajı göndər'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   404
   ============================================================ */

/* ============================================================
   ADDICTION DETAIL PAGE
   ============================================================ */

const PAGE_THEMES = {
  'sosial-media': {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accent: '#4FC3F7', accentDark: '#0288D1',
    badge: 'rgba(79,195,247,0.15)', badgeText: '#4FC3F7',
    tipsBg: '#f0f9ff', tipsBorder: '#0288D1'
  },
  'oyun': {
    gradient: 'linear-gradient(135deg, #0a1628 0%, #1a2f1a 50%, #0d2b0d 100%)',
    accent: '#69F0AE', accentDark: '#00C853',
    badge: 'rgba(105,240,174,0.15)', badgeText: '#69F0AE',
    tipsBg: '#f0fdf4', tipsBorder: '#00C853'
  },
  'siqaret': {
    gradient: 'linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #1a0a0a 100%)',
    accent: '#FF8A80', accentDark: '#E53935',
    badge: 'rgba(255,138,128,0.15)', badgeText: '#FF8A80',
    tipsBg: '#fff5f5', tipsBorder: '#E53935'
  },
  'kofein': {
    gradient: 'linear-gradient(135deg, #1a1000 0%, #2d1f00 50%, #3d2b00 100%)',
    accent: '#FFCC80', accentDark: '#E65100',
    badge: 'rgba(255,204,128,0.15)', badgeText: '#FFCC80',
    tipsBg: '#fffbf0', tipsBorder: '#E65100'
  },
  'fast-food': {
    gradient: 'linear-gradient(135deg, #1a0d00 0%, #2d1500 50%, #3d2000 100%)',
    accent: '#FFD54F', accentDark: '#F57F17',
    badge: 'rgba(255,213,79,0.15)', badgeText: '#FFD54F',
    tipsBg: '#fffdf0', tipsBorder: '#F57F17'
  },
  'alkoqol': {
    gradient: 'linear-gradient(135deg, #1a0010 0%, #2d001e 50%, #1a0028 100%)',
    accent: '#CE93D8', accentDark: '#7B1FA2',
    badge: 'rgba(206,147,216,0.15)', badgeText: '#CE93D8',
    tipsBg: '#fdf0ff', tipsBorder: '#7B1FA2'
  },
  'narkotik': {
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
    accent: '#80CBC4', accentDark: '#00695C',
    badge: 'rgba(128,203,196,0.15)', badgeText: '#80CBC4',
    tipsBg: '#f0fffe', tipsBorder: '#00695C'
  }
};

const DEFAULT_THEME = {
  gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  accent: '#76B852', accentDark: '#4a8f2a',
  badge: 'rgba(118,184,82,0.15)', badgeText: '#76B852',
  tipsBg: '#f0f9f4', tipsBorder: '#4a8f2a'
};

function AddictionDetailPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/pages/${slug}`);
        const json = await res.json();
        if (!active) return;
        if (json.success) {
          setPage(json.data);
        } else {
          setNotFound(true);
        }
      } catch {
        if (active) setNotFound(true);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [slug]);

  if (loading) return <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>Yüklənir…</div>;
  if (notFound || !page) return <NotFoundPage />;

  const theme = PAGE_THEMES[page.slug] || DEFAULT_THEME;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.metaDescription || page.shortDesc,
    url: `${SITE_URL}/asililiqlar/${page.slug}`,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }
  };

  return (
    <div className="page-enter">
      <SEO
        title={page.metaTitle || page.title}
        description={page.metaDescription || page.shortDesc}
        keywords={page.metaKeywords || ''}
        path={`/asililiqlar/${page.slug}`}
        jsonLd={articleJsonLd}
      />

      {/* THEMED HERO */}
      <section className="addiction-detail-hero" style={{ background: theme.gradient }}>
        <div className="container">
          <Link to="/asililiqlar" className="addiction-detail-back" style={{ color: theme.accent }}>
            ← Bütün asılılıqlar
          </Link>
          <div className="addiction-detail-hero__inner">
            <div>
              <span className="addiction-detail-level-badge" style={{ background: theme.badge, color: theme.badgeText }}>
                {page.levelLabel}
              </span>
              <h1 className="addiction-detail-hero__title" style={{ color: '#FFFFFF' }}>
                <span className="addiction-detail-hero__icon">{page.icon}</span>
                {page.title}
              </h1>
              <p className="addiction-detail-hero__sub" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {page.shortDesc}
              </p>
              <Link to="/elaqe" className="addiction-detail-cta" style={{ background: theme.accent, color: '#1a1a1a' }}>
                Kömək al →
              </Link>
            </div>
            <div className="addiction-detail-hero__emoji-wrap" style={{ borderColor: theme.accent }}>
              {page.heroImage
                ? <img src={page.heroImage} alt={page.title} className="addiction-detail-hero__img" />
                : <span className="addiction-detail-hero__big-icon">{page.icon}</span>
              }
            </div>
          </div>
        </div>
      </section>

      {/* MƏZMUN + TÖVSİYƏLƏR */}
      <section className="section">
        <div className="container addiction-detail-layout">
          <div className="addiction-detail-content">
            <h2 style={{ color: theme.accentDark }}>Asılılıq haqqında</h2>
            {page.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {page.tips && page.tips.length > 0 && (
            <div className="addiction-detail-tips" style={{ background: theme.tipsBg, borderColor: theme.tipsBorder }}>
              <h3 style={{ color: theme.accentDark }}>✅ Praktiki tövsiyələr</h3>
              <ol className="addiction-detail-tips__list">
                {page.tips.map((tip, i) => (
                  <li key={i} style={{ borderLeft: `3px solid ${theme.accentDark}` }}>{tip}</li>
                ))}
              </ol>
              <Link to="/elaqe" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex', background: theme.accentDark, boxShadow: 'none' }}>
                Mütəxəssislə əlaqə →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* DİGƏR ASILILIQLAR */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '50px 0' }}>
        <div className="container">
          <h3 style={{ marginBottom: 24, color: 'var(--text-dark)' }}>Digər asılılıqlar</h3>
          <div className="addiction-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {ADDICTIONS.filter((a) => a.id !== slug).map((a) => {
              const t = PAGE_THEMES[a.id] || DEFAULT_THEME;
              return (
                <Link key={a.id} to={`/asililiqlar/${a.id}`} className="addiction-mini-card" style={{ borderTop: `3px solid ${t.accentDark}` }}>
                  <span style={{ fontSize: 32 }}>{a.icon}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{a.name}</span>
                  <span style={{ fontSize: 11, color: t.accentDark }}>{LEVEL_LABELS[a.level]} risk</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="page-enter container section" style={{ textAlign: 'center' }}>
      <SEO title="Səhifə tapılmadı" path="/404" noindex />
      <h1 style={{ fontSize: 64, marginBottom: 16 }}>404</h1>
      <p style={{ marginBottom: 24 }}>Axtardığınız səhifə tapılmadı.</p>
      <Link to="/" className="btn btn-primary">Ana səhifəyə qayıt</Link>
    </div>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */

export default function App() {
  return (
    <ToastProvider>
      <div className="app-shell">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/asililiqlar" element={<AddictionsPage />} />
            <Route path="/asililiqlar/:slug" element={<AddictionDetailPage />} />
            <Route path="/bloq" element={<BlogListPage />} />
            <Route path="/bloq/:slug" element={<BlogPostPage />} />
            <Route path="/elaqe" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
