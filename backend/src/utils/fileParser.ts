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
 * Extract plain text from a file buffer.
 * Supports PDF, DOCX, and plain text.
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
    const result = await mammoth.extractRawText({ buffer })
    text = result.value
    logger.debug('[fileParser] DOCX parsed')
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
