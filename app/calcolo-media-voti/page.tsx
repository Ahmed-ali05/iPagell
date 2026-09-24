import type { Metadata } from "next";
import { headers } from "next/headers";
import { GradeAverageCalculator } from "@/components/grade-average-calculator";
import { publicAverageMetadata } from "@/lib/i18n/public-page";

export async function generateMetadata(): Promise<Metadata> {
  const hostname = (await headers()).get("host")?.split(":")[0];
  return publicAverageMetadata("it", hostname === "ipagell.website");
}

export default function ItalianAverage() { return <GradeAverageCalculator />; }
