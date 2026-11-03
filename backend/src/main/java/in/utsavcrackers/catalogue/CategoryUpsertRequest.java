package in.utsavcrackers.catalogue;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryUpsertRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 140) @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*") String slug) {
}
