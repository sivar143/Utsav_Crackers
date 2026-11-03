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
    private Product product;
    private UUID productId;

    @BeforeEach
    void setUp() {
        service = new CartService(carts, products);
        productId = UUID.randomUUID();
        product = mock(Product.class);
        when(product.getId()).thenReturn(productId);
        when(product.getSku()).thenReturn("SPK-001");
        when(product.getName()).thenReturn("Electric Sparklers");
        when(product.getPrice()).thenReturn(new BigDecimal("149.50"));
        when(product.getCurrency()).thenReturn("INR");
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
        when(products.findByIdAndActiveTrue(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.putItem("customer-123", productId, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void rejectsMixedCurrencyCartContents() {
        UUID usdProductId = UUID.randomUUID();
        Product usdProduct = mock(Product.class);
        when(usdProduct.getId()).thenReturn(usdProductId);
        when(usdProduct.getCurrency()).thenReturn("USD");
        Cart cart = new Cart("customer-123");
        cart.put(product, 1);
        when(products.findByIdAndActiveTrue(usdProductId)).thenReturn(Optional.of(usdProduct));
        when(carts.findByCustomerSubject("customer-123")).thenReturn(Optional.of(cart));

        assertThatThrownBy(() -> service.putItem("customer-123", usdProductId, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }
}
