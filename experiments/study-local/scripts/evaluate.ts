import { readFile, writeFile } from "node:fs/promises";
import { corpus, fixtureName } from "../src/corpus";
import { baselineReport, type CorpusSources } from "../src/evaluate";
import { LabError, decodeText, sourceFromText } from "../src/source";
import { sourceFromPdf, setPdfWorker } from "../src/pdf";
setPdfWorker(new URL("../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).href);
const sources: CorpusSources = [], excluded: { fixtureId: string; code: string }[] = [];
for (const fixture of corpus) {
  const bytes = new Uint8Array(await readFile(new URL(`../fixtures/${fixtureName(fixture)}`, import.meta.url)));
  try { sources.push({ fixtureId: fixture.id, source: fixture.kind === "text" ? await sourceFromText(decodeText(bytes), fixture.title) : await sourceFromPdf(bytes, fixture.title) }); }
  catch (error) {
    if (fixture.id !== "D15" || !(error instanceof LabError) || error.code !== "NO_TEXT") throw error;
    excluded.push({ fixtureId: fixture.id, code: error.code });
  }
}
const report = await baselineReport(sources, excluded, { runtime: process.version, platform: process.platform, arch: process.arch });
await writeFile(new URL("../reports/baseline.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ corpusHash: report.corpusHash, documents: report.readableDocuments, chunks: report.chunks, p95Ms: report.baseline.p95Ms, summary: report.baseline.summary, excluded }, null, 2));
