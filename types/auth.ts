export type FashionPreference = 'FEMALE' | 'MALE' | 'NEUTRAL';

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  fashionPreference: FashionPreference | null;
  cityName?: string | null;
  cityCoordinates?: string | null;
  age?: number | null;
  lifestyles: string[];
  stellaPersona?: string | null;
  onboardingCompleted: boolean;
  authProvider: 'LOCAL' | 'GOOGLE';
  subscriptionStatus: 'INACTIVE' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
  stripeCustomerId?: string | null;
  currentPeriodEnd?: string | null;
}

export interface UpdateProfileRequestDto {
  name?: string;
  fashionPreference: FashionPreference;
  cityName: string;
  cityCoordinates?: string;
  age?: number;
  lifestyles: string[];
  stellaPersona: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserResponseDto;
}

export type UserResponse = UserResponseDto;
export type AuthResponse = AuthResponseDto;

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  fashionPreference?: FashionPreference;
  cityName?: string;
  cityCoordinates?: string;
  lifestyles?: string[];
}