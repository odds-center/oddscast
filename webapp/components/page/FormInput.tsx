import { InputHTMLAttributes, forwardRef } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const inputClass =
  'input-base w-full px-4 text-foreground focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-gray-200';

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div>
      <label className='block text-[16px] font-medium mb-2 text-foreground'>{label}</label>
      <input ref={ref} className={`${inputClass} ${className}`} {...props} />
      {error && <p className='msg-error mt-1.5'>{error}</p>}
    </div>
  ),
);

FormInput.displayName = 'FormInput';

export default FormInput;
