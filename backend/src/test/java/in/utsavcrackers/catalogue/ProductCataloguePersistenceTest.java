package in.utsavcrackers.catalogue;

import static org.assertj.core.api.Assertions.assertThat;

import in.utsavcrackers.cart.Cart;
import in.utsavcrackers.cart.CartRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
class ProductCataloguePersistenceTest {

    @Autowired
    private ProductCategoryRepository categories;

    @Autowired
    private ProductRepository products;

    @Autowired
    private CartRepository carts;

    @PersistenceContext
    private EntityManager entityManager;

    // The test validates persistence and migrations, not live Keycloak connectivity.
    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    @Transactional
    void savesCategoryAndProductUsingTheFlywaySchema() {
        ProductCategory category = categories.saveAndFlush(new ProductCategory("Sparklers", "sparklers"));
        Product product = products.saveAndFlush(new Product(
                "SPK-001", "Electric Sparklers", "Decorative sparklers",
                category, new BigDecimal("149.50"), "INR"));

        Product stored = products.findByIdAndActiveTrue(product.getId()).orElseThrow();

        assertThat(stored.getCategory().getName()).isEqualTo("Sparklers");
        assertThat(stored.getPrice()).isEqualByComparingTo("149.50");
        assertThat(stored.getCurrency()).isEqualTo("INR");
    }

    @Test
    @Transactional
    void persistsCustomerCartAndItsProductLines() {
        ProductCategory category = categories.saveAndFlush(new ProductCategory("Fountains", "fountains"));
        Product product = products.saveAndFlush(new Product(
                "FNT-001", "Colour Fountain", "Outdoor fountain",
                category, new BigDecimal("299.00"), "INR"));
        Cart cart = new Cart("keycloak-subject-123");
        cart.put(product, 2);

        carts.saveAndFlush(cart);
        entityManager.clear();

        Cart restored = carts.findByCustomerSubject("keycloak-subject-123").orElseThrow();

        assertThat(restored.getItems()).hasSize(1);
        assertThat(restored.getItems().get(0).getProduct().getSku()).isEqualTo("FNT-001");
        assertThat(restored.getItems().get(0).getQuantity()).isEqualTo(2);
    }
}
