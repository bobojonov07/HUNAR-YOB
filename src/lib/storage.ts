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
  isPremium?: boolean;
  favorites?: string[];
  fcmTokens?: string[];
  lastActive?: any;
  createdAt: any;
  warningCount: number;
  isBlocked: boolean;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  photos: string[]; 
  receipt: string;  
  status: IdentificationStatus;
  submittedAt: any;
  errorReason?: string;
}

export interface Complaint {
  id: string;
  reportedUserId: string;
  reporterUserId: string;
  reason: string;
  createdAt: any;
  status: 'Pending' | 'Resolved';
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

export const VIP_PRICE = 20;
export const KYC_PRICE = 10;
export const PREMIUM_PRICE = 50;

export const REGULAR_LISTING_LIMIT = 1;
export const PREMIUM_LISTING_LIMIT = 5;

export const REGULAR_CHAR_LIMIT = 1000;
export const PREMIUM_CHAR_LIMIT = 5000;

export const ALL_REGIONS = [
  "Душанбе", "Бохтар", "Кӯлоб", "Хуҷанд", "Истаравшан", "Конибодом", "Панҷакент", 
  "Хоруғ", "Ваҳдат", "Ҳисор", "Турсунзода", "Рашт", "Данғара", "Ёвон"
];

export const ALL_CATEGORIES = [
  "Барномасоз", "Дӯзанда", "Дуредгар", "Сантехник", "Барқчӣ", "Меъмор", 
  "Ронанда", "Ошпаз", "Муаллим", "Табиб", "Сартарош", "Рангуборчӣ", 
  "Кафшергар", "Кондиционерсоз", "Автомеханик", "Дигар"
];

/**
 * Рӯйхати калимаҳои мамнӯъ (Дашномҳо ва калимаҳои қабеҳ)
 */
export const FORBIDDEN_WORDS = [
  "сука", "лаънат", "харом", "ганд", "наҳс", "кун", "гом", "хароми", "даюс"
];
