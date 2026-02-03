import mammoth from 'mammoth';

export async function extractTextFromFile(buffer: Buffer, mimeType: string, originalName: string): Promise<string> {
    try {
        if (mimeType === 'application/pdf') {
            return new Promise((resolve, reject) => {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const PDFParser = require('pdf2json');
                    const pdfParser = new PDFParser(null, 1); // 1 = text only

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    pdfParser.on("pdfParser_dataError", (errData: any) => {
                        console.error("PDF Parser Error:", errData.parserError);
                        reject(new Error(errData.parserError));
                    });

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    pdfParser.on("pdfParser_dataReady", () => {
                        try {
                            const text = pdfParser.getRawTextContent();
                            resolve(`--- START PDF: ${originalName} ---\n${text}\n--- END PDF ---`);
                        } catch (e) {
                            reject(e);
                        }
                    });

                    pdfParser.parseBuffer(buffer);
                } catch (e) {
                    reject(e);
                }
            });
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
