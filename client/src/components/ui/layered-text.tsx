
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./layered-text.css";

interface LayeredTextProps {
  lines?: Array<{ top: string; bottom: string }>;
  fontSize?: string;
  fontSizeMd?: string;
  lineHeight?: number;
  lineHeightMd?: number;
  className?: string;
}

const DEFAULT_LINES = [
  { top: "\u00A0", bottom: "INFINITE" },
  { top: "INFINITE", bottom: "PROGRESS" },
  { top: "PROGRESS", bottom: "INNOVATION" },
  { top: "INNOVATION", bottom: "FUTURE" },
  { top: "FUTURE", bottom: "DREAMS" },
  { top: "DREAMS", bottom: "ACHIEVEMENT" },
  { top: "ACHIEVEMENT", bottom: "\u00A0" },
];

export function LayeredText({
  lines = DEFAULT_LINES,
  fontSize = "54px",
  fontSizeMd = "30px",
  lineHeight = 48,
  lineHeightMd = 30,
  className = "",
}: LayeredTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const paragraphs =
      container.querySelectorAll<HTMLElement>(".layered-row p");

    const media = gsap.matchMedia();

    const setup = (height: number) => {
      const timeline = gsap.timeline({ paused: true });

      timeline.to(paragraphs, {
        y: -height,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.08,
      });

      const enter = () => timeline.play();
      const leave = () => timeline.reverse();

      container.addEventListener("mouseenter", enter);
      container.addEventListener("mouseleave", leave);

      return () => {
        container.removeEventListener("mouseenter", enter);
        container.removeEventListener("mouseleave", leave);
        timeline.kill();
        gsap.set(paragraphs, { clearProps: "transform" });
      };
    };

    media.add("(min-width: 768px)", () => setup(lineHeight));
    media.add("(max-width: 767px)", () => setup(lineHeightMd));

    return () => media.revert();
  }, [lines, lineHeight, lineHeightMd]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`layered-text ${className}`}
      style={
        {
          "--layered-size": fontSize,
          "--layered-mobile-size": fontSizeMd,
          "--layered-height": `${lineHeight}px`,
          "--layered-mobile-height": `${lineHeightMd}px`,
        } as React.CSSProperties
      }
    >
      <ul>
        {lines.map((line, index) => {
          const center = Math.floor(lines.length / 2);

          return (
            <li
              key={index}
              className="layered-row"
              style={
                {
                  "--x-desktop": `${(index - center) * 35}px`,
                  "--x-mobile": `${(index - center) * 20}px`,
                } as React.CSSProperties
              }
            >
              <p>{line.top}</p>
              <p>{line.bottom}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
