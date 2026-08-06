// subset-font ships no types. Only the call shape scripts/subset-display-font.ts
// uses is declared here.
declare module "subset-font" {
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: { targetFormat?: "sfnt" | "woff" | "woff2"; variationAxes?: Record<string, unknown> }
  ): Promise<Buffer>;
}
