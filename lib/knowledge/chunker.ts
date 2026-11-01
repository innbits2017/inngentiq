export interface TextChunk {
  content: string;
  chunkIndex: number;
}

export interface TextChunk {
  chunkIndex: number;
  content: string;
}

export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 200
): TextChunk[] {
  text = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  const chunks: TextChunk[] = [];

  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Prefer paragraph break
    if (end < text.length) {
      const paragraph = text.lastIndexOf("\n\n", end);

      if (paragraph > start + chunkSize * 0.6) {
        end = paragraph;
      } else {
        const sentence = text.lastIndexOf(".", end);

        if (sentence > start + chunkSize * 0.6) {
          end = sentence + 1;
        }
      }
    }

    const chunk = text.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push({
        chunkIndex: index++,
        content: chunk,
      });
    }

    // Stop when we've reached the end
    if (end >= text.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}