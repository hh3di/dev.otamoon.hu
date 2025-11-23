import { motion } from 'motion/react';
export default function Spinner({ fixed = false, size = '4rem', color = '#0ea5e9' }: { fixed?: boolean; size?: string; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      exit={{ opacity: 0 }}
      className={`${
        fixed
          ? 'fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center z-999'
          : 'flex items-center justify-center'
      }`}
    >
      <svg id="loader" stroke={color} width={size} viewBox="25 25 50 50" strokeWidth="2">
        <circle cx="50" cy="50" r="20" fill="none"></circle>
      </svg>
    </motion.div>
  );
}
