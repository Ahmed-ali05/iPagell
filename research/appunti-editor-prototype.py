"""Proof of concept for the notes editor specification, not application code.

One deliberately small Markdown AST feeds escaped HTML and paginated PDF.
Run with the bundled Python runtime; PDFs go to output/pdf and QA HTML to
outputs/appunti-editor-prototype.
"""

from __future__ import annotations

from dataclasses import dataclass
from html import escape
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable, KeepTogether, ListFlowable, ListItem, Paragraph,
    SimpleDocTemplate, Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs/appunti-editor-prototype"
PDF_OUT = ROOT / "output/pdf"


@dataclass(frozen=True)
class Block:
    kind: str
    lines: tuple[str, ...]


def inline_tokens(text: str) -> list[tuple[str, str]]:
    """Only backslash escapes and paired **strong** are syntax."""
    result: list[tuple[str, str]] = []
    plain = ""
    index = 0
    while index < len(text):
        if text[index] == "\\" and index + 1 < len(text):
            plain += text[index + 1]
            index += 2
        elif text.startswith("**", index):
            closing = text.find("**", index + 2)
            if closing > index + 2:
                if plain:
                    result.append(("text", plain))
                    plain = ""
                result.append(("strong", text[index + 2:closing]))
                index = closing + 2
            else:
                plain += "**"
                index += 2
        else:
            plain += text[index]
            index += 1
    if plain:
        result.append(("text", plain))
    return result


def parse_limited(source: str) -> list[Block]:
    blocks: list[Block] = []
    lines = source.split("\n")
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line:
            index += 1
            continue
        if line.startswith("## "):
            blocks.append(Block("section", (line[3:],)))
            index += 1
            continue
        kind = "bullet" if line.startswith("- ") else "ordered" if re.match(r"^\d+\. ", line) else "paragraph"
        grouped: list[str] = []
        while index < len(lines) and lines[index]:
            item = lines[index]
            item_kind = "bullet" if item.startswith("- ") else "ordered" if re.match(r"^\d+\. ", item) else "paragraph"
            if item_kind != kind or item.startswith("## "):
                break
            grouped.append(item[2:] if kind == "bullet" else re.sub(r"^\d+\. ", "", item, count=1) if kind == "ordered" else item)
            index += 1
        blocks.append(Block(kind, tuple(grouped)))
    return blocks


def safe_inline_html(value: str) -> str:
    return "".join(("<strong>" + escape(part) + "</strong>") if kind == "strong" else escape(part)
                   for kind, part in inline_tokens(value))


def safe_html(title: str, metadata: str, blocks: list[Block]) -> str:
    body = []
    for block in blocks:
        if block.kind == "section":
            body.append(f"<h2>{safe_inline_html(block.lines[0])}</h2>")
        elif block.kind == "paragraph":
            body.append("<p>" + "<br>".join(safe_inline_html(line) for line in block.lines) + "</p>")
        else:
            tag = "ul" if block.kind == "bullet" else "ol"
            body.append(f"<{tag}>" + "".join(f"<li>{safe_inline_html(line)}</li>" for line in block.lines) + f"</{tag}>")
    return ("<!doctype html><html lang='it'><meta charset='utf-8'><title>Anteprima appunto</title>"
            "<style>body{font:16px/1.55 system-ui;max-width:760px;margin:32px auto;padding:0 20px;color:#172033}"
            "h1{font-size:1.9rem}h2{font-size:1.25rem;margin-top:1.5em}p,li{white-space:pre-wrap}"
            "small{color:#526075}@media print{body{margin:0;max-width:none}h2{break-after:avoid}li{break-inside:avoid}}"
            "</style><main><h1>" + escape(title) + "</h1><small>" + escape(metadata) + "</small>"
            + "".join(body) + "</main></html>")


def pdf_markup(value: str) -> str:
    return "".join(("<b>" + escape(part) + "</b>") if kind == "strong" else escape(part)
                   for kind, part in inline_tokens(value))


def make_pdf(path: Path, title: str, metadata: str, blocks: list[Block]) -> None:
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("NoteTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=19, leading=24, alignment=TA_CENTER, spaceAfter=8)
    meta_style = ParagraphStyle("NoteMeta", parent=styles["Normal"], textColor=colors.HexColor("#526075"), fontSize=9, leading=13, alignment=TA_CENTER, spaceAfter=15)
    heading_style = ParagraphStyle("Section", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=17, spaceBefore=13, spaceAfter=5, keepWithNext=True)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontName="Helvetica", fontSize=10.5, leading=15, spaceAfter=8)
    story = [Paragraph(escape(title), title_style), Paragraph(escape(metadata), meta_style), HRFlowable(width="100%", thickness=.6, color=colors.HexColor("#cdd5e0")), Spacer(1, 10)]
    for block in blocks:
        if block.kind == "section":
            story.append(Paragraph(pdf_markup(block.lines[0]), heading_style))
        elif block.kind == "paragraph":
            story.append(Paragraph("<br/>".join(pdf_markup(line) for line in block.lines), body_style))
        else:
            items = [ListItem(Paragraph(pdf_markup(line), body_style), leftIndent=6) for line in block.lines]
            story.append(KeepTogether(ListFlowable(items, bulletType="bullet" if block.kind == "bullet" else "1", start="circle" if block.kind == "bullet" else "1", leftIndent=20)))
            story.append(Spacer(1, 6))
    def footer(canvas, doc):
        canvas.setFont("Helvetica", 9)
        canvas.setFillColor(colors.HexColor("#526075"))
        canvas.drawRightString(A4[0] - 19 * mm, 14 * mm, f"{doc.page}")
    SimpleDocTemplate(str(path), pagesize=A4, leftMargin=19*mm, rightMargin=19*mm,
                      topMargin=19*mm, bottomMargin=22*mm, title=title,
                      author="iPagell prototype").build(story, onFirstPage=footer, onLaterPages=footer)


def run() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PDF_OUT.mkdir(parents=True, exist_ok=True)
    short = ("## I pianeti\n"
             "Il Sole è una **stella**. La Terra gli gira intorno.\n\n"
             "- Mercurio è il pianeta più vicino.\n- Venere è molto caldo.\n- La Terra ha una Luna.\n\n"
             "Da ricordare: <script>alert(1)</script> e https://example.test/?x=<img> sono testo, non codice o link.")
    long_parts = ["## Come studiare\nQuesta scheda riassume gli argomenti per la verifica. **Leggi una sezione alla volta**.\n"]
    for number in range(1, 25):
        sentence = "Un evento può avere più spiegazioni e le fonti vanno confrontate. "
        long_parts.append(f"\n## Argomento {number}: eventi e conseguenze\n"
                          + f"Nel periodo {number}, persone e luoghi cambiano. La causa principale va distinta dalla conseguenza: "
                          + sentence * 3 + "\n\n"
                          + f"1. Individua la data dell'evento {number}.\n2. Scrivi la **causa** principale.\n3. Spiega la conseguenza con parole tue.\n")
    long = "".join(long_parts)
    for name, source, title, meta in [
        ("breve", short, "Il sistema solare", "Scienze · Appunto personale · 30 settembre 2026"),
        ("lunga", long, "Ripasso di storia", "Storia · Classe 2B · Autore: Ada · 30 settembre 2026"),
    ]:
        blocks = parse_limited(source)
        html = safe_html(title, meta, blocks)
        assert "<script>" not in html and "<img>" not in html and "<a " not in html
        (OUT / f"{name}.html").write_text(html, encoding="utf-8")
        make_pdf(PDF_OUT / f"appunti-prototipo-{name}.pdf", title, meta, blocks)
        print(f"{name}: {len(source)} caratteri, {len(blocks)} blocchi")


if __name__ == "__main__":
    run()
