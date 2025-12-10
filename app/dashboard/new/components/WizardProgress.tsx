import React from 'react';
import { Check } from 'lucide-react';
import type { SessionStep } from '../steps/SessionCreateStep';

interface WizardProgressProps {
  currentStep: SessionStep;
  onStepClick?: (step: SessionStep) => void;
  completedSteps?: SessionStep[];
}

const steps: { key: SessionStep; label: string; description: string }[] = [
  { key: 'create', label: 'Criar', description: 'Dados da sessão' },
  { key: 'players', label: 'Jogadores', description: 'Adicionar participantes' },
  { key: 'active', label: 'Jogo', description: 'Buy-ins e rebuys' },
  { key: 'cashout', label: 'Cash-out', description: 'Saídas e pagamentos' },
  { key: 'transfers', label: 'Transferências', description: 'Acertos finais' },
];

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  onStepClick,
  completedSteps = [],
}) => {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="w-full pb-6 md:pb-8">
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" aria-hidden="true" />

        {/* Progress bar fill */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          aria-hidden="true"
        />

        {/* Steps - Horizontal scroll on very small screens */}
        <div className="relative flex justify-between overflow-x-auto scrollbar-hide">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.key);
            const isCurrent = step.key === currentStep;
            const isPast = index < currentIndex;
            const isClickable = onStepClick && (isPast || isCompleted);

            return (
              <div
                key={step.key}
                className="flex flex-col items-center flex-shrink-0"
                style={{ flex: '1 1 0', minWidth: '60px' }}
              >
                <button
                  onClick={() => isClickable && onStepClick(step.key)}
                  disabled={!isClickable}
                  className={`
                    relative z-10 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border-2
                    transition-all duration-300 mb-2
                    ${isCurrent
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-110'
                      : isPast || isCompleted
                        ? 'border-primary bg-primary text-primary-foreground hover:scale-105'
                        : 'border-border bg-surface text-muted-foreground'
                    }
                    ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  `}
                  aria-label={`${step.label}: ${step.description}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isPast || isCompleted ? (
                    <Check className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <span className="text-xs md:text-sm font-semibold">{index + 1}</span>
                  )}
                </button>

                <div className="text-center w-full px-1">
                  <div className={`text-[10px] sm:text-xs md:text-sm font-medium transition-colors truncate ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </div>
                  <div className="hidden sm:block text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
