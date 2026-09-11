# oauthClient Abstract
An application allowed to obtain tokens from this server's authorization endpoints, however it was registered.

## Rules
- A client is public (`none`) unless it was registered with a secret; only the secret's hash is ever held.
- `redirectUris` is the exact set an authorization request may name; a loopback URI matches any port.
- A dynamically registered client expires and is re-registered by the client; a static one lives in configuration.
