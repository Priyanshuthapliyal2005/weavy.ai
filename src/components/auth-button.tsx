'use client';

import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { LogIn } from 'lucide-react';
import { Tooltip } from './tooltip';

export function AuthButton() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className='flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs text-panel-text-muted'>
        <div className='h-4 w-4 animate-pulse rounded-full bg-panel-text-muted/30' />
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <Tooltip text='Sign in to save workflows' position='top'>
          <SignInButton mode="modal">
            <button className="flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs text-panel-text transition-colors cursor-pointer hover:bg-panel-hover">
              <LogIn className='h-4 w-4' strokeWidth={1.5} />
              <span>Sign in</span>
            </button>
          </SignInButton>
        </Tooltip>
      </SignedOut>
      <SignedIn>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs text-panel-text'>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'w-5 h-5',
                },
              }}
            />
            <span className='max-w-[120px] truncate'>
              {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </span>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
