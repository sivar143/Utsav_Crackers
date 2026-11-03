package in.utsavcrackers.catalogue;

import static org.assertj.core.api.Assertions.assertThat;

import in.utsavcrackers.cart.Cart;
import in.utsavcrackers.cart.CartRepository;
import in.utsavcrackers.customer.CustomerAddress;
import in.utsavcrackers.customer.CustomerAddressRepository;
import in.utsavcrackers.customer.CustomerAddressRequest;
import in.utsavcrackers.inventory.InventoryBalance;
import in.utsavcrackers.inventory.InventoryBalanceRepository;
import in.utsavcrackers.inventory.InventoryMovement;
import in.utsavcrackers.inventory.InventoryMovementRepository;
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

    @Autowired
    private CustomerAddressRepository customerAddresses;

    @Autowired
    private InventoryBalanceRepository inventoryBalances;

    @Autowired
    private InventoryMovementRepository inventoryMovements;

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
    @Test
    @Transactional
    void persistsCustomerAddressWithOwnershipAndIndianDeliveryFields() {
        CustomerAddressRequest request = new CustomerAddressRequest(
                "Home", "Customer Name", "+919876543210", "12 Main Road",
                null, "Near the post office", "Rajamahendravaram", "East Godavari",
                "IN-AP", "533001", "IN");
        CustomerAddress saved = customerAddresses.saveAndFlush(
                new CustomerAddress("keycloak-subject-456", request, true));
        entityManager.clear();

        CustomerAddress restored = customerAddresses
                .findByIdAndCustomerSubject(saved.getId(), "keycloak-subject-456")
                .orElseThrow();

        assertThat(restored.getPostalCode()).isEqualTo("533001");
        assertThat(restored.getStateCode()).isEqualTo("IN-AP");
        assertThat(restored.isDefaultAddress()).isTrue();
        assertThat(restored.getLandmark()).isEqualTo("Near the post office");
    }

    @Test
    @Transactional
    void persistsInventoryBalanceAndAppendOnlyMovement() {
        ProductCategory category = categories.saveAndFlush(new ProductCategory("Roman Candles", "roman-candles"));
        Product product = products.saveAndFlush(new Product(
                "RC-001", "Roman Candle", "Inventory test product",
                category, new BigDecimal("399.00"), "INR"));
        InventoryBalance balance = new InventoryBalance(product);
        balance.adjustOnHand(8);
        inventoryBalances.saveAndFlush(balance);
        inventoryMovements.saveAndFlush(new InventoryMovement(
                product, 8, 8, 0, "Opening stock", "admin-subject"));
        entityManager.clear();

        InventoryBalance restored = inventoryBalances.findByProduct_Id(product.getId()).orElseThrow();
        var movements = inventoryMovements.findAllByProduct_IdOrderByCreatedAtDesc(product.getId());

        assertThat(restored.getOnHandQuantity()).isEqualTo(8);
        assertThat(restored.getAvailableQuantity()).isEqualTo(8);
        assertThat(movements).hasSize(1);
        assertThat(movements.get(0).getActorSubject()).isEqualTo("admin-subject");
    }

}
