"use server";
import fs from "fs";
import mdToPdf from "md-to-pdf";

const downloadPdf = async () => {
  const pdf = await mdToPdf({ path: "/content/resume.md" }).catch(
    console.error
  );

  if (pdf) {
    fs.writeFileSync(pdf.filename!, pdf.content);
  }
};

export { downloadPdf };
