import { IncomingForm } from "formidable";
import fs from "fs";
import { PDFDocument } from "pdf-lib";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const form = new IncomingForm({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    try {
      const filePath = files.file.filepath;
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // حذف النصوص العربي والانجليزي
      const arabicRegex = /ع\s*م\s*ر\s*م\s*ح\s*م\s*د\s*ع\s*ب\s*د\s*ا\s*ل\s*ح\s*م\s*ي\s*د\s*ح\s*ل\s*ه/g;
      const englishRegex = /UG_31185800@med\.tanta\.edu\.eg|2024\/2025/g;

      const pages = pdfDoc.getPages();
      for (const page of pages) {
        let text = page.getTextContent?.() || "";
        text = text.replace(arabicRegex, "").replace(englishRegex, "");
        // إعادة الكتابة على الصفحة
        page.drawText(text, { x: 10, y: 750 });
      }

      const newPdfBytes = await pdfDoc.save();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=cleaned.pdf");
      res.send(Buffer.from(newPdfBytes));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Processing error" });
    }
  });
}
