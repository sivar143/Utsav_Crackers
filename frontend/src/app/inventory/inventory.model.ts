export interface InventoryBalance {
  productId: string;
  sku: string;
  productName: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  movementType: string;
  quantityDelta: number;
  onHandAfter: number;
  reservedAfter: number;
  reason: string;
  actorSubject: string;
  createdAt: string;
}
