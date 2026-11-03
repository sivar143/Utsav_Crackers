package in.utsavcrackers.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import in.utsavcrackers.catalogue.Product;
import in.utsavcrackers.catalogue.ProductRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository products;

    @Mock
    private InventoryBalanceRepository balances;

    @Mock
    private InventoryMovementRepository movements;

    private InventoryService service;
    private Product product;
    private UUID productId;

    @BeforeEach
    void setUp() {
        service = new InventoryService(products, balances, movements);
        productId = UUID.randomUUID();
        product = mock(Product.class);
        when(product.getId()).thenReturn(productId);
        when(product.getSku()).thenReturn("SKU-001");
        when(product.getName()).thenReturn("Test product");
    }

    @Test
    void recordsPositiveAdjustmentAndCreatesTheInitialBalance() {
        when(products.findActiveByIdForUpdate(productId)).thenReturn(Optional.of(product));
        when(balances.findByProductIdForUpdate(productId)).thenReturn(Optional.empty());
        when(balances.save(any(InventoryBalance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryBalanceResponse response = service.adjust("admin-subject",
                productId, new InventoryAdjustmentRequest(25, "Opening stock"));

        assertThat(response.onHandQuantity()).isEqualTo(25);
        assertThat(response.reservedQuantity()).isZero();
        assertThat(response.availableQuantity()).isEqualTo(25);
        verify(movements).save(any(InventoryMovement.class));
    }

    @Test
    void rejectsAnAdjustmentThatWouldConsumeReservedStock() {
        InventoryBalance balance = new InventoryBalance(product);
        balance.adjustOnHand(10);
        // Reserved stock is maintained only by the future order reservation workflow.
        org.springframework.test.util.ReflectionTestUtils.setField(balance, "reservedQuantity", 6);
        when(products.findActiveByIdForUpdate(productId)).thenReturn(Optional.of(product));
        when(balances.findByProductIdForUpdate(productId)).thenReturn(Optional.of(balance));

        assertThatThrownBy(() -> service.adjust("admin-subject",
                productId, new InventoryAdjustmentRequest(-5, "Stock correction")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT");
    }

    @Test
    void rejectsZeroAdjustments() {
        assertThatThrownBy(() -> service.adjust("admin-subject",
                productId, new InventoryAdjustmentRequest(0, "No change")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }
}
