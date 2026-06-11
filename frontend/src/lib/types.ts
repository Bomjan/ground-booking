export interface User {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

export interface Profile {
  id: number;
  email: string;
  department: string;
  phone: number;
}

export interface Slot {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
}

export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancel_requested"
  | "cancelled";

export interface Booking {
  id: number;
  student_id: string;
  match_type: string;
  date: string;
  starting_time: string;
  ending_time: string;
  notes: string;
  status: BookingStatus;
  created_at: string;
}

export interface Admin {
  id: number;
  email: string;
}

export interface ApiError {
  error: string;
}
