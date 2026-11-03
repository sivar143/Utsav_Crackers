package in.utsavcrackers.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import in.utsavcrackers.platform.HealthController;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = HealthController.class,
        properties = "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8081/realms/utsav-crackers/protocol/openid-connect/certs")
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SecurityConfig securityConfig;

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/health")).andExpect(status().isOk());
    }

    @Test
    void publicCatalogueRoutesDoNotRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/products")).andExpect(status().isNotFound());
    }

    @Test
    void adminRoutesRejectAnonymousRequests() throws Exception {
        mockMvc.perform(get("/api/v1/admin/example")).andExpect(status().isUnauthorized());
    }

    @Test
    void adminRoutesRejectCustomerRole() throws Exception {
        mockMvc.perform(get("/api/v1/admin/example")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void keycloakRealmRolesAreMappedToSpringAuthorities() {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .claim("realm_access", Map.of("roles", List.of("ADMIN", "CUSTOMER")))
                .build();

        var authentication = securityConfig.keycloakJwtAuthenticationConverter().convert(jwt);

        assertThat(authentication).isNotNull();
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_CUSTOMER");
    }
}
