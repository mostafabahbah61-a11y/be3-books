import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase';
import type { Product, DiscountSettings } from '@/lib/store';
import { productName, formatPrice, GOVERNORATES, governorateName, calculateDiscount } from '@/lib/store';
import { ChevronLeft, Loader2, MessageCircle } from 'lucide-react';

interface Props {
  product: Product;
  onBack: () => void;
  onSuccess: () => void;
}

export default function CheckoutPage({ product, onBack, onSuccess }: Props) {
  const { lang, t } = useApp();
  const { settings } = useSettings();
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [governorateIdx, setGovernorateIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [discountSettings, setDiscountSettings] = useState<DiscountSettings>({ id: 1, min_quantity: 2, discount_per_book: 10 });

  useEffect(() => {
    supabase.from('public_discount_settings_view').select('*').limit(1).then(({ data }) => {
      if (data && data.length > 0) setDiscountSettings(data[0] as DiscountSettings);
    });
  }, []);

  const governorate = GOVERNORATES[governorateIdx];
  const discount = useMemo(
    () => calculateDiscount(quantity, product.discount_enabled, discountSettings.min_quantity, discountSettings.discount_per_book),
    [quantity, product.discount_enabled, discountSettings]
  );
  const subtotal = product.price * quantity;
  const deliveryFee = governorate.fee;
  const total = subtotal - discount + deliveryFee;

  const whatsappNumber = settings.whatsapp_number;

  const handleSubmit = async () => {
    setError('');
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError(t('من فضلك املأ جميع الحقول', 'Please fill in all fields'));
      return;
    }
    if (!/^\d{8,}$/.test(phone.replace(/\s/g, ''))) {
      setError(t('رقم التليفون غير صحيح', 'Invalid phone number'));
      return;
    }
    setSubmitting(true);

    const orderData = {
      product_id: product.id,
      product_name: productName(product, lang),
      quantity,
      unit_price: product.price,
      discount,
      delivery_fee: deliveryFee,
      total,
      customer_name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      governorate: governorateName(governorate, lang),
    };

    const { error: dbError } = await supabase.from('store_orders').insert(orderData);
    if (dbError) {
      setError(t('حدث خطأ، حاول مرة أخرى', 'An error occurred, try again'));
      setSubmitting(false);
      return;
    }

    const now = new Date().toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB');
    const msg =
      `🛒 *My Little Reader — ${t('طلب جديد', 'New Order')}*\n` +
      `${t('التاريخ', 'Date')}: ${now}\n` +
      `${t('المنتج', 'Product')}: ${productName(product, lang)}\n` +
      `${t('الكمية', 'Quantity')}: ${quantity}\n` +
      `${t('سعر الوحدة', 'Unit Price')}: ${formatPrice(product.price, lang)}\n` +
      `${t('الخصم', 'Discount')}: ${formatPrice(discount, lang)}\n` +
      `${t('التوصيل', 'Delivery')} (${governorateName(governorate, lang)}): ${formatPrice(deliveryFee, lang)}\n` +
      `${t('الإجمالي', 'Total')}: ${formatPrice(total, lang)}\n\n` +
      `${t('الاسم', 'Name')}: ${name.trim()}\n` +
      `${t('التليفون', 'Phone')}: ${phone.trim()}\n` +
      `${t('العنوان', 'Address')}: ${address.trim()}\n` +
      `${t('المحافظة', 'Governorate')}: ${governorateName(governorate, lang)}`;

    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    setSubmitting(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] dark:bg-[#1A1025] text-[#2D1B3D] dark:text-[#F5EDE8] transition-colors">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#7B3FA0] dark:text-[#B89AC4] hover:text-[#D6336C] transition-colors mb-6 font-medium"
        >
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          {t('رجوع', 'Back')}
        </button>

        <h1 className="text-3xl font-bold mb-8 text-[#3D1B5E] dark:text-[#E8D5E8]">
          {t('إتمام الطلب', 'Checkout')}
        </h1>

        {/* Order Summary */}
        <div className="bg-white dark:bg-[#2D1B3D] rounded-2xl shadow-md p-6 mb-6 border border-purple-100 dark:border-purple-900/30">
          <h2 className="font-bold text-lg mb-4 text-[#3D1B5E] dark:text-[#E8D5E8]">
            {t('ملخص الطلب', 'Order Summary')}
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <img src={product.image_url} alt={productName(product, lang)} className="w-16 h-20 object-cover rounded-lg" />
            <div>
              <div className="font-semibold">{productName(product, lang)}</div>
              <div className="text-[#D6336C] font-bold">{formatPrice(product.price, lang)}</div>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#4A3A5A] dark:text-[#C4B0CC]">{t('الكمية', 'Quantity')}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 hover:bg-[#7B3FA0] hover:text-white text-[#3D1B5E] dark:text-[#E8D5E8] font-bold flex items-center justify-center transition-all"
              >
                −
              </button>
              <span className="w-12 text-center font-bold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 hover:bg-[#7B3FA0] hover:text-white text-[#3D1B3D] dark:text-[#E8D5E8] font-bold flex items-center justify-center transition-all"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-purple-100 dark:border-purple-900/30">
            <div className="flex justify-between text-sm">
              <span className="text-[#4A3A5A] dark:text-[#C4B0CC]">{t('المجموع الفرعي', 'Subtotal')}</span>
              <span>{formatPrice(subtotal, lang)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{t('الخصم', 'Discount')}</span>
                <span>−{formatPrice(discount, lang)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#4A3A5A] dark:text-[#C4B0CC]">{t('التوصيل', 'Delivery')}</span>
              <span>{formatPrice(deliveryFee, lang)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-purple-100 dark:border-purple-900/30">
              <span>{t('الإجمالي', 'Total')}</span>
              <div className="text-right">
                <div className="text-[#D6336C]">{formatPrice(total, lang)}</div>
                <div className="text-[#D6336C] text-sm font-normal">
                  ({t('الدفع عند الاستلام', 'Cash on Delivery')})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Form */}
        <div className="bg-white dark:bg-[#2D1B3D] rounded-2xl shadow-md p-6 border border-purple-100 dark:border-purple-900/30">
          <h2 className="font-bold text-lg mb-4 text-[#3D1B5E] dark:text-[#E8D5E8]">
            {t('بيانات العميل', 'Customer Information')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[#4A3A5A] dark:text-[#C4B0CC]">
                {t('الاسم', 'Name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('اكتب اسمك', 'Enter your name')}
                className="w-full px-4 py-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] focus:ring-2 focus:ring-[#7B3FA0] focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[#4A3A5A] dark:text-[#C4B0CC]">
                {t('رقم التليفون', 'Phone Number')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] focus:ring-2 focus:ring-[#7B3FA0] focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[#4A3A5A] dark:text-[#C4B0CC]">
                {t('العنوان', 'Address')}
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder={t('اكتب عنوانك بالتفصيل', 'Enter your detailed address')}
                className="w-full px-4 py-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] focus:ring-2 focus:ring-[#7B3FA0] focus:border-transparent outline-none resize-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[#4A3A5A] dark:text-[#C4B0CC]">
                {t('المحافظة', 'Governorate')}
              </label>
              <select
                value={governorateIdx}
                onChange={(e) => setGovernorateIdx(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] focus:ring-2 focus:ring-[#7B3FA0] focus:border-transparent outline-none transition-all"
              >
                {GOVERNORATES.map((g, idx) => (
                  <option key={g.en} value={idx}>
                    {governorateName(g, lang)} — {g.fee} {t('ج.م', 'EGP')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full mt-6 py-4 bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] hover:from-[#6B2F90] hover:to-[#C0295B] disabled:opacity-50 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                {t('إتمام الطلب عبر واتساب', 'Confirm Order via WhatsApp')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
