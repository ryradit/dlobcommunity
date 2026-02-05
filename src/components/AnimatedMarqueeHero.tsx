"use client";

import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Props interface for the component
interface AnimatedMarqueeHeroProps {
  tagline: string;
  title: React.ReactNode;
  description: string;
  ctaText: string;
  images: string[];
  className?: string;
}

// Reusable Button component styled like in the image
const ActionButton = ({ children }: { children: React.ReactNode }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="mt-8 px-8 py-3 rounded-full bg-[#1e4843] text-white font-semibold shadow-lg transition-colors hover:bg-[#162f2c] focus:outline-none focus:ring-2 focus:ring-[#1e4843] focus:ring-opacity-75"
  >
    {children}
  </motion.button>
);

// The main hero component
export const AnimatedMarqueeHero: React.FC<AnimatedMarqueeHeroProps> = ({
  tagline,
  title,
  description,
  ctaText,
  images,
  className,
}) => {
  const [filteredImages, setFilteredImages] = useState<string[]>([]);

  useEffect(() => {
    // Use the images passed from props directly
    setFilteredImages(images);
  }, [images]);

  // Animation variants for the text content
  const FADE_IN_ANIMATION_VARIANTS: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring" as const, stiffness: 100, damping: 20 } 
    },
  };

  // Duplicate images for a seamless loop
  const duplicatedImages = [...filteredImages, ...filteredImages];

  return (
    <section
      className={cn(
        "relative w-full h-screen overflow-hidden bg-background flex flex-col items-center justify-center text-center px-4 -mt-64",
        className
      )}
    >
      <div className="z-10 flex flex-col items-center">
        {/* Tagline */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="mb-4 inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm"
        >
          {tagline}
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground"
        >
          {typeof title === 'string' ? (
            title.split(" ").map((word, i) => (
              <motion.span
                key={i}
                variants={FADE_IN_ANIMATION_VARIANTS}
                className="inline-block"
              >
                {word}&nbsp;
              </motion.span>
            ))
          ) : (
            title
          )}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          {description}
        </motion.p>

        {/* Call to Action Button */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.6 }}
        >
          <ActionButton>{ctaText}</ActionButton>
        </motion.div>
      </div>

      {/* Animated Image Marquee */}
      {filteredImages.length > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1/3 md:h-2/5 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
          <motion.div
            className="flex gap-4"
            animate={{ x: "-100%" }}
            transition={{
              ease: "linear",
              duration: 40,
              repeat: Infinity,
              repeatType: "loop",
            }}
            initial={{ x: 0 }}
          >
            {duplicatedImages.map((src, index) => (
              <div
                key={index}
                className="relative aspect-[3/4] h-48 md:h-64 flex-shrink-0 overflow-hidden rounded-2xl"
                style={{
                  transform: `rotate(${index % 2 === 0 ? -2 : 5}deg)`,
                }}
              >
                <img
                  src={src}
                  alt={`Showcase image ${index + 1}`}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: src.includes('bibit') ? 'center 20%' : 'center',
                  }}
                />
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
};
