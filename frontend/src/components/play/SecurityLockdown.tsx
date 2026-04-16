'use client';

import React, { useEffect, useCallback } from 'react';

interface SecurityLockdownProps {
  enabled: boolean;
  onViolation: (type: string) => void;
  children: React.ReactNode;
}

/**
 * SecurityLockdown Wrapper
 * Enforces "Safe Exam Browser" style restrictions:
 * - Prevents Right-Click (ContextMenu)
 * - Blocks Copy/Paste/Cut
 * - Monitors Fullscreen & Focus Loss
 */
export const SecurityLockdown: React.FC<SecurityLockdownProps> = ({ 
  enabled, 
  onViolation, 
  children 
}) => {
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (enabled) {
      e.preventDefault();
      onViolation('right_click');
    }
  }, [enabled, onViolation]);

  const handleCopyPaste = useCallback((e: ClipboardEvent) => {
    if (enabled) {
      e.preventDefault();
      onViolation('clipboard_usage');
    }
  }, [enabled, onViolation]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Block common dev-tool and navigation shortcuts
    const blockedKeys = ['F12', 'PrintScreen'];
    const isControlCombo = (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'j', 'u', 's'].includes(e.key.toLowerCase());
    const isAltTab = e.altKey && e.key === 'Tab';

    if (blockedKeys.includes(e.key) || isControlCombo || isAltTab) {
      // Note: Alt+Tab can't be truly blocked in browsers, but we detect focus loss separately
      e.preventDefault();
      onViolation('restricted_shortcut');
    }
  }, [enabled, onViolation]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('contextmenu', handleContextMenu as any);
    window.addEventListener('copy', handleCopyPaste as any);
    window.addEventListener('paste', handleCopyPaste as any);
    window.addEventListener('cut', handleCopyPaste as any);
    window.addEventListener('keydown', handleKeyDown);

    // Initial Fullscreen Request logic is usually handled by a button click (User Interaction)
    // but we can monitor it here
    const checkFullscreen = () => {
      if (!document.fullscreenElement && enabled) {
        onViolation('fullscreen_exit');
      }
    };

    document.addEventListener('fullscreenchange', checkFullscreen);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu as any);
      window.removeEventListener('copy', handleCopyPaste as any);
      window.removeEventListener('paste', handleCopyPaste as any);
      window.removeEventListener('cut', handleCopyPaste as any);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', checkFullscreen);
    };
  }, [enabled, handleContextMenu, handleCopyPaste, handleKeyDown, onViolation]);

  return (
    <div className={enabled ? "select-none" : ""}>
      {children}
    </div>
  );
};
