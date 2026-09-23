import { useLayoutEffect, useRef, useState } from "react";

export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return;

    const measure = () => {
      const box = el.getBoundingClientRect();
      const width = Math.floor(box.width);
      const height = Math.floor(box.height);
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, size] as const;
}
