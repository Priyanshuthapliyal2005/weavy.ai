import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        <span className="block h-7 w-2 bg-black" />
        <span className="block h-7 w-2 bg-black" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-normal tracking-[0.02em]">WEAVY</span>
        <div className="flex flex-col leading-none">
          <span className="text-[9px] tracking-[0.25em] text-black/60">ARTISTIC</span>
          <span className="text-[9px] tracking-[0.25em] text-black/60">INTELLIGENCE</span>
        </div>
      </div>
    </div>
  );
}

export function MarketingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[#e9ecef]" />
      <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/60" />
    </div>
  );
}

export function MarketingHeader({ minimal = true }: { minimal?: boolean }) {
  return (
    <header className="relative z-10 border-b border-black/[0.08] bg-white/30 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="Weavy home">
          <LogoMark />
        </Link>

        <div className="flex items-center gap-3">
          <SignedOut>
            {!minimal && (
              <Link
                href="/sign-in"
                className="hidden sm:inline text-[11px] font-medium tracking-[0.18em] text-black/70 hover:text-black transition-colors"
              >
                SIGN IN
              </Link>
            )}
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-lg bg-[#f3ff77] px-5 py-2.5 text-sm font-semibold text-black shadow-sm ring-1 ring-black/[0.08] hover:bg-[#eaff4d] transition-all hover:shadow"
            >
              Start Now
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-[#f3ff77] px-5 py-2.5 text-sm font-semibold text-black shadow-sm ring-1 ring-black/[0.08] hover:bg-[#eaff4d] transition-all hover:shadow"
            >
              Open App
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-black/10 bg-white/15 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-black/60">© {new Date().getFullYear()} Weavy</div>
        <div className="text-xs text-black/60">All rights reserved.</div>
      </div>
    </footer>
  );
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen text-black"
      style={{
        colorScheme: 'light',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <MarketingBackground />
      <MarketingHeader />
      <main className="relative z-10">{children}</main>
      <MarketingFooter />
    </div>
  );
}
