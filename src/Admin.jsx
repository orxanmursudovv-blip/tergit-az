import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const AUTH_STORAGE_KEY = 'tergit_admin_auth';
const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 saat

/* ============================================================
   AUTH STORAGE KÖMƏKÇİLƏRİ
   ============================================================ */

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.expiresAt) return null;
    if (Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredAuth(token, username) {
  const payload = { token, username, expiresAt: Date.now() + TOKEN_LIFETIME_MS };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/* ============================================================
   API KÖMƏKÇİSİ
   ============================================================ */

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    return { success: false, error: 'NETWORK_ERROR', message: 'Server ilə əlaqə qurulmadı.', authError: false, status: 0 };
  }

  let json;
  try {
    json = await res.json();
  } catch {
    json = { success: false, error: 'PARSE_ERROR', message: 'Server cavabı oxuna bilmədi.' };
  }

  return { ...json, status: res.status, authError: res.status === 401 || res.status === 403 };
}

/* ============================================================
   TOAST SİSTEMİ (Admin üçün müstəqil nüsxə)
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
   KÖMƏKÇİ FUNKSİYALAR
   ============================================================ */

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('az-AZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatUptime(seconds) {
  if (!seconds) return '0 dəq';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} saat ${m} dəq`;
  return `${m} dəq`;
}

/* ============================================================
   LOGİN EKRANI
   ============================================================ */

function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('İstifadəçi adı və şifrə tələb olunur.');
      return;
    }
    setSubmitting(true);
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { username: username.trim(), password }
    });
    setSubmitting(false);

    if (res.success) {
      onLoginSuccess(res.data.token, res.data.username);
    } else {
      setError(res.message || 'Giriş uğursuz oldu.');
    }
  }

  return (
    <div className="admin-login page-enter">
      <Helmet>
        <title>Admin Girişi | Tergit.az</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="admin-login__card panel" style={{ padding: 36 }}>
        <div className="login-brand">
          <span aria-hidden="true">⛓</span>
          Tergit<span style={{ color: 'var(--accent)' }}>.az</span>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">İstifadəçi adı</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="password">Şifrə</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', marginTop: 6 }}>
            {submitting ? 'Yoxlanılır…' : 'Daxil ol'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <Link to="/" className="footer-col a" style={{ color: 'var(--muted)', fontSize: 13.5 }}>
            ← Sayta qayıt
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD PANELİ
   ============================================================ */

function DashboardPanel({ token, onAuthError }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const res = await apiRequest('/api/stats', { token });
      if (!active) return;
      if (res.authError) {
        onAuthError();
        return;
      }
      if (res.success) {
        setStats(res.data);
        setError('');
      } else {
        setError(res.message || 'Statistika yüklənə bilmədi.');
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [token, onAuthError]);

  const cards = stats
    ? [
        { label: 'Bütün məqalələr', value: stats.totalPosts },
        { label: 'Dərc olunan', value: stats.publishedPosts },
        { label: 'Qaralama', value: stats.draftPosts },
        { label: 'Ümumi baxış', value: stats.totalViews },
        { label: 'Kateqoriya sayı', value: stats.totalCategories },
        { label: 'Bütün mesajlar', value: stats.totalMessages },
        { label: 'Oxunmamış mesaj', value: stats.unreadMessages },
        { label: 'Abunəçi sayı', value: stats.totalSubscribers },
        { label: 'Canlı baxış', value: stats.liveVisits },
        { label: 'Server iş vaxtı', value: formatUptime(stats.uptimeSeconds) }
      ]
    : [];

  return (
    <div>
      <div className="admin-topbar">
        <h1>Dashboard</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="empty-state">Statistika yüklənir…</div>}

      {!loading && stats && (
        <div className="admin-stats">
          {cards.map((c) => (
            <div className="stat-card" key={c.label}>
              <div className="stat-card__value">{c.value}</div>
              <div className="stat-card__label">{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MƏQALƏ MODAL (Əlavə et / Redaktə et)
   ============================================================ */

function PostModal({ post, categories, token, onClose, onSaved, addToast }) {
  const isEdit = Boolean(post);
  const [form, setForm] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    categoryId: post?.categoryId || categories[0]?.id || '',
    content: post?.content || '',
    metaTitle: post?.metaTitle || '',
    metaDescription: post?.metaDescription || '',
    metaKeywords: post?.metaKeywords || '',
    ogImage: post?.ogImage || '',
    published: post?.published || false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.content.trim() || !form.categoryId) {
      setError('Başlıq, məzmun və kateqoriya tələb olunur.');
      return;
    }
    setSaving(true);
    const res = await apiRequest(isEdit ? `/api/posts/${post.id}` : '/api/posts', {
      method: isEdit ? 'PUT' : 'POST',
      token,
      body: form
    });
    setSaving(false);

    if (res.success) {
      addToast(res.message || (isEdit ? 'Məqalə yeniləndi.' : 'Məqalə əlavə edildi.'), 'success');
      onSaved();
    } else {
      setError(res.message || 'Əməliyyat uğursuz oldu.');
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <h3>{isEdit ? 'Məqaləni redaktə et' : 'Yeni məqalə əlavə et'}</h3>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="post-title">Başlıq</label>
              <input id="post-title" type="text" value={form.title} onChange={(e) => update('title', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="post-slug">Slug (boş saxlasan avtomatik yaranır)</label>
              <input id="post-slug" type="text" value={form.slug} onChange={(e) => update('slug', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="post-category">Kateqoriya</label>
            <select id="post-category" value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
              {categories.length === 0 && <option value="">Əvvəlcə kateqoriya yaradın</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="post-content">Məzmun</label>
            <textarea
              id="post-content"
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              style={{ minHeight: 180 }}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="post-meta-title">Meta başlıq (SEO)</label>
              <input id="post-meta-title" type="text" value={form.metaTitle} onChange={(e) => update('metaTitle', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="post-meta-keywords">Meta açar sözlər</label>
              <input id="post-meta-keywords" type="text" value={form.metaKeywords} onChange={(e) => update('metaKeywords', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="post-meta-description">Meta açıqlama (SEO)</label>
            <textarea
              id="post-meta-description"
              value={form.metaDescription}
              onChange={(e) => update('metaDescription', e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="post-og-image">OG şəkil URL</label>
            <input
              id="post-og-image"
              type="text"
              placeholder="https://..."
              value={form.ogImage}
              onChange={(e) => update('ogImage', e.target.value)}
            />
          </div>

          <div className="checkbox-row">
            <input
              id="post-published"
              type="checkbox"
              checked={form.published}
              onChange={(e) => update('published', e.target.checked)}
            />
            <label htmlFor="post-published">Dərc olunsun (saytda görünsün)</label>
          </div>

          <div className="row-actions" style={{ marginTop: 22, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Ləğv et</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saxlanılır…' : 'Saxla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   BLOQ İDARƏSİ PANELİ
   ============================================================ */

function PostsPanel({ token, onAuthError }) {
  const { addToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState({ open: false, post: null });

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [postsRes, catRes] = await Promise.all([
      apiRequest('/api/admin/posts', { token }),
      apiRequest('/api/categories', { token })
    ]);
    if (postsRes.authError || catRes.authError) {
      onAuthError();
      return;
    }
    if (postsRes.success) setPosts(postsRes.data);
    if (catRes.success) setCategories(catRes.data);
    setError(!postsRes.success ? postsRes.message : !catRes.success ? catRes.message : '');
    setLoading(false);
  }, [token, onAuthError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(post) {
    if (!window.confirm(`"${post.title}" məqaləsini silmək istədiyinizə əminsiniz?`)) return;
    const res = await apiRequest(`/api/posts/${post.id}`, { method: 'DELETE', token });
    if (res.authError) return onAuthError();
    if (res.success) {
      addToast(res.message || 'Məqalə silindi.', 'success');
      loadData();
    } else {
      addToast(res.message || 'Silinmə uğursuz oldu.', 'error');
    }
  }

  async function handleTogglePublish(post) {
    const res = await apiRequest(`/api/posts/${post.id}`, {
      method: 'PUT',
      token,
      body: { published: !post.published }
    });
    if (res.authError) return onAuthError();
    if (res.success) {
      addToast(post.published ? 'Məqalə gizlədildi.' : 'Məqalə dərc edildi.', 'success');
      loadData();
    } else {
      addToast(res.message || 'Əməliyyat uğursuz oldu.', 'error');
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1>Bloq İdarəsi</h1>
        <button className="btn btn-primary" onClick={() => setModalState({ open: true, post: null })}>
          + Yeni məqalə
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <h3>Bütün məqalələr ({posts.length})</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Başlıq</th>
              <th>Kateqoriya</th>
              <th>Status</th>
              <th>Baxış</th>
              <th>Tarix</th>
              <th>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="empty-row"><td colSpan={6}>Yüklənir…</td></tr>
            )}
            {!loading && posts.length === 0 && (
              <tr className="empty-row"><td colSpan={6}>Hələ məqalə yoxdur.</td></tr>
            )}
            {!loading && posts.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{categoryMap[p.categoryId]?.name || '—'}</td>
                <td>
                  <span className={`tag-pill ${p.published ? 'pill-success' : 'pill-muted'}`}>
                    {p.published ? 'Dərc olunub' : 'Qaralama'}
                  </span>
                </td>
                <td>{p.views || 0}</td>
                <td>{formatDate(p.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" title={p.published ? 'Gizlət' : 'Dərc et'} onClick={() => handleTogglePublish(p)}>
                      {p.published ? '🙈' : '👁'}
                    </button>
                    <button className="icon-btn" title="Redaktə et" onClick={() => setModalState({ open: true, post: p })}>
                      ✎
                    </button>
                    <button className="icon-btn" title="Sil" onClick={() => handleDelete(p)}>
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalState.open && (
        <PostModal
          post={modalState.post}
          categories={categories}
          token={token}
          addToast={addToast}
          onClose={() => setModalState({ open: false, post: null })}
          onSaved={() => {
            setModalState({ open: false, post: null });
            loadData();
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   KATEQORİYA MODAL
   ============================================================ */

function CategoryModal({ token, onClose, onSaved, addToast }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#FFB703');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Kateqoriya adı tələb olunur.');
      return;
    }
    setSaving(true);
    const res = await apiRequest('/api/categories', {
      method: 'POST',
      token,
      body: { name: name.trim(), color, slug: slug.trim() }
    });
    setSaving(false);

    if (res.success) {
      addToast(res.message || 'Kateqoriya əlavə edildi.', 'success');
      onSaved();
    } else {
      setError(res.message || 'Əməliyyat uğursuz oldu.');
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: 440 }}>
        <h3>Yeni kateqoriya</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="cat-name">Ad</label>
            <input id="cat-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="cat-color">Rəng</label>
              <input
                id="cat-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ height: 44, padding: 4, cursor: 'pointer' }}
              />
            </div>
            <div className="field">
              <label htmlFor="cat-slug">Slug (boş saxlasan avtomatik yaranır)</label>
              <input id="cat-slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>

          <div className="row-actions" style={{ marginTop: 22, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Ləğv et</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saxlanılır…' : 'Əlavə et'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   KATEQORİYA İDARƏSİ PANELİ
   ============================================================ */

function CategoriesPanel({ token, onAuthError }) {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await apiRequest('/api/categories', { token });
    if (res.authError) return onAuthError();
    if (res.success) {
      setCategories(res.data);
      setError('');
    } else {
      setError(res.message || 'Kateqoriyalar yüklənə bilmədi.');
    }
    setLoading(false);
  }, [token, onAuthError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(cat) {
    if (!window.confirm(`"${cat.name}" kateqoriyasını silmək istədiyinizə əminsiniz?`)) return;
    const res = await apiRequest(`/api/categories/${cat.id}`, { method: 'DELETE', token });
    if (res.authError) return onAuthError();
    if (res.success) {
      addToast(res.message || 'Kateqoriya silindi.', 'success');
      loadData();
    } else {
      addToast(res.message || 'Silinmə uğursuz oldu.', 'error');
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1>Kateqoriya İdarəsi</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Yeni kateqoriya</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <h3>Bütün kateqoriyalar ({categories.length})</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Rəng</th>
              <th>Ad</th>
              <th>Slug</th>
              <th>Yaradılma tarixi</th>
              <th>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr className="empty-row"><td colSpan={5}>Yüklənir…</td></tr>}
            {!loading && categories.length === 0 && (
              <tr className="empty-row"><td colSpan={5}>Hələ kateqoriya yoxdur.</td></tr>
            )}
            {!loading && categories.map((c) => (
              <tr key={c.id}>
                <td><span className="color-swatch" style={{ background: c.color }} /></td>
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td>{formatDate(c.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" title="Sil" onClick={() => handleDelete(c)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <CategoryModal
          token={token}
          addToast={addToast}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   MESAJLAR PANELİ
   ============================================================ */

function MessagesPanel({ token, onAuthError }) {
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await apiRequest('/api/messages', { token });
    if (res.authError) return onAuthError();
    if (res.success) {
      setMessages(res.data);
      setError('');
    } else {
      setError(res.message || 'Mesajlar yüklənə bilmədi.');
    }
    setLoading(false);
  }, [token, onAuthError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleMarkRead(msg) {
    const res = await apiRequest(`/api/messages/${msg.id}/read`, { method: 'PUT', token });
    if (res.authError) return onAuthError();
    if (res.success) {
      loadData();
    } else {
      addToast(res.message || 'Əməliyyat uğursuz oldu.', 'error');
    }
  }

  async function handleDelete(msg) {
    if (!window.confirm(`${msg.name} adlı şəxsin mesajını silmək istədiyinizə əminsiniz?`)) return;
    const res = await apiRequest(`/api/messages/${msg.id}`, { method: 'DELETE', token });
    if (res.authError) return onAuthError();
    if (res.success) {
      addToast(res.message || 'Mesaj silindi.', 'success');
      loadData();
    } else {
      addToast(res.message || 'Silinmə uğursuz oldu.', 'error');
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1>Mesajlar</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <h3>Əlaqə mesajları ({messages.length})</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>E-mail</th>
              <th>Mesaj</th>
              <th>Tarix</th>
              <th>Status</th>
              <th>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr className="empty-row"><td colSpan={6}>Yüklənir…</td></tr>}
            {!loading && messages.length === 0 && (
              <tr className="empty-row"><td colSpan={6}>Hələ mesaj yoxdur.</td></tr>
            )}
            {!loading && messages.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td style={{ maxWidth: 260 }}>{m.message.slice(0, 80)}{m.message.length > 80 ? '…' : ''}</td>
                <td>{formatDate(m.createdAt)}</td>
                <td>
                  <span className={`tag-pill ${m.read ? 'pill-muted' : 'pill-success'}`}>
                    {m.read ? 'Oxunub' : 'Yeni'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {!m.read && (
                      <button className="icon-btn" title="Oxundu işarələ" onClick={() => handleMarkRead(m)}>✓</button>
                    )}
                    <button className="icon-btn" title="Sil" onClick={() => handleDelete(m)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   ABUNƏÇİLƏR PANELİ
   ============================================================ */

function SubscribersPanel({ token, onAuthError }) {
  const { addToast } = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await apiRequest('/api/subscribers', { token });
    if (res.authError) return onAuthError();
    if (res.success) {
      setSubscribers(res.data);
      setError('');
    } else {
      setError(res.message || 'Abunəçilər yüklənə bilmədi.');
    }
    setLoading(false);
  }, [token, onAuthError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(sub) {
    if (!window.confirm(`${sub.email} ünvanını silmək istədiyinizə əminsiniz?`)) return;
    const res = await apiRequest(`/api/subscribers/${sub.id}`, { method: 'DELETE', token });
    if (res.authError) return onAuthError();
    if (res.success) {
      addToast(res.message || 'Abunəçi silindi.', 'success');
      loadData();
    } else {
      addToast(res.message || 'Silinmə uğursuz oldu.', 'error');
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1>Abunəçilər</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <h3>Bülleten abunəçiləri ({subscribers.length})</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Abunəlik tarixi</th>
              <th>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr className="empty-row"><td colSpan={3}>Yüklənir…</td></tr>}
            {!loading && subscribers.length === 0 && (
              <tr className="empty-row"><td colSpan={3}>Hələ abunəçi yoxdur.</td></tr>
            )}
            {!loading && subscribers.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td>{formatDate(s.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" title="Sil" onClick={() => handleDelete(s)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   SEO PLANNER PANELİ
   ============================================================ */

function SeoPanel() {
  const [sitemap, setSitemap] = useState('');
  const [robots, setRobots] = useState('');
  const [loadingSitemap, setLoadingSitemap] = useState(true);
  const [loadingRobots, setLoadingRobots] = useState(true);
  const [errorSitemap, setErrorSitemap] = useState('');
  const [errorRobots, setErrorRobots] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    fetch('/sitemap.xml')
      .then((r) => {
        if (!r.ok) throw new Error('Sitemap yüklənə bilmədi');
        return r.text();
      })
      .then((txt) => { setSitemap(txt); setLoadingSitemap(false); })
      .catch((e) => { setErrorSitemap(e.message); setLoadingSitemap(false); });
  }, []);

  useEffect(() => {
    fetch('/robots.txt')
      .then((r) => {
        if (!r.ok) throw new Error('Robots.txt yüklənə bilmədi');
        return r.text();
      })
      .then((txt) => { setRobots(txt); setLoadingRobots(false); })
      .catch((e) => { setErrorRobots(e.message); setLoadingRobots(false); });
  }, []);

  function download(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`${filename} yükləndi.`, 'success');
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      addToast(`${label} kopyalandı.`, 'success');
    }).catch(() => {
      addToast('Kopyalama uğursuz oldu.', 'error');
    });
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1>SEO Planner</h1>
      </div>

      {/* ── SİTEMAP ── */}
      <div className="panel" style={{ marginBottom: 28 }}>
        <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🗺️ Sitemap.xml</h3>
          <div className="row-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => copyToClipboard(sitemap, 'Sitemap')}
              disabled={!sitemap}
            >
              📋 Kopyala
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => download(sitemap, 'sitemap.xml', 'application/xml')}
              disabled={!sitemap}
            >
              ⬇ Yüklə
            </button>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              🔗 Aç
            </a>
          </div>
        </div>
        {loadingSitemap && <div className="empty-state">Sitemap yüklənir…</div>}
        {errorSitemap && <div className="error-banner">{errorSitemap}</div>}
        {!loadingSitemap && !errorSitemap && (
          <textarea
            readOnly
            value={sitemap}
            style={{
              width: '100%', minHeight: 260, fontFamily: 'monospace',
              fontSize: 12, padding: 14, background: 'var(--bg)',
              color: 'var(--text)', border: '1px solid var(--border)',
              borderRadius: 8, resize: 'vertical', lineHeight: 1.6,
            }}
          />
        )}
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
          Bu sitemap dinamik olaraq yaranır — yeni bloq yazısı əlavə etdikcə avtomatik yenilənir. Google Search Console-a bu linki göndərə bilərsiniz: <code style={{ color: 'var(--accent)' }}>https://tergit.az/sitemap.xml</code>
        </p>
      </div>

      {/* ── ROBOTS.TXT ── */}
      <div className="panel">
        <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🤖 Robots.txt</h3>
          <div className="row-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => copyToClipboard(robots, 'Robots.txt')}
              disabled={!robots}
            >
              📋 Kopyala
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => download(robots, 'robots.txt', 'text/plain')}
              disabled={!robots}
            >
              ⬇ Yüklə
            </button>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              🔗 Aç
            </a>
          </div>
        </div>
        {loadingRobots && <div className="empty-state">Robots.txt yüklənir…</div>}
        {errorRobots && <div className="error-banner">{errorRobots}</div>}
        {!loadingRobots && !errorRobots && (
          <textarea
            readOnly
            value={robots}
            style={{
              width: '100%', minHeight: 140, fontFamily: 'monospace',
              fontSize: 13, padding: 14, background: 'var(--bg)',
              color: 'var(--text)', border: '1px solid var(--border)',
              borderRadius: 8, resize: 'vertical', lineHeight: 1.8,
            }}
          />
        )}
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
          Robots.txt axtarış motorlarına saytın hansı hissələrini gəzməməsini bildirir. <code style={{ color: 'var(--accent)' }}>/admin</code> və <code style={{ color: 'var(--accent)' }}>/api</code> qorunur.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN SHELL (sidebar + panel marşrutlaması)
   ============================================================ */

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'posts', label: 'Bloq İdarəsi', icon: '📝' },
  { id: 'categories', label: 'Kateqoriya İdarəsi', icon: '🏷️' },
  { id: 'messages', label: 'Mesajlar', icon: '✉️' },
  { id: 'subscribers', label: 'Abunəçilər', icon: '👥' },
  { id: 'seo', label: 'SEO Planner', icon: '🔍' }
];

function AdminShell({ token, username, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  function handleAuthError() {
    onLogout(true);
  }

  async function handleLogoutClick() {
    await apiRequest('/api/auth/logout', { method: 'POST', token });
    onLogout(false);
  }

  function renderPanel() {
    switch (activeTab) {
      case 'posts':
        return <PostsPanel token={token} onAuthError={handleAuthError} />;
      case 'categories':
        return <CategoriesPanel token={token} onAuthError={handleAuthError} />;
      case 'messages':
        return <MessagesPanel token={token} onAuthError={handleAuthError} />;
      case 'subscribers':
        return <SubscribersPanel token={token} onAuthError={handleAuthError} />;
      case 'seo':
        return <SeoPanel />;
      default:
        return <DashboardPanel token={token} onAuthError={handleAuthError} />;
    }
  }

  return (
    <div className="admin-shell">
      <Helmet>
        <title>Admin Panel | Tergit.az</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          ⛓ Tergit<span style={{ color: 'var(--accent)' }}>.az</span>
        </div>
        <nav className="admin-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={activeTab === t.id ? 'active' : ''}
              onClick={() => setActiveTab(t.id)}
            >
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </button>
          ))}
          <button onClick={handleLogoutClick} style={{ marginTop: 18, color: 'var(--danger)' }}>
            <span aria-hidden="true">🚪</span> Çıxış {username ? `(${username})` : ''}
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="filter-row admin-mobile-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`filter-chip ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <button className="filter-chip" onClick={handleLogoutClick} style={{ color: 'var(--danger)' }}>
            🚪 Çıxış
          </button>
        </div>

        {renderPanel()}
      </main>
    </div>
  );
}

/* ============================================================
   ADMIN ROOT
   ============================================================ */

export default function Admin() {
  const [auth, setAuth] = useState(() => readStoredAuth());

  // Saxlanılan tokenin müddətini fasiləli yoxla
  useEffect(() => {
    const interval = setInterval(() => {
      const current = readStoredAuth();
      if (!current) setAuth(null);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  function handleLoginSuccess(token, username) {
    const payload = writeStoredAuth(token, username);
    setAuth(payload);
  }

  function handleLogout() {
    clearStoredAuth();
    setAuth(null);
  }

  return (
    <ToastProvider>
      {auth ? (
        <AdminShell token={auth.token} username={auth.username} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </ToastProvider>
  );
}
