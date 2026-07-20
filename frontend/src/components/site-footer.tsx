"use client";

import { useLocaleStore } from "@/lib/i18n/store";

const GITHUB_URL = "https://github.com/JoeSmile/pal-universe";

export function SiteFooter(): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);

  return (
    <footer
      className="mt-auto border-t border-border/80 bg-bg-base"
      data-testid="site-footer"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-text-secondary md:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <section aria-labelledby="footer-disclaimer-heading">
            <h2
              id="footer-disclaimer-heading"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary"
            >
              {translate("footer.disclaimerTitle")}
            </h2>
            <p className="leading-relaxed">{translate("footer.disclaimer")}</p>
          </section>

          <section aria-labelledby="footer-contact-heading">
            <h2
              id="footer-contact-heading"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary"
            >
              {translate("footer.contactTitle")}
            </h2>
            <p className="leading-relaxed">
              {translate("footer.contact")}{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                {translate("footer.github")}
              </a>
            </p>
          </section>
        </div>

        <p className="border-t border-border/60 pt-4 text-xs text-text-tertiary">
          {translate("footer.learning")}
        </p>
      </div>
    </footer>
  );
}
