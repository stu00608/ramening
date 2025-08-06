export interface Review {
  id: string;
  restaurantName: string;
  visitDate: string;
  visitTime?: string;
  rating: number;
  ramenItems: Array<{ name: string; price: number; customization?: string }>;
  sideItems: Array<{ name: string; price: number }>;
  tags: string[];
  address: string;
  photos: Array<{ url: string; category: string; description?: string }>;
  textReview: string;
  createdAt: string;
  guestCount?: string;
  reservationStatus?: string;
  waitTime?: string;
  orderMethod?: string;
  paymentMethods?: string[];
  nearestStation?: string;
  walkingTime?: string;
}
