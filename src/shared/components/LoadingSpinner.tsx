import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <img
            src="https://ehqotgebdywdmwxbwbjl.supabase.co/storage/v1/object/sign/Logo/animatedlogo3.gif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82YTJkNThmMC1kMzNhLTRiY2MtODMxMy03ZjE2NmIwN2NjMDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMb2dvL2FuaW1hdGVkbG9nbzMuZ2lmIiwiaWF0IjoxNzU3MjY2NDMzLCJleHAiOjE3ODg4MDI0MzN9.J6IxjFdcZwL38INubr8hwsMYpzZM3il9GllxYQF_BFk"
            alt="Enerjisa Logo"
            className="max-w-full max-h-full object-contain animate-pulse"
          />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0099CB] mx-auto"></div>
        <p className="text-gray-600 mt-4">Yükleniyor...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;