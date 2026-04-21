'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashBoardIcon, FileTextIcon, ClockIcon } from '@/components/icons';
import { useTranslations } from 'next-intl';

// Disable static generation to avoid prerender issues with translations
export const dynamic = 'force-dynamic';
/** Required for @cloudflare/next-on-pages (non-static routes must use Edge). */
export const runtime = 'edge';

// Fallback translations for when next-intl is not available during SSR/prerender
const fallbackTranslations: Record<string, string> = {
  pageNotFound: 'Page Not Found',
  title: 'Oops! Page Not Found',
  description: "The page you're looking for doesn't exist or has been moved. You might have mistyped the URL, or the link you followed is outdated.",
  titleMobile: '404 - Page Not Found',
  descriptionMobile: "The page you're looking for doesn't exist or has been moved.",
  goToDashboard: 'Go to Dashboard',
  workflows: 'Automatizations',
  executions: 'Executions'
};

const NotFoundPage: React.FC = () => {
  const router = useRouter();
  
  // Use translations with fallback values
  // If NextIntlClientProvider is not available (during prerender), useTranslations will throw
  // We handle this by using fallback values
  let t: (key: string) => string;
  
  try {
    const translations = useTranslations('notFound');
    t = (key: string) => {
      try {
        const translated = translations(key);
        // If translation is missing or returns the key, use fallback
        return translated && translated !== key ? translated : (fallbackTranslations[key] || key);
      } catch {
        return fallbackTranslations[key] || key;
      }
    };
  } catch {
    // If useTranslations fails (e.g., during prerender), use fallback
    t = (key: string) => fallbackTranslations[key] || key;
  }

  return (
    <div className="h-full bg-black flex items-center justify-center px-4">
      {/* Desktop Layout */}
      <div className="hidden lg:flex max-w-6xl w-full items-center justify-center gap-12">
        {/* Error illustration */}
        <div className="max-w-md">
          <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
            <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
              <FileTextIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">404</h2>
            <p className="text-gray-400">{t('pageNotFound')}</p>
          </div>
        </div>

        {/* Error message */}
        <div className="max-w-lg text-center">
          <div className="space-y-6">
            {/* Title */}
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            
            {/* Description */}
            <p className="text-lg text-gray-300 mb-8">
              {t('description')}
            </p>

            {/* Quick navigation */}
            <div className="space-y-4">
              <button 
                onClick={() => router.push('/')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-medium rounded-lg transition-colors shadow-lg shadow-purple-500/25 flex items-center justify-center gap-3"
              >
                <DashBoardIcon className="w-5 h-5" />
                {t('goToDashboard')}
              </button>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push('/market')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileTextIcon className="w-4 h-4" />
                  {t('workflows')}
                </button>
                <button 
                  onClick={() => router.push('/executions')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ClockIcon className="w-4 h-4" />
                  {t('executions')}
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
            {t('titleMobile')}
          </h1>
          
          {/* Description */}
          <p className="text-gray-300">
            {t('descriptionMobile')}
          </p>

          {/* Call to Action Button */}
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-lg font-medium rounded-lg transition-colors shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            <DashBoardIcon className="w-5 h-5" />
            {t('goToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 