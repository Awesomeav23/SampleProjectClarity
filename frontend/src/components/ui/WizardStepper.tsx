import clsx from 'clsx';
import { Check } from 'lucide-react';

interface Step {
  title: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => {
        const isComplete = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isClickable = onStepClick && idx <= currentStep;

        return (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={isClickable ? () => onStepClick(idx) : undefined}
              disabled={!isClickable}
              className={clsx(
                'flex items-center gap-2',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-default'
              )}
            >
              <span
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
                  isComplete && 'bg-indigo-600 text-white',
                  isCurrent && 'bg-indigo-600 text-white ring-2 ring-indigo-200',
                  !isComplete && !isCurrent && 'bg-gray-200 text-gray-500'
                )}
              >
                {isComplete ? <Check size={16} /> : idx + 1}
              </span>
              <span
                className={clsx(
                  'text-sm font-medium hidden sm:block',
                  isCurrent ? 'text-indigo-600' : isComplete ? 'text-gray-700' : 'text-gray-400'
                )}
              >
                {step.title}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div
                className={clsx(
                  'flex-1 h-0.5 mx-3',
                  isComplete ? 'bg-indigo-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
