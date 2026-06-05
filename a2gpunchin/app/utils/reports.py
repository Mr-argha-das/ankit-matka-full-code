from io import BytesIO, StringIO
from typing import Any

import openpyxl
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def rows_to_csv(headers: list[str], rows: list[list[Any]]) -> bytes:
    buffer = StringIO()
    buffer.write(",".join(headers) + "\n")
    for row in rows:
        buffer.write(",".join(str(cell).replace(",", " ") for cell in row) + "\n")
    return buffer.getvalue().encode()


def rows_to_excel(headers: list[str], rows: list[list[Any]]) -> bytes:
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = "Sheet1"
    sheet.append(headers)
    for row in rows:
        sheet.append(row)
    sheet.column_dimensions["A"].width = 14
    sheet.column_dimensions["B"].width = 18
    sheet.column_dimensions["C"].width = 16
    sheet.column_dimensions["D"].width = 12
    sheet.column_dimensions["E"].width = 12
    sheet.column_dimensions["F"].width = 15
    sheet.column_dimensions["G"].width = 10
    sheet.column_dimensions["H"].width = 14
    for row in range(2, sheet.max_row + 1):
        sheet[f"C{row}"].number_format = "mm-dd-yy"
        sheet[f"D{row}"].number_format = "h:mm"
        sheet[f"E{row}"].number_format = "h:mm"
        sheet[f"F{row}"].number_format = "h:mm"
    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def rows_to_pdf(title: str, headers: list[str], rows: list[list[Any]]) -> bytes:
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4)
    y = 800
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, y, title)
    y -= 32
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(40, y, " | ".join(headers))
    pdf.setFont("Helvetica", 8)
    y -= 18
    for row in rows:
        if y < 50:
            pdf.showPage()
            y = 800
        pdf.drawString(40, y, " | ".join(str(cell)[:24] for cell in row))
        y -= 14
    pdf.save()
    return output.getvalue()
