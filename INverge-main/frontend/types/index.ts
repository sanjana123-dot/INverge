export type Role = 'FOUNDER' | 'INVESTOR';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type RequestIntent = 'INVESTMENT' | 'NETWORKING' | 'MENTORSHIP';

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email?: string;
  name: string;
  role: Role;
  bio?: string | null;
  profilePicture?: string | null;
  skills: string[];
  trustScore: number;
  profileCompleteness: number;
  profileCompletenessPercent?: number;
  responseRate: number;
  endorsementScore: number;
  activityScore: number;
  investmentInterests?: string[];
  domains?: string[];
  portfolioPreference?: string | null;
  startup?: Startup | null;
  experiences?: Experience[];
  createdAt?: string;
  _count?: {
    endorsementsReceived: number;
    receivedRequests: number;
  };
  trustScoreBreakdown?: TrustScoreBreakdown;
}

export interface Startup {
  id: string;
  founderId: string;
  startupName: string;
  description: string;
  pitch: string;
  domain: string;
  fundingStage: string;
  teamSize: number;
  pitchDeckUrl?: string | null;
  websiteUrl?: string | null;
  metrics?: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
  founder?: Partial<User>;
}

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  intent: RequestIntent;
  status: RequestStatus;
  createdAt: string;
  sender?: Partial<User>;
  receiver?: Partial<User>;
}

export interface Endorsement {
  id: string;
  fromUserId: string;
  toUserId: string;
  connectionRequestId?: string;
  message: string;
  categories: string[];
  createdAt: string;
  updatedAt?: string;
  fromUser?: Partial<User>;
  toUser?: Partial<User>;
}

export interface EndorsementTraitCount {
  name: string;
  count: number;
}

export interface UserEndorsementSummary {
  totalCount: number;
  topTraits: EndorsementTraitCount[];
  endorsements: {
    id: string;
    message: string;
    categories: string[];
    createdAt: string;
    endorser: {
      id: string;
      name: string;
      role: Role;
      profilePicture?: string | null;
    };
  }[];
}

export interface EndorsementEligibility {
  canEndorse: boolean;
  connectionRequestId: string | null;
  existingEndorsement: Endorsement | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: Partial<User>;
}

export interface TrustScoreBreakdown {
  profileCompleteness: { value: number; weight: number; contribution: number };
  responseRate: { value: number; weight: number; contribution: number };
  endorsements: { value: number; weight: number; contribution: number };
  activityConsistency: { value: number; weight: number; contribution: number };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
