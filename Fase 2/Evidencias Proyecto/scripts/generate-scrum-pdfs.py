#!/usr/bin/env python3
from __future__ import annotations

import html
import re
import argparse
import json
from sigaa_diagrams import diagram
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageTemplate,
    Paragraph,
    PageBreak,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Gestión Scrum SIGAA"
OUTPUT = SOURCE / "PDF"

GREEN = colors.HexColor("#0B3B33")
GREEN_2 = colors.HexColor("#176B57")
MINT = colors.HexColor("#EAF4F0")
GOLD = colors.HexColor("#D4A72C")
INK = colors.HexColor("#17211F")
MUTED = colors.HexColor("#61706C")
LINE = colors.HexColor("#D7E2DE")
PAPER = colors.HexColor("#FAFCFB")


def register_fonts() -> None:
    base = Path("/System/Library/Fonts/Supplemental")
    pdfmetrics.registerFont(TTFont("SIGAA", str(base / "Arial.ttf")))
    pdfmetrics.registerFont(TTFont("SIGAA-Bold", str(base / "Arial Bold.ttf")))
    pdfmetrics.registerFont(TTFont("SIGAA-Italic", str(base / "Arial Italic.ttf")))
    pdfmetrics.registerFontFamily(
        "SIGAA", normal="SIGAA", bold="SIGAA-Bold", italic="SIGAA-Italic"
    )


def inline_markup(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"<(https?://[^>]+)>", r"\1", text)
    safe = html.escape(text, quote=False)
    safe = re.sub(r"`([^`]+)`", r'<font name="SIGAA-Bold">\1</font>', safe)
    safe = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", safe)
    safe = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", safe)
    return safe.replace('—', '-').replace('–', '-').replace('‑', '-')


def max_table_columns(lines: list[str]) -> int:
    result = 0
    for line in lines:
        if line.strip().startswith("|"):
            result = max(result, len([x for x in line.strip().strip("|").split("|")]))
    return result


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="DocTitle", fontName="SIGAA-Bold", fontSize=22, leading=26,
        textColor=GREEN, spaceAfter=5 * mm, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="Subtitle", fontName="SIGAA", fontSize=9.5, leading=13,
        textColor=MUTED, spaceAfter=5 * mm,
    ))
    styles.add(ParagraphStyle(
        name="H2x", fontName="SIGAA-Bold", fontSize=14, leading=18,
        textColor=GREEN, spaceBefore=5 * mm, spaceAfter=2.5 * mm, keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="H3x", fontName="SIGAA-Bold", fontSize=11.5, leading=15,
        textColor=GREEN_2, spaceBefore=4 * mm, spaceAfter=2 * mm, keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="Bodyx", fontName="SIGAA", fontSize=9.2, leading=13.2,
        textColor=INK, spaceAfter=2.4 * mm,
    ))
    styles.add(ParagraphStyle(
        name="Smallx", fontName="SIGAA", fontSize=7.2, leading=9.2,
        textColor=INK,
    ))
    styles.add(ParagraphStyle(
        name="TableHead", fontName="SIGAA-Bold", fontSize=7.3, leading=9,
        textColor=colors.white, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="CodeBlock", fontName="Courier", fontSize=7.2, leading=9,
        textColor=INK, backColor=MINT, borderColor=LINE, borderWidth=0.5,
        borderPadding=5, spaceAfter=3 * mm,
    ))
    styles.add(ParagraphStyle(
        name="Quotex", fontName="SIGAA-Italic", fontSize=8.8, leading=12.5,
        textColor=GREEN_2, leftIndent=6 * mm, borderColor=GOLD,
        borderWidth=0, borderPadding=4, spaceAfter=3 * mm,
    ))
    return styles


def split_cells(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def is_separator_row(cells: list[str]) -> bool:
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", c.replace(" ", "")) for c in cells)


def table_flowable(rows: list[list[str]], styles, available_width: float):
    clean = [r for r in rows if not is_separator_row(r)]
    if not clean:
        return Spacer(1, 1)
    cols = max(len(r) for r in clean)
    clean = [r + [""] * (cols - len(r)) for r in clean]
    lengths = []
    for idx in range(cols):
        lengths.append(max(8, min(34, max(len(r[idx]) for r in clean))))
    total = sum(lengths)
    widths = [available_width * n / total for n in lengths]
    data = []
    for ridx, row in enumerate(clean):
        style = styles["TableHead"] if ridx == 0 else styles["Smallx"]
        data.append([Paragraph(inline_markup(cell), style) for cell in row])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PAPER]),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table


def parse_markdown(text: str, styles, available_width: float):
    lines = text.splitlines()
    title = next((ln[2:].strip() for ln in lines if ln.startswith("# ")), "Informe SIGAA")
    story = [Paragraph(inline_markup(title), styles["DocTitle"])]
    story.append(Paragraph(
        "SIGAA · Expediente de gestión Scrum · Capstone 2026",
        styles["Subtitle"],
    ))
    story.append(HRFlowable(width="100%", thickness=1.6, color=GOLD, spaceAfter=5 * mm))

    paragraph_buffer: list[str] = []
    list_buffer: list[str] = []
    in_code = False
    code_language = ''
    code_buffer: list[str] = []
    used_h1 = False
    i = 0

    def flush_paragraph():
        nonlocal paragraph_buffer
        if paragraph_buffer:
            story.append(Paragraph(inline_markup(" ".join(x.strip() for x in paragraph_buffer)), styles["Bodyx"]))
            paragraph_buffer = []

    def flush_list():
        nonlocal list_buffer
        if list_buffer:
            items = [ListItem(Paragraph(inline_markup(x), styles["Bodyx"]), leftIndent=4 * mm) for x in list_buffer]
            story.append(ListFlowable(items, bulletType="bullet", start="circle", leftIndent=6 * mm, bulletColor=GOLD))
            story.append(Spacer(1, 1.5 * mm))
            list_buffer = []

    while i < len(lines):
        raw = lines[i]
        stripped = raw.strip()
        if stripped == ':::pagebreak':
            flush_paragraph(); flush_list()
            story.append(PageBreak())
            i += 1
            continue
        if stripped.startswith(':::diagram '):
            flush_paragraph(); flush_list()
            story.append(diagram(stripped.split()[1], available_width))
            i += 1
            continue
        if stripped.startswith("```"):
            flush_paragraph(); flush_list()
            if in_code:
                if code_language == 'mermaid':
                    first = code_buffer[0].strip()
                    if first == 'mindmap':
                        kind = 'mindmap'
                    elif first == 'flowchart LR' and any('Dirección / UTP' in row for row in code_buffer):
                        kind = 'impact'
                    else:
                        raise ValueError('Mermaid diagram needs an explicit renderer; refusing to print raw code')
                    story.append(diagram(kind, available_width))
                else:
                    story.append(Paragraph("<br/>".join(html.escape(x) or " " for x in code_buffer), styles["CodeBlock"]))
                code_buffer = []
                in_code = False
            else:
                in_code = True
                code_language = stripped[3:].strip()
            i += 1
            continue
        if in_code:
            code_buffer.append(raw)
            i += 1
            continue
        if stripped.startswith("|"):
            flush_paragraph(); flush_list()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(split_cells(lines[i]))
                i += 1
            story.append(table_flowable(rows, styles, available_width))
            story.append(Spacer(1, 3 * mm))
            continue
        if not stripped:
            flush_paragraph(); flush_list(); i += 1; continue
        if stripped.startswith("# "):
            if not used_h1:
                used_h1 = True
            else:
                flush_paragraph(); flush_list()
                story.append(Paragraph(inline_markup(stripped[2:]), styles["H2x"]))
            i += 1; continue
        if stripped.startswith("## "):
            flush_paragraph(); flush_list()
            story.append(Paragraph(inline_markup(stripped[3:]), styles["H2x"]))
            i += 1; continue
        if stripped.startswith("### "):
            flush_paragraph(); flush_list()
            story.append(Paragraph(inline_markup(stripped[4:]), styles["H3x"]))
            i += 1; continue
        if stripped.startswith("#### "):
            flush_paragraph(); flush_list()
            story.append(Paragraph(inline_markup(stripped[5:]), styles["H3x"]))
            i += 1; continue
        if re.match(r"^[-*] ", stripped):
            flush_paragraph()
            list_buffer.append(stripped[2:].strip())
            i += 1; continue
        if re.match(r"^\d+\. ", stripped):
            flush_paragraph(); flush_list()
            match = re.match(r"^(\d+)\. (.*)$", stripped)
            story.append(Paragraph(f"<b>{match.group(1)}.</b> {inline_markup(match.group(2))}", styles["Bodyx"]))
            i += 1; continue
        if stripped.startswith(">"):
            flush_paragraph(); flush_list()
            story.append(Paragraph(inline_markup(stripped.lstrip("> ")), styles["Quotex"]))
            i += 1; continue
        if list_buffer and raw[:1].isspace():
            list_buffer[-1] = f"{list_buffer[-1]} {stripped}"
            i += 1; continue
        paragraph_buffer.append(stripped)
        i += 1
    flush_paragraph(); flush_list()
    if code_buffer:
        story.append(Paragraph("<br/>".join(html.escape(x) or " " for x in code_buffer), styles["CodeBlock"]))
    return title, story


class SigaaDocTemplate(BaseDocTemplate):
    def __init__(self, filename, title: str, page_size):
        self.report_title = title
        self.page_size = page_size
        width, height = page_size
        super().__init__(
            filename,
            pagesize=page_size,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=20 * mm,
            bottomMargin=17 * mm,
            title=title,
            author="Equipo SIGAA",
            subject="Expediente de gestión Scrum SIGAA",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="content")
        self.addPageTemplates(PageTemplate(id="sigaa", frames=[frame], onPage=self.decorate))

    def decorate(self, canvas, doc):
        width, height = self.page_size
        canvas.saveState()
        canvas.setFillColor(GREEN)
        canvas.rect(0, height - 8 * mm, width, 8 * mm, fill=1, stroke=0)
        canvas.setFillColor(GOLD)
        canvas.rect(0, height - 9 * mm, width, 1 * mm, fill=1, stroke=0)
        canvas.setFont("SIGAA-Bold", 7.5)
        canvas.setFillColor(GREEN)
        canvas.drawString(18 * mm, 9 * mm, "SIGAA · Gestión Scrum")
        canvas.setFont("SIGAA", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(width - 18 * mm, 9 * mm, f"Página {doc.page}")
        canvas.restoreState()


def build_pdf(source_file: Path, output_file: Path, styles) -> tuple[int, str]:
    text = source_file.read_text(encoding="utf-8")
    lines = text.splitlines()
    wide = max_table_columns(lines) >= 6
    page_size = landscape(A4) if wide else A4
    width, _ = page_size
    available = width - 36 * mm
    title, story = parse_markdown(text, styles, available)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    doc = SigaaDocTemplate(str(output_file), title, page_size)
    doc.build(story)
    return len(story), title


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('sources', nargs='*', type=Path)
    parser.add_argument('--manifest', type=Path)
    args = parser.parse_args()
    register_fonts()
    styles = make_styles()
    if args.manifest:
        entries = json.loads(args.manifest.read_text(encoding='utf-8'))
        outputs = [e['output'] for e in entries]
        if len(outputs) != len(set(outputs)):
            raise ValueError('Duplicate PDF output in manifest')
        for entry in entries:
            source, target = ROOT / entry['source'], ROOT / entry['output']
            build_pdf(source, target, styles)
            print(target.relative_to(ROOT))
        print(f'Generated {len(entries)} PDFs')
        return
    sources = args.sources or sorted(p for p in SOURCE.rglob("*.md") if OUTPUT not in p.parents)
    results = []
    mapping = {str(ROOT / e['source']): ROOT / e['output'] for e in json.loads((ROOT / 'scripts/document-regularization.json').read_text())}
    for source in sources:
        source = source.resolve()
        relative = source.relative_to(SOURCE)
        target = OUTPUT / relative.with_suffix(".pdf")
        target = mapping.get(str(source.resolve()), target)
        count, title = build_pdf(source, target, styles)
        results.append((relative, target.relative_to(ROOT), count, title))
    print(f"Generated {len(results)} PDFs")
    for source, target, _, _ in results:
        print(f"{source} -> {target}")


if __name__ == "__main__":
    main()
