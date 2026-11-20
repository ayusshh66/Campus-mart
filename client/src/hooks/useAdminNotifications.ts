import { useState, useCallback } from 'react';

import {
  showAdminError,
  showAdminSuccess,
} from '../utils/adminNotifications';

/* String-based error states */

export function useAdminError(
  title = 'Action unsuccessful'
) {
  const [error, setErrorState] =
    useState<string | null>(null);

  const setError = useCallback(
    (message: string | null) => {
      setErrorState(message);

      if (message) {
        showAdminError(message, title);
      }
    },
    [title]
  );

  return [error, setError] as const;
}

/* Object-based feedback states */

type AdminFeedback = {
  message: string;
  kind?: string;
  type?: string;
} | null;

export function useAdminFeedback<
  T extends AdminFeedback
>() {
  const [feedback, setFeedbackState] =
    useState<T | null>(null);

  const setFeedback = useCallback(
    (value: T | null) => {
      setFeedbackState(value);

      if (!value) return;

      const status = value.kind ?? value.type;

      if (status === 'error') {
        showAdminError(value.message);
      }

      if (status === 'success') {
        showAdminSuccess(value.message);
      }
    },
    []
  );

  return [feedback, setFeedback] as const;
}