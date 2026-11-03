package in.utsavcrackers.catalogue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository products;

    @Mock
    private ProductCategoryRepository categories;

    @InjectMocks
    private ProductService service;

    @Test
    void rejectsDuplicateSkuBeforePersisting() {
        ProductUpsertRequest request = new ProductUpsertRequest(
                "SKU-001", "Sparkler", "Description", UUID.randomUUID(), new BigDecimal("99.50"), "INR");
        when(products.existsBySkuIgnoreCase("SKU-001")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT");

        verify(products).existsBySkuIgnoreCase("SKU-001");
    }

    @Test
    void rejectsUnavailableCategory() {
        UUID categoryId = UUID.randomUUID();
        ProductUpsertRequest request = new ProductUpsertRequest(
                "SKU-002", "Flower Pot", null, categoryId, new BigDecimal("120.00"), "INR");
        when(products.existsBySkuIgnoreCase("SKU-002")).thenReturn(false);
        when(categories.findByIdAndActiveTrue(categoryId)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }
}
