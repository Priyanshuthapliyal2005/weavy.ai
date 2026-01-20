 'use client';

import { useEffect, useMemo } from 'react';
import { Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkflowStore } from '@/store/workflow-store';
import { SIDEBAR_TABS } from '@/constants/sidebar';

function isImageLike(output: unknown): output is string {
  if (typeof output !== 'string') return false;
  return (
    output.startsWith('data:image/') ||
    output.startsWith('http://') ||
    output.startsWith('https://')
  );
}

export function WorkflowGalleryModal() {
  const {
    activeTab,
    setActiveTab,
    galleryFocusNodeId,
    clearGalleryFocus,
    nodes,
  } = useWorkflowStore();

  const isOpen = activeTab === SIDEBAR_TABS.GALLERY || !!galleryFocusNodeId;

  const focusedNode = useMemo(() => {
    if (!galleryFocusNodeId) return null;
    return nodes.find((n) => n.id === galleryFocusNodeId) || null;
  }, [galleryFocusNodeId, nodes]);

  const focusedTitle =
    (focusedNode?.data as any)?.label || focusedNode?.type || 'Output';
  const focusedOutput = (focusedNode?.data as any)?.output;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearGalleryFocus();
        setActiveTab(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, clearGalleryFocus, setActiveTab]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-21000 flex items-center justify-center bg-black/60 p-4'
      onMouseDown={() => {
        clearGalleryFocus();
        setActiveTab(null);
      }}
      role='dialog'
      aria-modal='true'
      aria-label='Gallery'
    >
      <div
        className='w-full max-w-3xl bg-[#1e1e22] border border-[#2a2a2e] rounded-lg shadow-2xl overflow-hidden'
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-3 py-2 border-b border-[#2a2a2e]'>
          <div className='text-sm text-white/90 truncate'>{focusedTitle}</div>
          <div className='flex items-center gap-1.5'>
            <button
              type='button'
              onClick={async () => {
                const text =
                  typeof focusedOutput === 'string'
                    ? focusedOutput
                    : focusedOutput === null || focusedOutput === undefined
                      ? ''
                      : (() => {
                          try {
                            return JSON.stringify(focusedOutput, null, 2);
                          } catch {
                            return String(focusedOutput);
                          }
                        })();

                try {
                  await navigator.clipboard.writeText(text);
                  toast.success('Copied');
                } catch {
                  toast.error('Copy failed');
                }
              }}
              className='p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer'
              aria-label='Copy output'
              title='Copy'
            >
              <Copy size={16} />
            </button>
          <button
            type='button'
            onClick={() => {
              clearGalleryFocus();
              setActiveTab(null);
            }}
            className='p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer'
            aria-label='Close'
          >
            <X size={16} />
          </button>
          </div>
        </div>

        <div className='p-3 max-h-[80vh] overflow-auto custom-scrollbar'>
          {!focusedNode ? (
            <div className='text-xs text-white/60 py-8 text-center'>
              No node selected.
            </div>
          ) : focusedOutput === null || focusedOutput === undefined || focusedOutput === '' ? (
            <div className='text-xs text-white/60 py-8 text-center'>
              No output yet. Run this node to generate content.
            </div>
          ) : isImageLike(focusedOutput) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={focusedOutput}
              alt='output'
              className='w-full h-auto rounded border border-white/10 bg-black/20'
            />
          ) : (
            <pre className='whitespace-pre-wrap wrap-break-word text-[12px] text-white/85'>
              {typeof focusedOutput === 'string'
                ? focusedOutput
                : (() => {
                    try {
                      return JSON.stringify(focusedOutput, null, 2);
                    } catch {
                      return String(focusedOutput);
                    }
                  })()}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
