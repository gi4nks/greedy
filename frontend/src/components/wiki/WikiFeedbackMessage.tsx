import React from 'react';

interface WikiFeedbackMessageProps {
  message: { type: 'success' | 'error' | 'warning' | 'info', message: string } | null;
  onDismiss: () => void;
}

export const WikiFeedbackMessage: React.FC<WikiFeedbackMessageProps> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div className={`alert ${message.type === 'success' ? 'alert-success' : message.type === 'error' ? 'alert-error' : message.type === 'warning' ? 'alert-warning' : 'alert-info'}`}>
      <div>
        <span>{message.message}</span>
      </div>
      <div>
        <button
          onClick={onDismiss}
          className="btn btn-sm btn-circle btn-ghost"
        >
          ✕
        </button>
      </div>
    </div>
  );
};