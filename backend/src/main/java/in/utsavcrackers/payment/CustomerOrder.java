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
    @Column(name = "customer_name", length = 180, updatable = false)
    private String customerName;
    @Column(name = "customer_email", length = 254, updatable = false)
    private String customerEmail;
    @Column(name = "customer_phone", length = 32, updatable = false)
    private String customerPhone;
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
    @Column(name = "delivery_status", nullable = false, length = 24)
    private String deliveryStatus = "PENDING";
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
        this(customerSubject, null, null, null, addressSnapshot, itemsSnapshot, amount, currency, paymentMethod);
    }

    public CustomerOrder(String customerSubject, String customerName, String customerEmail, String customerPhone,
            String addressSnapshot, String itemsSnapshot, BigDecimal amount, String currency, String paymentMethod) {
        this.customerSubject = customerSubject;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
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
    public void updateDeliveryStatus(String status) { this.deliveryStatus = status; }
    public UUID getId() { return id; }
    public String getDeliveryAddressSnapshot() { return deliveryAddressSnapshot; }
    public String getItemsSnapshot() { return itemsSnapshot; }
    public Instant getCreatedAt() { return createdAt; }
    public String getDeliveryStatus() { return deliveryStatus; }
    public String getCustomerSubject() { return customerSubject; }
    public String getCustomerName() { return customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public String getCustomerPhone() { return customerPhone; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
}
