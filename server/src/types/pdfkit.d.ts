declare module 'pdfkit' {
  interface PDFDocument {
    pipe(destination: any): PDFDocument;
    end(): void;
    fontSize(size: number): PDFDocument;
    text(text: string, x?: number, y?: number, options?: any): PDFDocument;
    moveTo(x: number, y: number): PDFDocument;
    lineTo(x: number, y: number): PDFDocument;
    stroke(): PDFDocument;
  }

  interface PDFDocumentOptions {
    margin?: number;
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
  }

  export = PDFDocument;
}
