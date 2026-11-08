'use client';
// Responsive navigation — fixed sidebar on desktop, slide-over on phones.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Package, Sparkles, Send, ShoppingCart, Megaphone, Wallet,
  Plug, BookOpen, Settings, Menu, X, Zap,
} from 'lucide-react';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Catalog', icon: Package },
  { href: '/studio', label: 'AI Studio', icon: Sparkles },
  { href: '/composer', label: 'Composer', icon: Send },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/ads', label: 'Ads', icon: Megaphone },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/connectors', label: 'Connectors', icon: Plug },
  { href: '/guide', label: 'Setup Guide', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 ${
              active
                ? 'bg-gradient-to-r from-violet-600/25 via-violet-600/10 to-transparent text-violet-300 ring-1 ring-inset ring-violet-500/20'
                : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-lime-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
            <span className="flex-1">{label}</span>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_6px_#A3E635]" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-ink/85 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-lime-400 to-violet-600">
            <Zap size={17} className="text-black" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">SHADOW</span>
        </Link>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-zinc-300 hover:bg-white/5" aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-line bg-[#0D0D16]/95 px-4 py-5 backdrop-blur-xl lg:flex">
        <Link href="/" className="mb-7 flex items-center gap-2.5 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lime-400 to-violet-600 shadow-glow">
            <Zap size={19} className="text-black" strokeWidth={2.6} />
          </span>
          <span>
            <span className="block font-display text-[19px] font-bold leading-none tracking-tight text-white">SHADOW</span>
            <span className="mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.22em] text-zinc-500">AI Social Commerce</span>
          </span>
        </Link>
        <NavList />
        <div className="mt-auto rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/15 to-transparent p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/80">Mission Control</p>
          <p className="mt-1 text-[11.5px] leading-snug text-zinc-400">Meesho → AI → Instagram, FB, WA, YT, X → COD orders → withdraw. One screen.</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-[#0D0D16] px-4 py-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between px-2">
              <span className="font-display text-lg font-bold text-white">SHADOW</span>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
