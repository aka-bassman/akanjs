# ssoHandoff Abstract
A native app's SSO sign-in, held server-side while the system browser talks to the provider, then until the app exchanges its one-time code.

## Rules
- Two stages, one shape: keyed by the random OAuth `state` for ten minutes until the provider answers, then by the one-time code's hash for sixty seconds with `accountId` set.
- Consumed on first read at each stage, whether or not what follows succeeds.
- Only the PKCE verifier of the app that started the sign-in turns the code into a session; the code alone, or the deep link that carried it, is worth nothing.
- The callback scheme is checked against the lib's allowed list at the start, so a crafted start URL cannot send the code to another app's scheme.
