import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Image Optimization", ko: "이미지 최적화" })}>
        <Docs.Title>{l.trans({ en: "Image Optimization", ko: "이미지 최적화" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Somebody uploads a 4MB photo from their phone and it renders in a 96px avatar. The page is correct, the layout is right, and every visitor downloads four megabytes to look at a thumbnail.",
              ko: "누군가 폰에서 4MB짜리 사진을 올리고, 그 사진이 96px 아바타에 그려집니다. 페이지는 정상이고 레이아웃도 맞습니다. 그리고 모든 방문자가 썸네일 하나를 보려고 4메가바이트를 내려받습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>Image</code> from <code>akanjs/ui</code> answers that. It emits an optimizer URL carrying a
                  width and a quality, the server re-encodes once and caches the bytes, and the browser picks a
                  candidate off the <code>srcSet</code>. Everything else on this page is about not defeating that cache.
                </span>
              ),
              ko: (
                <span>
                  <code>akanjs/ui</code>의 <code>Image</code>가 그 답입니다. width와 quality를 담은 최적화 URL을
                  내보내고, 서버는 한 번만 다시 인코딩해 바이트를 캐시하며, 브라우저는 <code>srcSet</code>에서 후보를
                  고릅니다. 이 문서의 나머지는 그 캐시를 망치지 않는 법입니다.
                </span>
              ),
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "Use `Image` for images shown in UI.",
                ko: "UI에 보여주는 이미지는 `Image`를 사용하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Configure allowed remote domains in `akan.config.ts` — remote images are blocked until you do.",
                ko: "`akan.config.ts`에서 허용할 외부 domain을 설정합니다. 그 전까지 외부 이미지는 차단됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Keep repeated sizes few, so several elements share one cached file.",
                ko: "반복되는 size를 적게 유지해, 여러 요소가 캐시 파일 하나를 공유하게 하세요.",
              })}
            </li>
          </DocsList>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  None of this runs in the CSR bundle. A mobile or prebuilt-shell build renders the raw <code>src</code>{" "}
                  and never calls the optimizer, because there is no Akan server in front of it.
                </span>
              ),
              ko: (
                <span>
                  이 중 어느 것도 CSR 번들에서는 동작하지 않습니다. 모바일이나 사전 빌드된 shell은 원본 <code>src</code>
                  를 그대로 그리고 optimizer를 호출하지 않습니다. 앞에 Akan 서버가 없기 때문입니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="usage" title={l.trans({ en: "Use Image", ko: "Image 사용" })}>
        <Docs.Title>{l.trans({ en: "Use Image", ko: "Image 사용" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Pass a file-like object or a direct src. What you give it for sizing decides which srcSet it emits, and the two modes are exclusive.",
              ko: "File 형태의 객체나 직접 src를 넘깁니다. 크기 정보로 무엇을 주느냐가 어떤 srcSet을 내보낼지를 정하고, 두 방식은 배타적입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/article/Article.Unit.tsx"
            code={`import { Image } from "akanjs/ui";

interface CoverProps {
  className?: string;
  article: Article;
}
export const Cover = ({ className, article }: CoverProps) => {
  return (
    <Image
      className={className}
      file={article.cover}
      width={640}
      height={360}
      alt={article.title}
      priority={article.isFeatured}
    />
  );
};`}
          />
          <DocsList>
            <li>
              {l.trans({
                en: "A numeric `width` with no `sizes` emits a two-candidate 1x/2x srcSet, each snapped up to the nearest allowed width. This is what a fixed-size element wants.",
                ko: "`sizes` 없이 숫자 `width`만 주면 1x/2x 후보 두 개짜리 srcSet을 내보내며, 각각은 허용된 width 중 가장 가까운 위쪽 값으로 올라붙습니다. 고정 크기 요소에 맞는 방식입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`sizes` wins over `width`: once it is present the component emits the full w-descriptor srcSet and ignores the width for URL generation. Give it to a fluid element, not to a fixed one.",
                ko: "`sizes`는 `width`를 이깁니다. `sizes`가 있으면 컴포넌트는 w-descriptor srcSet 전체를 내보내고 URL 생성에서 width를 무시합니다. 고정 요소가 아니라 유동 요소에 주세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A data URL, a blob: URL and an .svg path are bypassed automatically, so `unoptimized` is for something else — an image another system already optimized.",
                ko: "data URL, blob: URL, .svg 경로는 자동으로 우회되므로 `unoptimized`는 다른 경우를 위한 것입니다. 다른 시스템이 이미 최적화해 둔 이미지입니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="config" title={l.trans({ en: "Config", ko: "설정" })}>
        <Docs.Title>{l.trans({ en: "Config", ko: "설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The whole optimizer is one key in akan.config.ts. Every array field is replaced wholesale rather than merged, so writing deviceSizes drops all eight defaults rather than adding to them.",
              ko: "optimizer 전체가 akan.config.ts의 키 하나입니다. 배열 필드는 병합이 아니라 통째로 교체되므로, deviceSizes를 적으면 기본값 여덟 개에 더해지는 것이 아니라 전부 사라집니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "deviceSizes",
                type: "number[]",
                default: "[640, 750, 828, 1080, 1200, 1920, 2048, 3840]",
                desc: l.trans({
                  en: "Viewport-scale widths, unioned with imageSizes to form the set of w values the optimizer accepts.",
                  ko: "뷰포트 규모의 width 목록입니다. imageSizes와 합집합을 이뤄 optimizer가 받는 w 값 집합이 됩니다.",
                }),
              },
              {
                key: "imageSizes",
                type: "number[]",
                default: "[32, 48, 64, 96, 128, 256, 384]",
                desc: l.trans({
                  en: "Fixed-element widths, in the same union.",
                  ko: "고정 요소용 width 목록이며 같은 합집합에 들어갑니다.",
                }),
              },
              {
                key: "formats",
                type: '("image/avif" | "image/webp")[]',
                default: '["image/webp"]',
                desc: l.trans({
                  en: "Candidate output formats; the first match against the request's Accept header wins.",
                  ko: "출력 형식 후보입니다. 요청의 Accept 헤더와 처음 맞는 것이 선택됩니다.",
                }),
              },
              {
                key: "qualities",
                type: "number[]",
                default: "[75]",
                desc: l.trans({
                  en: "Allow-list for the q parameter. Anything else is a 400, integer 1–100 included.",
                  ko: "q 파라미터 허용 목록입니다. 1~100 사이 정수라도 목록에 없으면 400입니다.",
                }),
              },
              {
                key: "minimumCacheTTL",
                type: "number",
                default: "14400",
                desc: l.trans({
                  en: "Seconds. The floor for how long a remote image is served without asking its origin again, and it also sets the response max-age.",
                  ko: "초 단위입니다. 외부 이미지를 origin에 다시 묻지 않고 제공하는 기간의 하한이며, 응답 max-age도 여기서 정해집니다.",
                }),
              },
              {
                key: "remotePatterns",
                type: "{ protocol?, hostname?, port?, pathname?, search? }[]",
                default: "[]",
                desc: l.trans({
                  en: "Allow-list for absolute URLs. Empty means no remote image is allowed at all.",
                  ko: "절대 URL 허용 목록입니다. 비어 있으면 외부 이미지는 하나도 허용되지 않습니다.",
                }),
              },
              {
                key: "localPatterns",
                type: "{ pathname?, search? }[]",
                default: '[{ pathname: "/**" }]',
                desc: l.trans({
                  en: "Allow-list for root-relative URLs. The default admits the whole public tree.",
                  ko: "루트 상대 URL 허용 목록입니다. 기본값은 public 트리 전체를 허용합니다.",
                }),
              },
              {
                key: "dangerouslyAllowSVG",
                type: "boolean",
                default: "false",
                desc: l.trans({
                  en: "Let SVG through the optimizer. Off, an SVG input is a 400 — an SVG is a document that can carry script, not a raster.",
                  ko: "SVG를 optimizer로 통과시킵니다. 꺼져 있으면 SVG 입력은 400입니다. SVG는 래스터가 아니라 스크립트를 실을 수 있는 문서이기 때문입니다.",
                }),
              },
              {
                key: "maximumRedirects",
                type: "number",
                default: "3",
                desc: l.trans({
                  en: "Redirect hops followed when fetching a remote image. Each hop is re-checked against remotePatterns, so a redirect cannot escape the allow-list.",
                  ko: "외부 이미지를 받을 때 따라가는 리다이렉트 횟수입니다. 매 홉마다 remotePatterns를 다시 검사하므로, 리다이렉트로 허용 목록을 빠져나갈 수 없습니다.",
                }),
              },
              {
                key: "fetchTimeoutMs",
                type: "number",
                default: "7000",
                desc: l.trans({
                  en: "Per-hop abort timeout for the remote fetch.",
                  ko: "외부 fetch의 홉당 중단 타임아웃입니다.",
                }),
              },
              {
                key: "maxRemoteBytes",
                type: "number",
                default: "26214400",
                desc: l.trans({
                  en: "Remote body cap — 25MB. Over it the request is a 413.",
                  ko: "외부 응답 본문 상한이며 25MB입니다. 넘으면 413입니다.",
                }),
              },
              {
                key: "maxConcurrency",
                type: "number",
                default: "0",
                desc: l.trans({
                  en: "Concurrent encodes. 0 sizes it from the CPUs the serving process sees, which the build machine's count is not.",
                  ko: "동시 인코딩 수입니다. 0이면 서버 프로세스가 인식한 CPU 수에서 결정되며, 빌드 머신의 CPU 수가 아닙니다.",
                }),
              },
            ]}
          />
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  Do not narrow <code>deviceSizes</code>, <code>imageSizes</code> or <code>qualities</code>. The{" "}
                  <code>Image</code> component does not read <code>akan.config.ts</code> — it holds the same lists as
                  its own constants — so a narrower config only makes the client emit <code>w</code> and <code>q</code>{" "}
                  values the server then rejects with a 400. Widen freely; narrowing breaks the pairing.
                </span>
              ),
              ko: (
                <span>
                  <code>deviceSizes</code>, <code>imageSizes</code>, <code>qualities</code>를 좁히지 마세요.{" "}
                  <code>Image</code> 컴포넌트는 <code>akan.config.ts</code>를 읽지 않고 같은 목록을 자기 상수로 들고
                  있습니다. 그래서 config만 좁히면 클라이언트가 내보낸 <code>w</code>·<code>q</code> 값을 서버가 400으로
                  거절하게 될 뿐입니다. 넓히는 것은 자유롭지만, 좁히면 둘의 짝이 깨집니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <div>
            {l.trans({
              en: "Encoding shares a worker pool with file reads and hashing, so raising maxConcurrency lets a burst of image requests slow down everything else the server is doing. The default holds it to half the slots on purpose.",
              ko: "인코딩은 파일 읽기·해싱과 같은 worker pool을 공유하므로, maxConcurrency를 높이면 이미지 요청이 몰릴 때 서버의 나머지 작업까지 함께 느려집니다. 기본값이 슬롯의 절반으로 묶어 두는 것은 의도된 선택입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="formats" title={l.trans({ en: "Formats And The Platform", ko: "포맷과 플랫폼" })}>
        <Docs.Title>{l.trans({ en: "Formats And The Platform", ko: "포맷과 플랫폼" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Encoding runs on Bun.Image, and which codecs exist depends on where the process runs. AVIF, HEIC and TIFF need an OS codec that only the macOS and Windows backends have — a Linux container does not, and never will emit AVIF.",
              ko: "인코딩은 Bun.Image에서 돌고, 어떤 코덱이 있는지는 프로세스가 어디서 도는지에 달려 있습니다. AVIF, HEIC, TIFF는 macOS와 Windows 백엔드에만 있는 OS 코덱을 필요로 합니다. Linux 컨테이너에는 없고, AVIF를 내보내는 일도 없습니다.",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "A format the platform cannot encode is filtered out of `formats` at boot, with one log line saying webp is served instead. The config is not an error — it is quietly narrowed.",
                ko: "플랫폼이 인코딩할 수 없는 형식은 부팅 때 `formats`에서 걸러지고, webp로 대신 제공한다는 로그 한 줄이 남습니다. 설정이 에러가 되는 것이 아니라 조용히 좁혀집니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "An animated image, an .ico, a .bmp and a .jxl are passed through without re-encoding, as is an input that is already webp or avif.",
                ko: "애니메이션 이미지, .ico, .bmp, .jxl은 재인코딩 없이 통과하며, 이미 webp나 avif인 입력도 마찬가지입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: 'This is why declaring `["image/avif", "image/webp"]` is safe: on a Linux deployment the first entry is dropped and every caller gets webp, and on a developer\'s Mac both are real.',
                ko: '`["image/avif", "image/webp"]`를 적어도 안전한 이유가 이것입니다. Linux 배포에서는 첫 항목이 빠지고 모든 호출자가 webp를 받으며, 개발자의 Mac에서는 둘 다 실제로 동작합니다.',
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="remote" title="remotePatterns">
        <Docs.Title>remotePatterns</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Remote images are blocked unless their host and path match `remotePatterns`. If optimization returns a bad request, check this setting first — the default is an empty list, which allows nothing.",
              ko: "외부 이미지는 host와 path가 `remotePatterns`에 맞아야 허용됩니다. 최적화 요청이 bad request로 실패하면 이 설정을 먼저 확인하세요. 기본값은 빈 목록이고, 아무것도 허용하지 않습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/akan.config.ts"
            code={`export default {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.example.com",
        pathname: "/articles/**",
      },
    ],
  },
};`}
          />
          <div>
            {l.trans({
              en: "hostname and pathname are globs: * matches one segment and ** matches any. port and search are matched too when declared, so a pattern can pin a non-standard port or require a signature query the CDN issues.",
              ko: "hostname과 pathname은 glob입니다. *는 한 segment, **는 임의 개수를 뜻합니다. port와 search도 적으면 함께 검사되므로, 비표준 포트를 고정하거나 CDN이 발급하는 서명 쿼리를 요구할 수 있습니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="remote-cache" title={l.trans({ en: "Remote Cache", ko: "외부 이미지 캐시" })}>
        <Docs.Title>{l.trans({ en: "Remote Cache", ko: "외부 이미지 캐시" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A remote image is downloaded once and then served from disk until its TTL runs out, so a warm image never reaches its origin. The TTL is the upstream `max-age`, floored by `minimumCacheTTL`.",
              ko: "외부 이미지는 한 번만 내려받고 TTL이 끝날 때까지 디스크에서 제공하므로, 캐시가 더워진 뒤에는 origin에 다시 요청하지 않습니다. TTL은 업스트림 `max-age`이며 `minimumCacheTTL`이 하한입니다.",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "After the TTL the source is fetched again, but an unchanged source reuses the encoded file, so revalidation costs one request and no re-encode.",
                ko: "TTL이 지나면 원본을 다시 받지만 원본이 그대로면 인코딩된 파일을 재사용하므로, 재검증 비용은 요청 1회이고 재인코딩은 없습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "That TTL pointer exists only in a production build. In development the source is refetched every time, so an upstream edit shows up immediately — the encoded bytes are still reused whenever the upstream ETag is unchanged.",
                ko: "TTL 포인터는 production 빌드에만 있습니다. 개발 중에는 매번 원본을 다시 받으므로 업스트림 수정이 즉시 반영되며, 업스트림 ETag가 그대로면 인코딩된 바이트는 그대로 재사용됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Local images are keyed by file mtime and size instead, so replacing a file in `public/` takes effect at once.",
                ko: "로컬 이미지는 파일 mtime과 크기로 key를 잡으므로 `public/` 파일을 교체하면 즉시 반영됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The cache lives in the build artifact directory, so each replica keeps its own and every deploy starts cold.",
                ko: "캐시는 build artifact 디렉터리에 있으므로 replica마다 따로 쌓이고, 배포할 때마다 비어 있는 상태로 시작합니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="cache-hit" title={l.trans({ en: "Cache Hits", ko: "Cache hit" })}>
        <Docs.Title>{l.trans({ en: "Cache Hits", ko: "Cache hit" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The encoded file's key is the URL, width, quality, output format and a tag identifying the exact source bytes — the upstream ETag for a remote image, mtime and size for a local one. Too many width or quality choices split that cache into many rarely-used files.",
              ko: "인코딩된 파일의 key는 URL, width, quality, 출력 형식, 그리고 원본 바이트를 특정하는 태그입니다. 외부 이미지는 업스트림 ETag, 로컬 이미지는 mtime과 크기입니다. width나 quality 선택지가 너무 많으면 이 캐시가 잘게 쪼개져 잘 재사용되지 않습니다.",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "Use a few repeated card sizes instead of many one-off widths.",
                ko: "매번 다른 width보다 반복되는 카드 size 몇 개를 사용하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Keep `qualities` at `[75]` unless a specific surface needs otherwise. Every extra value multiplies the files, and the client only ever asks for 75 unless a component passes `quality`.",
                ko: "특정 화면에 다른 값이 꼭 필요한 경우가 아니면 `qualities`는 `[75]`로 두세요. 값 하나가 늘 때마다 파일이 배로 늘고, 컴포넌트가 `quality`를 넘기지 않는 한 클라이언트는 75만 요청합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "A cold srcSet puts the same width in flight several times before any file exists; the optimizer deduplicates those in-flight requests, so only one encode happens.",
                ko: "차가운 srcSet은 파일이 생기기 전에 같은 width를 여러 번 동시에 요청합니다. optimizer가 그 진행 중 요청들을 합치므로 인코딩은 한 번만 일어납니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
