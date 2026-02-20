export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  points?: number;
  password?: string;
  role: string;
  created_at: string;
  updated_at: string;
}
