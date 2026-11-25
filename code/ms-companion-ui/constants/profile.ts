import type { MsType } from '@/types/health';

export const MS_TYPES: { value: MsType; label: string }[] = [
  { value: 'RRMS', label: 'Relapsing-remitting' },
  { value: 'SPMS', label: 'Secondary progressive' },
  { value: 'PPMS', label: 'Primary progressive' },
  { value: 'CIS', label: 'Clinically isolated syndrome (CIS)' },
  { value: 'UNSURE', label: "I'm not sure" },
];
