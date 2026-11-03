package in.utsavcrackers.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/health")).andExpect(status().isOk());
    }

    @Test
    void adminRoutesRejectAnonymousRequests() throws Exception {
        mockMvc.perform(get("/api/v1/admin/example")).andExpect(status().isUnauthorized());
    }

    @Test
    void adminRoutesRejectCustomerRole() throws Exception {
        mockMvc.perform(get("/api/v1/admin/example")
                .with(SecurityMockMvcRequestPostProcessors.jwt()
                        .jwt(jwt -> jwt.claim("realm_access", java.util.Map.of("roles", java.util.List.of("CUSTOMER"))))))
                .andExpect(status().isForbidden());
    }
}
