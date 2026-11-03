export interface CartLine {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
}

export interface CartResponse {
  id: string | null;
  items: CartLine[];
  totalQuantity: number;
  subtotal: number;
  currency: string | null;
}

export const EMPTY_CART: CartResponse = {
  id: null,
  items: [],
  totalQuantity: 0,
  subtotal: 0,
  currency: null
};
