
'use client';

export type UserRole = 'Usto' | 'Client';
export type IdentificationStatus = 'None' | 'Pending' | 'Verified' | 'Rejected' | 'Blocked';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  region?: string;
  profileImage?: string;
  balance: number;
  identificationStatus: IdentificationStatus;
  kycPhotos?: string[]; // [front, back, selfie]
  kycPaymentCheck?: string; // image of receipt
  kycSubmittedAt?: any;
  passportNumber?: string;
  isPremium?: boolean;
  isArtisanFeePaid?: boolean;
  warningCount?: number;
  isBlocked?: boolean;
  favorites?: string[];
  fcmTokens?: string[];
  lastActive?: any;
  createdAt: any;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | 'Payment' | 'Refund' | 'Verification';
  status: 'Pending' | 'Completed' | 'Failed';
  method: string;
  createdAt: any;
}

export interface Listing {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  title: string;
  category: string;
  description: string;
  images: string[];
  createdAt: any;
  isVip?: boolean;
  views: number;
}

export interface Chat {
  id: string;
  listingId: string;
  clientId: string;
  artisanId: string;
  lastMessage: string;
  lastSenderId: string;
  updatedAt: any;
  unreadCount: Record<string, number>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  isRead: boolean;
  type: 'text' | 'deal';
  dealId?: string;
}

export interface Deal {
  id: string;
  listingId: string;
  clientId: string;
  artisanId: string;
  title: string;
  price: number;
  fee: number;
  durationDays: number;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Confirmed' | 'Cancelled' | 'Expired';
  senderId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
  dealId: string;
}

export const VIP_PRICE = 20;
export const PREMIUM_PRICE = 100;
export const KYC_PRICE = 10;

export const ALL_REGIONS = [
  "Душанбе", "Бохтар", "Кӯлоб", "Хуҷанд", "Истаравшан", "Конибодом", "Панҷакент", 
  "Хоруғ", "Ваҳдат", "Ҳисор", "Турсунзода", "Рашт", "Данғара", "Ёвон"
];

export const ALL_CATEGORIES = [
  "Барномасоз", "Дӯзанда", "Дуредгар", "Сантехник", "Барқчӣ", "Меъмор", 
  "Ронанда", "Ошпаз", "Муаллим", "Табиб", "Сартарош", "Рангуборчӣ", 
  "Кафшергар", "Кондиционерсоз", "Автомеханик", "Дигар"
];

export function calculateFee(price: number): number {
  if (price < 100) return 5;
  if (price < 1000) return 20;
  return Math.floor(price * 0.05);
}
