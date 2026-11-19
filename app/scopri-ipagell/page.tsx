import { headers } from "next/headers";
import { LandingContent } from "@/components/landing-content";
import { publicSpaceMetadata } from "@/lib/i18n/public-page";
export async function generateMetadata() {
  return publicSpaceMetadata("it", "diary", (await headers()).get("host")?.split(":")[0] === "ipagell.website");
}
export default function DiaryPage() { return <LandingContent section="diary" />; }
