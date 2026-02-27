'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VerticalCutRevealProps {
  children: string;
  splitBy?: 'words' | 'characters';
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center';
  reverse?: boolean;
  transition?: any;
  className?: string;
}

export function VerticalCutReveal({
  children,
  splitBy = 'words',
  staggerDuration = 0.1,
  staggerFrom = 'first',
  reverse = false,
  transition = { type: 'spring', stiffness: 250, damping: 30 },
  className = '',
}: VerticalCutRevealProps) {
  const items = splitBy === 'words' ? children.split(' ') : children.split('');

  const getDelay = (index: number) => {
    const totalItems = items.length;
    let delay = 0;

    if (staggerFrom === 'first') {
      delay = index * staggerDuration;
    } else if (staggerFrom === 'last') {
      delay = (totalItems - index - 1) * staggerDuration;
    } else if (staggerFrom === 'center') {
      const center = totalItems / 2;
      delay = Math.abs(index - center) * staggerDuration;
    }

    return reverse ? (totalItems - 1) * staggerDuration - delay : delay;
  };

  return (
    <span className={className}>
      {items.map((item, index) => (
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...transition, delay: getDelay(index) }}
          style={{ display: 'inline-block', marginRight: splitBy === 'words' ? '0.25em' : '0' }}
        >
          {item}
        </motion.span>
      ))}
    </span>
  );
}
