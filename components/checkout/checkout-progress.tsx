'use client';

import { Icon } from '@iconify/react';

interface CheckoutProgressProps {
  currentStep: 'information' | 'payment';
}

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  const steps = [
    { id: 'information', label: 'Informasi', number: 1 },
    { id: 'payment', label: 'Pembayaran', number: 2 },
  ] as const;

  return (
    <div className="bg-neutral-900 py-4">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step.id || (currentStep === 'payment' && step.id === 'information')
                    ? 'bg-white text-neutral-900'
                    : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                {currentStep === 'payment' && step.id === 'information' ? (
                  <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  currentStep === step.id ? 'text-white font-medium' : 'text-neutral-400'
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="w-8 lg:w-12 h-px bg-neutral-700 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
