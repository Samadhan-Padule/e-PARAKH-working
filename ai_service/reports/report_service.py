import html
import os
import uuid
from datetime import datetime, timezone


REPORTS_DIR = os.path.join("reports", "generated")
os.makedirs(REPORTS_DIR, exist_ok=True)


def _safe(value):
    if value is None:
        return "N/A"

    if isinstance(value, (dict, list)):
        return str(value)

    return html.escape(str(value))


def _format_value(value):
    if value is None:
        return "N/A"

    if isinstance(value, bool):
        return "Yes" if value else "No"

    if isinstance(value, (dict, list)):
        return str(value)

    return str(value)


def _build_rows(data):
    if not isinstance(data, dict):
        return ""

    rows = []

    for key, value in data.items():
        label = str(key).replace("_", " ").title()
        rows.append(
            f"""
            <tr>
                <th>{_safe(label)}</th>
                <td>{_safe(_format_value(value))}</td>
            </tr>
            """
        )

    return "\n".join(rows)


def _build_list(items):
    if not items:
        return "<p>N/A</p>"

    if not isinstance(items, list):
        items = [items]

    return "<ul>" + "".join(
        f"<li>{_safe(_format_value(item))}</li>"
        for item in items
    ) + "</ul>"


def _build_evidence(evidence):
    if not evidence:
        return "<p>N/A</p>"

    if isinstance(evidence, dict):
        return _build_rows(evidence)

    return _build_list(evidence)


def _build_pdf_text(report):
    """
    Creates a standards-compliant, minimal PDF using only
    Python's standard library.
    """

    lines = []

    lines.append("e-PARAKH COMPLIANCE INSPECTION REPORT")
    lines.append("=" * 60)
    lines.append("")
    lines.append(f"Report ID: {report['report_id']}")
    lines.append(f"Generated At: {report['generated_at']}")
    lines.append(f"Photograph: {report['photograph_reference']}")
    lines.append("")

    lines.append("EXTRACTED OCR TEXT")
    lines.append("-" * 60)
    lines.extend(report["ocr_text"].splitlines() or ["N/A"])
    lines.append("")

    lines.append("DECLARATIONS")
    lines.append("-" * 60)

    declarations = report["declarations"]

    if isinstance(declarations, dict):
        for key, value in declarations.items():
            lines.append(
                f"{str(key).replace('_', ' ').title()}: "
                f"{_format_value(value)}"
            )
    else:
        lines.append(_format_value(declarations))

    lines.append("")

    lines.append("COMPLIANCE CHECKS")
    lines.append("-" * 60)

    compliance = report["compliance"]

    if isinstance(compliance, dict):
        for key, value in compliance.items():
            lines.append(
                f"{str(key).replace('_', ' ').title()}: "
                f"{_format_value(value)}"
            )
    else:
        lines.append(_format_value(compliance))

    lines.append("")

    lines.append("VISION SUMMARY")
    lines.append("-" * 60)

    vision = report["vision_summary"]

    if isinstance(vision, dict):
        for key, value in vision.items():
            lines.append(
                f"{str(key).replace('_', ' ').title()}: "
                f"{_format_value(value)}"
            )
    else:
        lines.append(_format_value(vision))

    lines.append("")

    lines.append("EVIDENCE")
    lines.append("-" * 60)

    evidence = report["evidence"]

    if isinstance(evidence, dict):
        for key, value in evidence.items():
            lines.append(
                f"{str(key).replace('_', ' ').title()}: "
                f"{_format_value(value)}"
            )
    elif isinstance(evidence, list):
        for item in evidence:
            lines.append(f"- {_format_value(item)}")
    else:
        lines.append(_format_value(evidence))

    lines.append("")

    lines.append("REMARKS")
    lines.append("-" * 60)
    lines.append(_format_value(report["remarks"]))
    lines.append("")

    return lines


def _escape_pdf_text(value):
    value = str(value)

    # PDF standard fonts cannot reliably represent arbitrary Unicode.
    # Replace unsupported characters rather than corrupting the PDF.
    value = value.encode("latin-1", "replace").decode("latin-1")

    value = value.replace("\\", "\\\\")
    value = value.replace("(", "\\(")
    value = value.replace(")", "\\)")

    return value


def _create_pdf(lines, output_path):
    """
    Creates a minimal valid PDF using only the Python standard library.
    """

    page_width = 595
    page_height = 842

    margin_x = 50
    start_y = 790
    line_height = 14

    # Split into pages.
    pages = []
    current_page = []
    y = start_y

    for line in lines:
        # Basic wrapping.
        text = str(line)

        max_chars = 90

        if not text:
            chunks = [""]
        else:
            chunks = [
                text[i:i + max_chars]
                for i in range(0, len(text), max_chars)
            ]

        for chunk in chunks:
            if y < 50:
                pages.append(current_page)
                current_page = []
                y = start_y

            current_page.append((chunk, y))
            y -= line_height

    if current_page:
        pages.append(current_page)

    objects = []

    # Object 1: Catalog
    objects.append(
        "<< /Type /Catalog /Pages 2 0 R >>"
    )

    # Object 2: Pages
    page_object_ids = []

    # We need objects for pages + content streams.
    next_object_id = 3

    for _ in pages:
        page_object_ids.append(next_object_id)
        next_object_id += 2

    kids = " ".join(
        f"{page_id} 0 R"
        for page_id in page_object_ids
    )

    objects.append(
        f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>"
    )

    for page_index, page_lines in enumerate(pages):
        page_id = page_object_ids[page_index]
        content_id = page_id + 1

        stream_lines = [
            "BT",
            "/F1 10 Tf",
        ]

        first = True

        for text, y_position in page_lines:
            escaped = _escape_pdf_text(text)

            if first:
                stream_lines.append(
                    f"{margin_x} {y_position} Td"
                )
                first = False
            else:
                stream_lines.append(
                    f"0 -{line_height} Td"
                )

            stream_lines.append(
                f"({_escape_pdf_text(escaped)}) Tj"
            )

        stream_lines.append("ET")

        stream = "\n".join(stream_lines).encode("latin-1", "replace")

        while len(objects) < content_id:
            objects.append(None)

        objects[page_id - 1] = (
            "<< /Type /Page "
            "/Parent 2 0 R "
            f"/MediaBox [0 0 {page_width} {page_height}] "
            "/Resources << /Font << /F1 "
            f"{len(objects) + 1} 0 R >> >> "
            f"/Contents {content_id} 0 R >>"
        )

        objects[content_id - 1] = (
            f"<< /Length {len(stream)} >>\n"
            f"stream\n{stream.decode('latin-1')}\nendstream"
        )

    # Add font object.
    font_id = len(objects) + 1

    objects.append(
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    )

    # Fix page references to the actual font object.
    for index, obj in enumerate(objects):
        if isinstance(obj, str) and "/F1" in obj and "/Resources" in obj:
            objects[index] = obj.replace(
                f"{len(objects)} 0 R",
                f"{font_id} 0 R"
            )

    pdf = bytearray()
    pdf.extend(b"%PDF-1.4\n")

    offsets = [0]

    for object_number, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))

        pdf.extend(
            f"{object_number} 0 obj\n".encode("latin-1")
        )

        pdf.extend(
            str(obj).encode("latin-1", "replace")
        )

        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)

    pdf.extend(
        f"xref\n0 {len(objects) + 1}\n".encode("latin-1")
    )

    pdf.extend(b"0000000000 65535 f \n")

    for offset in offsets[1:]:
        pdf.extend(
            f"{offset:010d} 00000 n \n".encode("latin-1")
        )

    pdf.extend(
        (
            f"trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n"
            f"%%EOF"
        ).encode("latin-1")
    )

    with open(output_path, "wb") as file:
        file.write(pdf)


def generate_report(
    photograph_reference,
    ocr_text,
    declarations,
    compliance,
    vision_summary,
    evidence,
    remarks=""
):
    report_id = str(uuid.uuid4())

    generated_at = datetime.now(timezone.utc).isoformat()

    report = {
        "report_id": report_id,
        "generated_at": generated_at,
        "photograph_reference": photograph_reference or "N/A",
        "ocr_text": ocr_text or "",
        "declarations": declarations or {},
        "compliance": compliance or {},
        "vision_summary": vision_summary or {},
        "evidence": evidence or {},
        "remarks": remarks or "",
    }

    html_path = os.path.join(
        REPORTS_DIR,
        f"{report_id}.html"
    )

    pdf_path = os.path.join(
        REPORTS_DIR,
        f"{report_id}.pdf"
    )

    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">

<title>e-PARAKH Compliance Report</title>

<style>
body {{
    font-family: Arial, Helvetica, sans-serif;
    background: #f4f6f8;
    color: #1f2937;
    margin: 0;
    padding: 40px;
}}

.report {{
    max-width: 1000px;
    margin: auto;
    background: white;
    padding: 40px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}}

.header {{
    border-bottom: 3px solid #1f4e79;
    padding-bottom: 20px;
    margin-bottom: 30px;
}}

h1 {{
    margin: 0;
    color: #1f4e79;
}}

h2 {{
    color: #1f4e79;
    margin-top: 30px;
}}

.meta {{
    background: #f3f4f6;
    padding: 15px;
    margin-top: 20px;
}}

table {{
    width: 100%;
    border-collapse: collapse;
}}

th, td {{
    border: 1px solid #d1d5db;
    padding: 10px;
    text-align: left;
    vertical-align: top;
}}

th {{
    width: 30%;
    background: #f3f4f6;
}}

pre {{
    white-space: pre-wrap;
    background: #f8fafc;
    padding: 15px;
    border: 1px solid #e5e7eb;
}}

.footer {{
    margin-top: 40px;
    padding-top: 15px;
    border-top: 1px solid #d1d5db;
    font-size: 12px;
    color: #6b7280;
}}
</style>

</head>

<body>

<div class="report">

<div class="header">
    <h1>e-PARAKH</h1>
    <p>Legal Metrology Compliance Inspection Report</p>

    <div class="meta">
        <strong>Report ID:</strong> {_safe(report_id)}<br>
        <strong>Generated At:</strong> {_safe(generated_at)}<br>
        <strong>Photograph Reference:</strong>
        {_safe(photograph_reference)}
    </div>
</div>

<h2>1. OCR Extracted Text</h2>

<pre>{_safe(ocr_text or "N/A")}</pre>


<h2>2. Extracted Declarations</h2>

<table>
{_build_rows(declarations)}
</table>


<h2>3. Compliance Checks</h2>

<table>
{_build_rows(compliance)}
</table>


<h2>4. Vision Analysis Summary</h2>

<table>
{_build_rows(vision_summary)}
</table>


<h2>5. Evidence</h2>

<table>
{_build_evidence(evidence)}
</table>


<h2>6. Remarks</h2>

<p>{_safe(remarks or "No remarks provided.")}</p>


<div class="footer">
    Generated by e-PARAKH AI OCR &amp; Compliance System.
</div>

</div>

</body>
</html>
"""

    with open(html_path, "w", encoding="utf-8") as file:
        file.write(html_content)

    pdf_lines = _build_pdf_text(report)
    _create_pdf(pdf_lines, pdf_path)

    return {
        "report_id": report_id,
        "generated_at": generated_at,
        "html_path": html_path,
        "pdf_path": pdf_path,
    }