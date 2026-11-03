package in.utsavcrackers.cart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import in.utsavcrackers.catalogue.Product;
import in.utsavcrackers.catalogue.ProductRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository carts;

    @Mock
    private ProductRepository products;

    private CartService service;

    @BeforeEach
    void setUp() {
        service = new CartService(carts, products);
    }

    @Test
    void returnsAnEmptyCartForANewCustomerWithoutCreatingDatabaseState() {
        when(carts.findByCustomerSubject("customer-123")).thenReturn(Optional.empty());

        CartResponse response = service.getCart("customer-123");

        assertThat(response.items()).isEmpty();
        assertThat(response.totalQuantity()).isZero();
        assertThat(response.subtotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.currency()).isNull();
    }

    @Test
    void calculatesLineAndCartTotalsFromThePersistedProductPrice() {
        UUID productId = UUID.randomUUID();
        Product product = product(productId, "INR");
        when(products.findByIdAndActiveTrue(productId)).thenReturn(Optional.of(product));
        when(carts.findByCustomerSubject("customer-123")).thenReturn(Optional.empty());
        when(carts.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartResponse response = service.putItem("customer-123", productId, 3);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).productId()).isEqualTo(productId);
        assertThat(response.items().get(0).unitPrice()).isEqualByComparingTo("149.50");
        assertThat(response.items().get(0).lineTotal()).isEqualByComparingTo("448.50");
        assertThat(response.subtotal()).isEqualByComparingTo("448.50");
        assertThat(response.currency()).isEqualTo("INR");
    }

    @Test
    void rejectsQuantityOutsideTheSupportedRange() {
        assertThatThrownBy(() -> service.putItem("customer-123", UUID.randomUUID(), 100))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }

    @Test
    void rejectsProductsThatAreNoLongerActive() {
        UUID productId = UUID.randomUUID();
        when(products.findByIdAndActiveTrue(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.putItem("customer-123", productId, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void rejectsMixedCurrencyCartContents() {
        UUID inrProductId = UUID.randomUUID();
        UUID usdProductId = UUID.randomUUID();
        Product inrProduct = mock(Product.class);
        when(inrProduct.getCurrency()).thenReturn("INR");
        Product usdProduct = mock(Product.class);
        when(usdProduct.getCurrency()).thenReturn("USD");
        Cart cart = new Cart("customer-123");
        cart.put(inrProduct, 1);
        when(products.findByIdAndActiveTrue(usdProductId)).thenReturn(Optional.of(usdProduct));
        when(carts.findByCustomerSubject("customer-123")).thenReturn(Optional.of(cart));

        assertThatThrownBy(() -> service.putItem("customer-123", usdProductId, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }

    private Product product(UUID id, String currency) {
        Product product = mock(Product.class);
        when(product.getId()).thenReturn(id);
        when(product.getSku()).thenReturn("SKU-" + id);
        when(product.getName()).thenReturn("Test product");
        when(product.getPrice()).thenReturn(new BigDecimal("149.50"));
        when(product.getCurrency()).thenReturn(currency);
        return product;
    }
}
