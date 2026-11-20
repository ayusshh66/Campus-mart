import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const isSmall = size === 'sm';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`relative inline-flex items-center justify-center rounded-full border transition-all duration-300 group ${
        isSmall ? 'w-8 h-8 p-1.5' : 'w-9 h-9 p-2'
      } ${
        isDark
          ? 'bg-[#12160F] hover:bg-[#1a2015] border-[#C6DE41]/30 hover:border-[#C6DE41]/60 text-zinc-300 hover:text-[#C6DE41] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
          : 'bg-[#FFFFFF] hover:bg-[#F3F5EC] border-[#DFE5D5] hover:border-[#C6DE41] text-[#171B13] hover:text-[#7E9E0A] shadow-[0_2px_8px_rgba(23,27,19,0.06)]'
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -60, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 60, scale: 0.7 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Moon className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#C6DE41]`} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: 60, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -60, scale: 0.7 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Sun className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#7E9E0A]`} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;

