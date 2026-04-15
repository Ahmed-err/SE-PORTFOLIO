# Portfolio Project — Claude Code Context

## Project Overview
A world-class software engineer portfolio website for **Alex Carter** (replace with your real name).
Goal: Win freelance clients and showcase engineering skills with premium design and animations.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui
- **Email**: Resend (contact form)
- **i18n**: next-intl (Arabic/English)
- **Theming**: next-themes (Dark/Light mode)
- **Deployment**: Vercel

## Features
- **Arabic/English i18n**: Full bilingual support using next-intl. All portfolio text is translated. Arabic uses Cairo font and RTL layout.
- **Dark/Light Theme**: Toggle between dark and light modes using next-themes. Persists via class-based theming with localStorage.
- **Language Toggle**: EN/AR button in navbar switches locale via cookie and page reload.
- **Theme Toggle**: Sun/moon button in navbar with rotate animation, instant dark/light switching.
- **Scroll Progress Bar**: Thin accent-colored progress line at the top of the viewport tracking scroll position.
- **Custom Cursor**: Animated cursor that expands on hoverable elements (hidden on touch devices).
- **Loading Screen**: Animated "AC" splash screen on first load.
- **Contact Form**: Sends messages via Resend API (with console fallback in dev).
- **Lazy Loading**: Below-fold sections loaded via `next/dynamic` for performance.
- **Reduced Motion**: All animations respect `prefers-reduced-motion` via `useReducedMotion()`.

## Animation System

### Hero Section
- **Gradient Mesh Background**: Three floating blobs that react to mouse movement via `useMotionValue`/`useTransform`. Each blob animates on a long loop (15–25s) for organic feel.
- **Split-Word Reveal**: Heading words animate in individually with 3D perspective (`rotateX` + `y` transform), staggered at 0.08s intervals using `wordReveal`/`wordRevealChild` variants.
- **Typewriter Effect**: Cycles through roles ("Full-Stack Developer", "UI/UX Engineer", etc.) with typing/deleting animation and a sharp blinking cursor (CSS `blink-cursor` keyframe).
- **Shimmer CTA Buttons**: `shimmer-btn` class adds a sweep highlight on hover via CSS `::after` pseudo-element with `translateX` animation.
- **Scroll Indicator**: "Scroll" label + bouncing `ChevronDown` icon, fades in after 2s delay.

### Navbar
- **Active Section Highlight**: `IntersectionObserver`-style scroll tracking updates `activeSection` state. Active link gets accent color + animated underline.
- **Underline Hover**: CSS `w-0 → w-full` transition on `::after` pseudo-underline, appears on hover.
- **Theme Toggle Animation**: Icon rotates 90° on swap using `AnimatePresence mode="wait"`.
- **Mobile Menu**: Staggered link appearance using `mobileNavContainer`/`mobileNavItem` variants (0.06s stagger, 0.1s delay). Hamburger/X icon animates between states.

### About Section
- **Count-Up Stats**: Numbers animate from 0 to target using `requestAnimationFrame` with cubic easeOut. Triggered by `useInView`. Respects reduced motion.
- **Rotating Gradient Border**: `conic-gradient` background with CSS `rotate-gradient` animation (4s infinite) creates a spinning border effect around the photo placeholder.
- **Line-by-Line Text**: Each paragraph fades in individually with 0.15s stagger using per-element `whileInView`.

### Services Section
- **3D Tilt Cards**: `useMotionValue` + `useSpring` for smooth rotateX/rotateY following mouse position. Spring physics (stiffness: 200, damping: 20).
- **Dynamic Glow**: `radial-gradient` positioned at mouse coordinates via `useTransform`, fading in on hover.
- **Icon Bounce**: `whileHover` with scale 1.1 + subtle rotation shake `[0, -5, 5, 0]`.
- **Staggered Scroll Entry**: Each card delays by `index * 0.1s`.

### Projects Section
- **Image Zoom**: CSS `transition-transform duration-500 group-hover:scale-105` with `overflow-hidden` container.
- **Overlay Slide-Up**: Overlay `translate-y-full → translate-y-0` on group hover, buttons inside use `whileHover` scale.
- **3D Tilt**: Same spring-based tilt system as Services.
- **Staggered Entry**: `index * 0.12s` delay per card.

### Tech Stack Section
- **Dual Marquee Rows**: Two rows scrolling in opposite directions via CSS `marquee-left`/`marquee-right` keyframes (30s infinite). Row 1: frontend + backend skills, Row 2: database + devops skills.
- **Pause on Hover**: `group-hover:[animation-play-state:paused]` on the marquee container.
- **Individual Skill Hover**: Each pill scales up (`hover:scale-110`) and gets accent border/color.
- **Edge Fade**: Gradient overlays on left/right edges for seamless loop appearance.

### Testimonials Section
- **Auto-Scroll Carousel**: Cycles every 5s with directional slide animation (`x: ±200`). Uses `AnimatePresence mode="wait"` for smooth crossfade.
- **Pause on Hover**: `onMouseEnter`/`onMouseLeave` toggles `isPaused` state.
- **Dot Indicators**: Active dot widens to `w-8` with accent color, others are small circles. Clickable for manual navigation.
- **Quote Decoration**: Large `Quote` icon at 5% opacity in top-right corner of card.

### Contact Section
- **Floating Labels**: Labels float up and shrink on focus/filled using CSS `peer` selectors and `translate-y` + `scale` transitions.
- **Submit Button States**: Idle → spinning `Loader2` icon → green `Check` icon with spring scale animation. Button color transitions from accent to green on success.
- **Pulsing Availability Dot**: Green dot next to "Available for freelance" with CSS `pulse-dot` animation (scale + opacity pulse).
- **Auto-Reset**: Status resets to idle 3s after successful send.

### Global
- **Scroll Progress Bar**: `ScrollProgress` component uses `useScroll()` + `useSpring()` for a smooth accent-gradient line at top of viewport (`z-60`).
- **Shimmer Buttons**: CSS-based sweep animation on all primary/outline buttons.
- **Reduced Motion**: CSS `prefers-reduced-motion: reduce` disables all CSS animations. Framer Motion `useReducedMotion()` used in Hero for conditional animation.
- **RTL Support**: All directional styles use `ltr:`/`rtl:` Tailwind modifiers. Marquee, floating labels, and decorative elements are RTL-aware.

## Project Structure
```
/
├── app/
│   ├── layout.tsx          # Root layout — fonts, next-intl provider, ThemeProvider, RTL dir
│   ├── page.tsx            # Main entry — lazy loads below-fold sections, ScrollProgress
│   ├── globals.css         # Dark/light vars, keyframes (shimmer, marquee, blink, pulse, rotate-gradient), reduced motion
│   └── api/
│       ├── contact/route.ts    # Contact form POST handler (Resend)
│       └── locale/route.ts     # Locale switching POST handler (sets cookie)
├── components/
│   ├── ui/                 # Button (with shimmer-btn class)
│   ├── layout/             # Navbar (active section tracking, staggered mobile menu), Footer
│   └── shared/             # CustomCursor, LoadingScreen, SectionWrapper, ThemeProvider, ScrollProgress
├── sections/
│   ├── Hero.tsx            # Gradient mesh, split-word reveal, typewriter, shimmer CTAs
│   ├── About.tsx           # Count-up stats, rotating gradient border, line-by-line text
│   ├── Services.tsx        # 3D tilt + glow cards, icon bounce, staggered entry
│   ├── Projects.tsx        # Image zoom, overlay slide-up, 3D tilt, staggered entry
│   ├── TechStack.tsx       # Dual marquee rows, pause on hover, skill pill hover
│   ├── Testimonials.tsx    # Auto-scroll carousel, dot nav, quote decoration
│   └── Contact.tsx         # Floating labels, submit spinner/checkmark, pulsing dot
├── lib/
│   ├── utils.ts            # cn() helper
│   ├── data.ts             # Type definitions
│   └── animations.ts       # Variants: fadeUp, staggerContainer, scaleIn, fadeIn, slideInLeft/Right, wordReveal, wordRevealChild, slideUp, mobileNavItem/Container
├── i18n/
│   └── request.ts          # next-intl server config (reads locale from cookie)
├── messages/
│   ├── en.json             # English translations
│   └── ar.json             # Arabic translations
├── public/
│   └── images/
└── CLAUDE.md
```

## Design System

### Theme
- **Default**: Dark mode
- **Dark Background**: `#0a0a0a` (primary), `#111111` (cards/sections), `#1a1a1a` (borders)
- **Light Background**: `#ffffff` (primary), `#f5f5f5` (cards/sections), `#e5e5e5` (borders)
- **Accent**: Electric purple `#7c3aed` / `#8b5cf6` — used for CTAs, highlights, glows
- **Dark Text**: `#ffffff` (primary), `#a1a1aa` (secondary), `#52525b` (muted)
- **Light Text**: `#0a0a0a` (primary), `#525252` (secondary), `#a1a1aa` (muted)
- **Font**: Geist Sans (headings) + Cairo (Arabic body) via next/font
- **Theme switching**: Class-based via next-themes (`<html class="light">` or default dark)

### Animation Conventions
- All scroll-triggered animations use `whileInView` + `viewport={{ once: true, margin: "-100px" }}`
- Standard entrance: `{ opacity: 0, y: 30 }` → `{ opacity: 1, y: 0 }` with `duration: 0.6`
- Stagger children: `staggerChildren: 0.1` (standard) or `0.15` (slow) on parent container
- Spring physics for interactive elements: `type: "spring", stiffness: 200–400, damping: 15–20`
- 3D tilt uses `useMotionValue` → `useTransform` → `useSpring` pipeline
- Page load sequence: LoadingScreen (1.5s) → Hero stagger reveal
- CSS keyframe animations: shimmer, marquee-left/right, blink-cursor, pulse-dot, rotate-gradient, mesh-float

## Internationalization (i18n)

### Setup
- Uses `next-intl` with a non-routing approach (no `/en` or `/ar` URL prefixes)
- Locale is stored in a cookie (`locale`) and read server-side via `i18n/request.ts`
- `NextIntlClientProvider` wraps the app in `layout.tsx` to provide translations client-side
- All text content lives in `messages/en.json` and `messages/ar.json`

### RTL Behavior
- When locale is `ar`, the `<html>` element gets `dir="rtl"` and `lang="ar"`
- The Arabic font (Cairo from Google Fonts) is loaded via `next/font` and applied when `dir="rtl"`
- Tailwind `ltr:` and `rtl:` modifiers are used for directional spacing (e.g., `ltr:ml-2 rtl:mr-2`)
- Layouts naturally flip in RTL mode via the `dir` attribute
- Marquee, floating labels, decorative elements all tested for RTL correctness

### Switching Language
- User clicks the `EN | AR` button in the navbar
- A POST request to `/api/locale` sets the `locale` cookie
- The page reloads to apply the new locale server-side

## Commands
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

## Environment Variables (.env.local)
```
RESEND_API_KEY=your_resend_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Coding Standards
- All components are functional with TypeScript interfaces for props
- No `any` types — use proper typing throughout
- Use `cn()` from `lib/utils.ts` for conditional Tailwind classes
- Framer Motion variants are defined outside components (in `lib/animations.ts` or at file top) — never inline large variant objects
- Images use `next/image` with proper `width`, `height`, and `alt`
- All sections have an `id` attribute matching the navbar anchor links
- Mobile-first responsive design — base styles for mobile, `md:` and `lg:` for larger screens
- All user-facing text uses `useTranslations()` from next-intl — never hardcode strings
- All animations must work in both LTR and RTL modes
- All animations must respect `prefers-reduced-motion`

## Performance Notes
- Below-fold sections lazy loaded via `next/dynamic`
- Optimize all images via `next/image`
- Framer Motion: `useReducedMotion()` used to conditionally disable complex animations
- Font optimization: `next/font` with `display: swap`
- CSS animations use `will-change: transform` only on actively animating elements
- Marquee uses CSS animations (not JS) for 60fps scroll

## Deployment
- Platform: Vercel
- Auto-deploys on push to `main`
- Add env vars in Vercel dashboard before first deploy
- No `vercel.json` needed for standard Next.js App Router setup

---
*Update the placeholder name "Alex Carter" and all personal info in `messages/en.json` and `messages/ar.json` before going live.*
