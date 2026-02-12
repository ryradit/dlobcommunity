'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export interface TutorialStep {
  element: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right'; // Position of tooltip relative to element
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  isActive: boolean;
  onClose: () => void;
  tutorialKey: string; // Unique key for localStorage tracking
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  steps,
  isActive,
  onClose,
  tutorialKey,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const updateElementPosition = () => {
      const selector = steps[currentStep]?.element;
      if (!selector) return;

      const element = document.querySelector(selector);
      if (element) {
        // Scroll element into view smoothly and center it
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait for scroll to complete before updating position
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setElementRect(rect);
          calculateTooltipPosition(rect, steps[currentStep].position);
        }, 300);
      }
    };

    updateElementPosition();
    window.addEventListener('resize', updateElementPosition);
    return () => window.removeEventListener('resize', updateElementPosition);
  }, [currentStep, isActive, steps]);

  const calculateTooltipPosition = (rect: DOMRect, position?: string) => {
    const offset = 20;
    const tooltipWidth = 288; // w-72 = 18rem = 288px
    const tooltipHeight = 220; // Approximate height of tooltip
    const padding = 10; // Padding from viewport edge
    
    let top = 0;
    let left = 0;
    let finalPosition = position || 'bottom';

    // Calculate initial position based on preference
    switch (finalPosition) {
      case 'top':
        top = rect.top - offset - tooltipHeight;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - offset - tooltipWidth;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left + rect.width + offset;
        break;
      case 'bottom':
      default:
        top = rect.top + rect.height + offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Adjust for viewport boundaries
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if tooltip goes off-screen
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    // Adjust vertical position if tooltip goes off-screen
    if (top < padding) {
      top = padding;
    } else if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
    }

    setTooltipPos({ top, left });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    localStorage.setItem(`tutorial_${tutorialKey}`, 'completed');
    onClose();
  };

  if (!isActive || !elementRect || steps.length === 0) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay Background */}
      <div className="fixed inset-0 bg-black/60 z-40 pointer-events-none" />

      {/* Highlighted Element Container */}
      <div
        className="fixed z-40 border-2 border-blue-400 rounded-lg shadow-lg shadow-blue-500/30 pointer-events-none"
        style={{
          top: `${elementRect.top - 4}px`,
          left: `${elementRect.left - 4}px`,
          width: `${elementRect.width + 8}px`,
          height: `${elementRect.height + 8}px`,
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-zinc-900 border border-blue-500/50 rounded-lg p-4 w-72 shadow-2xl pointer-events-auto"
        style={{
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-white">{step.title}</h3>
          </div>
          <button
            onClick={completeTutorial}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-300 mb-4">{step.description}</p>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 rounded-full h-1 mb-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            {currentStep + 1} / {steps.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
            >
              {currentStep === steps.length - 1 ? 'Selesai' : 'Lanjut'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), inset 0 0 30px rgba(59, 130, 246, 0.2);
          }
        }
      `}</style>
    </>
  );
};

export default TutorialOverlay;
