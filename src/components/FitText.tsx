import { useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * Sets a line of wood type to fill its measure, the way a compositor picks the size
 * that spans the bill. Shrinks or grows between min and max (px) to fit one line.
 */
export function FitText({
  as: Tag = 'span',
  children,
  className,
  min = 32,
  max = 96,
  id,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  min?: number;
  max?: number;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const parent = el.parentElement;
      if (!parent) return;
      const style = getComputedStyle(parent);
      const avail = parent.clientWidth - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd);
      el.style.fontSize = `${max}px`;
      el.style.whiteSpace = 'nowrap';
      const natural = el.scrollWidth;
      const size = Math.max(min, Math.min(max, (max * avail) / Math.max(1, natural)));
      el.style.fontSize = `${Math.floor(size)}px`;
      // If even the minimum cannot fit on one line, let it wrap.
      el.style.whiteSpace = size <= min ? 'normal' : 'nowrap';
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (el.parentElement) ro.observe(el.parentElement);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [children, min, max]);

  return (
    <Tag ref={ref} className={className} id={id} style={{ display: 'block', width: 'fit-content', marginInline: 'auto' }}>
      {children}
    </Tag>
  );
}
