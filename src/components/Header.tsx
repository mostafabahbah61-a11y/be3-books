import { useApp } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import { Moon, Sun, Globe } from 'lucide-react';

export default function Header() {
  const { lang, setLang, theme, setTheme } = useApp();
  const { settings } = useSettings();
  const siteName = lang === 'ar' ? settings.site_name_ar : settings.site_name_en;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1A1025]/80 backdrop-blur-md border-b border-purple-100 dark:border-purple-900/30 transition-colors">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group cursor-pointer">
          <img src="/images/logo_(1).png" alt={siteName} className="w-10 h-10 rounded-lg object-cover transition-transform group-hover:scale-105" />
          <span className="font-bold text-lg text-[#3D1B5E] dark:text-[#E8D5E8] hidden sm:block">
            {siteName}
          </span>
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 hover:bg-[#7B3FA0] hover:text-white text-[#3D1B5E] dark:text-[#E8D5E8] text-sm font-medium transition-all"
          >
            <Globe className="w-4 h-4" />
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 hover:bg-[#7B3FA0] hover:text-white text-[#3D1B5E] dark:text-[#E8D5E8] transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
