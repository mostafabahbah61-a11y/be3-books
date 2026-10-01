import { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase';
import { uploadProductImage } from '@/lib/upload';
import type { Product, Order, Feedback, SiteSettings, DiscountSettings } from '@/lib/store';
import { productName, formatPrice } from '@/lib/store';
import { Package, MessageSquare, BookOpen, LogOut, Plus, Trash2, Save, Loader2, Settings, Upload, X, KeyRound, Percent } from 'lucide-react';

interface Props {
  onLogout: () => void;
}

type Tab = 'products' | 'orders' | 'feedback' | 'discounts' | 'settings';

const emptyProduct = (): Product => ({
  id: '',
  name_ar: '',
  name_en: '',
  price: 0,
  old_price: null,
  image_url: '',
  gallery_urls: [],
  description_ar: '',
  description_en: '',
  active: true,
  sort_order: 0,
  discount_enabled: true,
});

export default function AdminDashboard({ onLogout }: Props) {
  const { lang, t } = useApp();
  const { settings, reload: reloadSettings } = useSettings();
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSettings, setEditSettings] = useState<SiteSettings | null>(null);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [discountSettings, setDiscountSettings] = useState<DiscountSettings>({ id: 1, min_quantity: 2, discount_per_book: 10 });
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountMsg, setDiscountMsg] = useState('');
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const adminPw = () => sessionStorage.getItem('mlr-admin-pw') || '';

  const loadAll = async () => {
    setLoading(true);
    const pw = adminPw();
    const [prodRes, orderRes, fbRes, discSetRes] = await Promise.all([
      supabase.rpc('admin_get_products', { p_password: pw }),
      supabase.rpc('admin_get_orders', { p_password: pw }),
      supabase.rpc('admin_get_feedback', { p_password: pw }),
      supabase.rpc('admin_get_discount_settings', { p_password: pw }),
    ]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
    if (orderRes.data) setOrders(orderRes.data as Order[]);
    if (fbRes.data) setFeedback(fbRes.data as Feedback[]);
    if (discSetRes.data && discSetRes.data.length > 0) setDiscountSettings(discSetRes.data[0] as DiscountSettings);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const saveProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    const newId = editingProduct.id || `prod-${Date.now()}`;
    await supabase.rpc('admin_save_product', {
      p_password: adminPw(),
      p_id: isAddingNew ? newId : editingProduct.id,
      p_name_ar: editingProduct.name_ar,
      p_name_en: editingProduct.name_en,
      p_price: editingProduct.price,
      p_old_price: editingProduct.old_price,
      p_image_url: editingProduct.image_url,
      p_gallery_urls: editingProduct.gallery_urls,
      p_description_ar: editingProduct.description_ar,
      p_description_en: editingProduct.description_en,
      p_active: editingProduct.active,
      p_sort_order: editingProduct.sort_order,
      p_discount_enabled: editingProduct.discount_enabled,
      p_is_new: isAddingNew,
    });
    setIsAddingNew(false);
    setEditingProduct(null);
    setSaving(false);
    loadAll();
  };

  const deleteProduct = async (id: string) => {
    await supabase.rpc('admin_delete_product', { p_password: adminPw(), p_id: id });
    loadAll();
  };

  const deleteOrder = async (id: string) => {
    await supabase.rpc('admin_delete_order', { p_password: adminPw(), p_id: id });
    loadAll();
  };

  const deleteFeedback = async (id: string) => {
    await supabase.rpc('admin_delete_feedback', { p_password: adminPw(), p_id: id });
    loadAll();
  };

  const saveSettings = async () => {
    if (!editSettings) return;
    setSaving(true);
    await supabase.rpc('admin_update_settings', {
      p_password: adminPw(),
      p_site_name_ar: editSettings.site_name_ar,
      p_site_name_en: editSettings.site_name_en,
      p_hero_subtitle_ar: editSettings.hero_subtitle_ar,
      p_hero_subtitle_en: editSettings.hero_subtitle_en,
      p_whatsapp_number: editSettings.whatsapp_number,
      p_facebook_url: editSettings.facebook_url,
      p_instagram_url: editSettings.instagram_url,
      p_footer_text_ar: editSettings.footer_text_ar,
      p_footer_text_en: editSettings.footer_text_en,
    });
    setSaving(false);
    setEditSettings(null);
    reloadSettings();
  };

  const handleMainUpload = async (file: File | undefined) => {
    if (!file || !editingProduct) return;
    setUploadingMain(true);
    const url = await uploadProductImage(file);
    if (url) setEditingProduct({ ...editingProduct, image_url: url });
    setUploadingMain(false);
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || !editingProduct) return;
    setUploadingGallery(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadProductImage(file);
      if (url) urls.push(url);
    }
    setEditingProduct({ ...editingProduct, gallery_urls: [...editingProduct.gallery_urls, ...urls] });
    setUploadingGallery(false);
  };

  const removeGalleryImage = (idx: number) => {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, gallery_urls: editingProduct.gallery_urls.filter((_, i) => i !== idx) });
  };

  const changePassword = async () => {
    setPasswordError('');
    setPasswordMsg('');
    if (newPassword.length < 3) {
      setPasswordError(t('كلمة المرور يجب أن تكون 3 أحرف على الأقل', 'Password must be at least 3 characters'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('كلمتا المرور غير متطابقتين', 'Passwords do not match'));
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.rpc('admin_change_password', { p_password: adminPw(), p_new_password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordError(t('حدث خطأ، حاول مرة أخرى', 'An error occurred, try again'));
      return;
    }
    sessionStorage.setItem('mlr-admin-pw', newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg(t('تم تغيير كلمة المرور بنجاح', 'Password changed successfully'));
  };

  const saveDiscountSettings = async () => {
    setSavingDiscount(true);
    setDiscountMsg('');
    await supabase.rpc('admin_update_discount_settings', {
      p_password: adminPw(),
      p_min_quantity: discountSettings.min_quantity,
      p_discount_per_book: discountSettings.discount_per_book,
    });
    setSavingDiscount(false);
    setDiscountMsg('تم حفظ إعدادات الخصم بنجاح');
    setTimeout(() => setDiscountMsg(''), 3000);
  };

  const toggleProductDiscount = async (productId: string, enabled: boolean) => {
    await supabase.rpc('admin_toggle_product_discount', { p_password: adminPw(), p_product_id: productId, p_enabled: enabled });
    loadAll();
  };

  const toggleAllProductsDiscount = async (enabled: boolean) => {
    setSavingDiscount(true);
    await supabase.rpc('admin_toggle_all_products_discount', { p_password: adminPw(), p_enabled: enabled });
    setSavingDiscount(false);
    loadAll();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mlr-admin');
    sessionStorage.removeItem('mlr-admin-pw');
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] dark:bg-[#1A1025] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#7B3FA0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F0] dark:bg-[#1A1025] text-[#2D1B3D] dark:text-[#F5EDE8]">
      {/* Header */}
      <div className="bg-[#3D1B5E] dark:bg-[#1A0F2E] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/images/logo_(1).png" alt="" className="w-10 h-10 rounded-lg object-cover" />
          <span className="font-bold text-lg">My Little Reader — {t('الإدارة', 'Admin')}</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
          <LogOut className="w-4 h-4" />
          {t('خروج', 'Logout')}
        </button>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 border-b border-purple-100 dark:border-purple-900/30 overflow-x-auto">
          {([
            { id: 'products' as Tab, label: t('المنتجات', 'Products'), icon: BookOpen },
            { id: 'orders' as Tab, label: t('الطلبات', 'Orders'), icon: Package },
            { id: 'feedback' as Tab, label: t('التقييمات', 'Feedback'), icon: MessageSquare },
            { id: 'discounts' as Tab, label: t('التخفيضات', 'Discounts'), icon: Percent },
            { id: 'settings' as Tab, label: t('الإعدادات', 'Settings'), icon: Settings },
          ]).map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex items-center gap-2 px-5 py-3 font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${tab === tabId ? 'border-[#D6336C] text-[#D6336C]' : 'border-transparent text-[#7B3FA0] dark:text-[#B89AC4] hover:text-[#D6336C]'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {tabId === 'orders' && orders.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-[#D6336C] text-white text-xs">{orders.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="space-y-4">
            <button
              onClick={() => { setEditingProduct(emptyProduct()); setIsAddingNew(true); }}
              className="w-full py-3 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-xl text-[#7B3FA0] dark:text-[#B89AC4] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('إضافة منتج جديد', 'Add New Product')}
            </button>
            {products.map((p) => (
              <div key={p.id} className="bg-white dark:bg-[#2D1B3D] rounded-xl shadow-sm p-4 flex items-center gap-4 border border-purple-100 dark:border-purple-900/30">
                <img src={p.image_url} alt="" className="w-16 h-20 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{productName(p, lang)}</div>
                  <div className="text-sm text-[#D6336C] font-semibold">{formatPrice(p.price, lang)}</div>
                  {p.old_price && <div className="text-xs text-gray-400 line-through">{formatPrice(p.old_price, lang)}</div>}
                </div>
                <button
                  onClick={() => { setEditingProduct(p); setIsAddingNew(false); }}
                  className="px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 hover:bg-[#7B3FA0] hover:text-white text-[#3D1B5E] dark:text-[#E8D5E8] font-medium transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {t('تعديل', 'Edit')}
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-center text-[#7B3FA0] dark:text-[#B89AC4] py-12">{t('لا توجد طلبات بعد', 'No orders yet')}</p>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="bg-white dark:bg-[#2D1B3D] rounded-xl shadow-sm p-4 border border-purple-100 dark:border-purple-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold">{o.product_name} × {o.quantity}</div>
                    <button onClick={() => deleteOrder(o.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-[#4A3A5A] dark:text-[#C4B0CC] space-y-1">
                    <div>{t('الاسم', 'Name')}: {o.customer_name}</div>
                    <div>{t('التليفون', 'Phone')}: {o.phone}</div>
                    <div>{t('العنوان', 'Address')}: {o.address}</div>
                    <div>{t('المحافظة', 'Governorate')}: {o.governorate}</div>
                    <div className="flex gap-4 pt-1 flex-wrap">
                      <span>{t('الخصم', 'Discount')}: {formatPrice(o.discount, lang)}</span>
                      <span>{t('التوصيل', 'Delivery')}: {formatPrice(o.delivery_fee, lang)}</span>
                      <span className="font-bold text-[#D6336C]">{t('الإجمالي', 'Total')}: {formatPrice(o.total, lang)}</span>
                    </div>
                    <div className="text-xs text-gray-400 pt-1">
                      {new Date(o.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {tab === 'feedback' && (
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <p className="text-center text-[#7B3FA0] dark:text-[#B89AC4] py-12">{t('لا توجد تقييمات بعد', 'No feedback yet')}</p>
            ) : (
              feedback.map((f) => (
                <div key={f.id} className="bg-white dark:bg-[#2D1B3D] rounded-xl shadow-sm p-4 border border-purple-100 dark:border-purple-900/30">
                  <div className="flex justify-between items-start">
                    <p className="flex-1">{f.message}</p>
                    <button onClick={() => deleteFeedback(f.id)} className="text-red-400 hover:text-red-600 transition-colors ml-2 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(f.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Discounts Tab */}
        {tab === 'discounts' && (
          <div className="space-y-6">
            {/* Discount formula explanation */}
            <div className="bg-white dark:bg-[#2D1B3D] rounded-xl shadow-sm p-6 border border-purple-100 dark:border-purple-900/30">
              <h3 className="text-lg font-bold text-[#3D1B5E] dark:text-[#E8D5E8] flex items-center gap-2 mb-4">
                <Percent className="w-5 h-5" />
                نظام الخصومات
              </h3>
              <div className="bg-[#FBF7F0] dark:bg-[#1A1025] rounded-lg p-4 border border-purple-100 dark:border-purple-900/20 mb-4">
                <p className="text-sm text-[#4A3A5A] dark:text-[#C4B0CC] leading-relaxed mb-3">
                  الخصم يبدأ من كتاب معين وبيزيد مبلغ ثابت مع كل كتاب زيادة. عدّل الأرقام تحت واضغط حفظ:
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-sm text-[#4A3A5A] dark:text-[#C4B0CC]">الخصم يبدأ من</span>
                  <input
                    type="number"
                    min={2}
                    value={discountSettings.min_quantity}
                    onChange={(e) => setDiscountSettings({ ...discountSettings, min_quantity: Math.max(2, Number(e.target.value)) })}
                    className="w-20 px-2 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#2D1B3D] text-center outline-none focus:ring-2 focus:ring-[#7B3FA0]"
                  />
                  <span className="text-sm text-[#4A3A5A] dark:text-[#C4B0CC]">كتب، بخصم</span>
                  <input
                    type="number"
                    min={1}
                    value={discountSettings.discount_per_book}
                    onChange={(e) => setDiscountSettings({ ...discountSettings, discount_per_book: Math.max(1, Number(e.target.value)) })}
                    className="w-20 px-2 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#2D1B3D] text-center outline-none focus:ring-2 focus:ring-[#7B3FA0]"
                  />
                  <span className="text-sm text-[#4A3A5A] dark:text-[#C4B0CC]">جنيه لكل كتاب زيادة</span>
                </div>
                <p className="text-xs text-[#7B3FA0] dark:text-[#B89AC4] mt-2">
                  المعادلة: الخصم = (عدد الكتب − {discountSettings.min_quantity - 1}) × {discountSettings.discount_per_book} جنيه
                </p>
                <button
                  onClick={saveDiscountSettings}
                  disabled={savingDiscount}
                  className="mt-3 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] text-white font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ الإعدادات
                </button>
                {discountMsg && <p className="text-green-600 text-sm mt-2">{discountMsg}</p>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {[2, 3, 4, 5, 10, 20].map((qty) => {
                  const d = (qty - (discountSettings.min_quantity - 1)) * discountSettings.discount_per_book;
                  return (
                    <div key={qty} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2 text-center">
                      <span className="font-bold text-[#3D1B5E] dark:text-[#E8D5E8]">{qty} كتاب</span>
                      <span className="block text-[#D6336C] font-bold">خصم {Math.max(0, d)} ج.م</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-product discount toggle */}
            <div className="bg-white dark:bg-[#2D1B3D] rounded-xl shadow-sm p-6 border border-purple-100 dark:border-purple-900/30">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-[#3D1B5E] dark:text-[#E8D5E8]">
                  تفعيل أو إلغاء الخصم لكل منتج
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAllProductsDiscount(true)}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-500 hover:text-white font-medium transition-all text-sm disabled:opacity-50"
                  >
                    تفعيل الكل
                  </button>
                  <button
                    onClick={() => toggleAllProductsDiscount(false)}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-500 hover:text-white font-medium transition-all text-sm disabled:opacity-50"
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#FBF7F0] dark:bg-[#1A1025] border border-purple-100 dark:border-purple-900/20">
                    <img src={p.image_url} alt="" className="w-10 h-12 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.name_ar}</div>
                      <div className="text-sm text-[#D6336C]">{p.price} ج.م</div>
                    </div>
                    <button
                      onClick={() => toggleProductDiscount(p.id, !p.discount_enabled)}
                      className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${p.discount_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${p.discount_enabled ? 'ltr:left-6 rtl:right-0.5' : 'ltr:left-0.5 rtl:right-6'}`} />
                    </button>
                    <span className={`text-sm font-medium ${p.discount_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {p.discount_enabled ? 'مفعّل' : 'ملغي'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#2D1B3D] rounded-xl shadow-sm p-6 border border-purple-100 dark:border-purple-900/30">
              <h3 className="text-lg font-bold mb-4 text-[#3D1B5E] dark:text-[#E8D5E8]">{t('إعدادات الموقع', 'Site Settings')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('اسم الموقع (عربي)', 'Site Name (Arabic)')}</label>
                  <input type="text" value={settings.site_name_ar} readOnly className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('اسم الموقع (إنجليزي)', 'Site Name (English)')}</label>
                  <input type="text" value={settings.site_name_en} readOnly className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('رقم واتساب', 'WhatsApp Number')}</label>
                  <input type="text" value={settings.whatsapp_number} readOnly className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('لينك فيسبوك', 'Facebook URL')}</label>
                  <input type="text" value={settings.facebook_url} readOnly className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('لينك إنستجرام', 'Instagram URL')}</label>
                  <input type="text" value={settings.instagram_url} readOnly className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none" />
                </div>
              </div>
              <button
                onClick={() => setEditSettings({ ...settings })}
                className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] text-white font-semibold shadow-md transition-all flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {t('تعديل الإعدادات', 'Edit Settings')}
              </button>
            </div>

            {/* Change Password Card */}
            <div className="bg-white dark:bg-[#2D1B3D] rounded-xl shadow-sm p-6 border border-purple-100 dark:border-purple-900/30 mt-4">
              <h3 className="text-lg font-bold mb-4 text-[#3D1B5E] dark:text-[#E8D5E8] flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                {t('تغيير كلمة المرور', 'Change Password')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('كلمة المرور الجديدة', 'New Password')}</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('كلمة المرور الجديدة', 'New Password')} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('تأكيد كلمة المرور', 'Confirm Password')}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('تأكيد كلمة المرور', 'Confirm Password')} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
                </div>
                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                {passwordMsg && <p className="text-green-600 text-sm">{passwordMsg}</p>}
                <button
                  onClick={changePassword}
                  disabled={savingPassword}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] text-white font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {t('حفظ كلمة المرور', 'Save Password')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setEditingProduct(null); setIsAddingNew(false); }}>
          <div className="bg-white dark:bg-[#2D1B3D] rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-[#3D1B5E] dark:text-[#E8D5E8]">
              {isAddingNew ? t('إضافة منتج جديد', 'Add New Product') : t('تعديل المنتج', 'Edit Product')}
            </h3>
            <div className="space-y-4">
              {isAddingNew && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('المعرّف', 'ID')}</label>
                  <input type="text" value={editingProduct.id} onChange={(e) => setEditingProduct({ ...editingProduct, id: e.target.value })} placeholder="level-1" className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{t('الاسم (عربي)', 'Name (Arabic)')}</label>
                <input type="text" value={editingProduct.name_ar} onChange={(e) => setEditingProduct({ ...editingProduct, name_ar: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('الاسم (إنجليزي)', 'Name (English)')}</label>
                <input type="text" value={editingProduct.name_en} onChange={(e) => setEditingProduct({ ...editingProduct, name_en: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('السعر', 'Price')}</label>
                  <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('السعر القديم', 'Old Price')}</label>
                  <input type="number" value={editingProduct.old_price ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, old_price: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
                </div>
              </div>

              {/* Main image upload */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('صورة الغلاف', 'Cover Image')}</label>
                {editingProduct.image_url && (
                  <img src={editingProduct.image_url} alt="" className="w-24 h-32 object-cover rounded-lg mb-2" />
                )}
                <input ref={mainInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleMainUpload(e.target.files?.[0])} />
                <button
                  type="button"
                  onClick={() => mainInputRef.current?.click()}
                  disabled={uploadingMain}
                  className="w-full py-2.5 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-lg text-[#7B3FA0] dark:text-[#B89AC4] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploadingMain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {t('رفع صورة', 'Upload Image')}
                </button>
              </div>

              {/* Gallery images upload */}
              <div>
                <label className="block text-sm font-medium mb-1">{t('صور المعرض', 'Gallery Images')}</label>
                {editingProduct.gallery_urls.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {editingProduct.gallery_urls.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGalleryUpload(e.target.files)} />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="w-full py-2.5 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-lg text-[#7B3FA0] dark:text-[#B89AC4] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {t('رفع صور المعرض', 'Upload Gallery Images')}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('الوصف (عربي)', 'Description (Arabic)')}</label>
                <textarea value={editingProduct.description_ar} onChange={(e) => setEditingProduct({ ...editingProduct, description_ar: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('الوصف (إنجليزي)', 'Description (English)')}</label>
                <textarea value={editingProduct.description_en} onChange={(e) => setEditingProduct({ ...editingProduct, description_en: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveProduct} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] text-white rounded-xl font-semibold shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('حفظ', 'Save')}
              </button>
              <button onClick={() => { setEditingProduct(null); setIsAddingNew(false); }} className="px-6 py-3 rounded-xl border border-purple-200 dark:border-purple-800 font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Settings Modal */}
      {editSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditSettings(null)}>
          <div className="bg-white dark:bg-[#2D1B3D] rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-[#3D1B5E] dark:text-[#E8D5E8]">{t('تعديل إعدادات الموقع', 'Edit Site Settings')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('اسم الموقع (عربي)', 'Site Name (Arabic)')}</label>
                <input type="text" value={editSettings.site_name_ar} onChange={(e) => setEditSettings({ ...editSettings, site_name_ar: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('اسم الموقع (إنجليزي)', 'Site Name (English)')}</label>
                <input type="text" value={editSettings.site_name_en} onChange={(e) => setEditSettings({ ...editSettings, site_name_en: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('العنوان الفرعي (عربي)', 'Subtitle (Arabic)')}</label>
                <textarea value={editSettings.hero_subtitle_ar} onChange={(e) => setEditSettings({ ...editSettings, hero_subtitle_ar: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('العنوان الفرعي (إنجليزي)', 'Subtitle (English)')}</label>
                <textarea value={editSettings.hero_subtitle_en} onChange={(e) => setEditSettings({ ...editSettings, hero_subtitle_en: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('رقم واتساب', 'WhatsApp Number')}</label>
                <input type="text" value={editSettings.whatsapp_number} onChange={(e) => setEditSettings({ ...editSettings, whatsapp_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('لينك فيسبوك', 'Facebook URL')}</label>
                <input type="text" value={editSettings.facebook_url} onChange={(e) => setEditSettings({ ...editSettings, facebook_url: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('لينك إنستجرام', 'Instagram URL')}</label>
                <input type="text" value={editSettings.instagram_url} onChange={(e) => setEditSettings({ ...editSettings, instagram_url: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('نص الفوتر (عربي)', 'Footer Text (Arabic)')}</label>
                <input type="text" value={editSettings.footer_text_ar} onChange={(e) => setEditSettings({ ...editSettings, footer_text_ar: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('نص الفوتر (إنجليزي)', 'Footer Text (English)')}</label>
                <input type="text" value={editSettings.footer_text_en} onChange={(e) => setEditSettings({ ...editSettings, footer_text_en: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-[#FBF7F0] dark:bg-[#1A1025] outline-none focus:ring-2 focus:ring-[#7B3FA0]" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveSettings} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-[#7B3FA0] to-[#D6336C] text-white rounded-xl font-semibold shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('حفظ', 'Save')}
              </button>
              <button onClick={() => setEditSettings(null)} className="px-6 py-3 rounded-xl border border-purple-200 dark:border-purple-800 font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
