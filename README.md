# مزاد النجوم · Star Auction

**العربية** · [English](#english)

لعبة مزاد كرة قدم بين ركنين، الأحمر والأزرق. كل ركن يبدأ بميزانية €450M ويبني تشكيلة أساسية مركزاً مركزاً. في كل جولة هناك بطاقة مكشوفة تزايدون عليها، وبطاقة مخفية تذهب **مجاناً للخاسر**. لذلك الفوز بالمزايدة ليس دائماً فوزاً بالجولة.

- **أنماط اللعب:** ضد الكمبيوتر (أربعة مستويات: مبتدئ، كشّاف، مدير رياضي، أسطورة)، أو لاعبان على جهاز واحد.
- **الخطط:** 4-3-3 و4-4-2 و3-5-2 و4-2-3-1. لا يُسحب لاعب إلا لمركز يلعب فيه فعلاً.
- **النقاط:** مجموع التقييمات، ثم انسجام النادي والمنتخب والدوري، ثم المال المتبقي. يمكن تفعيل كل عنصر أو إيقافه.
- **المباراة:** محاكاة دقيقة بدقيقة من قوة الهجوم والوسط والدفاع والحارس، وبلا نتائج مكتوبة مسبقاً.
- **الحفظ:** كل حركة تُحفظ تلقائياً، فيمكنك إكمال المزاد لاحقاً. وهناك سجل لكل النزالات.
- **قاعدة البيانات:** أندية وقيم سوقية محدّثة لموسم 2026/27 (أكتوبر 2026).
- **اللغة:** العربية والإنجليزية مع اتجاه كامل من اليمين لليسار، وطبعة نهارية وطبعة ليلية.

## English

A two-corner football draft auction. Red and blue each start with €450M and build a starting XI one position at a time. Every round has an open card you bid on and a face-down card that goes **free to the loser**, so winning the bid isn't always winning the round.

- **Modes:** vs the computer (four difficulty levels) or two players on one device.
- **Formations:** 4-3-3, 4-4-2, 3-5-2, 4-2-3-1. Players are only drawn for positions they actually play.
- **Scoring:** player ratings + club / nation / league chemistry + leftover cash. Each part can be toggled.
- **Match:** a minute-by-minute simulation driven by each XI's attack, midfield, defence and keeper. Nothing is scripted.
- **Saving:** auto-save and resume, plus a local record book of past games.
- **Data:** clubs and market values for the 2026/27 season (as of October 2026).
- **Language and look:** Arabic (RTL) and English, with day and night print themes.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # engine + data tests (vitest)
npm run build    # typecheck + production build
```

**Stack:** Vite, React and TypeScript. There is no backend; persistence is `localStorage`.

**Code layout:**
- Game rules live in `src/engine/` as pure functions with tests.
- The "How to play" page is generated from `src/engine/rules.ts`, so the rules text can't drift from the code.
- The player database is in `src/data/`.

Club badges are monograms drawn in kit colours. The project uses no club logos or player photos.
