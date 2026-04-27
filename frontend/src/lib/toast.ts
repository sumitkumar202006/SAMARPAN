'use client';

/**
 * Lightweight toast utility — replaces browser alert() calls.
 * No library dependency. Self-contained.
 *
 * Usage:
 *   import { toast } from '@/lib/toast';
 *   toast.error('Something went wrong');
 *   toast.success('Saved!');
 *   toast.info('Session ended');
 */

type ToastType = 'error' | 'success' | 'info' | 'warn';

interface ToastOptions {
  duration?: number; // ms, default 4000
}

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  error:   { bg: '#1a0a0a', border: '#ef4444', icon: '✕' },
  success: { bg: '#081a0e', border: '#22c55e', icon: '✓' },
  info:    { bg: '#0a0e1a', border: '#6366f1', icon: 'ℹ' },
  warn:    { bg: '#1a140a', border: '#f59e0b', icon: '⚠' },
};

function show(message: string, type: ToastType, opts: ToastOptions = {}) {
  if (typeof document === 'undefined') return;
  const duration = opts.duration ?? 4000;

  // Container
  let container = document.getElementById('samarpan-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'samarpan-toast-container';
    Object.assign(container.style, {
      position:  'fixed',
      top:       '1.25rem',
      right:     '1.25rem',
      zIndex:    '99999',
      display:   'flex',
      flexDirection: 'column',
      gap:       '0.5rem',
      pointerEvents: 'none',
    });
    document.body.appendChild(container);
  }

  const { bg, border, icon } = COLORS[type];

  const toast = document.createElement('div');
  Object.assign(toast.style, {
    display:      'flex',
    alignItems:   'center',
    gap:          '0.75rem',
    padding:      '0.875rem 1.25rem',
    borderRadius: '1rem',
    background:   bg,
    border:       `1px solid ${border}`,
    color:        '#f9fafb',
    fontFamily:   'Inter, system-ui, sans-serif',
    fontSize:     '0.8125rem',
    fontWeight:   '600',
    maxWidth:     '22rem',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(12px)',
    pointerEvents: 'auto',
    transform:    'translateX(calc(100% + 1.5rem))',
    transition:   'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
    opacity:      '0',
    cursor:       'pointer',
  });

  // Icon badge
  const badge = document.createElement('span');
  Object.assign(badge.style, {
    display:     'flex',
    alignItems:  'center',
    justifyContent: 'center',
    width:       '1.25rem',
    height:      '1.25rem',
    borderRadius: '50%',
    background:  border + '22',
    color:       border,
    fontSize:    '0.7rem',
    fontWeight:  '900',
    flexShrink:  '0',
  });
  badge.textContent = icon;

  // Message
  const msg = document.createElement('span');
  msg.textContent = message;
  Object.assign(msg.style, { flex: '1', lineHeight: '1.4' });

  toast.appendChild(badge);
  toast.appendChild(msg);
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity   = '1';
    });
  });

  const dismiss = () => {
    toast.style.transform = 'translateX(calc(100% + 1.5rem))';
    toast.style.opacity   = '0';
    setTimeout(() => toast.remove(), 300);
  };

  toast.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}

export const toast = {
  error:   (msg: string, opts?: ToastOptions) => show(msg, 'error',   opts),
  success: (msg: string, opts?: ToastOptions) => show(msg, 'success', opts),
  info:    (msg: string, opts?: ToastOptions) => show(msg, 'info',    opts),
  warn:    (msg: string, opts?: ToastOptions) => show(msg, 'warn',    opts),
};
