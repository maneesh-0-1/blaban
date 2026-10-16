export interface ItemCategory {
  id: number;
  name?: string;
  is_takeaway_only?: number | boolean;
  [key: string]: any;
}

export interface Item {
  id: number;
  name: string;
  description?: string;
  image?: string;
  image_full_url?: string;
  category_id?: number;
  category_ids?: Array<{ id: string | number; position: number }>;
  category?: ItemCategory;
  variations?: any[];
  add_ons?: any[];
  attributes?: any[];
  choice_options?: any[];
  price?: number;
  tax?: number;
  tax_type?: string;
  discount?: number;
  discount_type?: string;
  available_time_starts?: string;
  available_time_ends?: string;
  veg?: number;
  status?: number;
  store_id?: number;
  created_at?: string;
  updated_at?: string;
  order_count?: number;
  avg_rating?: number;
  rating_count?: number;
  module_id?: number;
  stock?: number;
  unit_type?: string;
  is_takeaway_only?: number | boolean;
  [key: string]: any;
}

export interface CartItem {
  id?: number;
  item_id?: number;
  cart_id?: number;
  name?: string;
  image?: string;
  image_full_url?: string;
  price?: number;
  unit_price?: number;
  discounted_price?: number;
  quantity?: number;
  total_price?: number;
  store_id?: number;
  store_name?: string;
  variation?: any;
  variations?: any;
  item?: Item;
  is_takeaway_only?: number | boolean;
  [key: string]: any;
}
