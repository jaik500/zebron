export interface Location {
  id?: string;

  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;

  createdAt?: any;
  updatedAt?: any;
}
