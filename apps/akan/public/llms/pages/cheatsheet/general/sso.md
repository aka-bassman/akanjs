# Single Sign-On

- Source: /cheatsheet/general/sso
- Mirror: /llms/pages/cheatsheet/general/sso.md
- Section: cheatsheet
- Category: General
- Priority: P2

## Headings

- Single Sign-On (#overview)
- Register Providers (#provider)
- Write A Callback (#callback)
- Account Id (#account-id)
- After The Callback (#redirect)
- Tips (#tips)

## Content

Single Sign-On

The service that confirms who the user is: GitHub, Google, Facebook, Kakao, Naver or Apple.

The route the provider sends the user back to, carrying a one-time `code`.

The one value that identifies the user on every sign-in: an email or a GitHub username.

A user in `prepare` status, created for a newcomer. The signup page finishes it.

The start route sends the browser to the provider's consent screen.

required

The app's client ID from the provider console. Kakao calls it the REST API key.

Sent with the code-for-token exchange, only when set.

Your Apple developer team ID, the issuer of Apple's client secret.

The ID of the Sign in with Apple key, sent as the secret's `kid`.

Path to that key's private key file. Akan signs the client secret with it.

Key in security.sso

Scope Akan requests

(none)

Path

What it does

Redirects the browser to Google's consent screen.

Trades Google's `code` for a profile, then signs in or continues signup.

Guards that refuse the call with `ssoNotConfigured` when that provider has no keys.

Builds the 302 to the provider's consent screen from the `ssoOrigin` cookie.

Read the `code` query and the `ssoOrigin` cookie, and throw when either is missing.

One per provider. Trades the code for a token and fetches the profile.

The user service's decision: sign in, continue signup or error. Returns `{ cookie, redirect }`.

The final 302 to `redirect`, setting the session cookies when there are any.

Nickname seed

Where an existing user lands, signed in.

Where a newcomer lands to finish signup. Gets `?userId=<id>` appended.

Where a failed sign-in lands. Gets `?error=<error key>` appended.

Providers shown as full-width buttons with a label.

Providers shown as a row of round icon buttons below.

Replace the current history entry instead of pushing a new one.

Outcome

When

Goes to

Signed in

The accountId belongs to an active, restricted or dormant user.

Continue signup

No such user yet, so a prepare user is created with a unique nickname.

Error

Signing in or preparing the user fails, for example with `noVerifiesInUser`.

Words used on this page

Term

What you do

What happens when the user clicks

Register Providers

Credential fields

Redirect URI for the console

A provider only sends users back to a URI you registered. Akan builds it from the origin of the page where the user clicked:

Write A Callback

The Google pair, as shipped. Every other provider has the same shape:

Helper

Account Id

Writing your own callbacks? Keep the difference in one lookup:

After The Callback

The callback always ends on one of three pages, and you name all three on the sign-in button:

SSOButtons props

Tips

## Code Examples

### apps/koyo/env/env.server.local.ts

```ts
import type { ModulesOptions } from "../lib/option";
import { libEnv } from "./env.server.type";

export const env: ModulesOptions = {
  ...libEnv,
  security: {
    verifies: [["password"]],
    sso: {
      github: { clientID: "<github-client-id>", clientSecret: "<github-client-secret>" },
      google: { clientID: "<google-client-id>", clientSecret: "<google-client-secret>" },
      kakao: { clientID: "<kakao-rest-api-key>" },
    },
  },
};
```

### libs/shared/lib/user/user.signal.ts

```ts
google: query(Any, { guards: [SSO.Google] })
  .with(Req)
  .exec((request) => makeOAuthRedirectResponse("google", request as Bun.BunRequest)),
googleCallback: query(Any, { guards: [SSO.Google], path: "google/callback" })
  .with(Req)
  .exec(async function (request) {
    const req = request as Bun.BunRequest & { account?: SerAccount };
    const googleUser = await extractGoogleProfile(getSsoCode(req), getSsoOrigin(req));
    const accountId = googleUser.emails[0].value;
    const { cookie, redirect } = await this.userService.handleSsoCallback(
      accountId,
      "google",
      req.cookies.toJSON() as unknown as SsoCookie,
      req.account,
      googleUser.displayName,
    );
    return makeSsoRedirectResponse(redirect, cookie);
  }),
```

### apps/koyo/srvkit/accountIdOf.ts

```ts
import type { FacebookResponse, GithubResponse, GoogleResponse, KakaoResponse, NaverResponse } from "@libs/shared/srvkit";

export const accountIdOf = {
  github: (profile: GithubResponse) => profile.username,
  google: (profile: GoogleResponse) => profile.emails[0].value,
  facebook: (profile: FacebookResponse) => profile.emails[0].value,
  kakao: (profile: KakaoResponse) => profile.email,
  naver: (profile: NaverResponse) => profile.email,
} as const;
```

### apps/koyo/page/signin.tsx

```tsx
import { User } from "@libs/shared/client";
import { page } from "akanjs/client";

export default page().render(() => (
  <User.Util.SSOButtons
    mainSsos={["kakao", "naver"]}
    subSsos={["google", "github"]}
    signinRedirect="/"
    signupRedirect="/signup"
    errorRedirect="/signin"
  />
));
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

