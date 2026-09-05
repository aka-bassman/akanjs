"use client";
import { router, usePage } from "akanjs/client";
import { parseAkanI18nEnv } from "akanjs/common";
import { st } from "akanjs/store";

import { agentAttrs } from "../agentAttrs";
import { buttonRecipe } from "../Button";
import { Dropdown } from "../Dropdown";

const languageNames = {
  en: "English",
  ko: "한국어",
  zhChs: "简体中文",
  zhCht: "繁體中文",
  ja: "日本語",
} as const;

// A configured locale the framework ships no display name for still routes and still translates, so it belongs
// in the list under its own code rather than vanishing from a menu that offers no other way to reach it.
const nameOf = (locale: string) => languageNames[locale as keyof typeof languageNames] ?? locale;

const warned = new Set<string>();
// A locale outside `AKAN_PUBLIC_LOCALES` has no route prefix, so choosing it navigates straight to a 404.
// Dropping it is the only safe render; saying so once is what keeps the drop from reading as a typo.
const warnDropped = (dropped: string[], locales: string[]) => {
  if (process.env.AKAN_PUBLIC_ENV !== "local") return;
  const unseen = dropped.filter((locale) => !warned.has(locale));
  if (!unseen.length) return;
  for (const locale of unseen) warned.add(locale);
  console.warn(
    `<SelectLanguage> dropped ${unseen.join(", ")}: not in AKAN_PUBLIC_LOCALES (${locales.join(",")}). Add the locale to the app i18n config, or drop it from the \`languages\` prop.`,
  );
};

export interface SelectLanguageProps {
  className?: string;
  languages?: string[];
}
export const SelectLanguage = ({ className, languages }: SelectLanguageProps) => {
  const { lang } = usePage();
  const { locales } = parseAkanI18nEnv();
  const requested = languages ?? locales;
  const offered = requested.filter((locale) => locales.includes(locale));
  warnDropped(
    requested.filter((locale) => !locales.includes(locale)),
    locales,
  );
  const setLanguage = st
    .tool("setLanguage")
    .desc("Show the site in another language.")
    .arg("language", String, { oneOf: offered })
    .exec((language) => {
      router.setLang(language);
    });
  return (
    <Dropdown
      className={className}
      buttonClassName="mx-2 my-auto h-8 min-h-0 border-none px-3 font-medium text-xs md:mx-4"
      value={nameOf(lang)}
      content={offered.map((locale) => (
        <li key={locale}>
          <button
            type="button"
            className={buttonRecipe({ variant: "ghost", size: "sm" }, "w-full justify-start")}
            onClick={() => {
              void setLanguage(locale);
            }}
            {...agentAttrs(setLanguage)}
          >
            {nameOf(locale)}
          </button>
        </li>
      ))}
    />
  );
};
