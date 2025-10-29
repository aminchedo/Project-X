export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

export const handleError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
      details: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    return error as ApiError;
  }

  return {
    status: 500,
    message: 'An unexpected error occurred',
  };
};

export const logError = (context: string, error: unknown) => {
  console.error(`[${context}]`, error);
  // TODO: Send to error tracking service (Sentry)
};