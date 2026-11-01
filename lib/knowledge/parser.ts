import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractText(file: Buffer, type: string) {
  switch (type) {
    case "application/pdf": {
      const parser = new PDFParse({
        data: new Uint8Array(file),
      });

      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({
        buffer: file,
      });

      return result.value;
    }

    case "text/plain":
      return file.toString("utf-8");

    default:
      throw new Error("Unsupported file type");
  }
}