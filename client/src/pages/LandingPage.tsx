import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Video, FileText, LayoutDashboard, Users, Sparkles, Shield, Zap, Menu, X, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Tech Stack', href: '#tech' },
];

const FEATURES = [
  {
    accentClass: 'bg-amber-500/10',
    iconClass: 'text-amber-400',
    glowClass: 'bg-amber-500/10',
    Icon: Sparkles,
    title: 'Smart Action Extraction',
    desc: 'Never forget who agreed to what. GPT-4 reads your transcript and auto-creates tracked tasks — assigned to the right person, instantly.',
    bullets: ['Live OpenAI Whisper transcription', 'GPT-4 powered meeting summaries', 'Automatic task generation & assignment'],
    bulletColor: 'bg-emerald-500/20',
    dotColor: 'bg-emerald-400',
    screenshot: '/screenshots/history.png',
    alt: 'AI Meeting Summary & Action Items',
    reverse: false,
  },
  {
    accentClass: 'bg-blue-500/10',
    iconClass: 'text-blue-400',
    glowClass: 'bg-blue-500/10',
    Icon: LayoutDashboard,
    title: 'Integrated Task Boards',
    desc: 'AI-extracted action items appear on your Kanban board in real-time. Manage sprints, drag tasks, and track progress without switching apps.',
    bullets: ['Real-time Socket.io sync', 'Drag & drop with optimistic UI', 'Linked to source meeting'],
    bulletColor: 'bg-blue-500/20',
    dotColor: 'bg-blue-400',
    screenshot: '/screenshots/kanban.png',
    alt: 'Kanban Task Board',
    reverse: true,
  },
  {
    accentClass: 'bg-purple-500/10',
    iconClass: 'text-purple-400',
    glowClass: 'bg-purple-500/10',
    Icon: Users,
    title: 'Enterprise Workspaces',
    desc: 'Organize your company into secure, isolated workspaces. Invite colleagues, assign roles, and keep your data strictly within your team.',
    bullets: ['Admin & Member role permissions', 'Secure shareable invite links', 'Isolated workspace data'],
    bulletColor: 'bg-purple-500/20',
    dotColor: 'bg-purple-400',
    screenshot: '/screenshots/team.png',
    alt: 'Team Workspace',
    reverse: false,
  },
];

const TECH = [
  { Icon: Zap, title: 'Sub-200ms WebRTC', desc: 'Peer-to-peer video architecture with Socket.io signaling designed for real-time conferencing at scale.' },
  { Icon: Shield, title: 'OWASP Compliant Security', desc: 'JWT + bcrypt, rate-limiting, Helmet.js CSP headers, and full OWASP Top 10 security review.' },
  { Icon: FileText, title: 'Kubernetes Orchestrated', desc: 'Multi-stage Docker images, Helm charts, and GitHub Actions CI/CD for zero-downtime rolling deploys.' },
];

const STEPS = [
  { step: '01', title: 'Host a Meeting', desc: 'Create a room, share the link. Participants join directly from their browser — no app download needed.' },
  { step: '02', title: 'AI Listens in Real-Time', desc: 'Whisper transcribes every speaker live. Transcripts stream to all participants as captions as you talk.' },
  { step: '03', title: 'Summary & Tasks Auto-Generated', desc: 'On meeting end, GPT-4 produces a concise summary, key decisions, and action items with assignees.' },
  { step: '04', title: 'Board Updates Instantly', desc: 'Tasks appear on the Kanban board in real-time for all workspace members via Socket.io.' },
];

export default function LandingPage() {
  const user = useAuthStore(state => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 overflow-x-hidden font-sans selection:bg-blue-500/30">

      {/* Ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[20%] right-[-10%] w-[30%] h-[40%] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ──── Navbar ──── */}
      <nav className="relative z-50 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center justify-between px-5 md:px-8 py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">IntelliMeet</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{l.label}</a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-600/20">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white font-medium text-sm transition-colors">Log in</Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-600/20">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-slate-900/80 backdrop-blur-md px-5 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-white py-2 text-sm font-medium">{l.label}</a>
            ))}
            <div className="pt-2 flex flex-col gap-2 border-t border-white/5">
              {user ? (
                <Link to="/dashboard" className="w-full text-center bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="w-full text-center text-slate-300 hover:text-white py-2.5 text-sm font-medium border border-white/10 rounded-xl">Log in</Link>
                  <Link to="/register" className="w-full text-center bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all">
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ──── Hero ──── */}
      <section className="relative z-10 pt-16 md:pt-24 pb-16 md:pb-24 px-5 md:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs md:text-sm font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by OpenAI Whisper &amp; GPT-4</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-5 md:mb-6 leading-tight max-w-4xl">
          Meetings that actually<br className="hidden sm:block" /> get&nbsp;work&nbsp;done.
        </h1>

        <p className="text-base md:text-lg lg:text-xl text-slate-400 max-w-2xl mb-8 md:mb-10 leading-relaxed">
          IntelliMeet is the AI-first collaboration platform that transcribes your calls, extracts action items, and organizes them into team task boards — automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none sm:w-auto mb-12 md:mb-20">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 md:px-8 md:py-4 rounded-2xl font-semibold text-base md:text-lg transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
          >
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-7 py-3.5 md:px-8 md:py-4 rounded-2xl font-semibold text-base md:text-lg transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            See Features
          </a>
        </div>

        {/* Hero Dashboard Screenshot */}
        <div className="relative w-full max-w-5xl mx-auto">
          <div className="rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-white/0 shadow-2xl">
            <div className="rounded-2xl overflow-hidden border border-white/5">
              <img
                src="/screenshots/dashboard.png"
                alt="IntelliMeet Dashboard"
                className="w-full h-auto block"
              />
            </div>
          </div>
          {/* Fade-out bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 md:h-32 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none rounded-b-2xl" />
        </div>
      </section>

      {/* ──── How it Works ──── */}
      <section id="how-it-works" className="relative z-10 py-20 md:py-28 px-5 md:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">From meeting to tasks in seconds</h2>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">Four steps that eliminate all the manual work that usually happens after every meeting.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="text-5xl font-black text-white/5 absolute -top-2 -right-2 select-none">{s.step}</div>
                <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">{s.step}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Features ──── */}
      <section id="features" className="relative z-10 py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Everything in one place</h2>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">Replace your fragmented tool stack with a single AI-native workspace.</p>
          </div>

          <div className="space-y-20 md:space-y-32">
            {FEATURES.map((f) => (
              <div key={f.title} className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${f.reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
                {/* Text */}
                <div>
                  <div className={`w-12 h-12 ${f.accentClass} rounded-2xl flex items-center justify-center mb-6`}>
                    <f.Icon className={`w-6 h-6 ${f.iconClass}`} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{f.title}</h3>
                  <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-6">{f.desc}</p>
                  <ul className="space-y-3">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-3 text-slate-300 text-sm md:text-base">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${f.iconClass}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Screenshot */}
                <div className={`relative rounded-2xl p-[1px] bg-gradient-to-tr from-white/5 to-white/10 shadow-2xl overflow-hidden group`}>
                  <div className={`absolute inset-0 ${f.glowClass} opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl`} />
                  <img src={f.screenshot} alt={f.alt} className="w-full h-auto rounded-[15px] relative z-10 border border-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Tech Highlights ──── */}
      <section id="tech" className="relative z-10 py-20 md:py-28 px-5 md:px-8 border-t border-white/5 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Engineering</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Enterprise grade by design</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base md:text-lg">Built on proven infrastructure patterns — not just a demo project.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {TECH.map((t) => (
              <div key={t.title} className="glass-card p-6 md:p-8 rounded-3xl hover:-translate-y-1 transition-transform">
                <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center mb-5">
                  <t.Icon className="w-5 h-5 text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{t.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Tech Badges ──── */}
      <section className="relative z-10 py-10 px-5 md:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-6">Built with</p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {['React 19', 'TypeScript', 'Node.js', 'MongoDB', 'Socket.io', 'WebRTC', 'OpenAI GPT-4', 'Whisper', 'Redis', 'Docker', 'Kubernetes', 'Prometheus'].map(t => (
              <span key={t} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400 font-medium">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="relative z-10 py-20 md:py-32 px-5 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-[2rem] md:rounded-[3rem] p-8 md:p-14 text-center shadow-2xl overflow-hidden">
            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
                Ready to transform<br className="hidden sm:block" /> your meetings?
              </h2>
              <p className="text-blue-100 text-base md:text-lg mb-8 md:mb-10 max-w-2xl mx-auto">
                Join teams who have stopped taking manual notes and started taking automated action with IntelliMeet.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 hover:bg-slate-100 px-8 py-3.5 rounded-2xl font-bold text-base md:text-lg transition-all shadow-xl"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-2xl font-semibold text-base md:text-lg transition-all border border-white/20"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Footer ──── */}
      <footer className="border-t border-white/5 py-8 md:py-12 px-5 md:px-8 text-center text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Video className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-slate-400">IntelliMeet</span>
        </div>
        <p className="text-sm">© 2026 Zidio Development &nbsp;·&nbsp; Built by Abhinav Walde, Priyansh Rai, Raghuveer Kumar, Ayush Patel</p>
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <Link to="/login" className="hover:text-slate-300 transition-colors">Login</Link>
          <Link to="/register" className="hover:text-slate-300 transition-colors">Register</Link>
        </div>
      </footer>
    </div>
  );
}
