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
  },
  {
    id: 'qumar',
    name: 'Qumar',
    icon: '🎰',
    level: 'yuksek',
    description: 'Qumar beynin mükafat sistemini maddə kimi stimullaşdıraraq maliyyə böhranına və ailə problemlərinə səbəb olur.',
    tips: [
      'Bank kartlarını qumar saytlarından ayırın, özünüzü məhdudlaşdırın',
      'Maliyyə vəziyyətinizi etibarlı bir yaxınla bölüşün',
      'Qumar oynamağa tetikləyən vəziyyətləri (stress, tək qalmaq) müəyyənləşdirin',
      'Anonim Qumarbazlar (GA) dəstək qruplarına qoşulun',
      'Maliyyə məsləhətçisi və ya psixoloqdan dəstək alın'
    ]
  },
  {
    id: 'texnologiya',
    name: 'Texnologiya / İnternet',
    icon: '📱',
    level: 'orta',
    description: 'Sosial media, oyun və internetin ümumi istifadəsi xüsusilə gənclər arasında sürətlə artaraq real həyatdan uzaqlaşmaya səbəb olur.',
    tips: [
      'Gündəlik ümumi ekran vaxtınızı tətbiqlə izləyin',
      'İnternetsiz fəaliyyətlər üçün konkret vaxt ayırın',
      'Yataq otağında elektron cihaz istifadəsini məhdudlaşdırın',
      'Real həyatda sosial əlaqələri prioritetləşdirin',
      'Ailə üzvləri ilə "ekransız saatlar" təyin edin'
    ]
  },
  {
    id: 'yemek',
    name: 'Yemək / Qida',
    icon: '🍔',
    level: 'orta',
    description: 'Şəkər və yağlı qidalar beyin dopamin sistemini aktivləşdirərək kompulsiv yemək davranışına yol açır.',
    tips: [
      'Qida gündəliyi saxlayın, emosional yemə anlarını qeyd edin',
      'Evdə sağlam alternativlər həmişə əlçatan olsun',
      'Aclıq və emosional istəyi fərqləndirməyi öyrənin',
      'Yavaş yeyin, doyma siqnallarına diqqət edin',
      'Lazım gəldikdə dietoloq və ya psixoloqdan dəstək alın'
    ]
  },
  {
    id: 'idman',
    name: 'İdman / Egzersiz',
    icon: '💪',
    level: 'asagi',
    description: 'Həddindən artıq məşq endorfin asılılığına çevrilərək travma, zədə və sosial izolyasiyaya yol aça bilər.',
    tips: [
      'Məşq proqramınıza istirahət günləri daxil edin',
      'Bədəninizin siqnallarını dinləyin, ağrıya məhəl qoymayın',
      'Məşqi buraxanda hiss etdiyiniz narahatlığı qeyd edin',
      'İdmandan başqa fəaliyyətlərə də vaxt ayırın',
      'Lazım gəldikdə idman psixoloqu ilə məsləhətləşin'
    ]
  },
  {
    id: 'alisveris',
    name: 'Alış-veriş',
    icon: '🛍️',
    level: 'orta',
    description: 'Kompulsiv alış-veriş çox vaxt emosional boşluğu doldurmaq cəhdidir və ciddi maliyyə böhranına gətirib çıxara bilər.',
    tips: [
      'Alış-verişdən əvvəl 24 saat gözləmə qaydası tətbiq edin',
      'Aylıq büdcə təyin edin və ona əməl edin',
      'Kreditli kartları evdə saxlayın, özünüzü məhdudlaşdırın',
      'Hansı emosiyaların alış-verişə tetiklədiyini müəyyənləşdirin',
      'Maliyyə məsləhətçisi ilə büdcə planı qurun'
    ]
  },
  {
    id: 'munasibet',
    name: 'Münasibət / Sevgi',
    icon: '❤️',
    level: 'orta',
    description: 'Kodependensiya zamanı insanlar başqaları vasitəsilə öz dəyərlərini axtarır, bu isə tükənmişliyə yol açır.',
    tips: [
      'Tək başına da dəyərli olduğunuzu xatırlayın',
      'Şəxsi sərhədlər qoymağı öyrənin',
      'Öz maraqlarınıza və hobbilərinizə vaxt ayırın',
      'Münasibətdən kənar dəstək şəbəkəsi (dostlar, ailə) qurun',
      'Lazım gəldikdə fərdi və ya cüt terapiyasından yardım alın'
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
          <span className="brand-text">Tergit<span className="brand-dot">.az</span></span>
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
              <span className="brand-text">Tergit<span className="brand-dot">.az</span></span>
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
const HOME_PRIORITY_IDS = ['siqaret', 'narkotik', 'qumar'];
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
  const [showAllHome, setShowAllHome] = useState(false);
  const priorityAddictions = useMemo(
    () => HOME_PRIORITY_IDS.map((id) => ADDICTIONS.find((a) => a.id === id)).filter(Boolean),
    []
  );
  const restAddictions = useMemo(
    () => ADDICTIONS.filter((a) => !HOME_PRIORITY_IDS.includes(a.id)),
    []
  );
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
              <Link to="/asililiqlar" className="btn btn-primary">Asılılıqları kəşf et →</Link>
              <Link to="/bloq" className="btn btn-ghost">Bloqu oxu</Link>
            </div>
            <div className="home-hero__stats">
              <div className="home-hero__stat">
                <span className="home-hero__stat-num">13</span>
                <span className="home-hero__stat-lbl">Asılılıq növü</span>
              </div>
              <div className="home-hero__stat">
                <span className="home-hero__stat-num">100%</span>
                <span className="home-hero__stat-lbl">Anonim</span>
              </div>
              <div className="home-hero__stat">
                <span className="home-hero__stat-num">Praktiki</span>
                <span className="home-hero__stat-lbl">Tövsiyələr</span>
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
            {priorityAddictions.map((a) => (
              <AddictionCard key={a.id} addiction={a} />
            ))}
            {showAllHome && restAddictions.map((a) => (
              <AddictionCard key={a.id} addiction={a} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            {!showAllHome ? (
              <button className="btn btn-ghost" onClick={() => setShowAllHome(true)}>
                Bütün asılılıqları gör ({restAddictions.length} daha)
              </button>
            ) : (
              <Link to="/asililiqlar" className="btn btn-ghost">Bütün asılılıqlar səhifəsinə keç</Link>
            )}
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
            <div className="home-signs-cta">
              <h3>Özünü tanı</h3>
              <p>Bu əlamətlərdən biri sənə tanışdırsa, kömək almaq ən doğru addımdır. Mütəxəssisə müraciət etmək güc əlamətidir.</p>
              <Link to="/elaqe" className="btn btn-primary" style={{ marginTop: 20 }}>Kömək al →</Link>
            </div>
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
          {/* Sosial media */}
          <div className="home-social">
            <p className="home-social__label">Bizi izləyin</p>
            <div className="home-social__links">
              <a href="https://www.instagram.com/tergit.az" target="_blank" rel="noopener noreferrer" className="home-social-btn home-social-btn--ig">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                <span>@tergit.az</span>
              </a>
              <a href="https://www.tiktok.com/@tergit.az" target="_blank" rel="noopener noreferrer" className="home-social-btn home-social-btn--tt">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.83 1.55V6.79a4.84 4.84 0 01-1.06-.1z"/></svg>
                <span>@tergit.az</span>
              </a>
            </div>
          </div>
          <div style={{ marginTop: 32 }}>
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
        title="Asılılıqlar — Növlər və Məsləhətlər"
        description="Sosial media, oyun, siqaret, kofein, fast food, alkoqol və narkotik asılılığı haqqında məlumat və praktiki məsləhətlər."
        keywords="asılılıq növləri, sosial media asılılığı, oyun asılılığı, siqaret, kofein, fast food, alkoqol, narkotik"
        path="/asililiqlar"
      />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-head__eyebrow">Asılılıqlar</span>
            <h2>Əsas asılılıq növləri</h2>
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
/* ============================================================
   FAQ ACCORDION KOMPONENTİ
   ============================================================ */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-item__q" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{question}</span>
        <span className="faq-item__arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="faq-item__a">{answer}</div>}
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
    image: (post.featuredImage || post.ogImage) ? [post.featuredImage || post.ogImage] : undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME }
  };
  // FAQ Schema
  const faqVisible = (post.faq || []).filter((f) => f.show && f.question && f.answer);
  const faqAll = (post.faq || []).filter((f) => f.question && f.answer);
  const faqJsonLd = faqAll.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqAll.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer }
    }))
  } : null;
  // dd.mm.yyyy format
  function formatDateDMY(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
  const canonicalPath = post.canonicalUrl || `${SITE_URL}/bloq/${post.slug}`;
  return (
    <div className="page-enter">
      <SEO
        title={post.metaTitle || post.title}
        description={post.metaDescription}
        keywords={post.metaKeywords}
        path={`/bloq/${post.slug}`}
        ogType="article"
        ogImage={post.featuredImage || post.ogImage}
        jsonLd={articleJsonLd}
      />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      {post.noIndex && (
        <meta name="robots" content="noindex,nofollow" />
      )}
      <article className="section">
        <div className="container post-detail">
          {/* Featured image */}
          {post.featuredImage && (
            <img
              className="post-detail__cover"
              src={post.featuredImage}
              alt={post.imageAlt || post.title}
            />
          )}
          {/* Başlıq — qara və bold */}
          <h1 style={{ color: '#1a1a1a', fontWeight: 800 }}>{post.title}</h1>
          <div className="post-detail__meta">
            <span>{formatDateDMY(post.createdAt)}</span>
            <span>· {post.views || 0} baxış</span>
          </div>
          <div className="post-detail__content">
            {post.content.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {/* FAQ Accordion */}
          {faqVisible.length > 0 && (
            <div className="post-faq">
              <h3 className="post-faq__title">Tez-tez verilən suallar</h3>
              {faqVisible.map((item, i) => (
                <FaqItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          )}
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
  const [submitted, setSubmitted] = useState(false);
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
        setSubmitted(true);
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
          <div style={{ marginBottom: 24 }} />
          {submitted ? (
            <div className="form-card" style={{ textAlign: 'center', padding: '56px 36px' }}>
              <div style={{ fontSize: 52, marginBottom: 18 }}>✅</div>
              <h3 style={{ fontSize: 22, color: 'var(--text-dark)', marginBottom: 10 }}>Mesajınız göndərildi!</h3>
              <p style={{ marginBottom: 28 }}>Təşəkkürlər. Ən qısa zamanda sizinlə əlaqə saxlayacağıq.</p>
              <button className="btn btn-primary" onClick={() => setSubmitted(false)}>Yeni mesaj göndər</button>
            </div>
          ) : (
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
          )}
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
/* ── DİGƏR ASİLILIQLAR KOMPONENTİ ── */
const PRIORITY_SLUGS = ['siqaret', 'narkotik', 'qumar'];
function OtherAddictions({ currentSlug }) {
  const [showAll, setShowAll] = useState(false);
  const others = ADDICTIONS.filter((a) => a.id !== currentSlug);
  // Priority sırası: siqaret, narkotik, qumar önce, sonra digərləri
  const sorted = [
    ...others.filter((a) => PRIORITY_SLUGS.includes(a.id)),
    ...others.filter((a) => !PRIORITY_SLUGS.includes(a.id))
  ];
  const visible = showAll ? sorted : sorted.slice(0, 3);
  return (
    <section className="adp-others-v2">
      <div className="container">
        <h3 className="adp-others-v2__title">Digər asılılıq növləri</h3>
        <div className="adp-others-v2__grid">
          {visible.map((a) => {
            const t = PAGE_THEMES[a.id] || DEFAULT_THEME;
            return (
              <Link key={a.id} to={`/asililiqlar/${a.id}`} className="adp-full-card">
                <div className="adp-full-card__hero" style={{ background: t.gradient }}>
                  <div className="adp-full-card__bg-emoji" aria-hidden="true">
                    {t.decorEmoji?.[0]}
                  </div>
                  <span className="adp-full-card__icon">{a.icon}</span>
                  <span className="adp-full-card__level" style={{ background: t.badge, color: t.badgeText }}>
                    {LEVEL_LABELS[a.level]} risk
                  </span>
                </div>
                <div className="adp-full-card__body">
                  <h4 className="adp-full-card__title">{a.name}</h4>
                  <p className="adp-full-card__desc">{a.description}</p>
                  <span className="adp-full-card__link" style={{ color: t.accentDark }}>
                    Ətraflı oxu →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        {!showAll && sorted.length > 3 && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button className="btn btn-ghost" onClick={() => setShowAll(true)}>
              Bütün asılılıqları gör ({sorted.length - 3} daha)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
const PAGE_THEMES = {
  'sosial-media': {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accent: '#4FC3F7', accentDark: '#0288D1',
    badge: 'rgba(79,195,247,0.15)', badgeText: '#4FC3F7',
    decorEmoji: ['📱', '💬', '❤️', '🔔', '👁'],
    stats: [
      { num: '4+ saat', label: 'Ortalama gündəlik ekran vaxtı' },
      { num: '70%', label: 'Yuxudan əvvəl telefon istifadəsi' },
      { num: '2.1x', label: 'Artmış narahatlıq riski' }
    ],
    quote: 'Hər bildiriş sənin diqqətini çalmaq üçün dizayn edilib.',
    warnColor: '#FF6B6B'
  },
  'oyun': {
    gradient: 'linear-gradient(135deg, #0a1628 0%, #0d2b0d 50%, #1a2f1a 100%)',
    accent: '#69F0AE', accentDark: '#00C853',
    badge: 'rgba(105,240,174,0.15)', badgeText: '#69F0AE',
    decorEmoji: ['🎮', '🕹️', '⚔️', '🏆', '🎯'],
    stats: [
      { num: '3-4%', label: 'Oyunçularda klinik asılılıq' },
      { num: '8+ saat', label: 'Ağır asılılıqda gündəlik oyun' },
      { num: '160M+', label: 'Dünyada risk altındakı oyunçu' }
    ],
    quote: 'Level up etmək üçün həyatına qayıt.',
    warnColor: '#FFD700'
  },
  'siqaret': {
    gradient: 'linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0a0a 100%)',
    accent: '#FF8A80', accentDark: '#C62828',
    badge: 'rgba(255,138,128,0.15)', badgeText: '#FF8A80',
    decorEmoji: ['🚬', '💨', '🫁', '❤️', '⚠️'],
    stats: [
      { num: '8M+', label: 'İllik ölüm siqarətə bağlıdır' },
      { num: '20 san', label: 'Nikotinin beyinə çatma sürəti' },
      { num: '90%', label: 'Ciyər xərçəngi siqaretdən qaynaqlanır' }
    ],
    quote: 'Hər gün tərk etmə günü ola bilər. Bu gün seç.',
    warnColor: '#FF5252'
  },
  'kofein': {
    gradient: 'linear-gradient(135deg, #1a1000 0%, #3d2800 50%, #2d1f00 100%)',
    accent: '#FFCC80', accentDark: '#E65100',
    badge: 'rgba(255,204,128,0.15)', badgeText: '#FFCC80',
    decorEmoji: ['☕', '🫖', '💊', '⚡', '😴'],
    stats: [
      { num: '400mg', label: 'Gündəlik təhlükəsiz limit' },
      { num: '2 gün', label: 'Geri çəkilmə müddəti' },
      { num: '90%', label: 'Yetkinlər gündəlik kofein istifadə edir' }
    ],
    quote: 'Enerji içkilərdən deyil, həyat tərzihdən gəlir.',
    warnColor: '#FFA000'
  },
  'fast-food': {
    gradient: 'linear-gradient(135deg, #1a0d00 0%, #3d1a00 50%, #2d1500 100%)',
    accent: '#FFD54F', accentDark: '#E65100',
    badge: 'rgba(255,213,79,0.15)', badgeText: '#FFD54F',
    decorEmoji: ['🍔', '🍟', '🥤', '🍕', '⚠️'],
    stats: [
      { num: '1.9Mlrd', label: 'Dünyada artıq çəkili insan' },
      { num: '39%', label: 'Yetkinlərdə obezitenin payı' },
      { num: '2x', label: 'Fast food istehlakçılarında diabet riski' }
    ],
    quote: 'Bədəninə verdiyin yanacaq gələcəyini şəkillendirir.',
    warnColor: '#FF6D00'
  },
  'alkoqol': {
    gradient: 'linear-gradient(135deg, #1a0010 0%, #2d0028 50%, #1a0028 100%)',
    accent: '#CE93D8', accentDark: '#6A1B9A',
    badge: 'rgba(206,147,216,0.15)', badgeText: '#CE93D8',
    decorEmoji: ['🍷', '🥃', '🫀', '🧠', '⚠️'],
    stats: [
      { num: '3M', label: 'İllik alkoqol bağlantılı ölüm' },
      { num: '5%', label: 'Dünya xəstəlik yükünün payı' },
      { num: '200+', label: 'Alkoqolun bağlantılı olduğu xəstəlik' }
    ],
    quote: 'Kömək istəmək zəiflik deyil, ən böyük gücdür.',
    warnColor: '#E040FB'
  },
  'narkotik': {
    gradient: 'linear-gradient(135deg, #050505 0%, #0f0f1a 50%, #0a0a14 100%)',
    accent: '#80CBC4', accentDark: '#00695C',
    badge: 'rgba(128,203,196,0.15)', badgeText: '#80CBC4',
    decorEmoji: ['💊', '🧪', '🫀', '🆘', '☎️'],
    stats: [
      { num: '500K+', label: 'İllik narkotik bağlantılı ölüm' },
      { num: '35M', label: 'Dünyada narkotik istifadə pozuntusu' },
      { num: '1/7', label: 'Asılı insanların müalicəyə çıxışı' }
    ],
    quote: 'Sağalma mümkündür. Hər gün yeni bir başlanğıcdır.',
    warnColor: '#F44336'
  },
  'qumar': {
    gradient: 'linear-gradient(135deg, #1a1500 0%, #3d2e00 50%, #2d2200 100%)',
    accent: '#FFD740', accentDark: '#F9A825',
    badge: 'rgba(255,215,64,0.15)', badgeText: '#FFD740',
    decorEmoji: ['🎰', '🃏', '🎲', '💰', '⚠️'],
    stats: [
      { num: '1-3%', label: 'Yetkinlərdə qumar pozuntusu' },
      { num: '4x', label: 'İntihar riskinin artması' },
      { num: '60%', label: 'Maliyyə böhranı ilə nəticələnən hal' }
    ],
    quote: 'Hər oyun qazanc vədi ilə başlayır, amma qurğu evin xeyrinədir.',
    warnColor: '#FF5252'
  },
  'texnologiya': {
    gradient: 'linear-gradient(135deg, #0d0d2b 0%, #1a1a4d 50%, #0f0f3d 100%)',
    accent: '#7C8CFF', accentDark: '#3F51B5',
    badge: 'rgba(124,140,255,0.15)', badgeText: '#7C8CFF',
    decorEmoji: ['📱', '💻', '🖥️', '🔔', '⌚'],
    stats: [
      { num: '7+ saat', label: 'Gündəlik ortalama ekran vaxtı' },
      { num: '46%', label: 'Telefonsuz narahatlıq hissi' },
      { num: '3x', label: 'Diqqət itkisinin artması' }
    ],
    quote: 'Cihazlar həyatına xidmət etməlidir, onu idarə etməməlidir.',
    warnColor: '#5C6BC0'
  },
  'yemek': {
    gradient: 'linear-gradient(135deg, #1a0d00 0%, #3d1a00 50%, #2d1500 100%)',
    accent: '#FFB74D', accentDark: '#EF6C00',
    badge: 'rgba(255,183,77,0.15)', badgeText: '#FFB74D',
    decorEmoji: ['🍔', '🍩', '🍕', '🍫', '⚠️'],
    stats: [
      { num: '20%', label: 'Yetkinlərdə kompulsiv yemə' },
      { num: '2x', label: 'Emal edilmiş qida istehlakı artımı' },
      { num: '70%', label: 'Emosional yemə halları' }
    ],
    quote: 'Yemək həzz mənbəyidir, amma tək həzz mənbəyi olmamalıdır.',
    warnColor: '#FF7043'
  },
  'idman': {
    gradient: 'linear-gradient(135deg, #001a10 0%, #003d24 50%, #002d1a 100%)',
    accent: '#69F0AE', accentDark: '#00897B',
    badge: 'rgba(105,240,174,0.15)', badgeText: '#69F0AE',
    decorEmoji: ['💪', '🏋️', '🏃', '⏱️', '⚠️'],
    stats: [
      { num: '3%', label: 'İdmançılarda kompulsiv məşq' },
      { num: '2x', label: 'Zədə riskinin artması' },
      { num: '50%', label: 'Sosial fəaliyyətdən geri çəkilmə' }
    ],
    quote: 'İdman bədənini gücləndirməlidir, onu tükətməməlidir.',
    warnColor: '#26A69A'
  },
  'alisveris': {
    gradient: 'linear-gradient(135deg, #2b0d1a 0%, #4d1a33 50%, #3d0f26 100%)',
    accent: '#F48FB1', accentDark: '#C2185B',
    badge: 'rgba(244,143,177,0.15)', badgeText: '#F48FB1',
    decorEmoji: ['🛍️', '💳', '🛒', '💸', '⚠️'],
    stats: [
      { num: '5-8%', label: 'Yetkinlərdə kompulsiv alış-veriş' },
      { num: '70%', label: 'Qadınlarda rast gəlinmə nisbəti' },
      { num: '90%', label: 'Borc problemi ilə nəticələnmə' }
    ],
    quote: 'Alış-veriş anlıq rahatlıq verir, amma boşluğu doldurmur.',
    warnColor: '#EC407A'
  },
  'munasibet': {
    gradient: 'linear-gradient(135deg, #1a0010 0%, #330020 50%, #260018 100%)',
    accent: '#F06292', accentDark: '#AD1457',
    badge: 'rgba(240,98,146,0.15)', badgeText: '#F06292',
    decorEmoji: ['❤️', '💔', '👥', '🔗', '⚠️'],
    stats: [
      { num: '40%', label: 'Yetkinlərdə kodependent davranış' },
      { num: '2x', label: 'Toksik münasibətdə qalma ehtimalı' },
      { num: '60%', label: 'Özünüqiymətləndirmə itkisi' }
    ],
    quote: 'Sağlam münasibət iki tam insanın birləşməsidir, biri digərini tamamlamaq üçün deyil.',
    warnColor: '#D81B60'
  }
};
const DEFAULT_THEME = {
  gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  accent: '#76B852', accentDark: '#4a8f2a',
  badge: 'rgba(118,184,82,0.15)', badgeText: '#76B852',
  decorEmoji: ['🔗', '💪', '🌱', '✨', '❤️'],
  stats: [], quote: '', warnColor: '#4a8f2a'
};
const ADDICTION_CONTENT = {
  'sosial-media': {
    symptoms: [
      { icon: '😰', title: 'Bildiriş yoxlaması', desc: 'Hər 2-3 dəqiqədən bir telefonu yoxlamaq' },
      { icon: '😴', title: 'Yuxu pozulması', desc: 'Gecə yarısına qədər skrol etmək' },
      { icon: '😟', title: 'FOMO', desc: 'Bir şeyi qaçırmaq qorxusu' },
      { icon: '😔', title: 'Özünə hörmət', desc: 'Başqaları ilə müqayisə nəticəsində düşgünlük' },
      { icon: '😤', title: 'Emosional reaktivlik', desc: 'Bəyənmə az gəldikdə əsəbilik' },
      { icon: '🚫', title: 'Real həyatdan qaçış', desc: 'Real münasibətlərin zəifləməsi' }
    ],
    timeline: [
      { time: '1-2 saat/gün', label: 'Normal istifadə', color: '#4CAF50' },
      { time: '2-4 saat/gün', label: 'Artan istifadə', color: '#FF9800' },
      { time: '4-6 saat/gün', label: 'Risk zonası', color: '#FF5722' },
      { time: '6+ saat/gün', label: 'Asılılıq', color: '#F44336' }
    ],
    didYouKnow: 'İnstagram "bəyənmə" funksiyası beynimizdə qumar oyunları ilə eyni neyron sistemini aktivləşdirir.',
    helpSteps: ['Digital detox — 24 saatlıq telefonsuz gün', 'Ekran vaxtı tətbiqini quraşdır', 'Bildirişləri söndür', 'Telefonsuz yataq otağı qaydası qoy', 'Sosial mediaya alternativ hobbi tap']
  },
  'oyun': {
    symptoms: [
      { icon: '🕐', title: 'Vaxt itirilməsi', desc: 'Oyun oynayarkən saatların necə keçdiyini hiss etməmək' },
      { icon: '😡', title: 'Kəsintiyə reaksiya', desc: 'Oyundan ayrılmaq məcburiyyəti qalanda güclü əsəbilik' },
      { icon: '🌙', title: 'Yuxudan imtina', desc: 'Gecə oyun oynamaq üçün yuxudan imtina etmək' },
      { icon: '🍽️', title: 'Yeməyi unutmaq', desc: 'Ac qalmağa baxmayaraq oyunu davam etdirmək' },
      { icon: '👥', title: 'Sosial təcrid', desc: 'Dostlardan və ailədon uzaqlaşmaq' },
      { icon: '📚', title: 'Vəzifə ihmali', desc: 'Məktəb, iş, digər məsuliyyətləri unutmaq' }
    ],
    timeline: [
      { time: '1-2 saat/gün', label: 'Sağlam oyun', color: '#4CAF50' },
      { time: '2-4 saat/gün', label: 'Diqqət tələb edir', color: '#FF9800' },
      { time: '4-8 saat/gün', label: 'Yüksək risk', color: '#FF5722' },
      { time: '8+ saat/gün', label: 'Klinik asılılıq', color: '#F44336' }
    ],
    didYouKnow: 'Dünya Səhiyyə Təşkilatı (WHO) 2018-ci ildə "Oyun Pozuntusunu" rəsmi xəstəlik kimi tanıdı.',
    helpSteps: ['Gündəlik oyun vaxtı limiti qoy (1-2 saat)', 'Yatmazdan 1 saat əvvəl oyunu bağla', 'Real idman ilə əvəz et', 'Oyun olmayan dostlarla vaxt keçir', 'Psixoloq yardımı al']
  },
  'siqaret': {
    symptoms: [
      { icon: '🤢', title: 'Geri çəkilmə', desc: 'Siqaret çəkmədikdə narahatçılıq, baş ağrısı' },
      { icon: '🧠', title: 'Obsessiv düşüncə', desc: 'Hər zaman növbəti siqaret haqqında düşünmək' },
      { icon: '😰', title: 'Stres cavabı', desc: 'Hər stresli anda ilk reaksiya siqaret çəkmək' },
      { icon: '💸', title: 'Mali ziyan', desc: 'Siqaretə xərclərin artması' },
      { icon: '🏃', title: 'Nəfəs çatışmazlığı', desc: 'Fiziki fəaliyyət zamanı güclü nəfəs çatışmazlığı' },
      { icon: '🌅', title: 'Səhər növbəti', desc: 'Oyandıqda ilk iş siqaret çəkmək' }
    ],
    timeline: [
      { time: 'Bəzən', label: 'Sosial siqaret', color: '#FF9800' },
      { time: 'Gündə 1-5', label: 'Başlangıc', color: '#FF5722' },
      { time: 'Gündə 5-15', label: 'Asılılıq', color: '#F44336' },
      { time: 'Gündə 15+', label: 'Ağır asılılıq', color: '#B71C1C' }
    ],
    didYouKnow: 'Siqareti tərk etdikdən 20 dəqiqə sonra qan təzyiqi normallaşmağa başlayır. 10 ildə ciyər xərçəngi riski 50% azalır.',
    helpSteps: ['Tərk etmə tarixini əvvəlcədən müəyyən et', 'Nikotin əvəzedicilərindən istifadə et', 'Həkimdən dərman müalicəsi soruş', 'Siqaret tetikleyicilərini müəyyən et', 'Dəstək qrupuna qoşul']
  },
  'kofein': {
    symptoms: [
      { icon: '🤕', title: 'Baş ağrısı', desc: 'Kofeinsiz 12-24 saatda güclü baş ağrısı' },
      { icon: '😩', title: 'Yorğunluq', desc: 'Kofeinsiz ekstrem yorğunluq hissi' },
      { icon: '😠', title: 'Əhval pozulması', desc: 'Qəhvəsiz günlərdə əsəbilik' },
      { icon: '🎯', title: 'Konsantrasiya', desc: 'Kofeinsiz diqqəti toplamaq çətinliyi' },
      { icon: '💊', title: 'Dözümlülük', desc: 'Eyni effekt üçün getdikcə daha çox kofein lazım' },
      { icon: '😤', title: 'İmtinaya müqavimət', desc: 'Azaltmaq istəsən belə dayandıra bilməmək' }
    ],
    timeline: [
      { time: 'Gündə 1-2 kasa', label: 'Mötədil', color: '#4CAF50' },
      { time: '2-4 kasa', label: 'Yüksək', color: '#FF9800' },
      { time: '4-6 kasa', label: 'Həddindən artıq', color: '#FF5722' },
      { time: '6+ kasa', label: 'Asılılıq zonası', color: '#F44336' }
    ],
    didYouKnow: 'Kofein dünyanın ən çox istifadə edilən psixoaktiv maddəsidir. 400mg gündəlik limit (4 kasa qəhvə) sağlam sayılır.',
    helpSteps: ['Qəfil deyil, tədricən azalt', 'Saat 14-dən sonra kofein qəbul etmə', 'Su qəbulunu artır', 'Yuxu keyfiyyətinə diqqət et', 'Enerji üçün qısa gəzintidən istifadə et']
  },
  'fast-food': {
    symptoms: [
      { icon: '🍟', title: 'Cravings', desc: 'Yedikdən dərhal sonra yenidən yeməyə can atmaq' },
      { icon: '😔', title: 'Emosional yemək', desc: 'Kədər, stres hisslərini yeməklə basmaq' },
      { icon: '🚫', title: 'Nəzarətsizlik', desc: 'Dayandırmaq istəsən belə dayandıra bilməmək' },
      { icon: '🙈', title: 'Gizli yemək', desc: 'Başqalarından gizlin yemək' },
      { icon: '🔄', title: 'Pişmanlıq dövrü', desc: 'Yemək → pişmanlıq → yenidən yemək dövrü' },
      { icon: '⚡', title: 'Enerji düşgünlüyü', desc: 'Yedikdən sonra ağırlıq, yorğunluq' }
    ],
    timeline: [
      { time: 'Həftədə 1-2', label: 'Mötədil', color: '#4CAF50' },
      { time: 'Həftədə 3-4', label: 'Diqqət et', color: '#FF9800' },
      { time: 'Gündə 1', label: 'Yüksək risk', color: '#FF5722' },
      { time: 'Gündə 2+', label: 'Asılılıq', color: '#F44336' }
    ],
    didYouKnow: 'Fast food şirkətləri yeməklərin "bliss point"ini — şəkər, yağ, duzun beyin üçün ən cəlbedici kombinasiyasını — elmi yolla hesablayır.',
    helpSteps: ['Evdə hazır sağlam yeməklər saxla', 'Aclıq hiss etdikdə fast food-a getmə', 'Hissə ölçüsünü azalt', 'Emosional yemə tetikleyicilərini tanı', 'Dietoloq yardımı al']
  },
  'alkoqol': {
    symptoms: [
      { icon: '🕐', title: 'Gündəlik içmə', desc: 'Hər gün içmək ehtiyacı hissi' },
      { icon: '🤫', title: 'Gizlin içmə', desc: 'Ailədən gizlin içmək' },
      { icon: '😰', title: 'Titrəmə', desc: 'Alkoqolsuz əllərdə titrəmə, tər basmaq' },
      { icon: '🛑', title: 'Dayandırma cəhdləri', desc: 'Dəfələrlə "bu son dəfədir" demək' },
      { icon: '💼', title: 'İş problemləri', desc: 'İçki səbəbindən iş, münasibət problemləri' },
      { icon: '🧠', title: 'Yaddaş boşluqları', desc: 'İçdikdən sonra nə etdiyini xatırlamamaq' }
    ],
    timeline: [
      { time: 'Həftədə 1-2', label: 'Mötədil', color: '#4CAF50' },
      { time: 'Həftədə 3-5', label: 'Riskli içmə', color: '#FF9800' },
      { time: 'Gündə 1-2 qədeh', label: 'Problem içmə', color: '#FF5722' },
      { time: 'Gündə 3+', label: 'Alkoqolizm', color: '#F44336' }
    ],
    didYouKnow: 'Alkoqol fiziki asılılığı yaranmış insanlar üçün qəfil dayandırmaq həyati təhlükəlidir. Mütləq tibbi nəzarət altında edilməlidir.',
    helpSteps: ['Mütəxəssisə müraciət et (ani dayandırma təhlükəlidir)', 'Anonim Alkoqollar (AA) qrupuna qoşul', 'Ailəni prosesə cəlb et', 'Tetikleyicilərdən uzaq qal', 'Uzunmüddətli psixoterapiya al']
  },
  'narkotik': {
    symptoms: [
      { icon: '💉', title: 'Dozanı artırma', desc: 'Eyni effekt üçün getdikcə daha çox doza lazım' },
      { icon: '🌑', title: 'Həyatın daralması', desc: 'Narkotikdən başqa heç nəyin əhəmiyyəti qalmamaq' },
      { icon: '🤒', title: 'Geri çəkilmə', desc: 'İstifadə olmadanda ağır fiziki simptomlar' },
      { icon: '💸', title: 'Mali dağınıqlıq', desc: 'Hər şeyi doza üçün xərcləmək' },
      { icon: '👤', title: 'İzolasiya', desc: 'Sevdiklərindən tam uzaqlaşmaq' },
      { icon: '⚠️', title: 'Qanuna zidd davranış', desc: 'Doza üçün qanun xaricindəki yollara əl atmaq' }
    ],
    timeline: [
      { time: 'İlk dəfə', label: 'Sınamaq', color: '#FF9800' },
      { time: 'Bəzən', label: 'Eksperimental', color: '#FF5722' },
      { time: 'Müntəzəm', label: 'Asılılıq inkişafı', color: '#F44336' },
      { time: 'Gündəlik', label: 'Ağır asılılıq', color: '#B71C1C' }
    ],
    didYouKnow: 'Narkotik asılılığı xroniki beyin xəstəliyidir — zəiflik deyil. Sağalma mümkündür və müalicə effektlidir.',
    helpSteps: ['Dərhal professional yardım al — 152 zəng et', 'Tibbi detoks proqramına müraciət et', 'Ailənə danış', 'Rehabilitasiya mərkəzini araşdır', 'Daimi psixoloji müşayiət al']
  },
  'qumar': {
    symptoms: [
      { icon: '💰', title: 'Artan mərc', desc: 'Eyni həyəcan üçün getdikcə daha çox pul qoymaq' },
      { icon: '🤥', title: 'Yalan danışma', desc: 'Qumar barədə yaxınlardan gizlin saxlamaq' },
      { icon: '🔄', title: 'İtkini geri qazanma cəhdi', desc: 'İtirdikdən sonra dərhal yenidən cəhd etmək' },
      { icon: '💸', title: 'Maliyyə böhranı', desc: 'Borc almaq, əmlak satmaq' },
      { icon: '😟', title: 'Narahatlıq', desc: 'Qumarsız vaxt narahatlıq, əsəbilik yaradır' },
      { icon: '👥', title: 'Münasibət problemi', desc: 'Ailə və iş münasibətlərinin zədələnməsi' }
    ],
    timeline: [
      { time: 'Bəzən', label: 'Əyləncəli qumar', color: '#4CAF50' },
      { time: 'Tez-tez', label: 'Risk artımı', color: '#FF9800' },
      { time: 'Müntəzəm', label: 'Problemli qumar', color: '#FF5722' },
      { time: 'Nəzarətsiz', label: 'Patoloji qumar', color: '#F44336' }
    ],
    didYouKnow: 'Qumar maşınlarının "az qala qazandım" effekti beyində real qələbədən daha çox dopamin sintezinə səbəb olur.',
    helpSteps: ['Bank kartlarını və hesabları qumar saytlarından ayır', 'Maliyyə vəziyyətini etibarlı yaxına bildir', 'Anonim Qumarbazlar qrupuna qoşul', 'Tetikleyici mühitdən uzaqlaş', 'Maliyyə məsləhətçisindən dəstək al']
  },
  'texnologiya': {
    symptoms: [
      { icon: '📵', title: 'Phantom vibration', desc: 'Telefon zəng çalmadığı halda titrədiyini hiss etmək' },
      { icon: '😬', title: 'Narahatlıq', desc: 'İnternetsiz qaldıqda gərginlik hiss etmək' },
      { icon: '🕐', title: 'Vaxt itkisi', desc: 'Planlaşdırılandan qat-qat çox vaxt onlayn keçirmək' },
      { icon: '😴', title: 'Yuxu problemi', desc: 'Ekran işığının yuxu keyfiyyətinə təsiri' },
      { icon: '👁️', title: 'Diqqət dağınıqlığı', desc: 'Bir tapşırığa fokuslana bilməmək' },
      { icon: '🚪', title: 'Sosial təcrid', desc: 'Üzbəüz ünsiyyətdən uzaqlaşmaq' }
    ],
    timeline: [
      { time: '2-4 saat/gün', label: 'Normal istifadə', color: '#4CAF50' },
      { time: '4-7 saat/gün', label: 'Yüksək istifadə', color: '#FF9800' },
      { time: '7-10 saat/gün', label: 'Risk zonası', color: '#FF5722' },
      { time: '10+ saat/gün', label: 'Asılılıq', color: '#F44336' }
    ],
    didYouKnow: 'Tədqiqatlar göstərir ki, smartfonun sadəcə görünən yerdə olması belə diqqət qabiliyyətini azaldır.',
    helpSteps: ['Gündəlik ekran vaxtı limiti təyin et', 'Bildirişləri minimuma endir', 'Ekransız fəaliyyətlər planla', 'Yataq otağında cihaz istifadəsini məhdudlaşdır', 'Rəqəmsal detoks günləri keçir']
  },
  'yemek': {
    symptoms: [
      { icon: '🍩', title: 'Kompulsiv yemə', desc: 'Aclıq olmadan da nəzarətsiz yemək' },
      { icon: '😢', title: 'Emosional yemə', desc: 'Stress, kədər anlarında yeməyə üz tutmaq' },
      { icon: '🙈', title: 'Gizli yemə', desc: 'Başqalarından gizlin yemək yemək' },
      { icon: '🔁', title: 'Təkrar pişmanlıq', desc: 'Yedikdən sonra peşmançılıq, sonra yenə yemək' },
      { icon: '⚖️', title: 'Çəki dəyişkənliyi', desc: 'Tez-tez kilolu/kilo vermə dövrləri' },
      { icon: '🍽️', title: 'Doyma siqnalını itirmə', desc: 'Doyduğunu hiss etməmək' }
    ],
    timeline: [
      { time: 'Ara-sıra', label: 'Normal', color: '#4CAF50' },
      { time: 'Həftəlik', label: 'Diqqət et', color: '#FF9800' },
      { time: 'Gündəlik', label: 'Risk zonası', color: '#FF5722' },
      { time: 'Nəzarətsiz', label: 'Yemə pozuntusu', color: '#F44336' }
    ],
    didYouKnow: 'Yüksək emal edilmiş qidalar (şəkər, yağ, duz) beyin dopamin reseptorlarına bəzi narkotik maddələrə bənzər təsir göstərir.',
    helpSteps: ['Qida gündəliyi saxla', 'Aclığı emosiyadan ayırmağı öyrən', 'Evdə sağlam alternativlər saxla', 'Yavaş yeməyi vərdiş et', 'Dietoloq və ya psixoloqdan dəstək al']
  },
  'idman': {
    symptoms: [
      { icon: '🤕', title: 'Zədəyə baxmayaraq məşq', desc: 'Ağrı və zədəyə baxmayaraq davam etmək' },
      { icon: '😟', title: 'Məşq buraxanda narahatlıq', desc: 'Bir gün məşq etməyəndə güclü gərginlik' },
      { icon: '⏰', title: 'Həyatın mərkəzində', desc: 'Bütün planları məşqə uyğunlaşdırmaq' },
      { icon: '👥', title: 'Sosial həyatdan imtina', desc: 'Dostlarla görüşü məşqə görə ləğv etmək' },
      { icon: '📉', title: 'Performans ehtirası', desc: 'Daim daha çox, daha sərt məşq istəyi' },
      { icon: '🍽️', title: 'Qida ilə əlaqəli nəzarət', desc: 'Yeməyi yalnız "yandırmaq" üçün hesablamaq' }
    ],
    timeline: [
      { time: '3-4 dəfə/həftə', label: 'Sağlam vərdiş', color: '#4CAF50' },
      { time: 'Gündəlik', label: 'Yüksək intensivlik', color: '#FF9800' },
      { time: 'Günə 2 dəfə', label: 'Risk zonası', color: '#FF5722' },
      { time: 'Dayanmadan', label: 'Kompulsiv məşq', color: '#F44336' }
    ],
    didYouKnow: 'Həddindən artıq məşq kortizol səviyyəsini artıraraq əslində bədəni gücləndirmək əvəzinə zəiflədə bilər.',
    helpSteps: ['Məşq proqramına istirahət günləri əlavə et', 'Bədən siqnallarını dinlə', 'Performans deyil, sağlamlığa fokuslan', 'Başqa fəaliyyətlərə də vaxt ayır', 'İdman psixoloqu ilə danış']
  },
  'alisveris': {
    symptoms: [
      { icon: '💳', title: 'Plansız alış-veriş', desc: 'İhtiyac olmadan kompulsiv alış-veriş' },
      { icon: '😌', title: 'Anlıq rahatlıq', desc: 'Alış-verişdən sonra qısa müddətli yüngüllük hissi' },
      { icon: '😔', title: 'Sonrakı peşmançılıq', desc: 'Aldıqdan dərhal sonra günahkarlıq hiss etmək' },
      { icon: '🙈', title: 'Gizlətmə', desc: 'Alınan əşyaları və xərcləri gizlətmək' },
      { icon: '💸', title: 'Borc yığılması', desc: 'Kredit kartı borcunun artması' },
      { icon: '📦', title: 'İstifadə edilməyən əşyalar', desc: 'Alınıb açılmamış məhsulların yığılması' }
    ],
    timeline: [
      { time: 'Ara-sıra', label: 'Normal', color: '#4CAF50' },
      { time: 'Həftəlik', label: 'Diqqət et', color: '#FF9800' },
      { time: 'Tez-tez', label: 'Risk zonası', color: '#FF5722' },
      { time: 'Nəzarətsiz', label: 'Kompulsiv alış-veriş', color: '#F44336' }
    ],
    didYouKnow: 'Onlayn mağazaların "məhdud təklif" və geri sayım taymerləri beyində təcili qərar vermə təzyiqini sürətlə artırır.',
    helpSteps: ['Alış-verişdən əvvəl 24 saat gözlə', 'Aylıq büdcə təyin et', 'Kartları evdə saxla', 'Tetikleyici emosiyaları tanı', 'Maliyyə məsləhətçisi ilə işlə']
  },
  'munasibet': {
    symptoms: [
      { icon: '😟', title: 'Tərk edilmə qorxusu', desc: 'Tək qalmaqdan həddindən artıq qorxmaq' },
      { icon: '🪞', title: 'Özünü itirmə', desc: 'Şəxsiyyətini partnyora görə formalaşdırmaq' },
      { icon: '📵', title: 'Daimi əlaqə ehtiyacı', desc: 'Hər zaman mesajlaşma/zəng tələbi' },
      { icon: '🚫', title: 'Sərhəd qoya bilməmə', desc: '"Xeyr" deyə bilməmək' },
      { icon: '👥', title: 'Dostlardan uzaqlaşma', desc: 'Münasibətdən kənar əlaqələri qurban vermək' },
      { icon: '😣', title: 'Toksik dövrəyə dözmə', desc: 'Sağlam olmayan münasibətdə qalmaq' }
    ],
    timeline: [
      { time: 'Sağlam asılılıq', label: 'Normal bağlılıq', color: '#4CAF50' },
      { time: 'Artan ehtiyac', label: 'Diqqət et', color: '#FF9800' },
      { time: 'Özünü itirmə', label: 'Risk zonası', color: '#FF5722' },
      { time: 'Tam asılılıq', label: 'Kodependensiya', color: '#F44336' }
    ],
    didYouKnow: 'Kodependensiya çox vaxt uşaqlıqdaki bağlanma nümunələrindən qaynaqlanır və terapiya ilə dəyişdirilə bilər.',
    helpSteps: ['Tək başına dəyərli olduğunu xatırla', 'Şəxsi sərhədlər qur', 'Öz maraqlarına vaxt ayır', 'Münasibətdən kənar dəstək şəbəkəsi qur', 'Fərdi və ya cüt terapiyasından yardım al']
  }
};
function AddictionDetailPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openSymptom, setOpenSymptom] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/pages/${slug}`);
        const json = await res.json();
        if (!active) return;
        if (json.success) setPage(json.data);
        else setNotFound(true);
      } catch { if (active) setNotFound(true); }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [slug]);
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--muted)' }}>
      Yüklənir…
    </div>
  );
  if (notFound || !page) return <NotFoundPage />;
  const theme = PAGE_THEMES[page.slug] || DEFAULT_THEME;
  const extra = ADDICTION_CONTENT[page.slug] || {};
  const articleJsonLd = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: page.title,
    description: page.metaDescription || page.shortDesc,
    url: `${SITE_URL}/asililiqlar/${page.slug}`,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }
  };
  return (
    <div className="page-enter adp">
      <SEO
        title={page.metaTitle || page.title}
        description={page.metaDescription || page.shortDesc}
        keywords={page.metaKeywords || ''}
        path={`/asililiqlar/${page.slug}`}
        jsonLd={articleJsonLd}
      />
      {/* ══ HERO ══ */}
      <section className="adp-hero" style={{ background: theme.gradient }}>
        <div className="adp-hero__bg-emojis" aria-hidden="true">
          {theme.decorEmoji.map((e, i) => (
            <span key={i} className={`adp-bg-emoji adp-bg-emoji--${i}`}>{e}</span>
          ))}
        </div>
        <div className="container adp-hero__inner">
          <div className="adp-hero__text">
            <Link to="/asililiqlar" className="adp-back" style={{ color: theme.accent }}>
              ← Bütün asılılıqlar
            </Link>
            <div className="adp-hero__tag" style={{ background: theme.badge, color: theme.badgeText }}>
              {page.levelLabel || 'Asılılıq'}
            </div>
            <h1 className="adp-hero__title">
              <span className="adp-hero__emoji">{page.icon}</span>
              {page.title}
            </h1>
            <p className="adp-hero__desc">{page.shortDesc}</p>
            {theme.quote && (
              <div className="adp-hero__quote" style={{ borderColor: theme.accent }}>
                <span className="adp-hero__quote-mark" style={{ color: theme.accent }}>"</span>
                {theme.quote}
              </div>
            )}
            <div className="adp-hero__btns">
              <Link to="/elaqe" className="adp-btn-primary" style={{ background: theme.accent }}>
                🆘 Kömək al
              </Link>
              <a href="#signs" className="adp-btn-ghost" style={{ borderColor: theme.accent, color: theme.accent }}>
                Əlamətlər →
              </a>
            </div>
          </div>
          {theme.stats && theme.stats.length > 0 && (
            <div className="adp-hero__stats">
              {theme.stats.map((s, i) => (
                <div key={i} className="adp-stat" style={{ borderTopColor: theme.accent }}>
                  <div className="adp-stat__num" style={{ color: theme.accent }}>{s.num}</div>
                  <div className="adp-stat__txt">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* ══ "BİLİRDİNMİ?" ══ */}
      {extra.didYouKnow && (
        <div className="adp-dyk" style={{ background: theme.accentDark }}>
          <div className="container adp-dyk__inner">
            <span className="adp-dyk__icon">💡</span>
            <p><strong>Bilirdinmi?</strong> {extra.didYouKnow}</p>
          </div>
        </div>
      )}
      {/* ══ ƏLAMƏTLƏr ══ */}
      {extra.symptoms && extra.symptoms.length > 0 && (
        <section id="signs" className="adp-section">
          <div className="container">
            <div className="adp-section__head">
              <div className="adp-section__tag" style={{ color: theme.accentDark, background: `${theme.accentDark}12` }}>Əlamətlər</div>
              <h2 className="adp-section__title">Asılılığın əlamətlərini tanı</h2>
              <p className="adp-section__sub">Bunlardan biri sənə tanışdırsa, kömək almağı düşün.</p>
            </div>
            <div className="adp-symptoms-grid">
              {extra.symptoms.map((s, i) => (
                <div key={i}
                  className={`adp-symptom-card${openSymptom === i ? ' open' : ''}`}
                  onClick={() => setOpenSymptom(openSymptom === i ? null : i)}
                  style={{ borderTopColor: theme.accentDark }}>
                  <div className="adp-symptom-card__top">
                    <span className="adp-symptom-icon">{s.icon}</span>
                    <span className="adp-symptom-title">{s.title}</span>
                    <span className="adp-symptom-arrow" style={{ color: theme.accentDark }}>{openSymptom === i ? '▲' : '▼'}</span>
                  </div>
                  {openSymptom === i && (
                    <div className="adp-symptom-desc" style={{ borderTopColor: `${theme.accentDark}30` }}>{s.desc}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* ══ RİSK TİMELINE ══ */}
      {extra.timeline && extra.timeline.length > 0 && (
        <section className="adp-section adp-section--gray">
          <div className="container">
            <div className="adp-section__head">
              <div className="adp-section__tag" style={{ color: theme.accentDark, background: `${theme.accentDark}12` }}>Risk səviyyələri</div>
              <h2 className="adp-section__title">Sən hansı mərhələdəsən?</h2>
            </div>
            <div className="adp-timeline">
              {extra.timeline.map((t, i) => (
                <div key={i} className="adp-tl-item">
                  <div className="adp-tl-dot" style={{ background: t.color, boxShadow: `0 0 12px ${t.color}60` }} />
                  <div className="adp-tl-content">
                    <div className="adp-tl-bar" style={{ background: t.color }} />
                    <div className="adp-tl-time">{t.time}</div>
                    <div className="adp-tl-label" style={{ color: t.color }}>{t.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* ══ MƏZMUN + TÖVSİYƏLƏR ══ */}
      <section className="adp-section">
        <div className="container adp-content-layout">
          <div className="adp-main-content">
            <div className="adp-section__tag" style={{ color: theme.accentDark, background: `${theme.accentDark}12` }}>Ətraflı məlumat</div>
            <h2 className="adp-section__title" style={{ marginBottom: 24 }}>{page.title} haqqında</h2>
            {page.content.split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i} className="adp-para">{para}</p>
            ))}
          </div>
          <aside className="adp-aside">
            {(page.tips && page.tips.length > 0 || extra.helpSteps) && (
              <div className="adp-tips-card" style={{ borderTopColor: theme.accentDark }}>
                <div className="adp-tips-card__head" style={{ background: `${theme.accentDark}10` }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <h3 style={{ color: theme.accentDark }}>Nə edə bilərəm?</h3>
                </div>
                <ol className="adp-tips-list">
                  {(page.tips && page.tips.length > 0 ? page.tips : (extra.helpSteps || [])).map((tip, i) => (
                    <li key={i}>
                      <span className="adp-tips-num" style={{ background: theme.accentDark }}>{i + 1}</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ol>
                <Link to="/elaqe" className="adp-tips-cta" style={{ background: theme.accentDark }}>
                  Mütəxəssislə əlaqə →
                </Link>
              </div>
            )}
            <div className="adp-help-card" style={{ borderColor: theme.warnColor }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🆘</div>
              <strong style={{ color: theme.warnColor, display: 'block', marginBottom: 8 }}>Kömək lazımdır?</strong>
              <p>Özün üçün ya da yaxınınız üçün professional yardım alın.</p>
              <a href="tel:152" className="adp-help-tel" style={{ background: theme.warnColor }}>📞 152 — Pulsuz Yardım</a>
            </div>
          </aside>
        </div>
      </section>
      {/* ══ DİGƏR ASİLILIQLAR ══ */}
      <OtherAddictions currentSlug={slug} />
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
