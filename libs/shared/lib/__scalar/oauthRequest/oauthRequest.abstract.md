# oauthRequest Abstract
One authorization request parked between `/oauth/authorize` and the user's decision on the consent page.

## Rules
- Lives ten minutes and is decided at most once: `pending -> approved | denied`, never back.
- Binds to the first signed-in account that opens it; any other account is refused, so knowing a request id is not enough to take its code.
- Carries everything the token exchange must re-check later: client, redirect URI, PKCE challenge, resource.
