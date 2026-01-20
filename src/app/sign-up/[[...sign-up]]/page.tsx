import { SignUp } from '@clerk/nextjs';
import { MarketingShell } from '@/components/marketing-shell';

export default function SignUpPage() {
  return (
    <MarketingShell>
      <div className="mx-auto flex min-h-[calc(100vh-56px-64px)] max-w-6xl items-center justify-center px-4 py-10">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-white/70 border border-black/10 shadow-sm backdrop-blur',
              headerTitle: 'text-black',
              headerSubtitle: 'text-black/60',
              socialButtonsBlockButton:
                'bg-white border border-black/10 text-black hover:bg-black/5',
              formFieldLabel: 'text-black/70',
              formFieldInput:
                'bg-white border-black/15 text-black placeholder:text-black/40',
              footerActionLink: 'text-black hover:text-black/70',
            },
          }}
          routing="path"
          path="/sign-up"
          afterSignUpUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </MarketingShell>
  );
}
