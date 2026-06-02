// pdf-parse/lib/pdf-parse.js type declarations
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PDFParseResult {
    text: string;
    // additional properties may exist
    [key: string]: any;
  }
  const pdf: (buffer: Buffer) => Promise<PDFParseResult>;
  export default pdf;
}
