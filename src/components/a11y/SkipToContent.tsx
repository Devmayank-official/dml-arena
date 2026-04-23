import { useTranslation } from "react-i18next";

/**
 * Skip-to-content link — first focusable element on every page.
 * WCAG 2.1 §2.4.1 (Bypass Blocks). Visually hidden until focused.
 */
export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  const { t } = useTranslation();
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {t("common.skipToContent")}
    </a>
  );
}
