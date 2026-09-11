# oauthConnection Abstract
One application's live grant to act as an account, as the account's owner sees it on a connected-apps list.

## Rules
- Derived from the refresh sessions that carry a `clientId`; a browser session is never listed here and is signed out elsewhere.
- One entry per grant lineage: the sessions a rotation leaves behind share the lineage id and collapse into it.
- Disconnecting revokes the lineage and denylists its id for as long as an access token minted from it can still be valid.
