export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: string[];
  role: 'admin' | 'customer';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  categoryId: string;
  images: string[];
  variants?: {
    flavors: {
      name: string;
      image?: string;
      sizes: { name: string; price: number }[];
    }[];
    accessories?: string[];
  };
  tags?: string[];
  isBestSeller?: boolean;
  isFastDelivery?: boolean;
  stock?: number;
  views?: number;
  orderCount?: number;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  link?: string;
  isActive: boolean;
  order: number;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  startDate: any;
  endDate: any;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  productIds: string[];
  isActive: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: any;
  endDate: any;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface ProductView {
  id: string;
  productId: string;
  timestamp: any;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  variant: {
    size: string;
    flavor: string;
    accessories?: string[];
  };
  message?: string;
  selected?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    quantity: number;
    variant: any;
    price: number;
    message?: string;
  }[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivering' | 'completed' | 'cancelled';
  deliveryTime: any; // Timestamp
  paymentMethod: 'COD' | 'MOMO' | 'VNPAY';
  shippingAddress: string;
  contactPhone: string;
  contactName: string;
  createdAt: any; // Timestamp
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: any; // Timestamp
}

export interface CustomCakeRequest {
  id: string;
  userId: string;
  contactName: string;
  contactPhone: string;
  email?: string;
  description: string;
  referenceImages?: string[];
  deliveryTime: any; // Timestamp
  status: 'pending' | 'reviewed' | 'quoted' | 'confirmed' | 'cancelled';
  quotePrice?: number;
  createdAt: any; // Timestamp
}

export interface ImportRecord {
  id?: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
  importDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: any;
}

export interface ExpenseRecord {
  id?: string;
  name: string;
  category: string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: any;
}
