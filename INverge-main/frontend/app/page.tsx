import Link from 'next/link';
import {
  Shield,
  Users,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Trust Score System',
    description:
      'Dynamic credibility scoring based on profile completeness, response rate, endorsements, and activity.',
  },
  {
    icon: Users,
    title: 'Structured Connections',
    description:
      'Send investment, networking, or mentorship requests. Messaging unlocks only after acceptance.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Discovery',
    description:
      'Investors browse startups with filters for domain, funding stage, and trust score range.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Messaging',
    description:
      'Socket-powered chat with typing indicators, notifications, and persistent history.',
  },
];

const testimonials = [
  {
    quote:
      'INverge replaced cold outreach with meaningful, trust-scored connections.',
    author: 'Sarah Chen',
    role: 'Seed Investor',
  },
  {
    quote:
      'Our acceptance rate doubled because investors see our credibility upfront.',
    author: 'Marcus Rivera',
    role: 'FinTech Founder',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Shield className="h-7 w-7 text-violet-600" />
            INverge
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-zinc-950 dark:to-indigo-950/20" />
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
            <Star className="h-4 w-4" />
            Trust-based startup networking
          </p>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
            Where founders and investors{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              build trust first
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            INverge connects startup founders with investors through credibility scoring,
            structured requests, and meaningful discovery — not random networking.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start for free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Built for credible connections</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <f.icon className="mb-4 h-8 w-8 text-violet-600" />
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-100 px-6 py-20 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Trusted by builders</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <blockquote
                key={t.author}
                className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="mb-4 text-zinc-700 dark:text-zinc-300">&ldquo;{t.quote}&rdquo;</p>
                <footer className="text-sm">
                  <strong>{t.author}</strong>
                  <span className="text-zinc-500"> · {t.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to build trust?</h2>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          Join founders and investors on a platform designed for meaningful connections.
        </p>
        <Link href="/signup">
          <Button size="lg">Create your account</Button>
        </Link>
      </section>

      <footer className="border-t border-zinc-200 px-6 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} INverge. Trust-based startup networking.
      </footer>
    </div>
  );
}
