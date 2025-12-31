import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

const TOUR_STORAGE_KEY = 'compareai-tour-completed';

export interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="logo"]',
    title: 'Welcome to CompareAI',
    description: 'Compare responses from multiple AI models side-by-side. Ask once, see how different AI models think.',
    position: 'bottom',
  },
  {
    id: 'model-selector',
    target: '[data-tour="model-selector"]',
    title: 'Select AI Models',
    description: 'Choose which AI models to compare. Select multiple models to see how each one responds to your question.',
    position: 'bottom',
  },
  {
    id: 'deep-mode',
    target: '[data-tour="deep-mode"]',
    title: 'Deep Mode',
    description: 'Enable Deep Mode for complex questions. AI models will debate and synthesize the best possible answer.',
    position: 'top',
  },
  {
    id: 'chat-input',
    target: '[data-tour="chat-input"]',
    title: 'Ask Your Question',
    description: 'Type any question here. All selected models will respond simultaneously so you can compare their answers.',
    position: 'top',
  },
];

export function useTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true);

  // Check if tour was completed before
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(completed === 'true');
  }, []);

  // Auto-start tour for first-time visitors
  useEffect(() => {
    if (!hasCompletedTour) {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    completeTour();
  }, []);

  const fireConfetti = useCallback(() => {
    // Center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00d4ff', '#a855f7', '#22c55e', '#f59e0b', '#ec4899'],
    });

    // Left side
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00d4ff', '#a855f7', '#22c55e'],
      });
    }, 150);

    // Right side
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#ec4899', '#00d4ff'],
      });
    }, 300);
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setHasCompletedTour(true);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    
    // Fire confetti celebration
    fireConfetti();
  }, [fireConfetti]);

  return {
    isActive,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    currentStepData: TOUR_STEPS[currentStep],
    hasCompletedTour,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  };
}
