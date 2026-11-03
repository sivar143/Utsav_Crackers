package in.utsavcrackers.customer;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class CustomerIdentityService {
    private final RestClient http;
    private final JdbcTemplate jdbc;
    private final String keycloakUrl;
    private final String adminUsername;
    private final String adminPassword;
    private final String realm;

    public CustomerIdentityService(
            JdbcTemplate jdbc,
            @Value("${KEYCLOAK_INTERNAL_URL:http://localhost:8081}") String keycloakUrl,
            @Value("${KEYCLOAK_ADMIN:admin}") String adminUsername,
            @Value("${KEYCLOAK_ADMIN_PASSWORD:}") String adminPassword,
            @Value("${KEYCLOAK_REALM:utsav-crackers}") String realm) {
        this.jdbc = jdbc;
        this.http = RestClient.create();
        this.keycloakUrl = keycloakUrl.replaceAll("/+$", "");
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.realm = realm;
    }

    public Map<String, Object> register(CustomerRegistrationRequest request) {
        String email = request.email().trim().toLowerCase();
        if (jdbc.queryForObject("SELECT COUNT(*) FROM customer_profiles WHERE email = ?", Integer.class, email) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        String adminToken = adminToken();
        Map<String, Object> user = Map.of(
                "username", email,
                "email", email,
                "firstName", request.firstName().trim(),
                "lastName", request.lastName() == null ? "" : request.lastName().trim(),
                "enabled", true,
                "emailVerified", false,
                "credentials", List.of(Map.of("type", "password", "value", request.password(), "temporary", false))
        );

        URI createdLocation;
        try {
            createdLocation = http.post()
                    .uri(keycloakUrl + "/admin/realms/" + realm + "/users")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(user)
                    .retrieve()
                    .toBodilessEntity()
                    .getHeaders()
                    .getLocation();
        } catch (org.springframework.web.client.HttpClientErrorException.Conflict ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        if (createdLocation == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Identity provider did not confirm customer creation");
        }

        String subject = createdLocation.getPath().substring(createdLocation.getPath().lastIndexOf('/') + 1);
        try {
            Map<?, ?> role = http.get()
                    .uri(keycloakUrl + "/admin/realms/" + realm + "/roles/CUSTOMER")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .retrieve().body(Map.class);
            http.post()
                    .uri(keycloakUrl + "/admin/realms/" + realm + "/users/" + subject + "/role-mappings/realm")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of(role))
                    .retrieve().toBodilessEntity();

            jdbc.update("""
                    INSERT INTO customer_profiles
                      (id, keycloak_subject, email, first_name, last_name, phone_number)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    UUID.randomUUID().toString(), subject, email, request.firstName().trim(),
                    request.lastName() == null ? "" : request.lastName().trim(), request.phoneNumber());
        } catch (Exception ex) {
            // Avoid leaving an identity without its corresponding application profile.
            try {
                http.delete().uri(keycloakUrl + "/admin/realms/" + realm + "/users/" + subject)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken).retrieve().toBodilessEntity();
            } catch (Exception ignored) {
                // The original provisioning error is the actionable failure.
            }
            if (ex instanceof DuplicateKeyException) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Customer account provisioning failed");
        }
        return Map.of("id", subject, "email", email, "message", "Account created. You can now sign in.");
    }

    public Map<String, Object> login(CustomerLoginRequest request) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", "utsav-web");
        form.add("username", request.email().trim().toLowerCase());
        form.add("password", request.password());
        try {
            return http.post()
                    .uri(keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Customer sign-in is temporarily unavailable");
        }
    }

    private String adminToken() {
        if (adminPassword == null || adminPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Customer registration is not configured");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", "admin-cli");
        form.add("username", adminUsername);
        form.add("password", adminPassword);
        try {
            Map<?, ?> token = http.post()
                    .uri(keycloakUrl + "/realms/master/protocol/openid-connect/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);
            return (String) token.get("access_token");
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Identity provider administration is unavailable");
        }
    }
}
