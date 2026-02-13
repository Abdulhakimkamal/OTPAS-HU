/**
 * useFormValidation Hook
 * Custom hook for handling form validation with backend error integration
 */

import { useState, useCallback } from 'react';
import { extractValidationErrors, isValidationError } from '@/utils/validationErrors';

interface UseFormValidationOptions {
  onSubmit: (data: any) => Promise<void>;
  validate?: (data: any) => Record<string, string>;
}

interface UseFormValidationReturn {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent, data: any) => Promise<void>;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  setFieldTouched: (field: string, isTouched?: boolean) => void;
  clearErrors: () => void;
  setErrors: (errors: Record<string, string>) => void;
}

export const useFormValidation = ({
  onSubmit,
  validate,
}: UseFormValidationOptions): UseFormValidationReturn => {
  const [errors, setErrorsState] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrorsState(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldTouched = useCallback((field: string, isTouched: boolean = true) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrorsState({});
  }, []);

  const setErrors = useCallback((newErrors: Record<string, string>) => {
    setErrorsState(newErrors);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent, data: any) => {
      e.preventDefault();
      
      // Clear previous errors
      clearErrors();
      setIsSubmitting(true);

      try {
        // Client-side validation
        if (validate) {
          const validationErrors = validate(data);
          if (Object.keys(validationErrors).length > 0) {
            setErrorsState(validationErrors);
            setIsSubmitting(false);
            return;
          }
        }

        // Submit form
        await onSubmit(data);
        
        // Clear touched state on successful submit
        setTouchedState({});
      } catch (error: any) {
        // Handle backend validation errors
        if (isValidationError(error)) {
          const backendErrors = extractValidationErrors(error);
          setErrorsState(backendErrors);
        } else {
          // Handle other errors
          console.error('Form submission error:', error);
          throw error;
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validate, clearErrors]
  );

  return {
    errors,
    touched,
    isSubmitting,
    handleSubmit,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    clearErrors,
    setErrors,
  };
};

/**
 * useFieldValidation Hook
 * Hook for individual field validation
 */
interface UseFieldValidationOptions {
  name: string;
  value: any;
  validate?: (value: any) => string | null;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  setFieldTouched: (field: string, isTouched?: boolean) => void;
}

interface UseFieldValidationReturn {
  error?: string;
  isTouched: boolean;
  hasError: boolean;
  onBlur: () => void;
  onChange: () => void;
}

export const useFieldValidation = ({
  name,
  value,
  validate,
  errors,
  touched,
  setFieldError,
  clearFieldError,
  setFieldTouched,
}: UseFieldValidationOptions): UseFieldValidationReturn => {
  const error = errors[name];
  const isTouched = touched[name] || false;
  const hasError = !!error && isTouched;

  const onBlur = useCallback(() => {
    setFieldTouched(name, true);
    
    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        setFieldError(name, validationError);
      } else {
        clearFieldError(name);
      }
    }
  }, [name, value, validate, setFieldTouched, setFieldError, clearFieldError]);

  const onChange = useCallback(() => {
    // Clear error when user starts typing
    if (error) {
      clearFieldError(name);
    }
  }, [name, error, clearFieldError]);

  return {
    error,
    isTouched,
    hasError,
    onBlur,
    onChange,
  };
};

export default useFormValidation;


/**
 * useFormValidation Hook (Simple Version)
 * Simpler hook for basic form validation without submit handling
 * Used for forms that handle submission manually
 */
interface UseSimpleFormValidationReturn {
  errors: Record<string, string>;
  hasErrors: boolean;
  handleApiError: (error: any) => void;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  getError: (field: string) => string | undefined;
  setFieldError: (field: string, error: string) => void;
}

export const useSimpleFormValidation = (): UseSimpleFormValidationReturn => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasErrors = Object.keys(errors).length > 0;

  const handleApiError = (error: any) => {
    if (isValidationError(error)) {
      const backendErrors = extractValidationErrors(error);
      setErrors(backendErrors);
    }
  };

  const clearErrors = () => {
    setErrors({});
  };

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const getError = (field: string): string | undefined => {
    return errors[field];
  };

  const setFieldError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  return {
    errors,
    hasErrors,
    handleApiError,
    clearErrors,
    clearFieldError,
    getError,
    setFieldError,
  };
};
