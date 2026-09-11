# oauthGrant Abstract
An authorization code the user's consent produced, held until the client exchanges it for tokens.

## Rules
- Keyed by the code's hash and consumed on first exchange, whether or not the exchange then succeeds.
- Lives sixty seconds; the exchange re-checks client, redirect URI, PKCE verifier and resource against what was authorized.
- Names the account the tokens will speak for; the tokens themselves are minted at exchange time from the live account.
