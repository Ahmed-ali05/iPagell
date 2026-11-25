"use client";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { GoogleMark } from "@/components/google-mark";
import { requestJson } from "@/lib/client-http";
import { formatDate } from "@/lib/i18n";

type Profile = {
  createdAt: number;
  identities: { provider: "google" | "apple"; createdAt: number }[];
};

/**
 * Settings → Account: how this account signs in and since when.
 * The method comes from the session, so it shows at once; dates arrive with
 * GET /api/auth/security and are simply left out if that request fails.
 * Accounts created with Google never show their random technical handle.
 */
export function AccountOverview({ username, method }: {
  username: string;
  method?: "password" | "google";
}) {
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const google = method === "google";

  useEffect(() => {
    let active = true;
    requestJson<Profile>("/api/auth/security")
      .then((value) => { if (active) setProfile(value); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const date = (value: number) => formatDate(locale, new Date(value), { day: "numeric", month: "long", year: "numeric" });
  const googleIdentity = profile?.identities.find((identity) => identity.provider === "google");
  return (
    <section className="account-overview" aria-labelledby="account-overview-title">
      <div className="account-overview-head">
        <h3 id="account-overview-title">{t("account.title")}</h3>
        <small>{profile ? t("account.created", { date: date(profile.createdAt) }) : ""}</small>
      </div>
      <ul className="account-methods" aria-label={t("account.methods")}>
        {!google && (
          <li>
            <KeyRound aria-hidden="true" />
            <div>
              <strong>{t("account.methodPassword")}</strong>
              <small>@{username}</small>
            </div>
          </li>
        )}
        {(google || googleIdentity) && (
          <li>
            <GoogleMark />
            <div>
              <strong>{t("account.methodGoogle")}</strong>
              <small>
                {google
                  ? t("account.googleOnly")
                  : googleIdentity && t("account.googleLinked", { date: date(googleIdentity.createdAt) })}
              </small>
            </div>
          </li>
        )}
      </ul>
      {google && <p className="account-note">{t("account.googleNote")}</p>}
    </section>
  );
}
