import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { SiteSettings } from '@/lib/store';
import { DEFAULT_SETTINGS } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface SettingsContextValue {
  settings: SiteSettings;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const reload = async () => {
    const { data } = await supabase
      .from('public_settings_view')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (data) setSettings(data as SiteSettings);
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, reload }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
