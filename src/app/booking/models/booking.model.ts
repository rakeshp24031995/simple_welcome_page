export interface Booking {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingSlot {
  date: string;
  time: string;
  available: boolean;
}

export interface BookingForm {
  service: string;
  date: string;
  time: string;
  notes?: string;
}