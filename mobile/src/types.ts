export type MsType = 'RRMS' | 'SPMS' | 'PPMS' | 'UNSURE';

export type ConsentKey = 'symptoms' | 'medication' | 'location' | 'notifications';
export type ConsentMap = Record<ConsentKey, boolean>;

export type TextSize = 'normal' | 'large' | 'xlarge';

export interface Profile {
  msType: MsType | null;
  medication: string;
  teamName: string;
  teamPhone: string;
}

export const EMPTY_PROFILE: Profile = {
  msType: null,
  medication: '',
  teamName: '',
  teamPhone: '',
};
