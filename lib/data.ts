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
    title: "SaaS Dashboard",
    description:
      "A comprehensive analytics platform for SaaS metrics. Real-time data visualization, subscription tracking, and revenue forecasting with a clean, intuitive interface.",
    tags: ["React", "Next.js", "Stripe", "PostgreSQL"],
    image: "/images/project-1.jpg",
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    title: "E-Commerce Platform",
    description:
      "A headless storefront built on Shopify API delivering blazing-fast performance with a 99 Lighthouse score. Custom checkout flow and real-time inventory sync.",
    tags: ["Next.js", "Shopify API", "Tailwind"],
    image: "/images/project-2.jpg",
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    title: "Real-time Chat App",
    description:
      "A scalable messaging platform supporting 10k concurrent users with typing indicators, read receipts, and end-to-end encryption.",
    tags: ["Socket.io", "Node.js", "Redis"],
    image: "/images/project-3.jpg",
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    title: "AI Content Generator",
    description:
      "An intelligent content platform that generates SEO-optimized blog posts, social media copy, and marketing materials using advanced AI models.",
    tags: ["OpenAI API", "Next.js", "Prisma"],
    image: "/images/project-4.jpg",
    liveUrl: "#",
    githubUrl: "#",
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
    name: "Sarah Mitchell",
    role: "CTO",
    company: "NovaTech",
    quote:
      "Delivered our platform 2 weeks ahead of schedule with exceptional code quality. Alex's ability to translate complex requirements into elegant solutions is unmatched.",
    avatar: "/images/avatar-1.jpg",
  },
  {
    name: "James Okafor",
    role: "Founder",
    company: "Launchpad",
    quote:
      "Exceptional attention to detail and clean code. Alex didn't just build what we asked for — he identified and solved problems we didn't even know we had.",
    avatar: "/images/avatar-2.jpg",
  },
  {
    name: "Priya Nair",
    role: "Product Manager",
    company: "Finlo",
    quote:
      "Alex turned a complex brief into a flawless product. Communication was always clear, deadlines were always met, and the end result exceeded our expectations.",
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
