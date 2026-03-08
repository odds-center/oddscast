import { InputHTMLAttributes, forwardRef } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const inputClass =
  'input-base w-full px-4 text-foreground focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-gray-200';

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = '', name, id, ...props }, ref) => {
    const inputId = id ?? name;
    const errorId = inputId ? `${inputId}-error` : undefined;
    return (
      <div>
        <label className='block text-[16px] font-medium mb-2 text-foreground'>{label}</label>
        <input
          ref={ref}
          name={name}
          id={inputId}
          className={`${inputClass} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error && errorId ? errorId : undefined}
          {...props}
        />
        {error && <p id={errorId} className='msg-error mt-1.5'>{error}</p>}
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';

export default FormInput;
