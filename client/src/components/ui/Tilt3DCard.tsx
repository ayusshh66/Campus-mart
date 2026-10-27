
import React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = "",
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const reducedMotion = useReducedMotion();

  const springConfig = {
    damping: 15,
    stiffness: 150,
  };

  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(
    springY,
    [-0.5, 0.5],
    ["10.5deg", "-10.5deg"]
  );

  const rotateY = useTransform(
    springX,
    [-0.5, 0.5],
    ["-10.5deg", "10.5deg"]
  );

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (reducedMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="h-full [perspective:1000px]">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: reducedMotion ? "0deg" : rotateX,
          rotateY: reducedMotion ? "0deg" : rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative h-full will-change-transform ${className}`}
      >
        <div
          className="h-full [transform-style:preserve-3d]"
          style={{
            transform: reducedMotion
              ? "none"
              : "translateZ(35px)",
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};
