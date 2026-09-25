import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, type LinkGridItem } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const termRows = [
    {
      name: "cnst.Price",
      href: "/conventions/scalar/constant",
      desc: l.trans({
        en: "The constant class that server and browser both load: fields, defaults and helpers.",
        ko: "서버와 브라우저가 모두 불러오는 constant 클래스로, 필드와 기본값, 헬퍼 메서드를 담습니다.",
      }),
    },
    {
      name: "by(cnst.Price)",
      desc: l.trans({
        en: "Builds a server-side class with the same fields as the constant class.",
        ko: "constant 클래스와 같은 필드를 가진 서버 쪽 클래스를 만듭니다.",
      }),
    },
    {
      name: "db.Price",
      desc: l.trans({
        en: "The value's type in server code: its stored fields, without methods.",
        ko: "서버 코드에서 쓰는 값의 타입으로, 저장된 필드만 있고 메서드는 없습니다.",
      }),
    },
  ];

  const fileColumns = [
    { key: "constant", label: "constant", code: true },
    { key: "dictionary", label: "dictionary", code: true },
    { key: "document", label: "document", code: true },
  ];

  const fileGroups = [
    {
      label: l.trans({ en: "The value itself, for server and browser", ko: "값 자체 — 서버와 브라우저 공통" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "Fields and defaults", ko: "필드와 기본값" })}</span>,
          desc: l.trans({
            en: "The value's shape, such as `amount: field(Float, { default: 0 })`.",
            ko: "`amount: field(Float, { default: 0 })`처럼 값의 모양을 정합니다.",
          }),
          marks: { constant: true },
        },
        {
          name: "enumOf(…)",
          desc: l.trans({
            en: "Enum classes such as `Currency`, declared above the scalar class.",
            ko: "`Currency` 같은 enum 클래스로, 스칼라 클래스 위에 선언합니다.",
          }),
          marks: { constant: true },
        },
        {
          name: <span className="font-sans">{l.trans({ en: "Helper methods", ko: "헬퍼 메서드" })}</span>,
          desc: l.trans({
            en: "Display, predicate and small calculation methods such as `getLabel()`.",
            ko: "`getLabel()`처럼 표시, 판별, 작은 계산을 맡는 메서드입니다.",
          }),
          marks: { constant: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Labels", ko: "라벨" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "Labels and descriptions", ko: "라벨과 설명" })}</span>,
          desc: l.trans({
            en: "An `[en, ko]` label and description for every field and enum value.",
            ko: "모든 필드와 enum 값에 붙는 `[en, ko]` 라벨과 설명입니다.",
          }),
          marks: { dictionary: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Server only", ko: "서버 전용" }),
      rows: [
        {
          name: "by(cnst.Price)",
          desc: l.trans({
            en: "The one-line wrapper that gives server code the `db.Price` type.",
            ko: "서버 코드에 `db.Price` 타입을 주는 한 줄짜리 래퍼입니다.",
          }),
          marks: { document: true },
        },
      ],
    },
  ];

  const needColumns = [
    { key: "need", label: l.trans({ en: "When you need…", ko: "필요한 것" }) },
    { key: "file", label: l.trans({ en: "File", ko: "파일" }), code: true },
    { key: "example", label: l.trans({ en: "Example", ko: "예시" }), code: true },
  ];

  const needRows = [
    {
      need: l.trans({
        en: "A service method that takes or returns the value",
        ko: "값을 받거나 돌려주는 service 메서드",
      }),
      file: "leaveInfo.document.ts",
      example: "leaveInfo: db.LeaveInfo",
    },
    {
      need: l.trans({
        en: "One price label reused in product cards, order summaries and invoices",
        ko: "상품 카드, 주문 요약, 청구서에서 함께 쓰는 가격 라벨",
      }),
      file: "price.constant.ts",
      example: "price.getLabel()",
    },
    {
      need: l.trans({
        en: "An address summary built from `city` and `street`",
        ko: "`city`와 `street`로 만드는 주소 요약",
      }),
      file: "address.constant.ts",
      example: "address.getSummary()",
    },
    {
      need: l.trans({
        en: "A calculation across two values, such as a distance",
        ko: "거리처럼 값 두 개를 함께 쓰는 계산",
      }),
      file: "coordinate.constant.ts",
      example: "Coordinate.getDistanceKm(a, b)",
    },
    {
      need: l.trans({
        en: "Loading other records or calling a backend service",
        ko: "다른 레코드를 불러오거나 백엔드 service를 호출하는 일",
      }),
      file: "<model>.service.ts",
      example: "this.userModel.getUser(userId)",
    },
  ];

  const nextLinks: LinkGridItem[] = [
    {
      href: "/conventions/scalar/constant#helper-methods",
      title: "scalar.constant.ts",
      desc: l.trans({
        en: "Where helper methods live, with instance and `static` examples.",
        ko: "헬퍼 메서드를 두는 곳과 인스턴스, `static` 메서드 예시입니다.",
      }),
    },
    {
      href: "/conventions/module/document",
      title: "model.document.ts",
      desc: l.trans({
        en: "A database module's document, where chain methods do belong.",
        ko: "체인 메서드를 실제로 두는, 데이터베이스 모듈의 document입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="document-overview" title="scalar.document.ts">
        <Docs.Title>scalar.document.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>price.document.ts</code> is the server-side class of a scalar. It is one line that wraps the
                  constant class, and it stays that way.
                </span>
              ),
              ko: (
                <span>
                  <code>price.document.ts</code>는 스칼라의 서버 쪽 클래스입니다. constant 클래스를 감싸는 한 줄이고,
                  앞으로도 그 한 줄로 둡니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>akan create-scalar price</code> writes it together with the other core files. Keep it even when
                  the scalar needs nothing but fields and labels.
                </span>
              ),
              ko: (
                <span>
                  <code>akan create-scalar price</code>가 다른 기본 파일과 함께 만들어 줍니다. 스칼라에 필드와 라벨만
                  필요하더라도 이 파일은 지우지 않습니다.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Name", ko: "이름" })} items={termRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="basic-wrapper" title={l.trans({ en: "The Whole File", ko: "파일 전체" })}>
        <Docs.Title>{l.trans({ en: "The Whole File", ko: "파일 전체" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Import the constant file as <code>cnst</code> and wrap its class with <code>by(cnst.Price)</code>. The
                  document class then has the same fields as the constant class:
                </span>
              ),
              ko: (
                <span>
                  constant 파일을 <code>cnst</code>로 import하고, 그 클래스를 <code>by(cnst.Price)</code>로 감쌉니다.
                  그러면 document 클래스가 constant 클래스와 같은 필드를 갖습니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/<app>/lib/__scalar/price/price.document.ts"
          code={`import { by } from "akanjs/document";

import * as cnst from "./price.constant";

export class Price extends by(cnst.Price) {}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Same name as the constant class.</strong> The <code>price/</code> folder exports{" "}
                    <code>Price</code>, which wraps <code>cnst.Price</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>이름은 constant 클래스와 같습니다.</strong> <code>price/</code> 폴더는{" "}
                    <code>cnst.Price</code>를 감싼 <code>Price</code>를 export합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Import the sibling file.</strong> The path is <code>./price.constant</code> in the same
                    folder.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>같은 폴더의 파일을 import합니다.</strong> 경로는 <code>./price.constant</code>입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The body stays empty.</strong> <code>by()</code> already copies every field, and helpers go
                    on the constant class, as the next section shows.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>본문은 비워 둡니다.</strong> <code>by()</code>가 필드를 모두 가져오고, 헬퍼 메서드는 다음
                    섹션처럼 constant 클래스에 둡니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  <strong>Only server code may import this file.</strong> A value import from <code>ui/</code>,{" "}
                  <code>webkit/</code>, <code>page/</code>, <code>common/</code>, <code>*.store.ts</code>,{" "}
                  <code>*.constant.ts</code> or any <code>.tsx</code> fails lint. Use <code>cnst.Price</code> there;{" "}
                  <code>import type</code> is still allowed.
                </span>
              ),
              ko: (
                <span>
                  <strong>이 파일은 서버 코드에서만 import합니다.</strong> <code>ui/</code>, <code>webkit/</code>,{" "}
                  <code>page/</code>, <code>common/</code>, <code>*.store.ts</code>, <code>*.constant.ts</code>, 그리고
                  모든 <code>.tsx</code>에서 값으로 import하면 lint 오류입니다. 그곳에서는 <code>cnst.Price</code>를
                  쓰고, <code>import type</code>은 그대로 쓸 수 있습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="helper-example"
        title={l.trans({ en: "Helpers Go On The Constant", ko: "헬퍼는 constant에 둡니다" })}
      >
        <Docs.Title>{l.trans({ en: "Helpers Go On The Constant", ko: "헬퍼는 constant에 둡니다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A helper that reads the scalar's fields, such as a label, a flag or a small calculation, belongs on the constant class. The document class keeps only the wrapper.",
              ko: "라벨, 참·거짓 판별, 작은 계산처럼 스칼라의 필드를 읽는 헬퍼는 constant 클래스에 둡니다. document 클래스에는 감싸는 한 줄만 남깁니다.",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "What you write", ko: "쓰는 것" })}
            columns={fileColumns}
            groups={fileGroups}
            markLabel={l.trans({ en: "Lives in this file", ko: "이 파일에 둡니다" })}
            emptyLabel={l.trans({ en: "Not here", ko: "여기 두지 않습니다" })}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  So a price label is a short method on <code>Price</code> in the constant file:
                </span>
              ),
              ko: (
                <span>
                  그래서 가격 라벨은 constant 파일의 <code>Price</code>에 짧은 메서드로 씁니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/<app>/lib/__scalar/price/price.constant.ts"
          code={`import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class Price extends via((field) => ({
  amount: field(Float, { default: 0 }),
  currency: field(String, { default: "KRW" }),
})) {
  getLabel() {
    return \`\${this.amount.toLocaleString()} \${this.currency}\`;
  }
}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Keep it short.</strong> Read the fields and return a display value, a boolean or a small
                    calculated result.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>짧게 씁니다.</strong> 필드를 읽고 표시 값, 참·거짓 값, 작은 계산 결과를 돌려줍니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Unlike a database module.</strong> A <code>model.document.ts</code> holds chain methods such
                    as <code>approve()</code>; a scalar's document holds none.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>데이터베이스 모듈과는 다릅니다.</strong> <code>model.document.ts</code>에는{" "}
                    <code>approve()</code> 같은 체인 메서드가 있지만, 스칼라의 document에는 없습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Never add a method to the document class.</strong> Nothing turns a stored price into a{" "}
                  <code>Price</code> document, so the method has no instance to run on, and browser code cannot import
                  it at all.
                </span>
              ),
              ko: (
                <span>
                  <strong>document 클래스에는 메서드를 추가하지 않습니다.</strong> 저장된 가격을 <code>Price</code>{" "}
                  document로 바꿔 주는 곳이 없어 메서드가 실행될 인스턴스가 없고, 브라우저 코드는 이 파일을 import할
                  수조차 없습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="when-to-use" title={l.trans({ en: "When You Use It", ko: "이 파일을 쓰는 곳" })}>
        <Docs.Title>{l.trans({ en: "When You Use It", ko: "이 파일을 쓰는 곳" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  You rarely edit this file, but server code uses its type. A service method that takes a scalar value
                  types it as <code>{"db.<Scalar>"}</code>:
                </span>
              ),
              ko: (
                <span>
                  이 파일을 고칠 일은 거의 없지만, 서버 코드는 이 파일의 타입을 씁니다. 스칼라 값을 받는 service
                  메서드는 그 값을 <code>{"db.<Scalar>"}</code> 타입으로 받습니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="libs/shared/lib/user/user.service.ts"
          code={`import { serve } from "akanjs/service";

import * as db from "../db";

export class UserService extends serve(db.user, () => ({})) {
  async setLeaveInfo(userId: string, leaveInfo: db.LeaveInfo) {
    const user = await this.userModel.getUser(userId);
    return await user.set({ leaveInfo }).save();
  }
}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>db.LeaveInfo</code> is data only.
                    </strong>{" "}
                    It lists the stored fields of the <code>LeaveInfo</code> scalar and no methods.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>db.LeaveInfo</code>는 데이터만 담습니다.
                    </strong>{" "}
                    <code>LeaveInfo</code> 스칼라의 저장 필드만 있고 메서드는 없습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Browser code uses <code>cnst.LeaveInfo</code>.
                    </strong>{" "}
                    The <code>db</code> types stay on the server side.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      브라우저 코드는 <code>cnst.LeaveInfo</code>를 씁니다.
                    </strong>{" "}
                    <code>db</code> 타입은 서버 쪽에만 둡니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Where each need goes", ko: "필요한 것마다 두는 곳" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Reach for a helper when the same display or calculation shows up in several places. Anything that loads data stays in a service.",
              ko: "같은 표시나 계산이 여러 곳에서 반복되면 헬퍼를 만듭니다. 데이터를 불러오는 일은 service에 둡니다.",
            })}
          </div>
          <Docs.Table columns={needColumns} rows={needRows} stacked />

          <Docs.SubSubTitle>{l.trans({ en: "Common mistakes", ko: "자주 하는 실수" })}</Docs.SubSubTitle>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Writing <code>getLabel()</code> in the document class.
                    </strong>{" "}
                    Move it to the constant class, which server and browser code can both import.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>getLabel()</code>을 document 클래스에 쓰는 것.
                    </strong>{" "}
                    서버와 브라우저 코드가 모두 import할 수 있는 constant 클래스로 옮깁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Deleting the file because it is one line.</strong> Server code gets <code>db.Price</code>{" "}
                    from it, so it stays beside the constant and dictionary.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>한 줄뿐이라고 파일을 지우는 것.</strong> 서버 코드의 <code>db.Price</code>가 이 파일에서
                    나오므로, constant와 dictionary 옆에 그대로 둡니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Loading records inside a helper.</strong> A helper only reads its own fields; a query or a
                    service call belongs in the parent module's service.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>헬퍼 안에서 레코드를 불러오는 것.</strong> 헬퍼는 자기 필드만 읽습니다. 쿼리나 service
                    호출은 상위 모듈의 service에 둡니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Read next", ko: "다음에 읽을 곳" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={nextLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
