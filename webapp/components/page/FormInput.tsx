import { InputHTMLAttributes, forwardRef } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const inputClass =
  'input-base w-full px-4 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20';

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div>
      <label className='block text-sm font-medium mb-2'>{label}</label>
      <input ref={ref} className={`${inputClass} ${className}`} {...props} />
      {error && <p className='msg-error mt-1.5'>{error}</p>}
    </div>
  ),
);

FormInput.displayName = 'FormInput';

export default FormInput;
