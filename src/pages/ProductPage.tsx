import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import type { Product } from '@/lib/store';
import { productName, productDescription, formatPrice } from '@/lib/store';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

interface Props {
  product: Product;
  onBack: () => void;
}

export default function ProductPage({ product, onBack }: Props) {
  const { lang, t } = useApp();
  const navigate = useNavigate();
  const gallery = product.gallery_urls.length > 0 ? product.gallery_urls : [product.image_url];
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % gallery.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + gallery.length) % gallery.length);

  return (
    <div className="min-h-screen bg-[#FBF7F0] dark:bg-[#1A1025] text-[#2D1B3D] dark:text-[#F5EDE8] transition-colors">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#7B3FA0] dark:text-[#B89AC4] hover:text-[#D6336C] transition-colors mb-6 font-medium"
        >
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          {t('العودة للكتب', 'Back to Books')}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-purple-50 dark:bg-[#2D1B3D]">
              <img
                src={gallery[currentImage]}
                alt={productName(product, lang)}
                className="w-full h-full object-cover"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 flex items-center justify-center shadow-lg transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 flex items-center justify-center shadow-lg transition-all"
                  >
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {gallery.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImage ? 'border-[#7B3FA0] scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-[#3D1B5E] dark:text-[#E8D5E8] mb-3">
              {productName(product, lang)}
            </h1>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-[#D6336C]">{formatPrice(product.price, lang)}</span>
              {product.old_price && (
                <span className="text-xl text-gray-400 line-through">{formatPrice(product.old_price, lang)}</span>
              )}
            </div>

            <button
              onClick={() => navigate(`/checkout/${product.id}`)}
              className="w-full py-4 bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] hover:from-[#6B2F90] hover:to-[#C0295B] text-white rounded-xl font-bold text-lg shadow-lg transition-all hover:shadow-2xl flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {t('إتمام الطلب', 'Checkout')}
            </button>

            <div className="mt-8 pt-8 border-t border-purple-100 dark:border-purple-900/30">
              <h2 className="text-xl font-bold mb-3 text-[#3D1B5E] dark:text-[#E8D5E8]">
                {t('الوصف والتفاصيل', 'Description & Details')}
              </h2>
              <p className="text-[#4A3A5A] dark:text-[#C4B0CC] leading-relaxed whitespace-pre-line">
                {productDescription(product, lang)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
