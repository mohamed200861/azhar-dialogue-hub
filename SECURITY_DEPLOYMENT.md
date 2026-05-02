# دليل النشر الآمن — اتحاد علماء الأزهر
# Secure Deployment Guide

هذا المستند يشرح متطلبات النشر الآمن للموقع على خادم خاص (VPS أو cloud).

---

## 1) متغيرات البيئة المطلوبة (Environment Variables)

عند البناء (`npm run build` / `bun run build`) يجب توفير هذه المتغيرات في ملف `.env` بجذر المشروع:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

ملاحظات مهمة:
- `VITE_SUPABASE_PUBLISHABLE_KEY` هو **مفتاح عام (anon)** ومسموح بظهوره في الـ frontend.
- **لا تضع أبداً** `SUPABASE_SERVICE_ROLE_KEY` في الـ frontend أو في أي ملف `.env` يبدأ بـ `VITE_`.
- لا تنشر ملف `.env` على GitHub. تأكد أن `.env` موجود في `.gitignore`.

أسرار الـ Edge Functions (تُدار من لوحة Supabase فقط):
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `LOVABLE_API_KEY`
- أي مفتاح Resend / SMTP عند تفعيل البريد لاحقًا (مثل `RESEND_API_KEY`).

---

## 2) عدم تسريب الأسرار (Do NOT expose secrets)

- لا تكتب كلمات مرور أو مفاتيح API في الكود المصدري.
- لا تترك ملفات مؤقتة (`.tmp-*`, `*.tmp.*`) داخل المستودع — `.gitignore` يستبعدها.
- استخدم `git status` قبل أي رفع للتأكد من عدم وجود ملفات حساسة.
- عند تدوير المفاتيح، حدّث Supabase ثم أعد بناء الموقع.

---

## 3) HTTPS إلزامي

- لا تنشر الموقع على HTTP أبدًا.
- استخدم Let's Encrypt مع Nginx/Caddy للحصول على شهادة مجانية.
- فعّل HSTS في إعداد الخادم:
  ```
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  ```
- وجّه كل HTTP إلى HTTPS (redirect 301).

---

## 4) Row-Level Security (RLS)

كل الجداول الحساسة محمية بـ RLS:
- `admin_users`, `audit_logs`, `user_roles`, `media_files`: مقصورة على الإدارة.
- `news_posts`, `library_items`, `videos`, `events`, `live_streams`: قراءة عامة فقط لما هو منشور (`published`/الحالات الظاهرة)، تعديل من المحررين والمدراء.
- `contact_messages`, `newsletter_subscribers`: إدخال عام مع تحقق من صحة البريد، قراءة للإدارة فقط.
- `site_settings`, `site_pages`: قراءة عامة لمفاتيح/صفحات منشورة، تعديل للمدراء.

تحقق دوريًا عبر "تشغيل فحص الأمان" داخل لوحة Lovable Cloud.

---

## 5) تخزين الملفات (Storage)

| Bucket | عام؟ | الاستخدام |
|---|---|---|
| `images` | نعم | صور عامة |
| `covers` | نعم | أغلفة المحتوى المنشور |
| `thumbnails` | نعم | صور مصغّرة للفيديو |
| `documents` | لا | ملفات داخلية للإدارة فقط |
| `attachments` | لا | مرفقات داخلية للإدارة فقط |

- لا تجعل `documents` أو `attachments` عامين أبدًا.
- سياسات `storage.objects` تمنع القراءة العامة لهذه الـ buckets.

---

## 6) مسارات الإدارة (Admin Routes)

- كل مسار `/admin/*` محمي بـ `RequireAdmin` على الواجهة.
- الحماية الفعلية على الـ backend عبر RLS + الدوال `is_admin`, `has_role`, `can_publish`.
- تسجيل الدخول فقط عبر Supabase Auth في `/admin/login`.
- **لا تستخدم** كلمة المرور الافتراضية في الإنتاج — غيّرها فورًا بعد النشر إلى كلمة مرور قوية وفريدة.

خطوات تأمين حساب super_admin:
1. ادخل على `/admin/login`.
2. غيّر كلمة المرور من إعدادات الحساب.
3. فعّل المصادقة الثنائية إذا كانت متاحة في Supabase.

---

## 7) النشر على خادم شخصي

### Build
```bash
bun install
bun run build
```
ينتج مجلد `dist/`.

### Nginx (مثال)
```nginx
server {
  listen 443 ssl http2;
  server_name yourdomain.org;

  ssl_certificate     /etc/letsencrypt/live/yourdomain.org/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.org/privkey.pem;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

  root /var/www/azhar/dist;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  # Cache assets
  location ~* \.(js|css|png|jpg|jpeg|gif|webp|svg|woff2?)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
}

server {
  listen 80;
  server_name yourdomain.org;
  return 301 https://$host$request_uri;
}
```

### تحديث الـ CORS / Auth في Supabase
- أضف نطاقك `https://yourdomain.org` في:
  - Authentication → URL Configuration → Site URL
  - Authentication → URL Configuration → Additional Redirect URLs

---

## 8) قائمة التحقق قبل النشر (Pre-deploy Checklist)

- [ ] `.env` يحتوي فقط على المتغيرات `VITE_*` العامة
- [ ] `.env` ليس في git
- [ ] HTTPS مفعّل والشهادة صالحة
- [ ] HSTS مفعّل
- [ ] فحص الأمان في Lovable Cloud لا يُظهر تحذيرات حرجة
- [ ] كلمة مرور super_admin قوية (12+ حرف، رموز، أرقام)
- [ ] الـ buckets الخاصة (`documents`, `attachments`) ليست عامة
- [ ] `/admin/login` لا يُتيح إنشاء حسابات super_admin من الواجهة (Bootstrap محدود لأول مستخدم فقط)
- [ ] Site URL وRedirect URLs محدّثة في Supabase
- [ ] نسخ احتياطي للقاعدة مفعّل في Supabase

---

## 9) الصيانة الدورية

- شغّل فحص الأمان أسبوعيًا.
- راجع `audit_logs` لأي نشاط مشبوه.
- دوّر مفاتيح API كل 90 يومًا.
- حدّث الحزم: `bun update` ثم `bun audit`.
