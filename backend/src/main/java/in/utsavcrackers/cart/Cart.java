package in.utsavcrackers.cart;

import in.utsavcrackers.catalogue.Product;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "shopping_carts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_shopping_carts_customer", columnNames = "customer_subject")
})
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 36, nullable = false, updatable = false)
    private UUID id;

    @Column(name = "customer_subject", nullable = false, length = 255, updatable = false)
    private String customerSubject;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();

    protected Cart() {
    }

    public Cart(String customerSubject) {
        this.customerSubject = customerSubject;
    }

    public void put(Product product, int quantity) {
        items.stream()
                .filter(item -> item.getProductId().equals(product.getId()))
                .findFirst()
                .ifPresentOrElse(
                        item -> item.changeQuantity(quantity),
                        () -> items.add(new CartItem(this, product, quantity)));
    }

    public void remove(UUID productId) {
        items.removeIf(item -> item.getProductId().equals(productId));
    }

    public void clear() {
        items.clear();
    }

    public UUID getId() { return id; }
    public String getCustomerSubject() { return customerSubject; }
    public List<CartItem> getItems() { return items; }
}
