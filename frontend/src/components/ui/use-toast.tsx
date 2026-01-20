interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const toast = ({ title, description, variant = 'default' }: ToastProps) => {
  // Simple console logging for now - you can implement actual toast UI later
  if (variant === 'destructive') {
    console.error(`Toast Error: ${title}`, description);
  } else {
    console.log(`Toast: ${title}`, description);
  }
  
  // For production, you'd want to use a proper toast library like react-hot-toast
  // For now, we'll use browser alert as fallback
  if (typeof window !== 'undefined') {
    const message = description ? `${title}: ${description}` : title;
    if (variant === 'destructive') {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  }
};