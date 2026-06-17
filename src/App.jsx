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
      <button className="addiction-card__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? '▲ Məsləhətləri gizlət' : '▼ Məsləhətlər'}
      </button>
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
          <ChainLogo />
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
              <ChainLogo size={30} />
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
            <div className="footer-col">
              <h4>Digər</h4>
              <Link to="/admin">Admin Panel</Link>
              <a href="/sitemap.xml">Sitemap</a>
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

function HomePage() {
  const [liveStats, setLiveStats] = useState(null);
  const [categoriesCount, setCategoriesCount] = useState(null);
  const [postsCount, setPostsCount] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const [healthRes, catRes, postsRes] = await Promise.all([
          fetch('/api/health').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json()),
          fetch('/api/posts').then((r) => r.json())
        ]);
        if (!active) return;
        if (healthRes.success) setLiveStats(healthRes.data);
        if (catRes.success) setCategoriesCount(catRes.data.length);
        if (postsRes.success) setPostsCount(postsRes.data.length);
      } catch {
        /* səssiz uğursuzluq — UI fallback dəyərləri göstərir */
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Asılılıqlardan azad olmaq üçün məlumat və dəstək platforması.',
    areaServed: 'AZ'
  };

  return (
    <div className="page-enter">
      <SEO
        title="Asılılıqdan azad olmağın yolu"
        description="Tergit.az — sosial media, oyun, siqaret, kofein, fast food, alkoqol və narkotik asılılığından azad olmaq üçün praktiki məsləhətlər və bloq."
        keywords="asılılıq, sosial media asılılığı, siqareti tərk etmək, alkoqol asılılığı, narkotik asılılığı, Tergit"
        path="/"
        jsonLd={orgJsonLd}
      />

      <section className="hero">
        <div className="container">
          <span className="hero__eyebrow">⛓ Zənciri qır</span>
          <h1 className="hero__title">
            Asılılıqdan <em>azad olmağın</em> yolunu birlikdə tapaq
          </h1>
          <p className="hero__subtitle">
            Tergit.az sosial media, oyun, siqaret, kofein, fast food, alkoqol və narkotik asılılığı ilə mübarizədə
            sənə praktiki məsləhətlər, real bilgi və dəstək təklif edir.
          </p>
          <div className="hero__actions">
            <Link to="/asililiqlar" className="btn btn-primary">7 asılılığı kəşf et</Link>
            <Link to="/bloq" className="btn btn-ghost">Bloqu oxu</Link>
          </div>
          <div className="hero__meta">
            <StatusBadge />
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card__value">7</div>
              <div className="stat-card__label">Əhatə olunan asılılıq növü</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{postsCount ?? '—'}</div>
              <div className="stat-card__label">Bloq məqaləsi</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{categoriesCount ?? '—'}</div>
              <div className="stat-card__label">Kateqoriya</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{liveStats?.liveVisits ?? '—'}</div>
              <div className="stat-card__label">Canlı baxış sayı</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-head__eyebrow">7 Asılılıq</span>
            <h2>Hansı asılılıqla mübarizə aparırsan?</h2>
            <p>Hər kateqoriya üçün konkret, tətbiq edilə bilən məsləhətlər hazırladıq.</p>
          </div>
          <div className="addiction-grid">
            {ADDICTIONS.map((a) => (
              <AddictionCard key={a.id} addiction={a} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/asililiqlar" className="btn btn-ghost">Bütün asılılıqları gör</Link>
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
