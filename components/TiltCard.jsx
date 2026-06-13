"use client";

import { useRef, useState } from "react";

/* 3D tilt on hover based on cursor position. GPU transform only. Disabled on
   touch devices (pointer: coarse) and under prefers-reduced-motion. */
export default function TiltCard({ children, className = "", href, max = 8 }) {
  const ref = useRef(null);
  const [transform, setTransform] = useState("");

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(pointer: coarse)")?.matches || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTransform(`perspective(800px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`);
  };
  const reset = () => setTransform("");

  const Comp = href ? "a" : "div";
  return (
    <Comp
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ transform, transition: transform ? "transform 0s" : "transform 0.3s ease" }}
      className={className}
    >
      {children}
    </Comp>
  );
}
