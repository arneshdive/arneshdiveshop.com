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
    <div className="bg-white border-b border-neutral-200 py-6">
      <div className="flex justify-center items-center gap-4 px-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === step.id || (currentStep === 'payment' && step.id === 'information')
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {currentStep === 'payment' && step.id === 'information' ? (
                <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                currentStep === step.id ? 'font-medium' : 'text-neutral-400'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className="w-16 lg:w-24 h-0.5 bg-neutral-200 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
