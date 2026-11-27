# Ahmed Yousif — portfolio

An Arabic-first, bilingual portfolio built as a small 3D world.

- **The Nile** is the main journey, told the way the tagline reads: from the
  banks of the Nile to the world. It opens on green banks (acacias, scarlet
  flame trees, neem, reeds, palms, Nubian villages, a few Meroitic pyramids on
  the ridge), passes al-Mogran where the Blue and White Nile meet, and ends in
  modern Khartoum: towers, a sail-shaped hotel, a mosque, and a lit bridge to
  sail under. Tap a tree for petals, a tower to light it, a pyramid to hear it,
  the water for rings, and turn the dial from dusk to night to light the city.
- **Three pylon gates** stand in the river. Each one leads into another place
  and has a way back:
  - **The Gallery**: real projects in brass frames around a dark hall with a
    polished stone floor.
  - **The Sky of Services**: a desert night under the galaxy, where every bright
    star is a service.
  - **The Majlis**: a coffee setting on the riverbank by lantern light, with the
    contact form.

## Stack

Next.js (App Router), TypeScript, three.js, and the Web Audio API. There are no
audio or 3D model files: every scene, texture and sound is generated in code.

- **Picture**: HDR rendering with multisampling, real reflections on the water
  and the gallery floor, bloom, a colour-preserving tone curve, per-place colour
  grading, vignette, film grain and dither. Quality adapts to the device and
  steps down on machines that cannot hold a smooth frame rate.
- **Sound**: a breathing drone, a soundscape for each place (water, wind,
  crickets, fire, room tone), a generative melody on physically modelled plucked
  strings in a pentatonic scale, bells for the stars, and a generated hall
  reverb. Sound is opt-in and pauses when the tab is hidden.

## Where things live

- `lib/content.json`: all text in Arabic and English, projects, services, contact details.
- `components/experience/Experience.tsx`: the interface on top of the scenes.
- `components/experience/engine.ts`: renderer, input, quality and transitions.
- `components/experience/river.ts`, `gallery.ts`, `sky.ts`, `majlis.ts`: one file per place.
- `components/experience/materials.ts`: sky, water, stone, light and particle shaders.
- `components/experience/props.ts`: palms and the felucca, shared between places.
- `components/experience/nature.ts`: trees, reeds and falling petals.
- `components/experience/city.ts`: towers with lit windows, the sail, the bridge, the mosque, traffic.
- `components/experience/post.ts`: bloom and the grading pass.
- `components/experience/audio.ts`: all sound.
- `app/api/contact/route.ts`: contact form: saved to Postgres, then sent through Resend.
- `lib/messages.ts`, `db/0001_messages.sql`: stored messages, read by the Sarmadax Console.
- `app/api/internal/console/leads*`: the Console's signed API (`lib/console-auth.ts`).
- `public/images/projects/`: project screenshots shown in the gallery.

## Run it

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `RESEND_API_KEY` and `CONTACT_EMAIL`
so the contact form sends email. `npm test` runs the unit tests.

## Sarmadax Console

Every message is saved to Postgres before it is emailed, so a Resend failure no
longer loses it, and the Console (console.sarmadax.com → البورتفوليو) lists them
with a status and notes. One-time setup on the Vercel project:

1. `DATABASE_URL`: a Neon Postgres connection string (pooled). Run
   `db/0001_messages.sql` against it once (Neon SQL editor or `psql`).
2. `CONSOLE_API_SECRET`: `openssl rand -base64 48`; set the same value as
   `PORTFOLIO_CONSOLE_SECRET` on the Console.

Without `DATABASE_URL` the form still emails, and the Console shows the inbox as
not connected.
