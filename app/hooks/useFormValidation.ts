import { useState, useCallback } from 'react';
import { z, ZodSchema } from 'zod';

type Touched<T> = { [K in keyof T]?: boolean };
type Errors<T> = { [K in keyof T]?: string };

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  schema: ZodSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [touched, setTouched] = useState<Touched<T>>({});

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  }, []);

  const handleBlur = useCallback((name: keyof T) => {
    setTouched((prevTouched) => ({
      ...prevTouched,
      [name]: true,
    }));

    const result = schema.safeParse(values);
    if (!result.success) {
      const newErrors: Errors<T> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof T;
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
    } else {
      setErrors({});
    }
  }, [schema, values]);

  const validateForm = useCallback(() => {
    const result = schema.safeParse(values);
    if (!result.success) {
      const newErrors: Errors<T> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof T;
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
      return newErrors;
    }
    setErrors({});
    return {};
  }, [schema, values]);
  
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);


  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setErrors,
    setValues,
    resetForm,
  };
} 