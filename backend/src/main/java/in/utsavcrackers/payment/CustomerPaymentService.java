package in.utsavcrackers.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
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
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CustomerPaymentService {
    private static final Logger log = LoggerFactory.getLogger(CustomerPaymentService.class);
    private final CartRepository carts;
    private final CustomerAddressRepository addresses;
    private final InventoryBalanceRepository inventory;
    private final FireworksEligibilityService eligibility;
    private final CustomerOrderRepository orders;
    private final ObjectMapper mapper;
    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;

    public CustomerPaymentService(CartRepository carts, CustomerAddressRepository addresses,
            InventoryBalanceRepository inventory, FireworksEligibilityService eligibility,
            CustomerOrderRepository orders, ObjectMapper mapper,
            @Value("${razorpay.key-id:}") String keyId,
            @Value("${razorpay.key-secret:}") String keySecret,
            @Value("${razorpay.webhook-secret:}") String webhookSecret) {
        this.carts = carts;
        this.addresses = addresses;
        this.inventory = inventory;
        this.eligibility = eligibility;
        this.orders = orders;
        this.mapper = mapper;
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
    }

    @Transactional
    public PaymentOrderResponse createOrder(String subject, String name, String email, String phone,
            CreatePaymentOrderRequest request) {
        requireCustomer(subject);
        if (keyId.isBlank() || keySecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Online payments are not configured yet. Please try again later.");
        }

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
        for (CartItem item : cart.getItems()) {
            if (!"INR".equals(item.getProduct().getCurrency())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Razorpay checkout currently accepts INR orders only.");
            }
            InventoryBalance balance = inventory.findByProduct_Id(item.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                            "Stock is not available for " + item.getProduct().getName() + "."));
            if (balance.getAvailableQuantity() < item.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Insufficient stock for " + item.getProduct().getName() + ".");
            }
            total = total.add(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        if (total.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart total must be greater than zero.");
        }

        final int amountPaise;
        try {
            amountPaise = total.movePointRight(2).intValueExact();
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The order amount is outside the supported payment range.");
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

        CustomerOrder localOrder = orders.save(new CustomerOrder(subject, safe(name), safe(email), safe(phone), addressSnapshot,
                writeJson(itemSnapshots), total, "INR", request.paymentMethod()));
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject options = new JSONObject();
            options.put("amount", amountPaise);
            options.put("currency", "INR");
            options.put("receipt", "UC-" + localOrder.getId().toString().replace("-", ""));
            options.put("notes", new JSONObject(Map.of("local_order_id", localOrder.getId().toString())));
            Order gatewayOrder = client.orders.create(options);
            localOrder.setRazorpayOrderId(gatewayOrder.get("id"));
            return new PaymentOrderResponse(localOrder.getId(), gatewayOrder.get("id"),
                    amountPaise, "INR", keyId, safe(name), safe(email), safe(phone));
        } catch (RazorpayException ex) {
            log.error("Unable to create Razorpay order for local order {}", localOrder.getId(), ex);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The payment provider could not start checkout. Your cart has not been charged.");
        }
    }

    @Transactional
    public PaymentVerificationResponse verifyPayment(String subject, VerifyPaymentRequest request) {
        requireCustomer(subject);
        CustomerOrder order = orders.findByRazorpayOrderIdAndCustomerSubject(
                        request.razorpayOrderId(), subject)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment order not found."));
        if ("PAID".equals(order.getPaymentStatus())) {
            return new PaymentVerificationResponse(order.getId(), "PAID", "Payment is already confirmed.");
        }
        try {
            JSONObject signatureData = new JSONObject();
            signatureData.put("razorpay_order_id", request.razorpayOrderId());
            signatureData.put("razorpay_payment_id", request.razorpayPaymentId());
            signatureData.put("razorpay_signature", request.razorpaySignature());
            if (!Utils.verifyPaymentSignature(signatureData, keySecret)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment signature verification failed.");
            }
            com.razorpay.Payment payment = new RazorpayClient(keyId, keySecret)
                    .payments.fetch(request.razorpayPaymentId());
            int expectedAmount = order.getAmount().movePointRight(2).intValueExact();
            int actualAmount = Integer.parseInt(String.valueOf(payment.get("amount")));
            if (!"captured".equalsIgnoreCase(String.valueOf(payment.get("status")))
                    || !request.razorpayOrderId().equals(String.valueOf(payment.get("order_id")))
                    || actualAmount != expectedAmount
                    || !"INR".equals(String.valueOf(payment.get("currency")))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The payment is not captured for the expected amount. If money was deducted, contact support before retrying.");
            }
            order.markPaid(request.razorpayPaymentId());
            clearCart(subject);
            return new PaymentVerificationResponse(order.getId(), "PAID",
                    "Payment received. Your order is confirmed.");
        } catch (RazorpayException ex) {
            log.error("Unable to verify Razorpay payment for order {}", order.getId(), ex);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "We could not confirm the payment yet. If money was deducted, do not pay again; contact support.");
        }
    }

    @Transactional
    public void handleWebhook(String payload, String signature) {
        if (webhookSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Payment webhook is not configured.");
        }
        if (signature == null || signature.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing payment webhook signature.");
        }
        try {
            if (!Utils.verifyWebhookSignature(payload, signature, webhookSecret)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment webhook signature.");
            }
            JsonNode root = mapper.readTree(payload);
            if (!"payment.captured".equals(root.path("event").asText())) return;
            JsonNode payment = root.path("payload").path("payment").path("entity");
            String gatewayOrderId = payment.path("order_id").asText("");
            String paymentId = payment.path("id").asText("");
            CustomerOrder order = orders.findByRazorpayOrderId(gatewayOrderId).orElse(null);
            if (order == null) return;
            int expectedAmount = order.getAmount().movePointRight(2).intValueExact();
            if (payment.path("amount").asInt(-1) != expectedAmount
                    || !order.getCurrency().equals(payment.path("currency").asText())) {
                log.error("Ignoring Razorpay webhook with mismatched amount/currency for order {}", order.getId());
                return;
            }
            order.markPaid(paymentId);
            clearCart(order.getCustomerSubject());
        } catch (RazorpayException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Payment webhook signature could not be verified.");
        } catch (java.io.IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment webhook payload.");
        }
    }

    private void clearCart(String subject) {
        carts.findByCustomerSubject(subject).ifPresent(cart -> {
            cart.clear();
            carts.save(cart);
        });
    }

    private String writeJson(Object value) {
        try { return mapper.writeValueAsString(value); }
        catch (Exception ex) { throw new IllegalStateException("Unable to create order item snapshot", ex); }
    }

    private String safe(String value) { return value == null ? "" : value; }

    private void requireCustomer(String subject) {
        if (subject == null || subject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A signed-in customer is required.");
        }
    }
}
