import { useState, useEffect } from 'react';

export interface TutorialStep {
  element: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function useTutorial(tutorialKey: string, steps: TutorialStep[] = []) {
  const [isActive, setIsActive] = useState(false);
  const [hasSeenBefore, setHasSeenBefore] = useState(false);

  useEffect(() => {
    // Check if user has completed this tutorial before
    const completed = localStorage.getItem(`tutorial_${tutorialKey}`);
    const skipped = localStorage.getItem(`tutorial_skip_${tutorialKey}`);
    
    if (!completed && !skipped) {
      // First time - show tutorial after a short delay
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
    
    setHasSeenBefore(!!completed || !!skipped);
  }, [tutorialKey]);

  const closeTutorial = () => {
    setIsActive(false);
  };

  const skipTutorial = () => {
    localStorage.setItem(`tutorial_skip_${tutorialKey}`, 'skipped');
    setIsActive(false);
  };

  const resetTutorial = () => {
    localStorage.removeItem(`tutorial_${tutorialKey}`);
    localStorage.removeItem(`tutorial_skip_${tutorialKey}`);
    // Show tutorial again on next page load
    setIsActive(true);
  };

  const toggleTutorial = () => {
    // Clear both states to allow tutorial to show
    localStorage.removeItem(`tutorial_${tutorialKey}`);
    localStorage.removeItem(`tutorial_skip_${tutorialKey}`);
    setIsActive(true);
  };

  return {
    isActive,
    hasSeenBefore,
    closeTutorial,
    skipTutorial,
    resetTutorial,
    toggleTutorial,
  };
}
