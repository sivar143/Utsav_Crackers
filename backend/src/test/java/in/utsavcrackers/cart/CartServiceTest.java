package in.utsavcrackers.cart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import in.utsavcrackers.catalogue.Product;
import in.utsavcrackers.catalogue.ProductCategory;
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

    @BeforeEach
    void setUp() {
        service = new CartService(carts, products);
        ProductCategory category = new ProductCategory("Sparklers", "sparklers");
        product = new Product("SPK-001", "Electric Sparklers", "Decorative sparklers",
                category, new BigDecimal("149.50"), "INR");
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
        // The persistence layer supplies the actual product id in normal operation.
        when(products.findByIdAndActiveTrue(productId)).thenReturn(Optional.of(product));
        when(carts.findByCustomerSubject("customer-123")).thenReturn(Optional.empty());
        when(carts.save(org.mockito.ArgumentMatchers.any(Cart.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CartResponse response = service.putItem("customer-123", productId, 3);

        assertThat(response.items()).hasSize(1);
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
        UUID productId = UUID.randomUUID();
        ProductCategory category = new ProductCategory("Fountains", "fountains");
        Product usdProduct = new Product("FNT-001", "Fountain", null, category,
                new BigDecimal("5.00"), "USD");
        Cart cart = new Cart("customer-123");
        // Seed the cart through its domain method; no browser-supplied price is accepted.
        cart.put(new Cart.ProductReference(UUID.randomUUID(), product), 1);
        when(products.findByIdAndActiveTrue(productId)).thenReturn(Optional.of(usdProduct));
        when(carts.findByCustomerSubject("customer-123")).thenReturn(Optional.of(cart));

        assertThatThrownBy(() -> service.putItem("customer-123", productId, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }
}
