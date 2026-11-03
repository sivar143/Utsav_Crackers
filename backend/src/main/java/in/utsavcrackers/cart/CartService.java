package in.utsavcrackers.cart;

import in.utsavcrackers.catalogue.Product;
import in.utsavcrackers.catalogue.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CartService {

    private static final int MAX_ITEM_QUANTITY = 99;

    private final CartRepository carts;
    private final ProductRepository products;

    public CartService(CartRepository carts, ProductRepository products) {
        this.carts = carts;
        this.products = products;
    }

    public CartResponse getCart(String customerSubject) {
        requireSubject(customerSubject);
        return carts.findByCustomerSubject(customerSubject)
                .map(this::toResponse)
                .orElseGet(this::emptyCart);
    }

    @Transactional
    public CartResponse putItem(String customerSubject, UUID productId, int quantity) {
        requireSubject(customerSubject);
        if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cart quantity must be between 1 and " + MAX_ITEM_QUANTITY);
        }

        Product product = products.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "The selected product is unavailable"));

        Cart cart = carts.findByCustomerSubject(customerSubject)
                .orElseGet(() -> new Cart(customerSubject));

        String existingCurrency = cart.getItems().isEmpty()
                ? null : cart.getItems().get(0).getProduct().getCurrency();
        if (existingCurrency != null && !existingCurrency.equals(product.getCurrency())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A cart can contain products in only one currency");
        }

        cart.put(product, quantity);
        return toResponse(carts.save(cart));
    }

    @Transactional
    public CartResponse removeItem(String customerSubject, UUID productId) {
        requireSubject(customerSubject);
        carts.findByCustomerSubject(customerSubject).ifPresent(cart -> {
            cart.remove(productId);
            carts.save(cart);
        });
        return getCart(customerSubject);
    }

    @Transactional
    public CartResponse clear(String customerSubject) {
        requireSubject(customerSubject);
        carts.findByCustomerSubject(customerSubject).ifPresent(cart -> {
            cart.clear();
            carts.save(cart);
        });
        return getCart(customerSubject);
    }

    private CartResponse toResponse(Cart cart) {
        List<CartResponse.CartLineResponse> lines = cart.getItems().stream()
                .map(item -> {
                    Product product = item.getProduct();
                    BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    return new CartResponse.CartLineResponse(product.getId(), product.getSku(),
                            product.getName(), item.getQuantity(), product.getPrice(), lineTotal,
                            product.getCurrency());
                })
                .toList();

        BigDecimal subtotal = lines.stream()
                .map(CartResponse.CartLineResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalQuantity = lines.stream().mapToInt(CartResponse.CartLineResponse::quantity).sum();
        String currency = lines.isEmpty() ? null : lines.get(0).currency();
        return new CartResponse(cart.getId(), lines, totalQuantity, subtotal, currency);
    }

    private CartResponse emptyCart() {
        return new CartResponse(null, List.of(), 0, BigDecimal.ZERO, null);
    }

    private void requireSubject(String subject) {
        if (subject == null || subject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A signed-in customer is required");
        }
    }
}
