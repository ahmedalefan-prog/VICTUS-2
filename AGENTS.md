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
`npm run dev` · `db:push` · `db:seed` · `db:studio` · `build`. يتطلب `DATABASE_URL` في `.env` (**قاعدة منفصلة عن VICTUS-1**).
لا middleware — الحماية في تخطيطات الخادم. عميل Prisma في `src/generated/prisma` (متجاهَل).

## حالة البناء
- **المراحل 1–6 مكتملة** · بناء أخضر · lint نظيف.
  - 1) الأساس (سقالة + RBAC/تنقّل/طبقات أفقية + مخطّط + لوحة).
  - 2) المختبر · 3) السوق · 4) الصيانة (الخدمات الثلاث: طلب/توثيق/دورة تنفيذ). **بلا تفاوض** — كل طلب بالسعر المعروض.
  - 5) الطبقات المساندة: العيادات/الأجهزة · التوظيف · الإعلانات (نقل VICTUS-1، 4/صفحة) · الموارد البشرية (لكل خدمة).
  - 6) الأدمن: مراجعة الحسابات · المستخدمون · الأدوار (مصفوفة + تجاوزات) · معاملات الخدمات (CSV) · المحافظات · التدقيق · الإعدادات · العلامات.
