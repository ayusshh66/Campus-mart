import { toast } from 'sonner';

export const showAdminError = (
  message: string,
  title = 'Action unsuccessful'
) => {
  toast.error(title, {
    description: message,
    duration: 6000,
    closeButton: true,
    className: 'campus-admin-error-toast',
  });
};

export const showAdminSuccess = (
  message: string,
  title = 'Action successful'
) => {
  toast.success(title, {
    description: message,
    duration: 4000,
    closeButton: true,
    className: 'campus-admin-success-toast',
  });
};

export const showAdminWarning = (
  message: string,
  title = 'Attention required'
) => {
  toast.warning(title, {
    description: message,
    duration: 5000,
    closeButton: true,
    className: 'campus-admin-warning-toast',
  });
};