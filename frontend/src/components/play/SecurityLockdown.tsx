'use client';

import React, { useEffect, useCallback, useRef } from 'react';

interface SecurityLockdownProps {
  enabled: boolean;
  isMatchActive?: boolean; // Only enforce input restrictions during active match
  onViolation: (type: string) => void;
  children: React.ReactNode;
}

/**
 * SecurityLockdown Wrapper
 * Enforces "Safe Exam Browser" style restrictions:
 * - Prevents Right-Click (ContextMenu)
 * - Blocks Copy/Paste/Cut
 * - Monitors Tab Visibility (visibilitychange + blur)
 * - Blocks restricted keyboard shortcuts
 * - Guards against fullscreen exits
 */
export const SecurityLockdown: React.FC<SecurityLockdownProps> = ({ 
  enabled, 
  isMatchActive = true,
  onViolation, 
  children 
}) => {
  // Debounce tab-switch violations so a single focus loss doesn't double-fire
  const tabSwitchCooldown = useRef(false);

  const fireTabSwitch = useCallback(() => {
    if (!enabled || !isMatchActive || tabSwitchCooldown.current) return;
    tabSwitchCooldown.current = true;
    onViolation('tab_switch');
    // 3-second cooldown to prevent rapid duplicate events
    setTimeout(() => { tabSwitchCooldown.current = false; }, 3000);
  }, [enabled, isMatchActive, onViolation]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (enabled && isMatchActive) {
      e.preventDefault();
      onViolation('right_click');
    }
  }, [enabled, isMatchActive, onViolation]);

  const handleCopyPaste = useCallback((e: ClipboardEvent) => {
    if (enabled && isMatchActive) {
      e.preventDefault();
      onViolation('clipboard_usage');
    }
  }, [enabled, isMatchActive, onViolation]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !isMatchActive) return;

    // Block common dev-tool and navigation shortcuts
    const blockedKeys = ['F12', 'PrintScreen'];
    const isControlCombo = (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'j', 'u', 's', 'i'].includes(e.key.toLowerCase());
    const isAltTab = e.altKey && e.key === 'Tab';
    const isAltF4 = e.altKey && e.key === 'F4';

    if (blockedKeys.includes(e.key) || isControlCombo || isAltTab || isAltF4) {
      e.preventDefault();
      onViolation('restricted_shortcut');
    }
  }, [enabled, isMatchActive, onViolation]);

  // PRIMARY: Page Visibility API — most reliable tab-switch detection
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      fireTabSwitch();
    }
  }, [fireTabSwitch]);

  // SECONDARY: Window blur — catches OS-level window switches
  const handleWindowBlur = useCallback(() => {
    fireTabSwitch();
  }, [fireTabSwitch]);

  const handleFullscreenChange = useCallback(() => {
    if (!document.fullscreenElement && enabled && isMatchActive) {
      onViolation('fullscreen_exit');
    }
  }, [enabled, isMatchActive, onViolation]);

  useEffect(() => {
    if (!enabled) return;

    // Input restrictions (only during active match)
    if (isMatchActive) {
      window.addEventListener('contextmenu', handleContextMenu as any);
      window.addEventListener('copy', handleCopyPaste as any);
      window.addEventListener('paste', handleCopyPaste as any);
      window.addEventListener('cut', handleCopyPaste as any);
      window.addEventListener('keydown', handleKeyDown);
    }

    // Tab/focus monitoring (always active when enabled)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu as any);
      window.removeEventListener('copy', handleCopyPaste as any);
      window.removeEventListener('paste', handleCopyPaste as any);
      window.removeEventListener('cut', handleCopyPaste as any);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [enabled, isMatchActive, handleContextMenu, handleCopyPaste, handleKeyDown, handleVisibilityChange, handleWindowBlur, handleFullscreenChange]);

  return (
    <div className={enabled && isMatchActive ? "select-none" : ""}>
      {children}
    </div>
  );
};
