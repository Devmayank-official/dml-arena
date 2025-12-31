import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { TourStep } from '@/hooks/useTour';

interface TourOverlayProps {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  stepData: TourStep;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay({
  isActive,
  currentStep,
  totalSteps,
  stepData,
  onNext,
  onPrev,
  onSkip,
}: TourOverlayProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !stepData) return;

    const updatePosition = () => {
      const element = document.querySelector(stepData.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        setTargetRect({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Calculate tooltip position
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const margin = 16;
        let style: React.CSSProperties = {};

        switch (stepData.position) {
          case 'bottom':
            style = {
              top: rect.bottom + margin,
              left: Math.max(margin, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - margin)),
            };
            break;
          case 'top':
            style = {
              top: rect.top - tooltipHeight - margin,
              left: Math.max(margin, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - margin)),
            };
            break;
          case 'left':
            style = {
              top: rect.top + rect.height / 2 - tooltipHeight / 2,
              left: rect.left - tooltipWidth - margin,
            };
            break;
          case 'right':
            style = {
              top: rect.top + rect.height / 2 - tooltipHeight / 2,
              left: rect.right + margin,
            };
            break;
        }

        setTooltipStyle(style);

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, stepData]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <AnimatePresence>
      {isActive && targetRect && (
        <>
          {/* Dark overlay with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] pointer-events-auto"
            onClick={onSkip}
            style={{
              background: `radial-gradient(
                ellipse ${targetRect.width + 40}px ${targetRect.height + 40}px 
                at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px,
                transparent 0%,
                transparent 70%,
                rgba(0, 0, 0, 0.85) 100%
              )`,
            }}
          />

          {/* Spotlight ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="fixed z-[101] pointer-events-none rounded-xl"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: '0 0 0 3px hsl(190 100% 50% / 0.6), 0 0 30px hsl(190 100% 50% / 0.3)',
            }}
          />

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.4, delay: 0.15, type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-[102] w-80 pointer-events-auto"
            style={tooltipStyle}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              <div className="p-5">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent">
                    <Sparkles className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {stepData.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {stepData.description}
                </p>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Skip tour
                  </Button>

                  <div className="flex items-center gap-2">
                    {!isFirstStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onPrev}
                        className="gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={onNext}
                      className="gap-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      {isLastStep ? 'Get Started' : 'Next'}
                      {!isLastStep && <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-4 bg-primary'
                      : i < currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
