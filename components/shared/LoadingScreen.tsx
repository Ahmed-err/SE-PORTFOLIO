"use client";

import { motion } from "framer-motion";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 1.0 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.span
          className="text-5xl font-bold text-accent"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          AY
        </motion.span>
        <motion.div
          className="h-0.5 bg-accent"
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
