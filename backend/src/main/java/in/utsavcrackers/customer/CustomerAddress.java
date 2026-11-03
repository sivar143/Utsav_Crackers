package in.utsavcrackers.customer;

import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "customer_addresses")
public class CustomerAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 36, nullable = false, updatable = false)
    private UUID id;

    @Column(name = "customer_subject", nullable = false, length = 255, updatable = false)
    private String customerSubject;

    @Column(nullable = false, length = 40)
    private String label;

    @Column(name = "recipient_name", nullable = false, length = 120)
    private String recipientName;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "address_line_1", nullable = false, length = 180)
    private String addressLine1;

    @Column(name = "address_line_2", length = 180)
    private String addressLine2;

    @Column(length = 180)
    private String landmark;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(name = "state_code", nullable = false, length = 10)
    private String stateCode;

    @Column(name = "postal_code", nullable = false, length = 10)
    private String postalCode;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(name = "is_default", nullable = false)
    private boolean defaultAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CustomerAddress() {
    }

    public CustomerAddress(String customerSubject, CustomerAddressRequest request, boolean defaultAddress) {
        this.customerSubject = customerSubject;
        updateDetails(request);
        this.defaultAddress = defaultAddress;
    }

    public void updateDetails(CustomerAddressRequest request) {
        this.label = request.label().trim();
        this.recipientName = request.recipientName().trim();
        this.phoneNumber = request.phoneNumber().trim();
        this.addressLine1 = request.addressLine1().trim();
        this.addressLine2 = normalizeOptional(request.addressLine2());
        this.landmark = normalizeOptional(request.landmark());
        this.city = request.city().trim();
        this.district = request.district().trim();
        this.stateCode = request.stateCode().trim().toUpperCase();
        this.postalCode = request.postalCode().trim();
        this.countryCode = request.countryCode().trim().toUpperCase();
    }

    public void markDefault() { this.defaultAddress = true; }
    public void clearDefault() { this.defaultAddress = false; }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public UUID getId() { return id; }
    public String getCustomerSubject() { return customerSubject; }
    public String getLabel() { return label; }
    public String getRecipientName() { return recipientName; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getAddressLine1() { return addressLine1; }
    public String getAddressLine2() { return addressLine2; }
    public String getLandmark() { return landmark; }
    public String getCity() { return city; }
    public String getDistrict() { return district; }
    public String getStateCode() { return stateCode; }
    public String getPostalCode() { return postalCode; }
    public String getCountryCode() { return countryCode; }
    public boolean isDefaultAddress() { return defaultAddress; }
    public Instant getCreatedAt() { return createdAt; }
}
