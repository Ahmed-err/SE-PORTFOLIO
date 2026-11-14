# Ahmed Yousif — portfolio

An Arabic-first, bilingual portfolio built as a small 3D world.

- **The Nile** is the main journey: scroll to sail past pyramids and palms, tap a
  pyramid to hear a note, tap the water for ripples, slide dusk into night.
- **Three gates** along the river lead into other places, and each has a way back:
  - **The Gallery**: real projects as lit frames in a dark hall.
  - **The Sky of Services**: every star is a service.
  - **The Majlis**: a tea setting on the riverbank with the contact form.

## Stack

Next.js (App Router), TypeScript, three.js, and the Web Audio API for sound.
No audio or 3D model files: scenes and sounds are generated in code.

## Where things live

- `lib/content.json`: all text in Arabic and English, projects, services, contact details.
- `components/experience/engine.ts`: the 3D scenes and sound.
- `components/experience/Experience.tsx`: the interface on top of the scenes.
- `app/api/contact/route.ts`: contact form, sent through Resend.
- `public/images/projects/`: project screenshots shown in the gallery.

## Run it

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `RESEND_API_KEY` and `CONTACT_EMAIL`
so the contact form sends email. Without them, messages are only logged.
