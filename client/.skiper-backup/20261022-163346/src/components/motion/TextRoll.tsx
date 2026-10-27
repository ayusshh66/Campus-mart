import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Skiper 58-inspired animated text for EXISTING React Router links. */
export const TextRoll: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;
  const letters = Array.from(text);
  return (
    <motion.span
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      aria-label={text}
      className={`relative inline-block overflow-hidden align-middle leading-[1.15] ${className}`}
    >
      <span aria-hidden="true" className="block whitespace-nowrap">
        {letters.map((letter, i) => (
          <motion.span
            key={`top-${i}`}
            className="inline-block"
            variants={{ rest: { y: '0%' }, hover: { y: '-110%' } }}
            transition={{ duration: 0.34, delay: i * 0.027, ease: 'easeInOut' }}
          >{letter === ' ' ? '\u00a0' : letter}</motion.span>
        ))}
      </span>
      <span aria-hidden="true" className="absolute inset-0 block whitespace-nowrap">
        {letters.map((letter, i) => (
          <motion.span
            key={`bottom-${i}`}
            className="inline-block"
            variants={{ rest: { y: '110%' }, hover: { y: '0%' } }}
            transition={{ duration: 0.34, delay: i * 0.027, ease: 'easeInOut' }}
          >{letter === ' ' ? '\u00a0' : letter}</motion.span>
        ))}
      </span>
    </motion.span>
  );
};
