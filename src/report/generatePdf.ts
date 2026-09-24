import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import { formatDisplayDate } from '../utils/dates';
import { reportFileName } from './fileName';
import {
  conditionLabel,
  holdsAirLabel,
  missingValveCoverCountLabel,
  outcomeLabel,
  photoCaption,
  pieceHeading,
  readyLabel,
  serialLabel,
  valveCoverMissingLabel,
  weightLabel,
} from './labels';
import { classifyPiece, findingReasons, pieceFlags } from './summary';
import type { InspectionReport, ReportLayout, ReportPiece } from './types';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const INK = rgb(0.11, 0.1, 0.08);
const MUTED = rgb(0.36, 0.34, 0.3);
const RULE = rgb(0.85, 0.81, 0.76);
const FLAG = rgb(0.95, 0.92, 0.88);
const REPAIR = rgb(0.54, 0.29, 0.07);
const OK = rgb(0.12, 0.42, 0.29);

export async function generateInspectionPdf(
  report: InspectionReport,
  layout: ReportLayout,
): Promise<{ bytes: Uint8Array; fileName: string }> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const writer = new PdfWriter(doc, font, fontBold);

  if (layout === 'findings') {
    await drawFindingsLayout(writer, report);
  } else if (layout === 'sheets') {
    await drawSheetsLayout(writer, report);
  } else {
    await drawClassicLayout(writer, report);
  }

  writer.numberPages();

  const bytes = await doc.save();
  return { bytes, fileName: reportFileName(report.inspection, layout) };
}

class PdfWriter {
  page: PDFPage;
  y = PAGE_HEIGHT - MARGIN;
  pageIndex = 0;

  constructor(
    readonly doc: PDFDocument,
    readonly font: PDFFont,
    readonly fontBold: PDFFont,
  ) {
    this.page = this.addPage();
  }

  addPage(): PDFPage {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
    this.pageIndex += 1;
    return this.page;
  }

  ensure(height: number): void {
    if (this.y - height < MARGIN + 24) {
      this.addPage();
    }
  }

  gap(size = 10): void {
    this.y -= size;
  }

  text(
    value: string,
    options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; width?: number } = {},
  ): void {
    const size = options.size ?? 11;
    const font = options.bold ? this.fontBold : this.font;
    const color = options.color ?? INK;
    const width = options.width ?? CONTENT_WIDTH;
    const lines = wrapText(value, font, size, width);
    const lineHeight = size + 4;
    this.ensure(lines.length * lineHeight);
    for (const line of lines) {
      if (line) {
        this.page.drawText(line, {
          x: MARGIN,
          y: this.y - size,
          size,
          font,
          color,
        });
      }
      this.y -= lineHeight;
    }
  }

  numberPages(): void {
    const count = this.doc.getPageCount();
    for (let index = 0; index < count; index += 1) {
      const page = this.doc.getPage(index);
      page.drawText(`Page ${index + 1} of ${count}`, {
        x: MARGIN,
        y: 28,
        size: 9,
        font: this.font,
        color: MUTED,
      });
    }
  }
}

async function drawClassicLayout(writer: PdfWriter, report: InspectionReport): Promise<void> {
  const { inspection, summary } = report;
  writer.text('End of season condition report', { size: 10, color: MUTED });
  writer.gap(6);
  writer.text('Aqua Park Condition Inspection', { size: 22, bold: true });
  writer.gap(4);
  writer.text(inspection.siteName || 'No site name', { size: 16 });
  writer.gap(12);
  writer.text(`Inspection  ${inspection.name || 'Untitled inspection'}`, { size: 11 });
  writer.text(`Date  ${formatDisplayDate(inspection.inspectionDate)}`, { size: 11 });
  writer.text(`Inspector  ${inspection.inspectorName || 'Not recorded'}`, { size: 11 });
  writer.gap(14);
  writer.text(
    inspection.notes.trim() ||
      'Prepared for the lake owner. Findings are from a physical inspection of inflatable equipment after removal from the water.',
    { size: 11, color: MUTED },
  );

  writer.addPage();
  writer.text('Executive summary', { size: 16, bold: true });
  writer.gap(10);
  drawKpis(writer, summary);
  writer.gap(10);
  writer.text(missingValveCoverCountLabel(summary.missingValveCovers), { size: 12, bold: true });
  writer.gap(14);
  writer.text('Needs attention', { size: 13, bold: true });
  writer.gap(6);
  const attention = report.pieces.filter((entry) => {
    const outcome = classifyPiece(entry);
    return outcome === 'repair' || outcome === 'unsuitable';
  });
  if (attention.length === 0) {
    writer.text('No repair or withdrawal items were recorded.', { color: MUTED });
  } else {
    for (const entry of attention) {
      const reasons = findingReasons(entry);
      writer.text(
        `${pieceHeading(entry.piece)} — ${reasons[0] ?? outcomeLabel(classifyPiece(entry))}`,
        { size: 11 },
      );
    }
  }
  if (summary.unassessed > 0) {
    writer.gap(8);
    writer.text(
      `${summary.unassessed} piece${summary.unassessed === 1 ? '' : 's'} not yet assessed.`,
      { color: MUTED, size: 10 },
    );
  }

  for (const entry of report.pieces) {
    writer.addPage();
    await drawPieceDetail(writer, entry);
  }
}

async function drawFindingsLayout(writer: PdfWriter, report: InspectionReport): Promise<void> {
  const { inspection } = report;
  writer.text(`${inspection.siteName || 'Site'} · ${formatDisplayDate(inspection.inspectionDate)}`, {
    size: 10,
    color: MUTED,
  });
  writer.gap(6);
  writer.text('What needs doing', { size: 22, bold: true });
  writer.gap(8);
  writer.text('This page is the working list for the owner. Pieces not listed here are ready as-is.', {
    size: 11,
    color: MUTED,
  });
  writer.gap(8);
  writer.text(missingValveCoverCountLabel(report.summary.missingValveCovers), {
    size: 12,
    bold: true,
  });
  writer.gap(12);

  const unsuitable = report.pieces.filter((entry) => classifyPiece(entry) === 'unsuitable');
  const repair = report.pieces.filter((entry) => classifyPiece(entry) === 'repair');

  writer.text('Do not use', { size: 13, bold: true });
  writer.gap(6);
  if (unsuitable.length === 0) {
    writer.text('None.', { color: MUTED });
  } else {
    for (const entry of unsuitable) {
      await drawFindingBlock(writer, entry);
    }
  }

  writer.gap(12);
  writer.text('Repair before next season', { size: 13, bold: true });
  writer.gap(6);
  if (repair.length === 0) {
    writer.text('None.', { color: MUTED });
  } else {
    for (const entry of repair) {
      await drawFindingBlock(writer, entry);
    }
  }

  writer.addPage();
  writer.text('Full inventory', { size: 16, bold: true });
  writer.gap(8);
  drawInventoryTable(writer, report.pieces);
}

async function drawSheetsLayout(writer: PdfWriter, report: InspectionReport): Promise<void> {
  const header = `${report.inspection.siteName || 'Site'} · ${formatDisplayDate(report.inspection.inspectionDate)} · ${report.inspection.inspectorName || 'Inspector not recorded'} · ${missingValveCoverCountLabel(report.summary.missingValveCovers)}`;

  if (report.pieces.length === 0) {
    writer.text(header, { size: 10, color: MUTED });
    writer.gap(10);
    writer.text('No pieces were recorded on this inspection.', { color: MUTED });
    return;
  }

  for (let index = 0; index < report.pieces.length; index += 1) {
    const entry = report.pieces[index];
    if (!entry) {
      continue;
    }
    if (index > 0) {
      writer.addPage();
    }
    writer.text(header, { size: 10, color: MUTED });
    drawRule(writer);
    writer.gap(10);
    await drawPieceSheet(writer, entry);
  }
}

async function drawPieceDetail(writer: PdfWriter, entry: ReportPiece): Promise<void> {
  const outcome = classifyPiece(entry);
  writer.text(pieceHeading(entry.piece), { size: 16, bold: true });
  writer.text(outcomeLabel(outcome), {
    size: 12,
    bold: true,
    color: outcome === 'ready' ? OK : outcome === 'unassessed' ? MUTED : REPAIR,
  });
  writer.text(
    `${serialLabel(entry.piece)} · Holds pressure: ${holdsAirLabel(entry.piece.holdsAir)} · D-ring: ${conditionLabel(entry.piece.connectingDRingCondition)} · Valve cover missing: ${valveCoverMissingLabel(entry.piece.valveCoverMissing)}`,
    { size: 10, color: MUTED },
  );
  if (entry.piece.holdsAirNotes.trim()) {
    writer.text(entry.piece.holdsAirNotes.trim(), { size: 10, color: MUTED });
  }
  if (entry.piece.readyNotes.trim()) {
    writer.text(entry.piece.readyNotes.trim(), { size: 10, color: MUTED });
  }
  writer.gap(10);
  drawAnchorTable(writer, entry);
  const reasons = findingReasons(entry);
  if (reasons.length > 0) {
    writer.gap(8);
    for (const reason of reasons) {
      writer.text(reason, { size: 10, color: MUTED });
    }
  }
  writer.gap(10);
  await drawPhotoRow(writer, entry);
}

async function drawFindingBlock(writer: PdfWriter, entry: ReportPiece): Promise<void> {
  writer.ensure(70);
  drawRule(writer);
  writer.gap(6);
  writer.text(`${pieceHeading(entry.piece)} · ${serialLabel(entry.piece)}`, { size: 12, bold: true });
  for (const reason of findingReasons(entry)) {
    writer.text(reason, { size: 11 });
  }
  await drawPhotoRow(writer, entry, 1);
}

async function drawPieceSheet(writer: PdfWriter, entry: ReportPiece): Promise<void> {
  const outcome = classifyPiece(entry);
  writer.text(pieceHeading(entry.piece), { size: 18, bold: true });
  writer.text(serialLabel(entry.piece), { size: 11, color: MUTED });
  writer.text(outcomeLabel(outcome), {
    size: 12,
    bold: true,
    color: outcome === 'ready' ? OK : outcome === 'unassessed' ? MUTED : REPAIR,
  });
  writer.gap(8);
  writer.text(`Holds pressure  ${holdsAirLabel(entry.piece.holdsAir)}`, { size: 11 });
  if (entry.piece.holdsAirNotes.trim()) {
    writer.text(entry.piece.holdsAirNotes.trim(), { size: 10, color: MUTED });
  }
  writer.text(
    `Connecting D-ring  ${conditionLabel(entry.piece.connectingDRingCondition)}`,
    { size: 11 },
  );
  if (entry.piece.connectingDRingNotes.trim()) {
    writer.text(entry.piece.connectingDRingNotes.trim(), { size: 10, color: MUTED });
  }
  writer.text(
    `Valve cover missing  ${valveCoverMissingLabel(entry.piece.valveCoverMissing)}`,
    { size: 11 },
  );
  if (entry.anchors.length === 0) {
    writer.text('Anchors  None recorded', { size: 11 });
  } else {
    for (const anchor of entry.anchors) {
      writer.text(
        `Anchor ${anchor.anchorNumber}  ${weightLabel(anchor.weightKg)} · line ${conditionLabel(anchor.lineCondition)}`,
        { size: 11 },
      );
    }
  }
  if (entry.piece.readyNotes.trim()) {
    writer.gap(4);
    writer.text(entry.piece.readyNotes.trim(), { size: 10, color: MUTED });
  } else {
    const reasons = findingReasons(entry);
    if (reasons.length > 0) {
      writer.gap(4);
      for (const reason of reasons) {
        writer.text(reason, { size: 10, color: MUTED });
      }
    } else if (outcome === 'ready') {
      writer.gap(4);
      writer.text('No defects. Suitable for use next season without repair.', {
        size: 10,
        color: MUTED,
      });
    }
  }
  writer.gap(12);
  await drawPhotoRow(writer, entry);
}

function drawKpis(writer: PdfWriter, summary: InspectionReport['summary']): void {
  const cells = [
    { value: String(summary.total), label: 'Pieces inspected' },
    { value: String(summary.ready), label: 'Ready' },
    { value: String(summary.repair), label: 'Ready if repaired' },
    { value: String(summary.unsuitable), label: 'Not ready' },
  ];
  const gap = 8;
  const cellWidth = (CONTENT_WIDTH - gap * 3) / 4;
  const height = 48;
  writer.ensure(height);
  cells.forEach((cell, index) => {
    const x = MARGIN + index * (cellWidth + gap);
    writer.page.drawRectangle({
      x,
      y: writer.y - height,
      width: cellWidth,
      height,
      borderColor: RULE,
      borderWidth: 1,
    });
    writer.page.drawText(cell.value, {
      x: x + 8,
      y: writer.y - 22,
      size: 16,
      font: writer.fontBold,
      color: INK,
    });
    writer.page.drawText(cell.label, {
      x: x + 8,
      y: writer.y - 38,
      size: 8,
      font: writer.font,
      color: MUTED,
    });
  });
  writer.y -= height;
}

function drawAnchorTable(writer: PdfWriter, entry: ReportPiece): void {
  const columns = [90, 120, 180];
  const headers = ['Anchor', 'Weight', 'Line'];
  const rowHeight = 18;
  writer.ensure(rowHeight * (entry.anchors.length + 1));
  drawTableHeader(writer, columns, headers, rowHeight);
  if (entry.anchors.length === 0) {
    writer.page.drawText('No anchors recorded', {
      x: MARGIN + 4,
      y: writer.y - 13,
      size: 10,
      font: writer.font,
      color: MUTED,
    });
    writer.y -= rowHeight;
    return;
  }

  for (const anchor of entry.anchors) {
    const flagged = conditionLabel(anchor.lineCondition) === 'Damaged';
    if (flagged) {
      writer.page.drawRectangle({
        x: MARGIN,
        y: writer.y - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: FLAG,
      });
    }
    const values = [
      anchor.anchorNumber,
      weightLabel(anchor.weightKg),
      conditionLabel(anchor.lineCondition),
    ];
    let x = MARGIN;
    values.forEach((value, index) => {
      writer.page.drawText(value, {
        x: x + 4,
        y: writer.y - 13,
        size: 10,
        font: writer.font,
        color: INK,
      });
      x += columns[index] ?? 80;
    });
    writer.y -= rowHeight;
  }
}

function drawInventoryTable(writer: PdfWriter, pieces: ReportPiece[]): void {
  const columns = [80, 90, 120, 160];
  const headers = ['Piece', 'Pressure', 'Ready', 'Flags'];
  const rowHeight = 18;
  drawTableHeader(writer, columns, headers, rowHeight);
  if (pieces.length === 0) {
    writer.text('No pieces recorded.', { color: MUTED });
    return;
  }

  for (const entry of pieces) {
    writer.ensure(rowHeight);
    const values = [
      entry.piece.pieceNumber.trim() || '—',
      holdsAirLabel(entry.piece.holdsAir),
      readyLabel(entry.piece.readyStatus),
      pieceFlags(entry).join(', ') || '—',
    ];
    let x = MARGIN;
    values.forEach((value, index) => {
      writer.page.drawText(clip(value, writer.font, 10, (columns[index] ?? 80) - 8), {
        x: x + 4,
        y: writer.y - 13,
        size: 10,
        font: writer.font,
        color: INK,
      });
      x += columns[index] ?? 80;
    });
    writer.y -= rowHeight;
  }
}

function drawTableHeader(
  writer: PdfWriter,
  columns: number[],
  headers: string[],
  rowHeight: number,
): void {
  writer.ensure(rowHeight);
  let x = MARGIN;
  headers.forEach((header, index) => {
    writer.page.drawText(header, {
      x: x + 4,
      y: writer.y - 13,
      size: 10,
      font: writer.fontBold,
      color: INK,
    });
    x += columns[index] ?? 80;
  });
  writer.y -= rowHeight;
  drawRule(writer);
}

function drawRule(writer: PdfWriter): void {
  writer.page.drawLine({
    start: { x: MARGIN, y: writer.y },
    end: { x: PAGE_WIDTH - MARGIN, y: writer.y },
    thickness: 0.6,
    color: RULE,
  });
}

async function drawPhotoRow(
  writer: PdfWriter,
  entry: ReportPiece,
  limit = 4,
): Promise<void> {
  const photos = entry.photos.slice(0, limit);
  if (photos.length === 0) {
    return;
  }

  const gap = 8;
  const columns = Math.min(photos.length, 2);
  const cellWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
  const imageHeight = 110;

  for (let index = 0; index < photos.length; index += columns) {
    const row = photos.slice(index, index + columns);
    writer.ensure(imageHeight + 18);
    for (let column = 0; column < row.length; column += 1) {
      const photo = row[column];
      if (!photo) {
        continue;
      }
      const x = MARGIN + column * (cellWidth + gap);
      const image = await embedPhoto(writer.doc, photo.blob);
      if (!image) {
        writer.page.drawRectangle({
          x,
          y: writer.y - imageHeight,
          width: cellWidth,
          height: imageHeight,
          color: FLAG,
        });
      } else {
        const fitted = fitContain(image.width, image.height, cellWidth, imageHeight);
        writer.page.drawImage(image, {
          x,
          y: writer.y - fitted.height,
          width: fitted.width,
          height: fitted.height,
        });
      }
      writer.page.drawText(clip(photoCaption(photo), writer.font, 8, cellWidth), {
        x,
        y: writer.y - imageHeight - 12,
        size: 8,
        font: writer.font,
        color: MUTED,
      });
    }
    writer.y -= imageHeight + 18;
  }
}

async function embedPhoto(doc: PDFDocument, blob: Blob): Promise<PDFImage | null> {
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (blob.type.includes('png')) {
      return await doc.embedPng(bytes);
    }
    return await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

function fitContain(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: maxWidth, height: maxHeight };
  }
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
}

function pdfSafe(value: string): string {
  return value
    .replaceAll('—', '-')
    .replaceAll('–', '-')
    .replaceAll('·', '-')
    .replaceAll('…', '...')
    .replaceAll('’', "'")
    .replaceAll('‘', "'")
    .replaceAll('“', '"')
    .replaceAll('”', '"');
}

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = pdfSafe(value).replace(/\s+/g, ' ').trim().split(' ');
  if (words.length === 1 && words[0] === '') {
    return [''];
  }
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    current = word;
    if (font.widthOfTextAtSize(current, size) > maxWidth) {
      lines.push(clip(current, font, size, maxWidth));
      current = '';
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.length > 0 ? lines : [''];
}

function clip(value: string, font: PDFFont, size: number, maxWidth: number): string {
  const safe = pdfSafe(value);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) {
    return safe;
  }
  let clipped = safe;
  while (clipped.length > 1 && font.widthOfTextAtSize(`${clipped}...`, size) > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}...`;
}