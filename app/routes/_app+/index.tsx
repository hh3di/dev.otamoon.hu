import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView, type Variants } from 'framer-motion';
import {
  Mail,
  MessageCircle,
  ArrowRight,
  ArrowUpRight,
  Server,
  Database,
  Terminal,
  Wrench,
  Sparkles,
  Send,
  ExternalLink,
  CheckCircle2,
  Layers,
  Bot,
  Boxes,
  ChevronDown,
  Menu,
  X,
  Braces,
  GitBranch,
  ServerCog,
  DatabaseZap,
  PanelsTopLeft,
  CloudCog,
  Zap,
  Atom,
  FileCode2,
  Globe2,
  Languages,
} from 'lucide-react';
import { LuGithub, LuLayoutDashboard } from 'react-icons/lu';
import { useLanguage } from '~/utils/service/language/context';
import { dataWithToast } from '~/utils/service/session.service';
import { FlutryMail } from '~/utils/service/FlutryMail.service';
import { data, Form, useActionData, useNavigation, type ActionFunction } from 'react-router';
import { contactSchema } from '~/utils/zod/contact.zod';
import { FormatZodError } from '~/utils/service/function.service';
import { getLanguage } from '~/utils/service/language/server';
import { loadMessages } from '~/utils/service/language/loader';
import { createTranslator } from '~/utils/service/language/translator';
import Spinner from '~/components/common/Spinner';
import Image from '~/components/common/Image';

interface NavLink {
  label: string;
  href: string;
}

interface SkillItem {
  name: string;
  level: number;
}

interface SkillCategory {
  key: string;
  icon: React.ElementType;
  accent: string;
  skills: SkillItem[];
}

interface ProjectItem {
  key: string;
  gradient: string;
  img: string;
  github: string;
  demo: string;
}

interface ServiceItem {
  icon: React.ElementType;
  key: string;
}

interface TechItem {
  icon: React.ElementType;
  name: string;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    key: 'frontend',
    icon: PanelsTopLeft,
    accent: 'from-violet-400 to-cyan-400',
    skills: [
      { name: 'React', level: 95 },
      { name: 'TypeScript', level: 94 },
      { name: 'React Router', level: 92 },
      { name: 'Tailwind CSS', level: 92 },
      { name: 'JavaScript', level: 90 },
      { name: 'HTML5', level: 95 },
      { name: 'CSS3', level: 88 },
      { name: 'Remix', level: 82 },
    ],
  },
  {
    key: 'backend',
    icon: ServerCog,
    accent: 'from-cyan-400 to-emerald-400',
    skills: [
      { name: 'Node.js', level: 95 },
      { name: 'TypeScript', level: 94 },
      { name: 'Fastify', level: 90 },
      { name: 'Express', level: 86 },
      { name: 'REST API Design', level: 93 },
      { name: 'Authentication Systems', level: 88 },
      { name: 'PHP', level: 75 },
      { name: 'C#', level: 45 },
    ],
  },
  {
    key: 'database',
    icon: DatabaseZap,
    accent: 'from-emerald-400 to-amber-400',
    skills: [
      { name: 'MariaDB', level: 88 },
      { name: 'MySQL', level: 86 },
      { name: 'Redis', level: 85 },
      { name: 'Sequelize ORM', level: 90 },
      { name: 'MongoDB', level: 72 },
      { name: 'Database Design', level: 88 },
    ],
  },
  {
    key: 'devops',
    icon: CloudCog,
    accent: 'from-amber-400 to-rose-400',
    skills: [
      { name: 'Linux', level: 85 },
      { name: 'Docker', level: 82 },
      { name: 'Nginx', level: 82 },
      { name: 'Debian', level: 85 },
      { name: 'Git / GitHub', level: 92 },
      { name: 'PM2', level: 85 },
      { name: 'Cloudflare', level: 80 },
    ],
  },
  {
    key: 'languages',
    icon: Braces,
    accent: 'from-rose-400 to-violet-400',
    skills: [
      { name: 'TypeScript', level: 95 },
      { name: 'JavaScript', level: 92 },
      { name: 'SQL', level: 85 },
      { name: 'Python', level: 70 },
      { name: 'PHP', level: 75 },
      { name: 'Go', level: 60 },
    ],
  },
  {
    key: 'tools',
    icon: Wrench,
    accent: 'from-violet-400 to-pink-400',
    skills: [
      { name: 'VS Code', level: 95 },
      { name: 'GitHub', level: 92 },
      { name: 'Postman', level: 88 },
      { name: 'Figma', level: 70 },
      { name: 'npm / pnpm', level: 90 },
      { name: 'CLI Tools', level: 85 },
    ],
  },
];

const PROJECTS: ProjectItem[] = [
  {
    key: 'flutryApi',
    gradient: 'from-violet-500/30 via-fuchsia-500/20 to-cyan-500/30',
    img: 'https://raw.githubusercontent.com/Flutry/Flutry/refs/heads/main/assets/logo.png',
    github: 'https://github.com/Flutry/Flutry',
    demo: '#',
  },
  {
    key: 'portfolioSite',
    gradient: 'from-cyan-500/30 via-blue-500/20 to-emerald-500/30',
    img: '/icon/apple-touch-icon.png',
    github: 'https://github.com/hh3di/dev.otamoon.hu',
    demo: 'https://dev.otamoon.hu',
  },
];

const SERVICES: ServiceItem[] = [
  {
    icon: Globe2,
    key: 'websites',
  },
  {
    icon: LuLayoutDashboard,
    key: 'dashboards',
  },
  {
    icon: Braces,
    key: 'apiDevelopment',
  },
  {
    icon: ServerCog,
    key: 'backendSystems',
  },
  {
    icon: Boxes,
    key: 'fullstackDevelopment',
  },
];

const TECH_STACK: TechItem[] = [
  {
    icon: Atom,
    name: 'React',
  },
  {
    icon: FileCode2,
    name: 'TypeScript',
  },
  {
    icon: Server,
    name: 'Node.js',
  },
  {
    icon: Zap,
    name: 'React Router V7',
  },
  {
    icon: ServerCog,
    name: 'Fastify',
  },
  {
    icon: Boxes,
    name: 'Sequelize',
  },
  {
    icon: Database,
    name: 'MariaDB',
  },
  {
    icon: Zap,
    name: 'Redis',
  },
  {
    icon: GitBranch,
    name: 'Git',
  },
  {
    icon: Bot,
    name: 'Discord.js',
  },
  {
    icon: Terminal,
    name: 'Linux',
  },
  {
    icon: CloudCog,
    name: 'Nginx',
  },
];

const CODE_SNIPPETS: string[] = [
  `const developer = {\n  name: "Szegedi Dániel",\n  role: "Fullstack Developer",\n  stack: ["React", "Node", "TS"],\n  passion: "pixel-perfect UI"\n};`,
  `function buildProduct(idea: Idea): Product {\n  const design = craft(idea);\n  const code = engineer(design);\n  return ship(code);\n}`,
  `export const values = [\n  "clean architecture",\n  "obsessive attention to detail",\n  "performance first"\n];`,
];

function useTypewriter(snippets: string[], speed = 28, pause = 1800) {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = snippets[index % snippets.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && text.length < current.length) {
      timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), speed);
    } else if (!deleting && text.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text.length > 0) {
      timeout = setTimeout(() => setText(current.slice(0, text.length - 1)), speed / 2);
    } else if (deleting && text.length === 0) {
      setDeleting(false);
      setIndex((i) => i + 1);
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, index, snippets, speed, pause]);

  return text;
}

function useMouseParallax() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 40, damping: 15 });
  const springY = useSpring(y, { stiffness: 40, damping: 15 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      x.set(cx);
      y.set(cy);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [x, y]);

  return { springX, springY };
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 bg-[#05050a]" style={{ zIndex: -1 }} />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

function FloatingBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[110px]"
        animate={{ x: [0, 60, -20, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-[110px]"
        animate={{ x: [0, -50, 30, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/15 blur-[110px]"
        animate={{ x: [0, 40, -40, 0], y: [0, -30, 30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUp}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/60 backdrop-blur-sm"
    >
      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
      {children}
    </motion.div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      className={`mb-14 flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}
    >
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <motion.h2 variants={fadeUp} className="max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
        <span className="relative inline-block">
          {title}
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="absolute -bottom-2 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400"
          />
        </span>
      </motion.h2>
      {description && (
        <motion.p variants={fadeUp} className="mt-5 max-w-xl text-base text-white/50">
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}

function GlowButton({
  children,
  variant = 'primary',
  icon: Icon,
  href = '#',
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: React.ElementType;
  href?: string;
  onClick?: () => void;
}) {
  const base =
    'group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-300';
  const primary =
    'bg-gradient-to-r from-violet-500 to-cyan-400 text-black shadow-[0_0_0_0_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_5px_rgba(139,92,246,0.45)]';
  const secondary = 'border border-white/15 bg-white/[0.04] text-white backdrop-blur-sm hover:border-white/30 hover:bg-white/[0.08]';

  return (
    <motion.a
      href={href}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.96 }}
      className={`${base} ${variant === 'primary' ? primary : secondary}`}
    >
      {variant === 'primary' && (
        <motion.span className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      <span className="relative z-10">{children}</span>
      {Icon && <Icon className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
    </motion.a>
  );
}

function GlassCard({ children, className = '', hoverGlow = true }: { children: React.ReactNode; className?: string; hoverGlow?: boolean }) {
  return (
    <motion.div
      whileHover={hoverGlow ? { y: -6 } : undefined}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`group relative rounded-3xl border border-white/10 bg-white/[0.025] backdrop-blur-xl transition-colors duration-300 hover:border-white/20 ${className}`}
    >
      {hoverGlow && (
        <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-violet-500/0 via-transparent to-cyan-500/0 opacity-0 transition-opacity duration-500 group-hover:from-violet-500/10 group-hover:to-cyan-500/10 group-hover:opacity-100" />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/70">
      {children}
    </span>
  );
}

function Navbar() {
  const { t, changeLanguage, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const NAV_LINKS: NavLink[] = [
    { label: t('nav.links.about'), href: '#about' },
    { label: t('nav.links.skills'), href: '#skills' },
    { label: t('nav.links.projects'), href: '#projects' },
    { label: t('nav.links.timeline'), href: '#timeline' },
    { label: t('nav.links.services'), href: '#services' },
    { label: t('nav.links.contact'), href: '#contact' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed inset-x-0 top-0 z-50 px-4 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-5 py-3 backdrop-blur-xl">
        <a href="#hero" className="flex items-center gap-2 font-display text-lg font-bold text-white">
          <Image src="/icon/favicon-32x32.png" alt="logo" />

          {t('nav.logoName')}
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="relative text-sm font-medium text-white/60 transition-colors hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className={`hidden items-center gap-3  ${language === 'en' ? 'lg:flex' : 'xl:flex'}`}>
          <button
            onClick={() => changeLanguage(language === 'hu' ? 'en' : 'hu')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <Languages className="h-4 w-4" />
            {language === 'hu' ? 'HU' : 'EN'}
          </button>

          <GlowButton variant="secondary" icon={ArrowUpRight} href="#contact">
            {t('nav.ctaButton')}
          </GlowButton>
        </div>

        <button className="text-white lg:hidden" onClick={() => setOpen((o) => !o)} aria-label={t('nav.menuAriaLabel')}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={` mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl ${language === 'en' ? 'lg:hidden' : 'xl:hidden'} `}
          >
            <div className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}

              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="flex items-center gap-2 text-sm text-white/50">
                  <Languages className="h-4 w-4" />
                  Language
                </span>

                <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                  <button
                    onClick={() => changeLanguage('hu')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      language === 'hu' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    HU
                  </button>

                  <button
                    onClick={() => changeLanguage('en')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      language === 'en' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function CodeWindow() {
  const typed = useTypewriter(CODE_SNIPPETS);
  const { springX, springY } = useMouseParallax();
  const rotateX = useTransform(springY, [-1, 1], [6, -6]);
  const rotateY = useTransform(springX, [-1, 1], [-6, 6]);

  const lines = typed.split('\n');

  return (
    <motion.div style={{ rotateX, rotateY, transformPerspective: 1000 }} className="relative w-full max-w-md">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12]/90 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-400/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          <span className="ml-3 font-mono text-xs text-white/40">portfolio.ts</span>
        </div>
        <div className="min-h-[220px] w-full min-w-[25rem] p-6 font-mono text-[13px] leading-relaxed text-white/80 sm:text-sm">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 select-none text-white/20">{i + 1}</span>
              <span className="whitespace-pre-wrap break-all">
                {line}
                {i === lines.length - 1 && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-cyan-400 align-middle" />}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <section id="hero" className="relative flex min-h-screen items-center overflow-hidden px-6 pt-32 pb-20">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {t('hero.badge')}
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('hero.titlePrefix')}{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-lg text-lg text-white/55">
            {t('hero.description')}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-4">
            <GlowButton icon={ArrowRight} href="#projects">
              {t('hero.primaryButton')}
            </GlowButton>
            <GlowButton variant="secondary" icon={Mail} href="#contact">
              {t('hero.secondaryButton')}
            </GlowButton>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4">
            {[LuGithub, Mail].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ y: -4, scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 backdrop-blur-sm transition-colors hover:border-violet-400/40 hover:text-white"
              >
                <Icon className="h-4.5 w-4.5" />
              </motion.a>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            <CodeWindow />
          </motion.div>
        </motion.div>
      </div>

      <motion.a
        href="#about"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 hover:text-white/60"
      >
        <ChevronDown className="h-6 w-6" />
      </motion.a>
    </section>
  );
}

function About() {
  const { t } = useLanguage();
  const tags = [t('about.tags.cleanCode'), t('about.tags.performance'), t('about.tags.uxFocused'), t('about.tags.scalability')];

  return (
    <section id="about" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow={t('about.eyebrow')} title={t('about.title')} description={t('about.description')} />

        <div className="flex flex-col gap-2 w-full justify-center items-center text-center mx-auto max-w-4xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="flex flex-col items-center justify-center"
          >
            <motion.p variants={fadeUp} className="text-white/60 leading-relaxed">
              {t('about.paragraph1')}
            </motion.p>
            <motion.p variants={fadeUp} className="mt-4 text-white/60 leading-relaxed">
              {t('about.paragraph2')}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              {tags.map((tag) => (
                <div key={tag} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {tag}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SkillCard({ category, index, title }: { category: SkillCategory; index: number; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const Icon = category.icon;

  return (
    <motion.div ref={ref} variants={fadeUp} custom={index}>
      <GlassCard className="h-full p-7">
        <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${category.accent} text-black`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mb-5 font-display text-lg font-semibold text-white">{title}</h3>
        <div className="space-y-4">
          {category.skills.map((skill) => (
            <div key={skill.name}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-white/60">{skill.name}</span>
                <span className="text-white/40">{skill.level}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${category.accent}`}
                  initial={{ width: 0 }}
                  animate={{ width: inView ? `${skill.level}%` : 0 }}
                  transition={{ duration: 1.1, delay: 0.2, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function Skills() {
  const { t } = useLanguage();
  return (
    <section id="skills" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow={t('skills.eyebrow')} title={t('skills.title')} description={t('skills.description')} />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SKILL_CATEGORIES.map((category, i) => (
            <SkillCard key={category.key} category={category} index={i} title={t(`skills.categories.${category.key}`)} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  title,
  description,
  tags,
  codeLabel,
  demoLabel,
}: {
  project: ProjectItem;
  index: number;
  title: string;
  description: string;
  tags: string[];
  codeLabel: string;
  demoLabel: string;
}) {
  return (
    <motion.div variants={fadeUp} custom={index}>
      <GlassCard className="overflow-hidden">
        <div className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${project.gradient} overflow-hidden`}>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <motion.div
            whileHover={{ scale: 1.1, rotate: 6 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-black/30 backdrop-blur-md"
          >
            <Image src={project.img} alt={project.key} width={70} height={70} />
          </motion.div>
        </div>

        <div className="p-7">
          <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/55">{description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
            {project.github !== '#' && (
              <motion.a
                href={project.github}
                target="_blank"
                whileHover={{ x: 2 }}
                className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white"
              >
                <LuGithub className="h-4 w-4" /> {codeLabel}
              </motion.a>
            )}
            {project.demo !== '#' && (
              <motion.a
                href={project.demo}
                target="_blank"
                whileHover={{ x: 2 }}
                className="flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300"
              >
                <ExternalLink className="h-4 w-4" /> {demoLabel}
              </motion.a>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function Projects() {
  const { t } = useLanguage();
  return (
    <section id="projects" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow={t('projects.eyebrow')} title={t('projects.title')} description={t('projects.description')} />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 gap-8 md:grid-cols-2"
        >
          {PROJECTS.map((project, i) => {
            const base = `projects.items.${project.key}`;
            const tagsObj = t(`${base}.tags`);
            return (
              <ProjectCard
                key={project.key}
                project={project}
                index={i}
                title={t(`${base}.title`)}
                description={t(`${base}.description`)}
                tags={Object.values(tagsObj)}
                codeLabel={t('projects.codeLink')}
                demoLabel={t('projects.demoLink')}
              />
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function Services() {
  const { t } = useLanguage();
  return (
    <section id="services" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow={t('services.eyebrow')} title={t('services.title')} description={t('services.description')} />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SERVICES.map((service, i) => {
            const Icon = service.icon;
            const base = `services.items.${service.key}`;
            return (
              <motion.div key={service.key} variants={fadeUp} custom={i}>
                <GlassCard className="h-full p-7">
                  <motion.div
                    whileHover={{ rotate: 8, scale: 1.05 }}
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-violet-300"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <h3 className="font-display text-lg font-semibold text-white">{t(`${base}.title`)}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-white/50">{t(`${base}.description`)}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function TechStack() {
  const { t } = useLanguage();
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow={t('techStack.eyebrow')} title={t('techStack.title')} />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6"
        >
          {TECH_STACK.map((tech, i) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={tech.name}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, scale: 1.05 }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center backdrop-blur-sm transition-colors hover:border-violet-400/30"
              >
                <Icon className="h-6 w-6 text-white/70" />
                <span className="text-xs font-medium text-white/50">{tech.name}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function ContactForm() {
  const { t } = useLanguage();

  const [error, setError] = useState<Record<string, string> | null>(null);
  const navigation = useNavigation();
  const isRunning = navigation.formMethod != null;
  const actionData = useActionData();
  useEffect(() => {
    if (actionData && actionData.error) {
      setError(actionData.error);
    }
  }, [actionData]);

  return (
    <Form method="post" className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">{t('contact.form.nameLabel')}</label>
          <input
            required
            type="text"
            name="name"
            id="name"
            placeholder={t('contact.form.namePlaceholder')}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-violet-400/50"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">{t('contact.form.emailLabel')}</label>
          <input
            required
            type="email"
            name="email"
            id="email"
            placeholder={t('contact.form.emailPlaceholder')}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-violet-400/50"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">{t('contact.form.messageLabel')}</label>
        <textarea
          required
          rows={5}
          name="message"
          id="message"
          placeholder={t('contact.form.messagePlaceholder')}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-violet-400/50"
        />
      </div>

      <motion.button
        type="submit"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_0_0_rgba(139,92,246,0.5)] transition-shadow duration-300 hover:shadow-[0_0_40px_5px_rgba(139,92,246,0.4)] sm:w-auto"
      >
        {isRunning && <Spinner size="1rem" color="white" />}
        {t('contact.form.submitButton')}
        <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </motion.button>
    </Form>
  );
}

function Contact() {
  const { t } = useLanguage();

  const contactLinks = [
    { icon: Mail, label: t('contact.links.email.label'), value: t('contact.links.email.value') },
    { icon: LuGithub, label: t('contact.links.github.label'), value: t('contact.links.github.value') },
  ];

  return (
    <section id="contact" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle eyebrow={t('contact.eyebrow')} title={t('contact.title')} description={t('contact.description')} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="lg:col-span-3">
            <GlassCard className="p-8" hoverGlow={false}>
              <ContactForm />
            </GlassCard>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-4 lg:col-span-2"
          >
            {contactLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.label}
                  href="#"
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-sm transition-colors hover:border-violet-400/30"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-violet-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/35">{link.label}</div>
                    <div className="text-sm font-medium text-white/80">{link.value}</div>
                  </div>
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="relative border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-white">
          <Image src="/icon/favicon-32x32.png" alt="logo" />
          {t('footer.logoName')}
        </div>
        <p className="text-xs text-white/35">
          © {new Date().toLocaleString('hu-HU', { year: 'numeric' })} {t('footer.copyright')}
        </p>
        <div className="flex items-center gap-4">
          {[LuGithub, MessageCircle].map((Icon, i) => (
            <a key={i} href="#" className="text-white/40 transition-colors hover:text-white">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function Portfolio() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05050a] font-sans text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
        .font-sans { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
        html { scroll-behavior: smooth; }
      `}</style>

      <GridBackground />
      <FloatingBlobs />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Services />
        <TechStack />
        <Contact />
        <Footer />
      </div>
    </div>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const validate = await contactSchema.safeParseAsync(Object.fromEntries(formData));
  if (!validate.success) {
    console.log(validate);
    return data({ error: FormatZodError(validate.error) });
  }

  const language = getLanguage(request);
  const messages = await loadMessages(language);
  const t = createTranslator(messages);
  console.log('sadfs');
  try {
    const { name, email, message } = validate.data;

    // Email sablon HTML-ben
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          ${t('contact.newMessage')} - dev.otamoon.hu
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${t('contact.name')}:</strong> ${name}</p>
          <p><strong>${t('contact.email')}:</strong> ${email}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #374151; margin-top: 0;">${t('contact.message')}:</h3>
          <p style="line-height: 1.6; color: #4b5563;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px; font-size: 12px; color: #6b7280;">
          <p style="margin: 5px 0 0 0;">${t('contact.fromWebsite')}: dev.otamoon.hu</p>
        </div>
      </div>
    `;

    // Email küldése
    await FlutryMail.sendMail('dev@otamoon.hu', 'dev@otamoon.hu', `${t('contact.emailSubject')} - ${name}`, emailHtml, email);

    return dataWithToast(null, { type: 'success', message: t('contact.messageSentSuccessfully') });
  } catch (error) {
    console.error('Email sending error:', error);
    return dataWithToast(null, {
      type: 'error',
      message: t('contact.messageSendError'),
    });
  }
};
