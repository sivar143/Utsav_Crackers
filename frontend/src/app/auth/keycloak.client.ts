import Keycloak from 'keycloak-js';

// Local development identity provider. Production values must come from deployment runtime configuration.
export const keycloak = new Keycloak({
  url: 'http://localhost:8081',
  realm: 'utsav-crackers',
  clientId: 'utsav-web'
});
