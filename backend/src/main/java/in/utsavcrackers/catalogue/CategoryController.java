package in.utsavcrackers.catalogue;

import java.net.URI;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> list() {
        return service.listActive();
    }

    @GetMapping("/categories/{id}")
    public CategoryResponse get(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        return service.getActive(id);
    }

    @PostMapping("/admin/categories")
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryUpsertRequest request) {
        CategoryResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/v1/categories/" + response.id())).body(response);
    }
}
