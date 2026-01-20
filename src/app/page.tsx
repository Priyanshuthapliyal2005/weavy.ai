'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { MarketingShell } from '@/components/marketing-shell';

function WorkflowHeroIllustration() {
  return (
    <div className="relative mx-auto mt-16 h-[500px] w-full max-w-5xl">
      {/* Connector lines */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1000 500"
        fill="none"
        aria-hidden="true"
      >
        {/* 3D Rodin to Stable Diffusion */}
        <path
          d="M310 140 C 420 140, 580 140, 690 140"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="2.5"
        />
        {/* 3D Rodin to Flux Pro */}
        <path
          d="M310 140 C 310 220, 310 300, 310 360"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="2"
        />
        {/* Stable Diffusion to Minimax Video */}
        <path
          d="M690 140 C 690 220, 690 300, 690 360"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="2.5"
        />
        {/* Flux Pro to Minimax Video */}
        <path
          d="M310 360 C 420 360, 580 360, 690 360"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="2"
        />
      </svg>

      {/* Nodes */}
      {/* Four nodes, 2x2 grid, consistent size */}
      <div className="absolute left-[180px] top-[40px] w-[260px] h-[200px] rounded-2xl bg-white/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06] backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-medium tracking-[0.24em] text-black/50">3D</div>
          <div className="mt-1 text-[11px] font-normal tracking-[0.08em] text-black/80">RODIN 2.0</div>
        </div>
        <div className="h-[120px] w-full overflow-hidden rounded-xl bg-black/5">
          <img
            src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68349ea45685e2905f5c21e6_3D_RODIN_hero_mobile.avif"
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="absolute left-[560px] top-[40px] w-[260px] h-[200px] rounded-2xl bg-white/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06] backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-medium tracking-[0.24em] text-black/50">IMAGE</div>
          <div className="mt-1 text-[11px] font-normal tracking-[0.08em] text-black/80">STABLE DIFFUSION</div>
        </div>
        <div className="h-[120px] w-full overflow-hidden rounded-xl bg-black/5">
          <img
            src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68349df097acbeb0e747fb60_Diffusion-diff_hero_mobile.avif"
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="absolute left-[180px] top-[260px] w-[260px] h-[200px] rounded-2xl bg-white/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06] backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-medium tracking-[0.24em] text-black/50">IMAGE</div>
          <div className="mt-1 text-[11px] font-normal tracking-[0.08em] text-black/80">FLUX PRO 1.1</div>
        </div>
        <div className="h-[120px] w-full overflow-hidden rounded-xl bg-black/5">
          <img
            src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68349defe03a701656079aac_Color-diff_hero_mobile.avif"
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="absolute left-[560px] top-[260px] w-[260px] h-[200px] rounded-2xl bg-white/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.06] backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-medium tracking-[0.24em] text-black/50">VIDEO</div>
          <div className="mt-1 text-[11px] font-normal tracking-[0.08em] text-black/80">MINIMAX VIDEO</div>
        </div>
        <div className="h-[120px] w-full overflow-hidden rounded-xl bg-black/5">
          <img
            src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6835ce9cc9475b88f57c57da_VIDEO_hero_mobile.png"
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <MarketingShell>
        <section className="mx-auto max-w-7xl px-25 pt-20 pb-16">
          <div className="grid items-start gap-8 md:grid-cols-[0.9fr_1.8fr]">
            <div>
              <h1
                className="text-6xl font-normal leading-[0.9] tracking-[-0.02em] md:text-7xl ml-40"
              >
                Weavy
              </h1>
            </div>
            <div>
              <h2 className="text-6xl font-normal leading-[0.9] tracking-[-0.02em] md:text-7xl">Artistic Intelligence</h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-black/70">
                Turn your creative vision into scalable workflows. Access all AI models and professional editing tools in one node based platform.
              </p>
            </div>
          </div>

          <WorkflowHeroIllustration />
        </section>
    </MarketingShell>
  );
}
