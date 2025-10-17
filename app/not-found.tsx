'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const NotFoundPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Desktop Layout */}
      <div className="hidden lg:flex max-w-6xl w-full items-center justify-center gap-12">
        {/* Error message */}
        <div className="max-w-lg text-center">
          <div className="space-y-6">
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              404 - Page Not Found
            </h1>
            
            {/* Description */}
            <p className="text-lg text-gray-600 mb-8">
              Sorry, but the page you're looking for doesn't exist or has been moved. 
              You might have mistyped the URL, or the link you followed is outdated.
            </p>

            {/* Call to Action Button */}
            <button 
              onClick={() => router.push('/')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-medium rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-center">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900">
            404 - Page Not Found
          </h1>
          
          {/* Description */}
          <p className="text-gray-600">
            Sorry, but the page you're looking for doesn't exist or has been moved.
          </p>

          {/* Call to Action Button */}
          <button 
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg font-medium rounded-lg transition-colors w-full"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 