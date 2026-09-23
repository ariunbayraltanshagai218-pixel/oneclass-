# OneClass — онлайн хувилбар тохируулах

## 1. Storage bucket үүсгэх
Supabase Dashboard → **Storage** → **New bucket**
- Name: `oneclass-media`
- **Public bucket: ON**

## 2. SQL Editor дээр ажиллуулах
Supabase Dashboard → **SQL Editor** → **New query**.
Доорх `setup.sql` файлын бүх SQL-ийг paste хийгээд **Run** дар.

Энэ нь `media` хүснэгт болон upload/list хийхэд шаардлагатай RLS policy-уудыг үүсгэнэ.

## 3. Сайтыг турших
`index.html`-ийг шууд double-click хийж нээхээс илүү local web server эсвэл hosting дээр ажиллуулна.
Жишээ нь VS Code Live Server, Netlify, Vercel гэх мэт.

## Анхаарах зүйл
Энэ хувилбар нь нэвтрэх системгүй. Тиймээс линктэй хүн зураг/видео upload хийж чадна.
Ангийнханд зориулж жинхэнэ хамгаалалт хэрэгтэй бол дараагийн шатанд Supabase Auth + зөвшөөрлийн систем нэмнэ.

## Нууцлал
`config.js` дотор зөвхөн publishable key байна. Secret/service_role key-г хэзээ ч browser кодонд хийж болохгүй.
