/**
 * FormError Component
 * Displays validation error messages for form fields
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  error?: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error, className }) => {
  if (!error) return null;

  return (
    <div className={cn('flex items-start gap-2 text-sm text-red-600 mt-1', className)}>
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
};

interface FormErrorListProps {
  errors: string[];
  className?: string;
}

export const FormErrorList: React.FC<FormErrorListProps> = ({ errors, className }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-md p-4', className)}>
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Please fix the following errors:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

interface ValidationErrorsProps {
  errors: Record<string, string>;
  className?: string;
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors, className }) => {
  const errorMessages = Object.entries(errors).map(([field, message]) => `${field}: ${message}`);
  return <FormErrorList errors={errorMessages} className={className} />;
};

interface FieldErrorProps {
  error?: string;
  touched?: boolean;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, touched, className }) => {
  if (!error || !touched) return null;

  return <FormError error={error} className={className} />;
};

export default FormError;
