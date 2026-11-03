package in.utsavcrackers.inventory;

import java.util.UUID;

public record InventoryBalanceResponse(
        UUID productId,
        String sku,
        String productName,
        int onHandQuantity,
        int reservedQuantity,
        int availableQuantity) {

    static InventoryBalanceResponse from(in.utsavcrackers.catalogue.Product product, InventoryBalance balance) {
        return new InventoryBalanceResponse(product.getId(), product.getSku(), product.getName(),
                balance == null ? 0 : balance.getOnHandQuantity(),
                balance == null ? 0 : balance.getReservedQuantity(),
                balance == null ? 0 : balance.getAvailableQuantity());
    }
}
