import { useEffect, useRef, useState } from 'react';
import { formatIQD } from '../utils/currency';
import { appExperience } from '../config/experience';

interface AnimatedMoneyProps {
  value: number;
  className?: string;
}

export function AnimatedMoney({ value, className }: AnimatedMoneyProps) {
  const previous = useRef(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || from === value) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / appExperience.animationDurationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <strong className={className}>{formatIQD(display)}</strong>;
}
