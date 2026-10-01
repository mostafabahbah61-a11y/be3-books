import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { SettingsProvider } from '@/context/SettingsContext';
import Header from '@/components/Header';
import HomePage from '@/pages/HomePage';
import ProductPage from '@/pages/ProductPage';
import CheckoutPage from '@/pages/CheckoutPage';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/store';
import { Check } from 'lucide-react';

function SuccessPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FBF7F0] dark:bg-[#1A1025] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3 text-[#3D1B5E] dark:text-[#E8D5E8]">
          {t('تم استلام طلبك!', 'Order Received!')}
        </h1>
        <p className="text-[#7B3FA0] dark:text-[#B89AC4] mb-8">
          {t('سيتم التواصل معك قريباً عبر واتساب لتأكيد الطلب', 'We will contact you via WhatsApp shortly to confirm')}
        </p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105">
          {t('العودة للرئيسية', 'Back to Home')}
        </button>
      </div>
    </div>
  );
}

function ProductRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('store_products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setProduct(data as Product);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] dark:bg-[#1A1025] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#7B3FA0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    navigate('/');
    return null;
  }

  return <ProductPage product={product} onBack={() => navigate('/')} />;
}

function CheckoutRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('store_products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setProduct(data as Product);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] dark:bg-[#1A1025] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#7B3FA0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    navigate('/');
    return null;
  }

  return (
    <CheckoutPage
      product={product}
      onBack={() => navigate(`/product/${product.id}`)}
      onSuccess={() => navigate('/success')}
    />
  );
}

function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('mlr-admin') === 'true');
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const hash = location.hash.toLowerCase();
    if (path.includes('admin') || hash.includes('admin')) {
      if (!isAdmin) {
        // stay on login
      }
    }
  }, [location, isAdmin]);

  if (!isAdmin) return <AdminLogin onLogin={() => setIsAdmin(true)} />;
  return <AdminDashboard onLogout={() => setIsAdmin(false)} />;
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.toLowerCase().includes('admin') ||
    location.hash.toLowerCase().includes('admin');

  if (isAdminRoute) {
    return <AdminRoute />;
  }

  return (
    <div className="pt-[60px]">
      <Header />
      <Routes>
        <Route path="/" element={<HomePageWrapper />} />
        <Route path="/product/:id" element={<ProductRoute />} />
        <Route path="/checkout/:id" element={<CheckoutRoute />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </div>
  );
}

function HomePageWrapper() {
  const navigate = useNavigate();
  return (
    <HomePage
      onProductClick={(p) => navigate(`/product/${p.id}`)}
      onCheckout={(p) => navigate(`/checkout/${p.id}`)}
    />
  );
}

export default function App() {
  return (
    <AppProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SettingsProvider>
    </AppProvider>
  );
}
