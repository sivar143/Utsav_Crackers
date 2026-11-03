export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  price: number;
  currency: string;
  imageData?: string | null;
}
