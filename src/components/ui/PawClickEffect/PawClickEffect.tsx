'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PawClickEffect.scss';

interface Paw {
  id: number;
  x: number;
  y: number;
  rotation: number;
}

export function PawClickEffect() {
  const [paws, setPaws] = useState<Paw[]>([]);

  const handleClick = useCallback((e: MouseEvent) => {
    // Only trigger on desktop/large screens as requested
    if (window.innerWidth < 1024) return;

    // Don't trigger on buttons or interactive elements if desired, 
    // but usually click effects look better everywhere.
    // We can filter if needed.

    const newPaw: Paw = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
      rotation: Math.random() * 360,
    };

    setPaws((prev) => [...prev.slice(-10), newPaw]); // Keep only last 10 for performance
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  return (
    <div className="paw-click-effect">
      <AnimatePresence>
        {paws.map((paw) => (
          <motion.div
            key={paw.id}
            initial={{ opacity: 0, scale: 0.5, x: paw.x - 16, y: paw.y - 16, rotate: paw.rotation }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2, y: paw.y - 40 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onAnimationComplete={() => {
              setPaws((prev) => prev.filter((p) => p.id !== paw.id));
            }}
            className="paw-click-effect__paw"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-6 3c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm12 0c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-6 7c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4z" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
