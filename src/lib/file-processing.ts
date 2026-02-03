import mammoth from 'mammoth';

export async function extractTextFromFile(buffer: Buffer, mimeType: string, originalName: string): Promise<string> {
    try {
        if (mimeType === 'application/pdf') {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pdfModule = require('pdf-parse');
            // Check for various export styles (default vs named vs direct)
            const parseFunc = typeof pdfModule === 'function' ? pdfModule : (pdfModule.default || pdfModule.PDFParse);

            if (typeof parseFunc !== 'function') {
                throw new Error('PDF parsing library could not be loaded correctly.');
            }

            const data = await parseFunc(buffer);
            return `--- START PDF: ${originalName} ---\n${data.text}\n--- END PDF ---`;
        }

        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            return `--- START DOCX: ${originalName} ---\n${result.value}\n--- END DOCX ---`;
        }

        if (mimeType === 'text/plain') {
            const text = buffer.toString('utf-8');
            return `--- START TXT: ${originalName} ---\n${text}\n--- END TXT ---`;
        }

        // For images or unknown types, we just return metadata. 
        // Images will be handled via Vision API separately often, but for text context:
        if (mimeType.startsWith('image/')) {
            return `[Image Attachment: ${originalName}]`;
        }

        return `[Attachment: ${originalName} (${mimeType}) - Content extraction not supported]`;

    } catch (error) {
        console.error(`Error extracting text from ${originalName}:`, error);
        return `[Error extracting content from ${originalName}]`;
    }
}
