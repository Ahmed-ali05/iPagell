import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFile, mkdir } from "node:fs/promises";
import { corpus, fixtureName } from "../src/corpus";
const root = new URL("../fixtures/", import.meta.url);
await mkdir(root, { recursive: true });
for (const doc of corpus) {
  if (doc.kind === "text") { await writeFile(new URL(fixtureName(doc), root), doc.passages.map(([text]) => text).join("\n\n")); continue; }
  const pdf = await PDFDocument.create();
  // Stable bytes across regenerations; no real names, metadata or third-party content.
  pdf.setCreationDate(new Date("2026-10-07T00:00:00Z")); pdf.setModificationDate(new Date("2026-10-07T00:00:00Z"));
  pdf.setTitle(doc.title); pdf.setAuthor("iPagell synthetic study-local-eval-v1");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, x: number, y: number, width = 75) => {
    const words = text.split(" "); const lines: string[] = []; let line = "";
    for (const word of words) { if (line.length + word.length + 1 > width) { lines.push(line); line = ""; } line += (line ? " " : "") + word; }
    lines.push(line);
    for (const [i, row] of lines.entries()) page.drawText(row, { x, y: y - i * 14, size: 10, font });
  };
  let page = pdf.addPage([595, 842]);
  if (doc.kind === "image") {
    const png = await pdf.embedPng(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64"));
    page.drawImage(png, { x: 50, y: 50, width: 400, height: 600 });
  } else if (doc.kind === "columns") {
    // Five pages with two columns; the extractor's ordering must remain inspectable.
    for (let p = 0; p < 5; p++) {
      if (p) page = pdf.addPage([595, 842]);
      for (let col = 0; col < 2; col++) {
        for (let row = 0; row < 9; row++) draw(`Osservazione sintetica ${p * 18 + col * 9 + row + 1}: i dati descrivono il campione, senza identificare studenti.`, 35 + col * 280, 700 - row * 60, 39);
      }
      if (p < doc.passages.length) draw(doc.passages[p][0], 35, 800, 78);
    }
  } else {
    doc.passages.forEach(([text], i) => draw(text, 40, 780 - i * 140));
    if (doc.kind === "mixed") {
      page = pdf.addPage([595, 842]);
      const png = await pdf.embedPng(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64"));
      page.drawImage(png, { x: 50, y: 50, width: 400, height: 600 });
      page.drawRectangle({ x: 100, y: 200, width: 200, height: 200, color: rgb(.3, .3, .3) });
    }
  }
  await writeFile(new URL(fixtureName(doc), root), await pdf.save());
}
console.log(`Generated ${corpus.length} synthetic fixtures.`);
