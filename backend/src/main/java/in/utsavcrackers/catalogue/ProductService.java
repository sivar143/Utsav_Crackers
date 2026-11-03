package in.utsavcrackers.catalogue;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository products;
    private final ProductCategoryRepository categories;

    public ProductService(ProductRepository products, ProductCategoryRepository categories) {
        this.products = products;
        this.categories = categories;
    }

    public List<ProductResponse> listActive() {
        return products.findAllByActiveTrueOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse getActive(UUID id) {
        return toResponse(products.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found")));
    }

    @Transactional
    public ProductResponse create(ProductUpsertRequest request) {
        String sku = request.sku().trim();
        if (products.existsBySkuIgnoreCase(sku)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A product with this SKU already exists");
        }
        Product product = new Product(sku, request.name().trim(), request.description(),
                activeCategory(request.categoryId()), request.price(), request.currency());
        return toResponse(products.save(product));
    }

    @Transactional
    public ProductResponse update(UUID id, ProductUpsertRequest request) {
        Product product = products.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        String sku = request.sku().trim();
        if (products.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A product with this SKU already exists");
        }
        product.update(sku, request.name().trim(), request.description(),
                activeCategory(request.categoryId()), request.price(), request.currency());
        return toResponse(product);
    }

    @Transactional
    public void deactivate(UUID id) {
        Product product = products.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        product.deactivate();
    }

    private ProductCategory activeCategory(UUID id) {
        return categories.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected category is unavailable"));
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(product.getId(), product.getSku(), product.getName(),
                product.getDescription(), product.getCategory().getId(), product.getCategory().getName(),
                product.getPrice(), product.getCurrency());
    }
}
