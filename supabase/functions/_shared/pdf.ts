import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

// WinAnsi (fontes padrão do PDF) cobre o português; troca o que estiver fora dela.
const winAnsi = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ•]/g, '');

export async function renderPdf(title: string, text: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, M = 64, size = 10.5, lead = 15.5;
  let page = pdf.addPage([W, H]);
  let y = H - M;

  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
  const wrap = (line: string, f = font, s = size) => {
    const words = line.split(/\s+/);
    const out: string[] = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(test, s) > W - 2 * M && cur) { out.push(cur); cur = w; } else cur = test;
    }
    out.push(cur);
    return out;
  };

  page.drawText(winAnsi(title), { x: M, y, size: 14, font: bold, color: rgb(0.04, 0.12, 0.23) });
  y -= 30;
  for (const raw of winAnsi(text).split('\n')) {
    const isHeading = /^(CLÁUSULA|CLAUSULA|\d+\.)\s/i.test(raw.trim()) && raw.trim().length < 90;
    const f = isHeading ? bold : font;
    if (!raw.trim()) { y -= lead * 0.6; continue; }
    for (const l of wrap(raw.trim(), f)) {
      if (y < M) newPage();
      page.drawText(l, { x: M, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
      y -= lead;
    }
    if (isHeading) y -= 2;
  }
  return pdf.save();
}
