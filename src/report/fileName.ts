import type { Inspection } from '../models';
import type { ReportLayout } from './types';

export function reportFileName(inspection: Inspection, layout: ReportLayout): string {
  const site = slugPart(inspection.siteName) || 'site';
  const name = slugPart(inspection.name) || 'inspection';
  return `${site}-${name}-${layout}.pdf`;
}

function slugPart(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
