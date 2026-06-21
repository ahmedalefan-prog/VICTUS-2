# VICTUS — منصّة الخدمات (دليل المشروع)

منصة تجارية محورها **ثلاث خدمات مملوكة للإدارة**: المختبر · السوق · الصيانة. تخدم العيادات/الأطباء كعملاء يطلبون، مع طبقتي توظيف وإعلانات. كل طلب يُوثَّق تلقائياً لاستقطاع النِّسب يدوياً (المنصة لا تحسب نِسباً).
عربي RTL · IQD · تقويم ميلادي · العراق فقط.

الحزمة: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 6 + PostgreSQL · Auth.js v5 (Credentials/JWT).

> الخريطة الكاملة في `docs/VICTUS-الخريطة-النهائية.md`. هذا المشروع أُسّس نظيفاً من VICTUS-1 (مرجع مجمّد) بنقل الأساس المُجرَّب وإعادة بناء القلب حول «الخدمة».

## مبادئ أساسية
- **ابنِ تدريجياً مرحلة بعد مرحلة** — لا تبدأ مرحلة بلا تأكيد.
- **RBAC مركزي**: مصدر الحقيقة `src/lib/rbac.ts` (موارد × إجراءات + قوالب الأدوار). قسم جديد = أضف `resource` + عنصر في `src/lib/nav.ts` + صلاحيات في القوالب، ثم `npm run db:seed`.
- **حراسة الصفحات**: `requirePermission(resource, action)` من `src/lib/guard.ts` في كل صفحة خادم. **الصلاحيات حيّة** (تُحقن من القاعدة كل طلب).
- **التنسيق**: `formatIQD` و `formatDate/formatDateTime` من `src/lib/format.ts` (لا هجري).
- **الطبقات الأفقية**: `dispatchNotification` (`notifications.ts`) · `logActivity`/`recordAudit` (`audit.ts`) · `saveMedia/...` (`storage.ts`) · `getSetting/setSetting` (`settings.ts`).
- **العمليات الحسّاسة** داخل `prisma.$transaction` تُنشئ توثيقها المتّسق.
- وسائط بروابط خارجية عبر `<img>` (لا `next/image` بلا `remotePatterns`).

## نواة الخدمات
- `Service` (LAB/MARKET/MAINTENANCE — مملوكة للأدمن، وضع EXCLUSIVE) · `ServiceMember` (فريق داخلي بأدوار MANAGER/MEMBER) · عزل صارم: العضو يصل لخدمته فقط.
- `CatalogItem` (سعر عادي/VIP، مخزون، condition للأجهزة) · `ServiceOrder` (ORD-) + `OrderItem` + `PriceChangeLog` + `PartnerTransaction` (توثيق الإدارة).
- قواعد الطلب: التصفّح للجميع، الطلب للأطباء/العيادات (CREATE على lab/market/maintenance). **بلا تفاوض** — كل طلب بالسعر المعروض (المتّفق = المعروض) ويوثَّق فوراً، ثم دورة التنفيذ.

## أنواع الحسابات (6)
SUPER_ADMIN · CLINIC_OWNER · DENTIST · SERVICE_MEMBER · JOB_SEEKER · ADVERTISER.
المدير الافتراضي: admin@victus.iq / Victus@2026.

## أوامر
`npm run dev` · `db:push` · `db:seed` · `db:studio` · `build`. يتطلب في `.env` (**قاعدة منفصلة عن VICTUS-1**): `DATABASE_URL` (نقطة Neon **المجمّعة** `-pooler` + `pgbouncer=true` — للتشغيل) و `DIRECT_DATABASE_URL` (المباشرة — للهجرات/`db push`). على Vercel اضبط كليهما + `AUTH_SECRET`.
لا middleware — الحماية في تخطيطات الخادم. عميل Prisma في `src/generated/prisma` (متجاهَل).

## حالة البناء
- **المراحل 1–6 مكتملة** · بناء أخضر · lint نظيف.
  - 1) الأساس (سقالة + RBAC/تنقّل/طبقات أفقية + مخطّط + لوحة).
  - 2) المختبر · 3) السوق · 4) الصيانة (الخدمات الثلاث: طلب/توثيق/دورة تنفيذ). **بلا تفاوض** — كل طلب بالسعر المعروض.
  - 5) الطبقات المساندة: العيادات/الأجهزة · التوظيف · الإعلانات (نقل VICTUS-1، 4/صفحة) · الموارد البشرية (لكل خدمة).
   - 6) الأدمن: مراجعة الحسابات · المستخدمون · الأدوار (مصفوفة + تجاوزات) · معاملات الخدمات (CSV) · المحافظات · التدقيق · الإعدادات · العلامات.

## تحسينات المجلس
- **استجابة الموبايل**: جميع فورم الإدخال صارت `grid-cols-1 sm:grid-cols-2` (16 ملفاً — job-post-form, candidate-form, payroll-create, employee-controls×5, employee-roster, brand-manager, device-manager, campaign-form×2, lab-order-builder×2, ads/[id]/page).
- **أزرار الإشعارات**: `md:opacity-0 md:group-hover:opacity-100` لتظهر دوماً على الموبايل.
- **Empty States**: 38 حالة استُبدلت بـ `<EmptyState>` في 34 ملفاً.
- **Focus Ring**: `*:focus-visible { outline: 2px solid var(--primary) }` للوحة المفاتيح.
- **تباين النصوص**: `--fg-muted: #544e48` و `--fg-faint: #8d877f` أغمق للوضع الفاتح الزجاجي.
- **Pagination**: مكوّن `<Pagination>` تقليدي (أرقام) + skip/take — طُبق على `market/orders`, `lab/orders`, `admin/users`, `admin/audit`, `admin/transactions`.
- **صفحة 404**: `not-found.tsx` مخصصة.
- **Animations**: shimmer (skeleton), pulse (badge), slide-from-top (toast), fade-in (modal backdrop).
- **صفحة الخطأ (error.tsx)**: `src/components/ui/error-page.tsx` + `(dashboard)/error.tsx`.
- **الوصولية (a11y)**: `aria-label` للأزرار المفقودة (sidebar، إشعارات، pagination)، `aria-current="page"` للروابط النشطة، `aria-pressed` لأزرار الفلترة.
- **الملف الشخصي المُحسّن**: يعرض البريد، الهاتف، الحالة، تاريخ التسجيل، آخر دخول، العضويات في الخدمات، العيادات المملوكة.
- **التصميم المستقبلي (Year 3000)**:
  - `globals.css`: خلفية بنقاط شبكية + 3 كرات متوهجة عائمة (gradient orbs) + تحسين `.glass` بحدود متدرجة
  - `Card`: إضافة `card-glow` — توهج نيون عند التمرير (hover shadow + border)
  - `DataTable`: إطار زجاجي مع hover glow، صفوف `futuristic-table` مع توهج خفيف
  - `PageHeader`: عنوان بتدرج لوني (`text-gradient`) من fg → primary
  - `Button`: glow shadow محسّن على hover لجميع الأنواع
  - `Badge`: دعم `glow` prop لتأثير النيون
  - `Input/Select`: كلاس `futuristic-input` مع glow زجاجي عند focus
  - `layout.tsx`: 3 كرات متوهجة (futuristic-orb) عائمة بخلفية التطبيق
  - الوضع الفاتح: تم تغيير البيج الدافئ إلى **Crystal Clean** — أبيض/رمادي عصري
- **تحسينات إضافية (المستقبل البعيد)**:
  - `scanline` — طبقة مسح CRT خفيفة على كامل الشاشة (تأثير سايبربانك)
  - `cyber-border` — إطار متدرج متحرك (conic-gradient يدور) يظهر عند hover على البطاقات والسايدبار
  - `glitch` — تأثير خلل رقمي للنصوص المهمة (data-text + clip-path)
  - `particle-field` + 10 جزيئات CSS عائمة في الخلفية (بدون JS)
  - `neon-glow` — توهج نيون ثلاثي الطبقات
  - `skeleton-futuristic` — هيكل تحميل متدرج مع مسح ضوئي (sweep)
  - `useTilt` hook — تأثير 3D للبطاقات (perspective + rotateX/Y حسب mouse position)
  - `skeleton-futuristic` في `loading.tsx` بدل Skeleton القديم
