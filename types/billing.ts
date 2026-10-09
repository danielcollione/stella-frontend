export type PlanCode = 'FREE' | 'ATELIER' | 'COUTURE';
export type BillingInterval = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'INACTIVE' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';

// Espelha o PlanDto do back-end (vitrine vem do banco: muda sem deploy do front)
export interface Plan {
  code: PlanCode;
  name: string;
  tagline: string | null;
  highlight: boolean;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  trialDays: number;
  features: { text: string; included: boolean; comingSoon: boolean }[];
  entitlements: Record<string, string>;
}

export interface UsageItem {
  key: string;
  label: string;
  used: number;
  limit: number;
}

// Espelha o BillingStatusDto
export interface BillingStatus {
  planCode: PlanCode;
  planName: string;
  status: SubscriptionStatus;
  interval: BillingInterval | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEligible: boolean;
  canManageSubscription: boolean;
  usagePeriodStart: string;
  usage: UsageItem[];
  entitlements: Record<string, string>;
}

// Corpo do HTTP 402 devolvido quando o plano não permite a ação
export interface PlanLimitError {
  message: string;
  entitlementKey: string;
  planCode: PlanCode;
  limit: number;
}
