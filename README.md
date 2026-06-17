# Tergit.az

Asılılıqdan azad olmağın yolu — sosial media, oyun, siqaret, kofein, fast food, alkoqol və narkotik asılılığı haqqında məlumat, məsləhət və bloq platforması. React (Vite) frontend + Node.js/Express backend, JSON fayl əsaslı verilənlər bazası.

## Quraşdırma

```bash
npm install
```

## Development rejimində işə salmaq

```bash
npm run dev
```

Bu əmr eyni vaxtda iki proses başladır:
- **Backend** (Express) → `http://localhost:5000`
- **Frontend** (Vite dev server) → `http://localhost:5173`

Brauzerdə `http://localhost:5173` ünvanına daxil olun. Vite, `/api`, `/sitemap.xml` və `/robots.txt` sorğularını avtomatik olaraq backend-ə yönləndirir.

Server ilk dəfə başlayanda `data/` qovluğunu və içindəki JSON fayllarını (categories, posts — 7 kateqoriya və 2 nümunə məqalə ilə əvvəlcədən doldurulmuş; messages, subscribers, blocked-ips — boş) avtomatik yaradır.

## Admin Panel

`http://localhost:5173/admin` ünvanından daxil olun.

- **İstifadəçi adı:** `admin`
- **Şifrə:** `azadol2026`

Bu məlumatları `.env` faylında `ADMIN_USERNAME` və `ADMIN_PASSWORD` (və ya production üçün bcrypt-lənmiş `ADMIN_PASSWORD_HASH`) ilə dəyişə bilərsiniz — nümunə üçün `.env.example` faylına baxın.

5 yanlış giriş cəhdindən sonra IP 15 dəqiqəliyinə bloklanır.

## Production build

```bash
npm run build   # frontend-i dist/ qovluğuna build edir
npm start       # NODE_ENV=production olaraq backend-i işə salır, dist/ statik faylları da ondan verir
```

Production-da `.env` faylında `JWT_SECRET`-i təsadüfi, uzun bir sətirlə əvəz etməyi unutmayın (`openssl rand -hex 32`).

## Fayl strukturu

```
tergit-az/
├── src/
│   ├── App.jsx        ← Əsas sayt (Ana Səhifə, Asılılıqlar, Bloq, Əlaqə)
│   ├── Admin.jsx       ← Admin panel (Dashboard, Bloq/Kateqoriya/Mesaj/Abunəçi idarəsi)
│   ├── main.jsx        ← React giriş nöqtəsi və router
│   └── index.css       ← Dizayn sistemi (rənglər, animasiyalar, responsive)
├── server.js            ← Backend — bütün API endpoint-ləri, JWT, brute-force, rate limiting
├── data/                 ← JSON "verilənlər bazası" (avtomatik yaranır)
├── package.json
├── vite.config.js
├── index.html
└── .env.example
```
