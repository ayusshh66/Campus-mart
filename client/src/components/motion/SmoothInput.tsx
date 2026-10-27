import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Skiper-inspired smooth caret; preserves the actual native <input> DOM element.
 * No wrapper means existing form layouts, native input types, refs and callbacks
 * are unchanged. The animated caret is a fixed-position, noninteractive overlay.
 * Inspired by Skiper UI's SmoothInput (https://skiper-ui.com/).
 */
type Props = ComponentPropsWithoutRef<'input'>;
type Caret = { left: number; top: number; height: number };

const ANIMATED_TYPES = new Set(['text', 'email', 'password', 'search', 'tel', 'url']);

export const SmoothInput = forwardRef<HTMLInputElement, Props>(function SmoothInput(
  {
    type = 'text',
    style,
    onFocus,
    onBlur,
    onClick,
    onKeyUp,
    onSelect,
    onChange,
    onScroll,
    ...rest
  },
  forwardedRef,
) {
  const nativeRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState<Caret | null>(null);
  const reduceMotion = useReducedMotion();
  const animateCaret = ANIMATED_TYPES.has(type || 'text') && !reduceMotion && !rest.disabled && !rest.readOnly;

  const attachRef = useCallback((node: HTMLInputElement | null) => {
    nativeRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  const updateCaret = useCallback(() => {
    const input = nativeRef.current;
    if (!input || document.activeElement !== input || !animateCaret) return;

    // Hide overlay while a range is selected; keep native selection behavior.
    const start = input.selectionStart;
    const end = input.selectionEnd;
    if (start === null || end === null || start !== end) {
      setCaret(null);
      return;
    }

    const css = getComputedStyle(input);
    const rect = input.getBoundingClientRect();
    const fontSize = parseFloat(css.fontSize) || 14;
    const leftPadding = parseFloat(css.paddingLeft) || 0;
    const rightPadding = parseFloat(css.paddingRight) || 0;
    const passwordBullet = navigator.userAgent.match(/firefox|fxios/i) ? '●' : '•';
    const prefix = type === 'password'
      ? passwordBullet.repeat(start)
      : input.value.slice(0, start);

    // Match the input's computed typography for accurate variable-width text.
    const measure = document.createElement('span');
    measure.textContent = prefix || '\u200b';
    Object.assign(measure.style, {
      position: 'fixed',
      visibility: 'hidden',
      whiteSpace: 'pre',
      fontFamily: css.fontFamily,
      fontSize: css.fontSize,
      fontWeight: css.fontWeight,
      fontStyle: css.fontStyle,
      letterSpacing: css.letterSpacing,
      fontFeatureSettings: css.fontFeatureSettings,
      pointerEvents: 'none',
    });
    document.body.appendChild(measure);
    const width = prefix ? measure.getBoundingClientRect().width : 0;
    measure.remove();

    const rawLeft = rect.left + leftPadding + width - input.scrollLeft;
    const minimum = rect.left + leftPadding;
    const maximum = rect.right - rightPadding;
    if (rawLeft < minimum - 1 || rawLeft > maximum + 1) {
      setCaret(null);
      return;
    }
    setCaret({
      left: Math.min(maximum, Math.max(minimum, rawLeft)),
      top: rect.top + rect.height / 2,
      height: Math.max(12, Math.min(fontSize * 1.1, rect.height - 8)),
    });
  }, [animateCaret, type]);

  const scheduleUpdate = () => requestAnimationFrame(updateCaret);

  useEffect(() => {
    if (!focused || !animateCaret) return;
    const handler = () => requestAnimationFrame(updateCaret);
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    document.addEventListener('selectionchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
      document.removeEventListener('selectionchange', handler);
    };
  }, [focused, animateCaret, updateCaret]);

  return (
    <>
      <input
        {...rest}
        ref={attachRef}
        type={type}
        style={{ ...style, ...(focused && animateCaret ? { caretColor: 'transparent' } : {}) }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
          scheduleUpdate();
        }}
        onBlur={(event) => {
          setFocused(false);
          setCaret(null);
          onBlur?.(event);
        }}
        onClick={(event) => { onClick?.(event); scheduleUpdate(); }}
        onKeyUp={(event) => { onKeyUp?.(event); scheduleUpdate(); }}
        onSelect={(event) => { onSelect?.(event); scheduleUpdate(); }}
        onChange={(event) => { onChange?.(event); scheduleUpdate(); }}
        onScroll={(event) => { onScroll?.(event); scheduleUpdate(); }}
      />
      {focused && animateCaret && caret && typeof document !== 'undefined' && createPortal(
        <motion.span
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] block w-[2px] rounded-full bg-[#C6DE41] shadow-[0_0_6px_#C6DE41]"
          initial={false}
          animate={{ left: caret.left, top: caret.top, height: caret.height, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 530, damping: 37, mass: 0.35 }}
          style={{ transform: 'translateY(-50%)' }}
        />,
        document.body,
      )}
    </>
  );
});
