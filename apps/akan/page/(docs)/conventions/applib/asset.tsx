import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="asset-overview" title={l.trans({ en: "Asset Overview", ko: "애셋 개요" })}>
        <Docs.Title>{l.trans({ en: "Asset Overview", ko: "애셋 개요" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Apps and libraries both hold their assets in two folders at the root, beside lib and ui. Use public for files that the browser can request, and private for files that only server code should read. There is no asset folder wrapping them — akan sync rejects any root entry outside the allowlist.",
              ko: "앱과 라이브러리 모두 애셋을 루트의 두 폴더에 두며, lib나 ui와 같은 위치입니다. 브라우저가 요청할 수 있는 파일은 public에, 서버 코드만 읽어야 하는 파일은 private에 둡니다. 둘을 감싸는 asset 폴더는 없습니다. akan sync는 허용 목록 밖의 루트 항목을 거부합니다.",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" })}>
            {[
              {
                title: "public/",
                desc: l.trans({
                  en: "Served as static assets. Use it for images, PDF files, downloadable JSON, icons, and other files that can be public.",
                  ko: "정적 애셋으로 서빙됩니다. 이미지, PDF, 다운로드 가능한 JSON, 아이콘처럼 공개되어도 되는 파일에 사용합니다.",
                }),
              },
              {
                title: "private/",
                desc: l.trans({
                  en: "Available only to server-side code. Use it for seed data, private JSON, model files, and resources used by server jobs.",
                  ko: "서버 코드에서만 사용할 수 있습니다. seed data, private JSON, 모델 파일, 서버 작업용 리소스에 사용합니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe()}>
                <div className="font-mono font-semibold text-primary">{title}</div>
                <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="public-assets" title={l.trans({ en: "Public Assets", ko: "Public 애셋" })}>
        <Docs.Title>{l.trans({ en: "Public Assets", ko: "Public 애셋" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Files under public are served by the server as static assets. The browser can request them directly by URL, with the folder itself dropped from the path.",
              ko: "public 아래 파일은 서버가 정적 애셋으로 서빙합니다. 브라우저는 URL로 직접 요청할 수 있으며 폴더 이름 자체는 경로에서 빠집니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="public asset examples"
          language="bash"
          code={`apps/myapp/public/docs/product-guide.pdf
apps/myapp/public/data/sample-products.json
apps/myapp/public/images/hero.png

# Web requests
/docs/product-guide.pdf
/data/sample-products.json
/images/hero.png`}
        />

        <Code.Snippet
          className="w-full"
          title="Link to a PDF"
          code={`import { usePage } from "@apps/myapp/client";
import { Link } from "akanjs/ui";

export const GetProductGuide = () => {
  const { l } = usePage();
  return <Link href="/docs/product-guide.pdf">{l.trans({ en: "Open product guide", ko: "제품 가이드 열기" })}</Link>;
};`}
        />
        <Code.Snippet
          className="w-full"
          title="Fetch static JSON"
          code={`export const loadSampleProducts = async () => {
  const res = await fetch("/data/sample-products.json");
  return res.json();
};`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="optimized-images" title={l.trans({ en: "Optimized Images", ko: "Optimized Image" })}>
        <Docs.Title>{l.trans({ en: "Optimized Images", ko: "Optimized Image" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "When an image is public, you can render it with the Image component from akanjs/ui. Akan serves an optimized image response in a similar way to Next.js image optimization, so use this for UI images instead of a plain img tag when possible.",
              ko: "이미지가 public에 있다면 akanjs/ui의 Image 컴포넌트로 렌더링할 수 있습니다. Akan은 Next.js image optimization과 비슷하게 최적화된 이미지 응답을 서빙하므로, UI 이미지는 가능한 일반 img 태그보다 Image를 사용하세요.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="HeroImage.tsx"
          code={`import { Image } from "akanjs/ui";

export const HeroImage = () => {
  return (
    <Image
      src="/images/hero.png"
      alt="Product hero"
      width={1200}
      height={640}
      priority
    />
  );
};`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="private-assets" title={l.trans({ en: "Private Assets", ko: "Private 애셋" })}>
        <Docs.Title>{l.trans({ en: "Private Assets", ko: "Private 애셋" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Files under private are for server-only resources. Put files here when the browser should not download them directly, but the server needs them to load data, run inference, or initialize a service.",
              ko: "private 아래 파일은 서버 전용 리소스입니다. 브라우저가 직접 다운로드하면 안 되지만 서버가 데이터 로딩, 추론, 서비스 초기화에 사용해야 하는 파일을 여기에 둡니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="private asset examples"
          language="bash"
          code={`apps/myapp/private/seed/products.json
apps/myapp/private/model/yolo.onnx
libs/shared/private/recommendation/default-rules.json`}
        />
        <Code.Snippet
          className="w-full"
          title="Load private JSON on the server"
          code={`export const loadInitialProducts = async () => {
  const file = Bun.file("./private/seed/products.json");
  return file.json();
};`}
        />
        <Code.Snippet
          className="w-full"
          title="Use a private model file on the server"
          code={`export const detectObjects = async (image: ArrayBuffer) => {
  const file = Bun.file("./private/model/yolo.onnx");
  const model = await loadYoloModel(file);
  return model.detect(image);
};`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="library-asset-sync" title={l.trans({ en: "Library Asset Sync", ko: "라이브러리 애셋 sync" })}>
        <Docs.Title>{l.trans({ en: "Library Asset Sync", ko: "라이브러리 애셋 sync" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "When a library has assets, Akan syncs both public and private assets into each app. Public assets become browser-requestable files, while private assets stay server-only after sync. Sync links the library folder into the app, so editing a library asset takes effect without another sync; a production build copies the real files into the build output.",
              ko: "라이브러리가 애셋을 가지고 있으면 Akan은 public과 private 애셋을 모두 각 앱으로 sync합니다. public 애셋은 브라우저가 요청할 수 있는 파일이 되고, private 애셋은 sync 이후에도 서버 전용으로 남습니다. sync는 라이브러리 폴더를 앱에 링크하므로 라이브러리 애셋을 수정하면 다시 sync하지 않아도 반영되고, 프로덕션 빌드에서는 실제 파일이 빌드 결과물로 복사됩니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="library asset mapping"
          language="bash"
          code={`# Source in a library
libs/shared/public/banner/logo.png
libs/shared/private/recommendation/default-rules.json

# Linked into an app as public assets
apps/myapp/public/libs/shared/banner/logo.png

# Linked into an app as private assets
apps/myapp/private/libs/shared/recommendation/default-rules.json

# Copied as real files into the production build
dist/apps/myapp/public/libs/shared/banner/logo.png

# Browser request
/libs/shared/banner/logo.png`}
        />
        <Code.Snippet
          className="w-full"
          title="Use synced public library asset"
          code={`import { Image } from "akanjs/ui";

export const SharedLogo = () => {
  return (
    <Image
      src="/libs/shared/banner/logo.png"
      alt="Shared logo"
      width={240}
      height={80}
    />
  );
};`}
        />
        <Code.Snippet
          className="w-full"
          title="Use synced private library asset"
          code={`export const loadDefaultRules = async () => {
  const file = Bun.file("./private/libs/shared/recommendation/default-rules.json");
  return file.json();
};`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="practical-rules" title={l.trans({ en: "Practical Rules", ko: "실전 규칙" })}>
        <Docs.Title>{l.trans({ en: "Practical Rules", ko: "실전 규칙" })}</Docs.Title>
        <Docs.Description>
          <div className="space-y-1">
            {[
              l.trans({
                en: "Use public when the browser is allowed to request the file directly.",
                ko: "브라우저가 파일을 직접 요청해도 된다면 public을 사용합니다.",
              }),
              l.trans({
                en: "Use private when the file contains internal data, model weights, or server-only configuration.",
                ko: "내부 데이터, 모델 파일, 서버 전용 설정처럼 공개되면 안 되는 파일은 private을 사용합니다.",
              }),
              l.trans({
                en: "Use Image from akanjs/ui for public UI images that should be optimized by the server.",
                ko: "서버 최적화가 필요한 public UI 이미지는 akanjs/ui의 Image를 사용합니다.",
              }),
              l.trans({
                en: "Put reusable public files in a library's own public folder when multiple apps need the same asset.",
                ko: "여러 앱이 같은 파일을 사용한다면 라이브러리 자신의 public 폴더에 둡니다.",
              }),
            ].map((rule) => (
              <div key={rule} className={panelRecipe({ padding: "row" }, "text-foreground/70")}>
                {rule}
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
