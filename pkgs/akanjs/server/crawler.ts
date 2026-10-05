//? `(?<!cu)`: CUBOT is a phone brand whose browsers carry the name; `-user` is how AI assistants name a fetch a person asked for.
const crawlerPattern =
  /(?<!cu)bot|crawl|spider|slurp|-user\b|preview|facebookexternalhit|facebookcatalog|meta-external|kakaotalk-scrap|whatsapp|vkshare|embedly|iframely|mastodon|anthropic-ai|cohere-ai|google-inspectiontool|googleother|mediapartners-google|yeti\b|daum\/|daumoa|ia_archiver/i;

export const isCrawlerUserAgent = (userAgent: string | null | undefined): boolean =>
  !!userAgent && crawlerPattern.test(userAgent);
