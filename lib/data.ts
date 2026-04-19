export interface Project {
  title: string;
  description: string;
  tags: string[];
  image: string;
  liveUrl: string;
  githubUrl: string;
}

export interface Service {
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar: string;
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export const projects: Project[] = [
  {
    title: "ElectroPro ERP",
    description:
      "Full-stack electrical supplies platform combining e-commerce with ERP — inventory, accounting, HR, and order management in one system.",
    tags: ["Next.js", "PostgreSQL", "Prisma", "NextAuth"],
    image: "/images/project-1.jpg",
    liveUrl: "https://himmat.store",
    githubUrl: "https://github.com/Ahmed-err/ecommerce-accounting-system",
  },
  {
    title: "PrintCraft",
    description:
      "Custom print-on-demand platform with an interactive visual design builder, Paymob payment integration, and automated WhatsApp/SMS/email notifications.",
    tags: ["React", "Express.js", "MongoDB", "Paymob"],
    image: "/images/project-2.jpg",
    liveUrl: "https://harfoushprint.com",
    githubUrl: "https://github.com/Ahmed-err/Print-Shop",
  },
  {
    title: "Tajdera",
    description:
      "A gamified personal budget tracker that roasts your spending habits with AI-style sarcasm across 4 shame tiers. Fully offline, bilingual Arabic/English.",
    tags: ["React", "TypeScript", "Vite", "Framer Motion"],
    image: "/images/project-3.jpg",
    liveUrl: "",
    githubUrl: "https://github.com/Ahmed-err/tajdera",
  },
  {
    title: "Sarmadax Agency Site",
    description:
      "A bilingual digital agency website built with Next.js, Framer Motion, and next-intl — featuring animated sections, a pricing page, portfolio, and contact form.",
    tags: ["Next.js", "TypeScript", "next-intl", "Framer Motion"],
    image: "/images/project-4.jpg",
    liveUrl: "",
    githubUrl: "https://github.com/Ahmed-err/sarmadax",
  },
];

export const services: Service[] = [
  {
    title: "Full-Stack Web Development",
    description:
      "End-to-end web applications built with modern frameworks, optimized for performance and scalability.",
    icon: "Code",
  },
  {
    title: "Mobile Apps",
    description:
      "Cross-platform mobile applications with React Native, delivering native performance on iOS and Android.",
    icon: "Smartphone",
  },
  {
    title: "REST & GraphQL APIs",
    description:
      "Robust, well-documented APIs designed for reliability, security, and developer experience.",
    icon: "Server",
  },
  {
    title: "UI/UX Consulting",
    description:
      "Design audits and user experience consulting to improve conversion rates and user satisfaction.",
    icon: "Palette",
  },
  {
    title: "Performance Optimization",
    description:
      "Speed audits and optimization — from bundle size reduction to database query tuning and caching strategies.",
    icon: "Zap",
  },
  {
    title: "Code Review & Mentoring",
    description:
      "Thorough code reviews and 1-on-1 mentoring to level up your team's engineering practices.",
    icon: "Users",
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Khalid Al-Otaibi",
    role: "CEO",
    company: "NafaaTech — Riyadh 🇸🇦",
    quote:
      "Sarmadax delivered our SaaS platform in under 6 weeks — clean code, flawless Arabic RTL, and a design our clients immediately trusted. Best tech investment we've made.",
    avatar: "/images/avatar-1.jpg",
  },
  {
    name: "Omar Abdel-Fattah",
    role: "Co-Founder",
    company: "LogiTrack — Cairo 🇪🇬",
    quote:
      "We needed a complex logistics dashboard with real-time tracking and Arabic support. Ahmed nailed every requirement and went beyond what we asked for. Highly recommend.",
    avatar: "/images/avatar-2.jpg",
  },
  {
    name: "Rania Mustafa",
    role: "Founder",
    company: "Bazaar Mobile — Khartoum 🇸🇩",
    quote:
      "Our e-commerce app launched to 30K+ downloads in the first three weeks. The interface feels premium, performance is excellent, and the team was responsive at every step.",
    avatar: "/images/avatar-3.jpg",
  },
];

export const skillCategories: SkillCategory[] = [
  {
    category: "Frontend",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
  },
  {
    category: "Backend",
    skills: ["Node.js", "Python", "Express", "FastAPI", "GraphQL"],
  },
  {
    category: "Database",
    skills: ["PostgreSQL", "MongoDB", "Redis", "Prisma"],
  },
  {
    category: "DevOps",
    skills: ["Docker", "AWS", "Vercel", "GitHub Actions", "Nginx"],
  },
];

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Tech Stack", href: "#techstack" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];
