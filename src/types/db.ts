import type { UserRole } from '@/lib/roles';
import type { PreferredSlot, VisitStatus } from '@/lib/visits';

export interface CellRow {
  id: string;
  name: string;
  sort_order: number;
}

export interface MemberRow {
  id: string;
  name: string;
  photo_path: string | null;
  cell_id: string | null;
  duty: string | null;
  is_officer: boolean;
  active: boolean;
}

export interface MemberContactRow {
  member_id: string;
  phone: string | null;
  birth_date: string | null;
  baptized: boolean | null;
}

export interface MemberPrivateRow {
  member_id: string;
  address: string | null;
  workplace: string | null;
  family_info: string | null;
}

export interface ProfileRow {
  id: string;
  member_id: string | null;
  role: UserRole;
  approval: 'pending' | 'approved' | 'rejected';
  kakao_nickname: string | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  color: string;
}

export interface VisitRow {
  id: string;
  member_id: string;
  requested_by: string | null;
  preferred_slots: PreferredSlot[];
  message: string | null;
  status: VisitStatus;
  proposed_slot: PreferredSlot | null;
  confirmed_at: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}
