# 🎬 MovieVIP — VIP гишүүнчлэлтэй онлайн кино вэбсайт

Гар утас, компьютер дээр бүрэн ажилладаг, **зөвхөн VIP эрхтэй хэрэглэгч кино үздэг** онлайн кино үзэх вэб платформ.

## ✨ Онцлог боломжууд

- 📱💻 **Responsive** — гар утас, таблет, компьютер дээр бүрэн ажиллана
- 🏠 **Нүүр хуудас** — шинэ кино, шинэ анги, онцлох кино
- 🎞 **Кино бүр** — постер, товч агуулга, ангийн жагсаалттай
- ▶️ **Онлайн видео тоглуулагч** — MP4/WebM, HLS (.m3u8), Embed (iframe) дэмждэг
- 🔍 **Хайлт** — нэр, агуулгаар хайх
- 🛠 **Админ хэсэг** — кино, анги, постер, тайлбар нэмэх/засах/устгах
- 🔒 **VIP хамгаалалт** — **төлбөр төлөөгүй хэрэглэгч кино үзэх боломжгүй**, зөвхөн VIP үзнэ
- 👤 **Бүртгэл / нэвтрэлт** — аюулгүй нууц үг (bcrypt), JWT токен
- 👑 **Админ VIP гараар олгоно** — хоногоор эсвэл хугацаагүй
- 💳 **Төлбөрийн бүтэц бэлэн** — дараа нь **QPay, SocialPay** автомат төлбөр нэмэхэд бэлэн
- 📘✈️ **Facebook Page, Telegram** холбоос
- 🔐 **HTTPS (SSL)** дэмжсэн бүтэц

## 📦 Хоёр хувилбар

Энэ repo дотор 2 хувилбар байгаа — өөрт тохирохыг нь сонгоно уу:

| Хувилбар | Байршил | Онцлог |
|---------|---------|--------|
| **Backend (бүрэн)** | repo-гийн үндэс (`server.js`, `src/`, `public/`) | Node.js сервертэй, найдвартай VIP хамгаалалт, нэгдсэн өгөгдлийн сан, QPay/SocialPay нэмэхэд бэлэн. **Бодит ашиглалтад энэ.** |
| **Frontend-only (энгийн)** | [`web/`](web/) фолдер | Сервер шаардахгүй, browser дээр localStorage-оор ажиллана. GitHub Pages/Netlify дээр үнэгүй host. **Демо/танилцуулгад тохиромжтой.** Дэлгэрэнгүй: [`web/README.md`](web/README.md) |

> Доорх заавар нь **backend хувилбарынх**. Зөвхөн frontend хэрэгтэй бол [`web/README.md`](web/README.md)-г уншина уу.

## 🧰 Технологи

| Хэсэг | Технологи |
|------|-----------|
| Backend | Node.js + Express |
| Өгөгдлийн сан | SQLite (better-sqlite3) — тусдаа сервер шаардахгүй |
| Нэвтрэлт | JWT + bcrypt + httpOnly cookie |
| Frontend | Цэвэр HTML/CSS/JS (framework-гүй, хурдан) |
| Постер оруулах | Multer |

---

## 🚀 Локал дээр ажиллуулах

```bash
# 1. Багцууд суулгах
npm install

# 2. Тохиргооны файл үүсгэх
cp .env.example .env
#    .env файлаа нээж JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD зэргийг өөрчилнө

# 3. Сервер асаах
npm start
```

Дараа нь браузераар нээнэ: **http://localhost:3000**

Анхны админ (эхний ажиллуулахад автоматаар үүснэ):
- И-мэйл: `admin@example.com`
- Нууц үг: `Admin12345`
- ⚠️ **Заавал .env дотор өөрчилнө үү!**

---

## ⚙️ Тохиргоо (.env)

```env
PORT=3000
NODE_ENV=production            # сервер дээр HTTPS-тэй бол production
JWT_SECRET=урт-санамсаргүй-нууц-түлхүүр   # ЗААВАЛ солино
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=таны-хүчтэй-нууц-үг
FACEBOOK_URL=https://facebook.com/таны-хуудас
TELEGRAM_URL=https://t.me/таны-суваг
SITE_NAME=Movie               # лого дээр "VIP" автоматаар нэмэгдэнэ
```

---

## 👑 Админ хэрхэн ашиглах

1. `admin@example.com`-оор нэвтэрнэ
2. Баруун дээд булангийн **🛠 Админ** товч дарна
3. **Кино & Анги** таб:
   - Шинэ кино нэмэх (нэр, агуулга, постер файл/URL, он, жанр)
   - Кино дээр **🎞 Анги** дарж ангиуд нэмэх (видео линк тавих)
   - Видео төрөл: MP4 файл / HLS урсгал / Embed iframe
4. **Хэрэглэгч & VIP** таб:
   - Хэрэглэгчид **+VIP** дарж хоногоор VIP эрх олгоно (0 = хугацаагүй)
   - VIP цуцлах, админ болгох боломжтой

> 💡 Видео файлаа шууд серверт хийхгүй — өөр газар (жишээ: Bunny.net, Cloudflare Stream, Google Drive шууд линк, эсвэл өөрийн CDN) байршуулаад **линкийг** нь админ формд тавина.

---

## 🌐 Домэйн, хостинг, HTTPS (SSL) холбох

### Хувилбар A — Өөрийн VPS (Ubuntu) + Nginx + Let's Encrypt (үнэгүй SSL)

```bash
# 1. Серверт код байршуулах
git clone <таны-repo> /var/www/movievip
cd /var/www/movievip
npm install --omit=dev
cp .env.example .env   # тохиргоогоо хийнэ (NODE_ENV=production)

# 2. PM2-оор байнга ажиллуулах
npm install -g pm2
pm2 start server.js --name movievip
pm2 save && pm2 startup

# 3. Nginx reverse proxy (SSL-ийг nginx дээр төгсгөнө)
sudo apt install nginx certbot python3-certbot-nginx -y
```

`/etc/nginx/sites-available/movievip`:
```nginx
server {
    server_name таны-домэйн.mn www.таны-домэйн.mn;
    client_max_body_size 12M;   # постер зураг оруулахад
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;   # secure cookie-д чухал
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/movievip /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. Үнэгүй SSL сертификат авах (HTTPS автоматаар тохирно)
sudo certbot --nginx -d таны-домэйн.mn -d www.таны-домэйн.mn
```

**Домэйн холбох:** Домэйн бүртгэлийн (жишээ: GoDaddy, Namecheap, эсвэл Монголын .mn) DNS дотор **A record** үүсгэж, VPS-ийнхээ IP хаяг руу заана.

### Хувилбар B — Бэлэн платформ (хамгийн хялбар)

**Render.com / Railway.app** зэрэг платформд:
- GitHub repo холбоно → автоматаар build хийж, **HTTPS-ийг үнэгүй, автомат** олгоно
- Environment variables хэсэгт `.env`-ийн утгуудаа оруулна
- Custom domain хэсэгт өөрийн домэйноо холбоно (DNS-ээ тэдний зааврын дагуу тохируулна)
- Start command: `node server.js`

> ⚠️ SQLite файл (`data/app.db`) диск дээр хадгалагдана. Render/Railway дээр **persistent disk / volume** асааж `data/` фолдерийг холбоорой, эс бол дахин deploy хийхэд өгөгдөл арилна.

---

## 💳 QPay / SocialPay автомат төлбөр нэмэх (ирээдүйд)

Бүтэц бэлэн байгаа. `src/routes/payments.js` дотор:

1. `POST /api/payments/qpay/create` — QPay-ийн `/v2/invoice` руу хүсэлт илгээж QR/линк буцаана
2. `POST /api/payments/qpay/callback` — QPay-ийн webhook. Төлбөр амжилттай бол:
   ```js
   db.prepare("UPDATE payments SET status='paid', paid_at=datetime('now') WHERE invoice_id=?").run(id);
   // дараа нь тухайн хэрэглэгчид VIP олгоно (admin.js доторх логик шиг)
   ```
3. SocialPay мөн ижил бүтэцтэй.

`payments` хүснэгт нь `provider`, `status`, `invoice_id`, `vip_days` талбартай тул шууд холбоход бэлэн.

---

## 📁 Бүтэц

```
├── server.js              # Express сервер, маршрут холболт
├── src/
│   ├── db.js              # SQLite + хүснэгтүүд
│   ├── auth.js            # JWT, VIP шалгах middleware
│   ├── seed.js            # анхны админ + жишээ өгөгдөл
│   └── routes/
│       ├── auth.js        # бүртгэл/нэвтрэлт
│       ├── movies.js      # нүүр, кино, хайлт, VIP-only watch
│       ├── admin.js       # кино/анги/постер/VIP удирдлага
│       └── payments.js    # VIP багц + QPay/SocialPay бэлтгэл
├── public/               # frontend (HTML/CSS/JS)
│   ├── index.html  movie.html  login.html  register.html
│   ├── search.html  vip.html  admin.html
│   ├── css/style.css
│   └── js/common.js  home  admin.js
└── data/app.db           # SQLite (git-д ороогүй)
```

## 🔐 Аюулгүй байдлын тэмдэглэл

- Видео линк зөвхөн **VIP хэрэглэгчийн** `/api/watch/:id` хүсэлтэд буцаана (frontend-д нуугдсан)
- Нууц үг bcrypt-ээр hash хийгдэнэ
- Нэвтрэлтэд rate-limit (brute-force хамгаалалт)
- Production дээр `secure` httpOnly cookie (HTTPS шаардана)

---

Асуулт гарвал `.env` тохиргоо, серверийн лог (`pm2 logs`)-оо шалгаарай. Амжилт хүсье! 🎬
