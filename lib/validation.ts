// Input validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[0-9\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "").substring(0, 255);
}

export function validatePrice(price: number): boolean {
  return price > 0 && price < 1000000;
}

export function validateDuration(minutes: number): boolean {
  return minutes > 0 && minutes <= 10080; // Max 7 days
}

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

export function validateCustomer(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Customer name is required";
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = "Valid phone number is required";
  }

  if (data.email && !validateEmail(data.email)) {
    errors.email = "Valid email is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePackage(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Package name is required";
  }

  if (!validatePrice(data.price)) {
    errors.price = "Price must be between 0 and 1000000";
  }

  if (!validateDuration(data.durationMinutes)) {
    errors.durationMinutes = "Duration must be between 1 minute and 7 days";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
