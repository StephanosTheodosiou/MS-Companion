import { ApiError } from '@/utils/apiClient';

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return "We couldn't reach MS Companion. Check your internet connection and try again.";
    }
    if (error.status === 429) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    if (error.status >= 500) {
      return 'Something went wrong on our side. Please try again in a moment.';
    }
  }
  return 'Something went wrong. Please try again.';
}
