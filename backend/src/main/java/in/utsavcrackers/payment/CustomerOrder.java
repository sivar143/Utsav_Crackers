package in.utsavcrackers.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 36, nullable = false, updatable = false)
    private UUID id;
    @Column(name = "customer_subject", nullable = false, length = 255, updatable = false)
    private String customerSubject;
    @Column(name = "delivery_address_snapshot", nullable = false, length = 1200, updatable = false)
    private String deliveryAddressSnapshot;
    @Column(name = "items_snapshot", nullable = false, columnDefinition = "LONGTEXT", updatable = false)
    private String itemsSnapshot;
    @Column(nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal amount;
    @Column(nullable = false, length = 3, updatable = false)
    private String currency;
    @Column(name = "payment_method", nullable = false, length = 12, updatable = false)
    private String paymentMethod;
    @Column(name = "payment_status", nullable = false, length = 24)
    private String paymentStatus = "PENDING";
    @Column(name = "razorpay_order_id", length = 64, unique = true)
    private String razorpayOrderId;
    @Column(name = "razorpay_payment_id", length = 64, unique = true)
    private String razorpayPaymentId;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "paid_at")
    private Instant paidAt;
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CustomerOrder() {}

    public CustomerOrder(String customerSubject, String addressSnapshot, String itemsSnapshot,
            BigDecimal amount, String currency, String paymentMethod) {
        this.customerSubject = customerSubject;
        this.deliveryAddressSnapshot = addressSnapshot;
        this.itemsSnapshot = itemsSnapshot;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
    }

    public void setRazorpayOrderId(String value) { this.razorpayOrderId = value; }
    public void markPaid(String paymentId) {
        if (!"PAID".equals(paymentStatus)) {
            paymentStatus = "PAID";
            razorpayPaymentId = paymentId;
            paidAt = Instant.now();
        }
    }
    public void markFailed() { if (!"PAID".equals(paymentStatus)) paymentStatus = "FAILED"; }
    public UUID getId() { return id; }
    public String getCustomerSubject() { return customerSubject; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
}
