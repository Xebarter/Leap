// Types and interfaces for Property Manager

export interface PropertyUnit {
  id: string;
  property_id: string;
  block_id: string;
  floor_number: number;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  is_available: boolean;
  created_at: string;
}

export interface PropertyBlock {
  id: string;
  name: string;
  location: string;
  total_floors: number;
  total_units: number;
  created_at: string;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  description: string;
  price_ugx: number;
  category: string;
  bedrooms: number;
  bathrooms: number;
  image_url: string;
  video_url: string;
  minimum_initial_months: number;
  total_floors: number;
  units_config: string;
  block_id?: string;
  created_at: string;
  property_blocks?: PropertyBlock;
  property_units?: PropertyUnit[];
}

export interface PropertyCreateFormProps {
  onSubmit: (formData: FormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
  property?: any
  blocks?: any[]
}

export interface UniqueUnitType {
  type: string;
  label: string;
  monthlyFee: number;
  bedrooms: number;
  bathrooms: number;
  totalUnits: number;
  unitsPerFloor: Array<{ floor: number; count: number }>;
  description?: string;
  customTitle?: string;
  imageUrl?: string;
}
