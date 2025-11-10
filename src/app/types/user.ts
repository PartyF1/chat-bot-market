export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  createdAt?: string;
  balance?: number;
  registrationDate?: string;
  totalSales?: number;
  totalEarnings?: number;
  sellerRating?: number;
}
