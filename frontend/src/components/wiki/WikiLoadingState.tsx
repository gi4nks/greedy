import React from 'react';

interface WikiLoadingStateProps {
  loading: boolean;
}

export const WikiLoadingState: React.FC<WikiLoadingStateProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body text-center">
        <span className="loading loading-spinner loading-lg mx-auto mb-4"></span>
        <p className="text-base-content/70">Searching the AD&D wiki...</p>
      </div>
    </div>
  );
};