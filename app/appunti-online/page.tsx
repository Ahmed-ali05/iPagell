import { headers } from "next/headers";
import { PublicNotes } from "@/components/public-notes";
import { publicSpaceMetadata } from "@/lib/i18n/public-page";
export async function generateMetadata() {
  return publicSpaceMetadata("it", "notes", (await headers()).get("host")?.split(":")[0] === "ipagell.website");
}
export default function NotesPage() { return <PublicNotes />; }
