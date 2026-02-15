"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface CtaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageSrc: string;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
}

const CtaCard = React.forwardRef<HTMLDivElement, CtaCardProps>(
  (
    {
      className,
      imageSrc,
      title,
      description,
      buttonText,
      buttonHref,
      ...props
    },
    ref
  ) => {
    // Animation variants for Framer Motion
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
          delayChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: {
          type: "spring" as const,
          stiffness: 100,
          damping: 12,
        },
      },
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-3xl shadow-2xl",
          className
        )}
        {...props}
      >
        {/* Background Image */}
        <img
          src={imageSrc}
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3e6461]/90 via-[#2d4a47]/80 to-[#1e4843]/90" />
        
        {/* Animated blobs */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#4a7370] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-[#2d5a56] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-[#3e6461] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Glassmorphism container */}
        <motion.div
          className="relative z-10 backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl m-4 md:m-8 p-8 md:p-12 lg:p-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="flex flex-col items-center text-center text-white max-w-4xl mx-auto">
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              variants={itemVariants}
            >
              {title}
            </motion.h2>
            <motion.p
              className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl leading-relaxed"
              variants={itemVariants}
            >
              {description}
            </motion.p>

            <motion.div variants={itemVariants}>
              <Link href={buttonHref}>
                <button className="group relative px-12 py-5 overflow-hidden rounded-full transition-all duration-300 hover:scale-105">
                  {/* Button glass background */}
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-md border border-white/30 rounded-full transition-all duration-300 group-hover:bg-white/30"></div>
                  
                  {/* Button shine effect */}
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  </div>
                  
                  {/* Button content */}
                  <span className="relative z-10 text-white font-bold text-xl flex items-center gap-3">
                    {buttonText}
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5,
                        ease: "easeInOut"
                      }}
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  </span>
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }
);

CtaCard.displayName = "CtaCard";

export { CtaCard };
