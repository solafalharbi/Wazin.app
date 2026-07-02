import React from 'react';
import { Sidebar } from './Sidebar';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex w-full">
      <Sidebar />
      <main 
        className="flex-1 transition-all duration-300 md:ml-72 flex flex-col pt-16 md:pt-0 min-h-[100dvh]"
        style={{
          marginLeft: language === 'en' ? undefined : '0',
          marginRight: language === 'ar' ? undefined : '0',
        }}
      >
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
          {children}
        </div>
      </main>
      
      {/* Hack for RTL sidebar spacing on desktop */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          html[dir="rtl"] main {
            margin-left: 0;
            margin-right: 18rem; /* 72 * 0.25rem = 18rem */
          }
        }
      `}} />
    </div>
  );
}
