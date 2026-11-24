import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

// WinAnsi (fontes padrão do PDF) cobre o português; troca o que estiver fora dela.
const winAnsi = (s: string) =>
  s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u2022]/g, '');

export interface CampoAssinatura { page: number; x: number; y: number; w: number; h: number }

export async function renderPdf(title: string, text: string) {
  return (await renderPdfComAssinatura(title, text)).bytes;
}

/**
 * Gera o PDF e, se `assinante` vier, reserva no fim um bloco de assinatura.
 * Devolve a posição do bloco em % da página (formato dos campos do Documenso).
 */
export async function renderPdfComAssinatura(title: string, text: string, assinante?: string) {
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

  let campo: CampoAssinatura | null = null;
  if (assinante) {
    const boxH = 70, boxW = 240;
    if (y - 40 - boxH - 30 < M) newPage();
    y -= 40;
    const top = y;
    page.drawLine({ start: { x: M, y: top - boxH }, end: { x: M + boxW, y: top - boxH }, thickness: 0.8, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(winAnsi(assinante), { x: M, y: top - boxH - 14, size: 9.5, font: bold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText('Assinatura eletronica', { x: M, y: top - boxH - 27, size: 8.5, font, color: rgb(0.4, 0.4, 0.4) });
    campo = {
      page: pdf.getPageCount(),
      x: (M / W) * 100, y: ((H - top) / H) * 100,
      w: (boxW / W) * 100, h: ((boxH - 4) / H) * 100,
    };
  }
  return { bytes: await pdf.save(), campo };
}
