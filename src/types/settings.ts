export interface EditorialSettings {
  name: string;
  nit: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface SystemSettings {
  key: string;
  value: unknown;
  description?: string;
  lastUpdatedBy?: string;
}
