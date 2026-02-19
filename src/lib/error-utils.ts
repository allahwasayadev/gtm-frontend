import { isAxiosError } from 'axios';

interface ApiErrorPayload {
  message?: string | string[];
}

export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallbackMessage;
}
