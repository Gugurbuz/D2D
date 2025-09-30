export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^(\+90|0)?[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    return value != null;
  },

  minLength: (value: string, min: number): boolean => {
    return value.trim().length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.trim().length <= max;
  },

  numeric: (value: string): boolean => {
    return !isNaN(Number(value)) && value.trim() !== '';
  },

  coordinates: (lat: number, lng: number): boolean => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  },
};

export type ValidationRule = {
  field: string;
  validator: (value: any) => boolean;
  message: string;
};

export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: ValidationRule[]
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const value = data[rule.field];
    if (!rule.validator(value)) {
      errors[rule.field] = rule.message;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}