package in.utsavcrackers.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.utsavcrackers.cart.Cart;
import in.utsavcrackers.cart.CartItem;
import in.utsavcrackers.cart.CartRepository;
import in.utsavcrackers.compliance.FireworksEligibilityResponse;
import in.utsavcrackers.compliance.FireworksEligibilityService;
import in.utsavcrackers.customer.CustomerAddress;
import in.utsavcrackers.customer.CustomerAddressRepository;
import in.utsavcrackers.inventory.InventoryBalance;
import in.utsavcrackers.inventory.InventoryBalanceRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CustomerOrderService {
    private static final String CASH_ON_DELIVERY = "COD";
    private final CartRepository carts;
    private final CustomerAddressRepository addresses;
    private final InventoryBalanceRepository inventory;
    private final FireworksEligibilityService eligibility;
    private final CustomerOrderRepository orders;
    private final ObjectMapper mapper;

    public CustomerOrderService(CartRepository carts, CustomerAddressRepository addresses,
            InventoryBalanceRepository inventory, FireworksEligibilityService eligibility,
            CustomerOrderRepository orders, ObjectMapper mapper) {
        this.carts = carts;
        this.addresses = addresses;
        this.inventory = inventory;
        this.eligibility = eligibility;
        this.orders = orders;
        this.mapper = mapper;
    }

    @Transactional
    public CustomerOrderResponse placeOrder(String subject, String name, String email, String phone,
            CreateCustomerOrderRequest request) {
        requireCustomer(subject);
        CustomerAddress address = addresses.findByIdAndCustomerSubject(request.addressId(), subject)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Select one of your saved delivery addresses."));
        FireworksEligibilityResponse policy = eligibility.check(subject, address.getId());
        if (!policy.eligibleForCheckout()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Delivery is not eligible for this address: " + policy.reason());
        }

        Cart cart = carts.findByCustomerSubject(subject)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty."));
        if (cart.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty.");
        }

        BigDecimal total = BigDecimal.ZERO;
        String currency = null;
        for (CartItem item : cart.getItems()) {
            InventoryBalance balance = inventory.findByProduct_Id(item.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                            "Stock is not available for " + item.getProduct().getName() + "."));
            if (balance.getAvailableQuantity() < item.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Insufficient stock for " + item.getProduct().getName() + ".");
            }
            if (currency == null) currency = item.getProduct().getCurrency();
            if (!currency.equals(item.getProduct().getCurrency())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Your cart contains products with different currencies.");
            }
            total = total.add(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        if (total.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your order total must be greater than zero.");
        }

        String addressSnapshot = String.join(", ", address.getRecipientName(), address.getPhoneNumber(),
                address.getAddressLine1(), safe(address.getAddressLine2()), safe(address.getLandmark()),
                address.getCity(), address.getDistrict(), address.getStateCode(), address.getPostalCode(),
                address.getCountryCode());
        List<Map<String, Object>> itemSnapshots = cart.getItems().stream().map(item -> Map.<String, Object>of(
                "productId", item.getProductId().toString(),
                "sku", item.getProduct().getSku(),
                "name", item.getProduct().getName(),
                "quantity", item.getQuantity(),
                "unitPrice", item.getProduct().getPrice().toPlainString(),
                "lineTotal", item.getProduct().getPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity())).toPlainString()
        )).toList();

        CustomerOrder order = orders.save(new CustomerOrder(subject, safe(name), safe(email), safe(phone),
                addressSnapshot, writeJson(itemSnapshots), total, currency == null ? "INR" : currency,
                CASH_ON_DELIVERY));
        cart.clear();
        carts.save(cart);
        return new CustomerOrderResponse(order.getId(), order.getAmount(), order.getCurrency(),
                CASH_ON_DELIVERY, "Your order has been placed. Pay the total amount when it is delivered.");
    }

    private String writeJson(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create order item snapshot", ex);
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private void requireCustomer(String subject) {
        if (subject == null || subject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A signed-in customer is required.");
        }
    }
}
