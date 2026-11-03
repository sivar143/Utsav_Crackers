package in.utsavcrackers.catalogue;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final ProductCategoryRepository categories;

    public CategoryService(ProductCategoryRepository categories) {
        this.categories = categories;
    }

    public List<CategoryResponse> listActive() {
        return categories.findAllByActiveTrueOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryUpsertRequest request) {
        String name = request.name().trim();
        String slug = request.slug().trim();
        if (categories.existsByNameIgnoreCase(name) || categories.existsBySlugIgnoreCase(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A category with this name or slug already exists");
        }
        return toResponse(categories.save(new ProductCategory(name, slug)));
    }

    private CategoryResponse toResponse(ProductCategory category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getSlug());
    }
}
