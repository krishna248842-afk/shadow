import { Zap, Lock } from 'lucide-react';

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  return <LoginInner searchParams={searchParams} />;
}

async function LoginInner({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8 text-center">
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-lime-400 to-violet-600 shadow-glow">
          <Zap size={26} className="text-black" strokeWidth={2.6} />
        </span>
        <h1 className="font-display text-2xl font-bold text-white">SHADOW</h1>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">AI Social Commerce</p>
        <form method="POST" action="/api/auth/login" className="mt-6 text-left">
          <input type="hidden" name="next" value={next ?? '/'} />
          <label className="label" htmlFor="password">Store password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input id="password" name="password" type="password" required autoFocus placeholder="APP_PASSWORD" className="input pl-10" />
          </div>
          {error === '1' && <p className="mt-2 text-xs font-medium text-red-400">Wrong password — try again.</p>}
          <button type="submit" className="btn-primary mt-4 w-full">Enter Mission Control →</button>
        </form>
        <p className="mt-5 text-[10.5px] leading-relaxed text-zinc-600">This gate keeps your business data private when Shadow is deployed on a public URL.</p>
      </div>
    </div>
  );
}
