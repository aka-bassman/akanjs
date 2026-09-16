---
"akanjs": patch
---

An attachment carrying both bytes and an address is read from the bytes

Both vision adaptors picked `url` over `data` — `AnthropicLlm.sourceOf` and the OpenAI dialect's image part — so a
host could not send an address for the screen and bytes for the model in one attachment. Sending both got the
address, and when that address was private the model answered about a picture nothing had fetched, with no error
anywhere. That is the one attachment failure that reports nothing, and the framework's own default storage backend
serves exactly such a path.

The order is now bytes first in both. Choosing the address does save the provider hop what the bytes weigh, so this
is not free — but a host that has a publicly reachable URL has no reason to also inline the bytes, while a host
that uploaded to private storage has every reason to send both. Being wrong the new way costs a larger request;
being wrong the old way cost a confident answer about nothing. A provider-reachable URL should still travel alone.
