import pdfParse from 'pdf-parse'
import mammoth  from 'mammoth'
import { logger } from './logger'

export type SupportedMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain'

const SUPPORTED_MIME_TYPES: SupportedMimeType[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export function isSupportedMimeType(mime: string): mime is SupportedMimeType {
  return SUPPORTED_MIME_TYPES.includes(mime as SupportedMimeType)
}

/**
 * Extract all hyperlink href targets from an HTML string.
 * Filters out anchor fragments (#) and mailto: links (those are already
 * captured as visible text in the raw text extraction).
 */
function extractHrefsFromHtml(html: string): string[] {
  const matches = [...html.matchAll(/href="([^"]+)"/g)]
  return matches
    .map(m => m[1])
    .filter(url => !url.startsWith('#') && !url.startsWith('mailto:'))
}

/**
 * Extract plain text from a file buffer.
 * Supports PDF, DOCX, and plain text.
 *
 * For DOCX files, we run both extractRawText (for the body text) AND
 * convertToHtml (to recover hyperlink href targets that are stored as Word
 * relationship URLs and would otherwise be lost with raw-text-only extraction).
 * Any recovered URLs are appended as a clearly-labelled block so the LLM can
 * reliably find and extract them into the links field.
 */
export async function extractText(
  buffer:   Buffer,
  mimeType: string,
): Promise<string> {
  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Use PDF, DOCX, or TXT.`)
  }

  let text = ''

  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer)
    text = data.text
    logger.debug(`[fileParser] PDF parsed — ${data.numpages} pages`)
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Run both extractions in parallel
    const [textResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer }),
    ])

    text = textResult.value
    logger.debug('[fileParser] DOCX parsed')

    // Recover any hyperlink URLs that are stored as relationship targets and
    // are NOT already visible in the raw text (e.g. the displayed text is
    // "GitHub" but the href is "https://github.com/username").
    const hrefs = extractHrefsFromHtml(htmlResult.value)
    if (hrefs.length > 0) {
      // Only append URLs that are not already present in the raw text
      const newUrls = hrefs.filter(url => !text.includes(url))
      if (newUrls.length > 0) {
        text += '\n\n[DOCUMENT HYPERLINKS]\n' + newUrls.join('\n')
        logger.debug(`[fileParser] Appended ${newUrls.length} hyperlink URL(s) recovered from DOCX relationships`)
      }
    }
  } else {
    text = buffer.toString('utf-8')
    logger.debug('[fileParser] TXT parsed')
  }

  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!cleaned) {
    throw new Error('Could not extract text from file — the document may be empty or image-only')
  }

  return cleaned
}
