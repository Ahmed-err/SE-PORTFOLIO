# Ahmed Yousif — Developer Portfolio

A bilingual (Arabic / English) personal portfolio built with Next.js, Framer Motion, and next-intl. Features dark/light theming, animated sections, a working contact form, and full RTL support.

**Live:** [ahmed-yousif-dev-portfolio.vercel.app](https://ahmed-yousif-dev-portfolio.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| i18n | next-intl (AR / EN + RTL) |
| Theming | next-themes |
| Email | Resend |
| Deployment | Vercel |

---

## Features

- Fully bilingual — Arabic (RTL) and English (LTR) with locale-based routing
- Dark / light mode with system preference detection
- Animated sections: Hero, About, Services, Projects, Tech Stack, Testimonials, Contact
- Working contact form via Resend API with server-side validation
- Responsive across all screen sizes
- Custom cursor and scroll-progress indicator

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in RESEND_API_KEY and CONTACT_EMAIL

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

---

## Project Structure

```
app/              # Next.js App Router (layout, page, API routes)
components/       # Shared UI components (Navbar, Footer, etc.)
sections/         # Page sections (Hero, Projects, Contact, etc.)
lib/              # Data definitions and animation variants
messages/         # i18n translation files (en.json, ar.json)
public/           # Static assets
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | No | Enables contact form emails via Resend |
| `CONTACT_EMAIL` | No | Recipient email for contact submissions |
| `NEXT_PUBLIC_SITE_URL` | No | Used in OG metadata |

The contact form falls back to a console log in development if `RESEND_API_KEY` is not set.

---

## Customisation

All content lives in two places:

- **`lib/data.ts`** — projects, services, testimonials, skills, nav links
- **`messages/en.json`** and **`messages/ar.json`** — all display text

Update those files to make the portfolio your own.

---

## License

MIT
