import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Code,
  Cpu,
  GraduationCap,
  LayoutTemplate,
  ShieldCheck,
} from 'lucide-react';

const SUBJECTS = [
  {
    href: '/docs/computer-systems',
    title: 'Вычислительные системы и сети',
    desc: 'Подсети и VLSM, модель OSI, конвейер CPU, маршрутизация, SLA и RAID',
    icon: Cpu,
    accent: 'bg-subject-cs/10 text-subject-cs',
  },
  {
    href: '/docs/systems-programming',
    title: 'Системное программирование',
    desc: 'JavaScript и Node, алгоритмы, отладка, тесты — с автопроверкой кода',
    icon: Code,
    accent: 'bg-subject-sp/10 text-subject-sp',
  },
  {
    href: '/docs/web-development',
    title: 'Web-разработка и дизайн',
    desc: 'HTML/CSS, Flexbox и Grid, Figma, аналитика — с живыми песочницами',
    icon: LayoutTemplate,
    accent: 'bg-subject-web/10 text-subject-web',
  },
  {
    href: '/docs/computer-literacy',
    title: 'Компьютерная грамотность и ИИ',
    desc: 'Горячие клавиши, таблицы, промпты для ИИ, фактчекинг, безопасность',
    icon: GraduationCap,
    accent: 'bg-subject-lit/10 text-subject-lit',
  },
  {
    href: '/docs/business-design',
    title: 'Управление бизнес-дизайном',
    desc: 'Бизнес-модели, ценность и JTBD, путь клиента, юнит-экономика, процессы',
    icon: Briefcase,
    accent: 'bg-subject-bd/10 text-subject-bd',
  },
  {
    href: '/docs/digital-security',
    title: 'Цифровая безопасность',
    desc: 'Риски и угрозы, доступы, социальная инженерия, инциденты — для 3 курса',
    icon: ShieldCheck,
    accent: 'bg-subject-sec/10 text-subject-sec',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-16">
      <p className="text-sm font-semibold text-fd-muted-foreground">
        Кафедра БИжЭМ · Бизнес-информатика и Математика в экономике
      </p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
        Сначала попробуй руками — потом читай теорию
      </h1>
      <p className="mt-3 max-w-2xl text-fd-muted-foreground">
        Я собрал здесь лекции и тренажёры по предметам нашей кафедры. Идея простая:
        сначала покрути тему в тренажёре, реши пару задач — а потом уже читай, как оно
        устроено. Заводить аккаунт не нужно, прогресс остаётся у тебя в браузере.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {SUBJECTS.map((subject) => (
          <Link
            key={subject.href}
            href={subject.href}
            className="group rounded-xl border border-fd-border bg-fd-card p-4 transition-colors hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            <span className={`grid size-9 place-items-center rounded-lg ${subject.accent}`}>
              <subject.icon className="size-4.5" aria-hidden />
            </span>
            <p className="mt-3 font-bold leading-snug">{subject.title}</p>
            <p className="mt-1 text-sm text-fd-muted-foreground">{subject.desc}</p>
          </Link>
        ))}

        <Link
          href="/docs"
          className="group flex items-center justify-between rounded-xl border border-dashed border-fd-border p-4 text-sm font-semibold text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          Все дисциплины и лекции
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </main>
  );
}
