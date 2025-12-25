
export enum PrizeType {
  MOBILE = 'Mobile',
  BIKE = 'Bike',
  FAN = 'Fan'
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  name: string;
  mobile: string;
  prize: PrizeType;
  proofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  processedBy?: string;
  processedAt?: number;
  isReferralFree?: boolean;
  referralCode?: string;
  referredBy?: string;
  isWinner?: boolean;
  deviceType: 'mobile' | 'desktop';
}

export interface Winner {
  id: string;
  ticketId: string;
  name: string;
  prize: PrizeType;
  ticketNumber: string;
  timestamp: number;
  celebrationPhoto?: string;
}

export interface Announcement {
  text: string;
  timestamp: number;
  isBreaking?: boolean;
}

export interface PrizeStats {
  [PrizeType.MOBILE]: number;
  [PrizeType.BIKE]: number;
  [PrizeType.FAN]: number;
  total: number;
  mobileDeviceCount: number;
  desktopDeviceCount: number;
}

export interface AppConfig {
  jazzCash: string;
  jazzCashName: string;
  easyPaisa: string;
  easyPaisaName: string;
  bankAccount: string;
  bankAccountName: string;
  ticketPrice: number;
  adminEmail: string;
  adminName: string;
  adminKey: string;
  referralRequirement: number;
  managementLink: string;
  prizeImages: {
    [key in PrizeType]: string;
  };
}
