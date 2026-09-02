import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";

export default function Page() {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Image Optimization", ko: "이미지 최적화" })}>
        <Docs.Title>{l.trans({ en: "Image Optimization", ko: "이미지 최적화" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan Image works like a small image optimizer. It creates optimized URLs with width and quality, serves WebP when possible, and caches the generated result.",
              ko: "Akan Image는 작은 이미지 최적화기처럼 동작합니다. width와 quality가 포함된 최적화 URL을 만들고, 가능하면 WebP로 제공하며, 생성된 결과를 캐시합니다.",
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
                en: "Configure allowed sizes and remote domains in `akan.config.ts`.",
                ko: "`akan.config.ts`에서 허용할 size와 외부 domain을 설정합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Keep size options small enough to improve cache hits.",
                ko: "Cache hit을 높이려면 size option을 너무 많이 늘리지 마세요.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="usage" title={l.trans({ en: "Use Image", ko: "Image 사용" })}>
        <Docs.Title>{l.trans({ en: "Use Image", ko: "Image 사용" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Pass a file-like object or a direct src. Width and height help Akan choose the nearest cached size.",
              ko: "File 형태의 객체나 직접 src를 넘길 수 있습니다. width와 height가 있으면 Akan이 가까운 캐시 size를 고르기 쉽습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Article cover", ko: "Article cover" })}
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
      sizes="(max-width: 768px) 100vw, 640px"
      alt={article.title}
      priority={article.isFeatured}
    />
  );
};`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="config" title={l.trans({ en: "Config", ko: "설정" })}>
        <Docs.Title>{l.trans({ en: "Config", ko: "설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The default config covers common responsive sizes. Change it only when your UI has clear image sizes that repeat often.",
              ko: "기본 설정은 일반적인 반응형 size를 포함합니다. UI에서 반복해서 쓰는 이미지 크기가 명확할 때만 바꾸는 것이 좋습니다.",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "`minimumCacheTTL` is the floor for how long a remote image is served without asking its origin again, and it also sets the response `max-age`.",
                ko: "`minimumCacheTTL`은 외부 이미지를 origin에 다시 묻지 않고 제공하는 기간의 하한이며, 응답 `max-age`도 여기서 정해집니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`maxConcurrency` caps how many images encode at once. `0` sizes it from the CPUs the serving process sees.",
                ko: "`maxConcurrency`는 동시에 인코딩할 이미지 수를 제한합니다. `0`이면 서버 프로세스가 인식한 CPU 수에서 결정합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Encoding shares a worker pool with file reads and hashing, so raising that cap lets a burst of image requests slow down everything else the server is doing.",
                ko: "인코딩은 파일 읽기·해싱과 같은 worker pool을 공유하므로, 이 상한을 높이면 이미지 요청이 몰릴 때 서버의 나머지 작업까지 함께 느려집니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="akan.config.ts"
          code={`export default {
  images: {
    deviceSizes: [640, 1080, 1920],
    imageSizes: [64, 128, 256],
    formats: ["image/webp"],
    qualities: [75],
    minimumCacheTTL: 14400,
    maxConcurrency: 0,
  },
};`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="remote" title="remotePatterns">
        <Docs.Title>remotePatterns</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Remote images are blocked unless their host and path match `remotePatterns`. If optimization returns a bad request, check this setting first.",
              ko: "외부 이미지는 host와 path가 `remotePatterns`에 맞아야 허용됩니다. 최적화 요청이 bad request로 실패하면 이 설정을 먼저 확인하세요.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Allow CDN images", ko: "CDN 이미지 허용" })}
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
                en: "`akan start` skips this cache and refetches every time, so an upstream edit shows up immediately.",
                ko: "`akan start`는 이 캐시를 쓰지 않고 매번 다시 받으므로, 업스트림 수정이 즉시 반영됩니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Local images are keyed by file mtime instead, so replacing a file in `public/` takes effect at once.",
                ko: "로컬 이미지는 파일 mtime으로 key를 잡으므로 `public/` 파일을 교체하면 즉시 반영됩니다.",
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
              en: "The optimizer cache key changes when URL, width, quality, or output format changes. Too many width or quality choices can split the cache into many rarely-used files.",
              ko: "Optimizer cache key는 URL, width, quality, output format이 바뀌면 달라집니다. Width나 quality 선택지가 너무 많으면 캐시가 잘게 쪼개져 잘 재사용되지 않습니다.",
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
                en: "Keep `qualities` small, often only `[75]`.",
                ko: "`qualities`는 보통 `[75]`처럼 작게 유지하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Use `unoptimized` for data URLs, SVGs, or images already optimized by another system.",
                ko: "Data URL, SVG, 이미 다른 시스템에서 최적화된 이미지는 `unoptimized`를 고려하세요.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
}
