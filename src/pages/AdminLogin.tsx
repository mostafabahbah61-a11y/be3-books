import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Lock, Loader2 } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const { t } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data } = await supabase.rpc('verify_admin_password', { p_password: password });
    if (data === true) {
      sessionStorage.setItem('mlr-admin', 'true');
      sessionStorage.setItem('mlr-admin-pw', password);
      onLogin();
    } else {
      setError(t('كلمة المرور غير صحيحة', 'Incorrect password'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D1B5E] via-[#5B2A86] to-[#7B3FA0] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#2D1B3D] rounded-3xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7B3FA0] to-[#D6336C] flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2 text-[#3D1B5E] dark:text-[#E8D5E8]">
            {t('لوحة الإدارة', 'Admin Dashboard')}
          </h1>
          <p className="text-center text-sm text-[#7B3FA0] dark:text-[#B89AC4] mb-6">
            {t('أدخل كلمة المرور للدخول', 'Enter password to access')}
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('كلمة المرور', 'Password')}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] text-[#2D1B3D] dark:text-[#F5EDE8] focus:ring-2 focus:ring-[#7B3FA0] focus:border-transparent outline-none transition-all text-center"
            />
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] hover:from-[#6B2F90] hover:to-[#C0295B] disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('دخول', 'Login')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
