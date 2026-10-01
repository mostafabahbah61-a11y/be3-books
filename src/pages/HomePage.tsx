import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/store';
import { productName, formatPrice } from '@/lib/store';
import { ArrowUp, ShoppingCart, Facebook, Instagram, MessageCircle } from 'lucide-react';

interface Props {
  onProductClick: (p: Product) => void;
  onCheckout: (p: Product) => void;
}

export default function HomePage({ onProductClick, onCheckout }: Props) {
  const { lang, t } = useApp();
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const siteName = lang === 'ar' ? settings.site_name_ar : settings.site_name_en;
  const subtitle = lang === 'ar' ? settings.hero_subtitle_ar : settings.hero_subtitle_en;
  const footerText = lang === 'ar' ? settings.footer_text_ar : settings.footer_text_en;
  const waLink = `https://wa.me/${settings.whatsapp_number}`;

  useEffect(() => {
    supabase
      .from('store_products')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data) setProducts(data as Product[]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const submitFeedback = async () => {
    setFeedbackError('');
    if (feedback.trim().length < 2) {
      setFeedbackError(t('من فضلك اكتب رأيك', 'Please write your feedback'));
      return;
    }
    const { error } = await supabase.from('store_feedback').insert({ message: feedback.trim() });
    if (error) {
      setFeedbackError(t('حدث خطأ، حاول مرة أخرى', 'An error occurred, try again'));
      return;
    }
    setFeedback('');
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] dark:bg-[#1A1025] text-[#2D1B3D] dark:text-[#F5EDE8] transition-colors">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#3D1B5E] via-[#5B2A86] to-[#7B3FA0] dark:from-[#1A0F2E] dark:via-[#2D1B3D] dark:to-[#3D1B5E]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 70%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <img src="/images/logo_(1).png" alt={siteName} className="w-28 h-28 mx-auto mb-6 rounded-2xl shadow-2xl object-cover ring-4 ring-white/20" />
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            {siteName}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {subtitle}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a href="#products" className="px-8 py-3 bg-[#D6336C] hover:bg-[#C0295B] text-white rounded-full font-semibold shadow-lg transition-all hover:scale-105">
              {t('تصفح الكتب', 'Browse Books')}
            </a>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold border border-white/30 transition-all hover:scale-105 backdrop-blur-sm">
              {t('تواصل معنا', 'Contact Us')}
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FBF7F0] dark:from-[#1A1025] to-transparent" />
      </section>

      {/* Products */}
      <section id="products" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-2 text-[#3D1B5E] dark:text-[#E8D5E8]">
          {t('كتبنا', 'Our Books')}
        </h2>
        <p className="text-center text-[#7B3FA0] dark:text-[#B89AC4] mb-12">
          {t('اختر المستوى المناسب لطفلك', 'Choose the right level for your child')}
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#7B3FA0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => onProductClick(p)}
                className="group bg-white dark:bg-[#2D1B3D] rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-purple-100 dark:border-purple-900/30 hover:-translate-y-1"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-purple-50 dark:bg-[#1A1025]">
                  <img
                    src={p.image_url}
                    alt={productName(p, lang)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {p.old_price && (
                    <div className="absolute top-3 ltr:right-3 rtl:left-3 bg-[#D6336C] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      {t('خصم', 'Sale')} {Math.round((1 - p.price / p.old_price) * 100)}%
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-[#3D1B5E] dark:text-[#E8D5E8] mb-1">
                    {productName(p, lang)}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-[#D6336C]">{formatPrice(p.price, lang)}</span>
                    {p.old_price && (
                      <span className="text-sm text-gray-400 line-through">{formatPrice(p.old_price, lang)}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onProductClick(p); }}
                    className="w-full py-3 bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] hover:from-[#6B2F90] hover:to-[#C0295B] text-white rounded-xl font-semibold shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {t('شراء الآن', 'Buy Now')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feedback */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-2 text-[#3D1B5E] dark:text-[#E8D5E8]">
          {t('رأيك يهمنا', 'Your Opinion Matters')}
        </h2>
        <p className="text-center text-[#7B3FA0] dark:text-[#B89AC4] mb-6">
          {t('شاركنا تجربتك واقتراحاتك', 'Share your experience and suggestions')}
        </p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder={t('اكتب رأيك هنا...', 'Write your feedback here...')}
          className="w-full p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#2D1B3D] text-[#2D1B3D] dark:text-[#F5EDE8] focus:ring-2 focus:ring-[#7B3FA0] focus:border-transparent outline-none resize-none transition-all"
        />
        {feedbackError && <p className="text-red-500 text-sm mt-2">{feedbackError}</p>}
        {feedbackSent && <p className="text-green-600 text-sm mt-2">{t('شكرا لك على رأيك!', 'Thank you for your feedback!')}</p>}
        <button
          onClick={submitFeedback}
          className="mt-4 w-full py-3 bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
        >
          {t('إرسال', 'Submit')}
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-[#3D1B5E] dark:bg-[#1A0F2E] text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/images/logo_(1).png" alt={siteName} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <div className="font-bold text-lg">{siteName}</div>
                <div className="text-white/60 text-sm">{footerText}</div>
              </div>
            </div>
            <div className="flex gap-4">
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-green-500 flex items-center justify-center transition-all hover:scale-110">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-blue-600 flex items-center justify-center transition-all hover:scale-110">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={settings.instagram_url || '#'} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 hover:bg-pink-500 flex items-center justify-center transition-all hover:scale-110">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/50 text-sm">
            © 2026 {siteName} — {t('جميع الحقوق محفوظة', 'All rights reserved')}
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 ltr:right-6 rtl:left-6 z-40 w-14 h-14 bg-[#25D366] hover:bg-[#1FB855] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 ltr:left-6 rtl:right-6 z-40 w-12 h-12 bg-[#7B3FA0] hover:bg-[#D6336C] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
