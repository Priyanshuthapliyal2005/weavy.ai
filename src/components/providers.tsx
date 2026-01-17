'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import { ReactFlowProvider } from '@xyflow/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ReactFlowProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#212126',
              color: '#d3d3d4',
              border: '1px solid #302e33',
              borderRadius: '0.375rem',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: {
                primary: '#6edeb3',
                secondary: '#212126',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef9192',
                secondary: '#212126',
              },
            },
          }}
        />
      </ReactFlowProvider>
    </ClerkProvider>
  )
}
