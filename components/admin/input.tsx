import { forwardRef, useLayoutEffect, useRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { formatCurrencyInput } from '@/lib/utils/format';

const baseInputStyles = `
  w-full px-4 py-2.5 text-base 
  bg-white border border-neutral-200 rounded-lg 
  focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900
  transition-colors
`;

// Helper to render label with red asterisk
function renderLabel(label: string) {
  if (label.endsWith(' *')) {
    const text = label.slice(0, -2);
    return <>{text}<span className="text-red-500"> *</span></>;
  }
  if (label.endsWith('*')) {
    const text = label.slice(0, -1);
    return <>{text}<span className="text-red-500">*</span></>;
  }
  return label;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-xs text-neutral-500 mb-1.5">
            {renderLabel(label)}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseInputStyles} ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-xs text-neutral-500 mb-1.5">
            {renderLabel(label)}
          </label>
        )}
        <textarea
          ref={ref}
          className={`${baseInputStyles} resize-none ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: { id: string; name: string }[];
  inline?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, inline, placeholder, className = '', children, ...props }, ref) => {
    const selectElement = (
      <select
        ref={ref}
        className={`${baseInputStyles} ${className}`}
        {...props}
      >
        {options ? (
          <>
            <option value="">{placeholder || `Pilih ${label?.toLowerCase() || 'opsi'}`}</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </>
        ) : (
          children
        )}
      </select>
    );

    if (inline) {
      return selectElement;
    }

    return (
      <div>
        {label && (
          <label className="block text-xs text-neutral-500 mb-1.5">
            {renderLabel(label)}
          </label>
        )}
        {selectElement}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-xs text-neutral-500 mb-1.5">
            {renderLabel(label)}
          </label>
        )}
        <input
          ref={ref}
          type="number"
          className={`${baseInputStyles} ${className}`}
          {...props}
        />
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  value: number | string;
  onChange: (value: string) => void;
}

function parseCurrency(value: string): string {
  return value.replace(/\D/g, '');
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, className = '', value, onChange, ...props }, ref) => {
    const displayValue = formatCurrencyInput(value);
    const inputRef = useRef<HTMLInputElement>(null);
    // Digit count before the caret, captured on the raw (pre-format) value so the
    // caret can be restored to the equivalent position after re-formatting below.
    const pendingCaretDigits = useRef<number | null>(null);

    useLayoutEffect(() => {
      if (pendingCaretDigits.current === null || !inputRef.current) return;
      const target = pendingCaretDigits.current;
      pendingCaretDigits.current = null;
      let digitCount = 0;
      let pos = displayValue.length;
      for (let i = 0; i < displayValue.length; i++) {
        if (/\d/.test(displayValue.charAt(i))) {
          digitCount++;
          if (digitCount === target) {
            pos = i + 1;
            break;
          }
        }
      }
      if (target === 0) pos = 0;
      inputRef.current.setSelectionRange(pos, pos);
    }, [displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const caretPos = e.target.selectionStart ?? e.target.value.length;
      pendingCaretDigits.current = e.target.value.slice(0, caretPos).replace(/\D/g, '').length;
      onChange(parseCurrency(e.target.value));
    };

    return (
      <div>
        {label && (
          <label className="block text-xs text-neutral-500 mb-1.5">
            {renderLabel(label)}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            Rp
          </span>
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            className={`${baseInputStyles} pl-10 ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
