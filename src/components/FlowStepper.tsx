import React from 'react';
import { CheckCircle } from 'lucide-react';
import { BRAND_COLORS } from '../styles/theme';

interface Step {
  key: string;
  label: string;
}

interface FlowStepperProps {
  steps: Step[];
  currentStepKey: string;
  completedSteps: string[];
}

export const FlowStepper: React.FC<FlowStepperProps> = ({
  steps,
  currentStepKey,
  completedSteps,
}) => {
  return (
    <div className="flex items-center gap-2 mb-6" aria-label="Adım İlerlemesi">
      {steps.map((step, index) => {
        const isCurrent = step.key === currentStepKey;
        const isCompleted = completedSteps.includes(step.key);

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                isCurrent
                  ? 'text-white shadow-lg transform scale-110'
                  : isCompleted
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
              style={{
                backgroundColor: isCurrent || isCompleted ? BRAND_COLORS.navy : undefined,
              }}
              title={step.label}
            >
              {isCompleted && !isCurrent ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-16 mx-2 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-[' + BRAND_COLORS.navy + ']' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
