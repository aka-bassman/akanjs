"use client";
import { Translator } from "akanjs/client";
import { parseAkanI18nEnv } from "akanjs/common";

const errorKeyPattern = /^[a-zA-Z][A-Za-z0-9]*\.error\.[A-Za-z0-9_]+$/;

const messageOf = (error: unknown, lang: string) => {
  if (!(error instanceof Error) || !errorKeyPattern.test(error.message))
    return Translator.translateByLocale(lang, "base.pageLoadFailed");
  const { data } = error as { data?: Record<string, string | number> };
  return Translator.translateByLocale(lang, error.message, data);
};

interface RenderFailureProps {
  error: unknown;
  onRetry: () => void;
}
export const RenderFailure = ({ error, onRetry }: RenderFailureProps) => {
  const lang = Translator.getActiveLocale() ?? parseAkanI18nEnv().defaultLocale;
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="max-w-sm text-foreground/70 text-sm">{messageOf(error, lang)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-field bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
      >
        {Translator.translateByLocale(lang, "base.retry")}
      </button>
    </div>
  );
};
