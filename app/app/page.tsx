import type { Metadata } from "next";
import { IPagellApp } from "@/components/ipagell-app";

export const metadata: Metadata = {
  title: "Diario",
  description: "Area personale iPagell per voti, agenda, assenze e classi.",
  alternates: { canonical: "/app" },
  robots: { index: false, follow: false },
};

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return (
    <IPagellApp
      initialAccountMode={mode === "register" ? "register" : "login"}
    />
  );
}
