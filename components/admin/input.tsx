import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

const baseInputStyles = `
  w-full px-4 py-2.5 text-sm 
  bg-white border border-neutral-200 rounded-lg 
  focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-inset focus:ring-neutral-900
  transition-colors
`;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-xs text-neutral-500 mb-1.5">
            {label}
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
            {label}
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
            {label}
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
            {label}
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

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? value.replace(/\D/g, '') : String(value);
  if (!num) return '';
  return parseInt(num, 10).toLocaleString('id-ID');
}

function parseCurrency(value: string): string {
  return value.replace(/\D/g, '');
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, className = '', value, onChange, ...props }, ref) => {
    const displayValue = formatCurrency(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseCurrency(e.target.value);
      onChange(parsed);
    };

    return (
      <div>
        {label && (
          <label className="block text-xs text-neutral-500 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            Rp
          </span>
          <input
            ref={ref}
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
