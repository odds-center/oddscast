import { InputHTMLAttributes, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = '', name, id, ...props }, ref) => {
    const inputId = id ?? name;
    const errorId = inputId ? `${inputId}-error` : undefined;
    return (
      <div>
        <label className='block text-[16px] font-medium mb-2 text-foreground'>{label}</label>
        <Input
          ref={ref}
          name={name}
          id={inputId}
          className={cn(className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error && errorId ? errorId : undefined}
          {...props}
        />
        {error && <p id={errorId} className='text-error text-xs mt-1.5'>{error}</p>}
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';

export default FormInput;
