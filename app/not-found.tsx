'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashBoardIcon, FileTextIcon, ClockIcon } from '@/components/icons';

const NotFoundPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      {/* Desktop Layout */}
      <div className="hidden lg:flex max-w-6xl w-full items-center justify-center gap-12">
        {/* Error illustration */}
        <div className="max-w-md">
          <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
            <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
              <FileTextIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">404</h2>
            <p className="text-gray-400">Page Not Found</p>
          </div>
        </div>

        {/* Error message */}
        <div className="max-w-lg text-center">
          <div className="space-y-6">
            {/* Title */}
            <h1 className="text-4xl font-bold text-white mb-4">
              Oops! Page Not Found
            </h1>
            
            {/* Description */}
            <p className="text-lg text-gray-300 mb-8">
              The page you're looking for doesn't exist or has been moved. 
              You might have mistyped the URL, or the link you followed is outdated.
            </p>

            {/* Quick navigation */}
            <div className="space-y-4">
              <button 
                onClick={() => router.push('/')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-medium rounded-lg transition-colors shadow-lg shadow-purple-500/25 flex items-center justify-center gap-3"
              >
                <DashBoardIcon className="w-5 h-5" />
                Go to Dashboard
              </button>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push('/workflows')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileTextIcon className="w-4 h-4" />
                  Workflows
                </button>
                <button 
                  onClick={() => router.push('/executions')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ClockIcon className="w-4 h-4" />
                  Executions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full max-w-sm">
        <div className="bg-gray-800 rounded-xl shadow-sm p-8 space-y-6 text-center border border-gray-700">
          {/* Error illustration */}
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
            <FileTextIcon className="w-8 h-8 text-white" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-white">
            404 - Page Not Found
          </h1>
          
          {/* Description */}
          <p className="text-gray-300">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Call to Action Button */}
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-lg font-medium rounded-lg transition-colors shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            <DashBoardIcon className="w-5 h-5" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 