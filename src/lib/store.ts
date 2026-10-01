export type Lang = 'ar' | 'en';

export type Theme = 'light' | 'dark';

export interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  price: number;
  old_price: number | null;
  image_url: string;
  gallery_urls: string[];
  description_ar: string;
  description_en: string;
  active: boolean;
  sort_order: number;
  discount_enabled: boolean;
}

export interface DiscountSettings {
  id: number;
  min_quantity: number;
  discount_per_book: number;
}

export interface Order {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  delivery_fee: number;
  total: number;
  customer_name: string;
  phone: string;
  address: string;
  governorate: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  message: string;
  created_at: string;
}

export interface SiteSettings {
  id: number;
  site_name_ar: string;
  site_name_en: string;
  hero_subtitle_ar: string;
  hero_subtitle_en: string;
  whatsapp_number: string;
  facebook_url: string;
  instagram_url: string;
  footer_text_ar: string;
  footer_text_en: string;
  admin_password?: string;
}

export const GOVERNORATES: { ar: string; en: string; fee: number }[] = [
  { ar: 'القاهرة', en: 'Cairo', fee: 85 },
  { ar: 'الجيزة', en: 'Giza', fee: 85 },
  { ar: 'القليوبية', en: 'Qalyubia', fee: 85 },
  { ar: 'بورسعيد', en: 'Port Said', fee: 95 },
  { ar: 'الإسماعيلية', en: 'Ismailia', fee: 95 },
  { ar: 'السويس', en: 'Suez', fee: 95 },
  { ar: 'الإسكندرية', en: 'Alexandria', fee: 95 },
  { ar: 'الدقهلية', en: 'Dakahlia', fee: 95 },
  { ar: 'الشرقية', en: 'Sharqia', fee: 95 },
  { ar: 'البحيرة', en: 'Beheira', fee: 95 },
  { ar: 'الغربية', en: 'Gharbia', fee: 95 },
  { ar: 'كفر الشيخ', en: 'Kafr El Sheikh', fee: 95 },
  { ar: 'دمياط', en: 'Damietta', fee: 95 },
  { ar: 'المنوفية', en: 'Monufia', fee: 95 },
  { ar: 'بني سويف', en: 'Beni Suef', fee: 85 },
  { ar: 'الفيوم', en: 'Faiyum', fee: 65 },
  { ar: 'المنيا', en: 'Minya', fee: 85 },
  { ar: 'أسيوط', en: 'Asyut', fee: 85 },
  { ar: 'سوهاج', en: 'Sohag', fee: 100 },
  { ar: 'قنا', en: 'Qena', fee: 100 },
  { ar: 'الأقصر', en: 'Luxor', fee: 100 },
  { ar: 'أسوان', en: 'Aswan', fee: 100 },
  { ar: 'مطروح', en: 'Matrouh', fee: 125 },
  { ar: 'الوادي الجديد', en: 'New Valley', fee: 125 },
  { ar: 'البحر الأحمر', en: 'Red Sea', fee: 95 },
  { ar: 'شمال سيناء', en: 'North Sinai', fee: 125 },
  { ar: 'جنوب سيناء', en: 'South Sinai', fee: 125 },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  site_name_ar: 'قارئي الصغير',
  site_name_en: 'My Little Reader',
  hero_subtitle_ar: 'رحلة طفلك نحو القراءة تبدأ من هنا — كتب مصممة بحب لكل مستوى',
  hero_subtitle_en: "Your child's reading journey starts here — books crafted with love for every level",
  whatsapp_number: '201156617653',
  facebook_url: 'https://www.facebook.com/MyLittleReaders/',
  instagram_url: '',
  footer_text_ar: 'كتب تعليمية للأطفال',
  footer_text_en: 'Educational books for children',
  admin_password: 'admin',
};

export function productName(p: Product, lang: Lang): string {
  return lang === 'ar' ? p.name_ar : p.name_en;
}

export function productDescription(p: Product, lang: Lang): string {
  return lang === 'ar' ? p.description_ar : p.description_en;
}

export function governorateName(g: { ar: string; en: string }, lang: Lang): string {
  return lang === 'ar' ? g.ar : g.en;
}

export function formatPrice(price: number, lang: Lang): string {
  return `${price} ${lang === 'ar' ? 'ج.م' : 'EGP'}`;
}

export function calculateDiscount(quantity: number, discountEnabled: boolean, minQuantity: number = 2, discountPerBook: number = 10): number {
  if (!discountEnabled || quantity < minQuantity) return 0;
  return (quantity - (minQuantity - 1)) * discountPerBook;
}
