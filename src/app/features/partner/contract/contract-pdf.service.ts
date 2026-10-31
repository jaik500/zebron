import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

import { ContractOverview } from './organization-contract.service';

const PAGE_MARGIN = 54;
const BRAND: [number, number, number] = [0, 121, 121];
const DARK: [number, number, number] = [3, 45, 66];
const TEXT: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  deactivated: 'Retired',
  selected: 'Requested',
  provisioning: 'Provisioning',
  failed: 'Provisioning failed',
  available: 'Available',
};

/**
 * Builds the downloadable contract: summary, parties, provisioned
 * applications, billing contact, agreement text and acceptance record.
 */
@Injectable({
  providedIn: 'root',
})
export class ContractPdfService {
  download(overview: ContractOverview, applicationName: (id: string) => string): void {
    const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    const contentWidth = width - PAGE_MARGIN * 2;

    let y = PAGE_MARGIN;

    const ensureSpace = (needed: number): void => {
      if (y + needed > height - PAGE_MARGIN) {
        pdf.addPage();
        y = PAGE_MARGIN;
      }
    };

    const heading = (text: string, size = 13): void => {
      // Room above the heading so it doesn't crowd the text before it
      // (y is the baseline of the next line). Not at the top of a page.
      if (y > PAGE_MARGIN) {
        y += size >= 13 ? 16 : 10;
      }
      ensureSpace(size + 24);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(size);
      pdf.setTextColor(...DARK);
      pdf.text(text, PAGE_MARGIN, y);
      y += size + 10;
    };

    const paragraph = (text: string, size = 10, color: [number, number, number] = TEXT): void => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(...color);

      const lines = pdf.splitTextToSize(text, contentWidth) as string[];
      const lineHeight = size * 1.45;

      for (const line of lines) {
        ensureSpace(lineHeight);
        pdf.text(line, PAGE_MARGIN, y);
        y += lineHeight;
      }

      y += 6;
    };

    const row = (label: string, value: string): void => {
      pdf.setFontSize(10);
      const valueLines = pdf.splitTextToSize(value || '—', contentWidth - 150) as string[];
      ensureSpace(valueLines.length * 14 + 4);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...MUTED);
      pdf.text(label, PAGE_MARGIN, y);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...TEXT);
      valueLines.forEach((line, index) => pdf.text(line, PAGE_MARGIN + 150, y + index * 14));

      y += valueLines.length * 14 + 4;
    };

    const { contract, organization, terms } = overview;

    // ---------------- Header band ----------------
    pdf.setFillColor(...DARK);
    pdf.rect(0, 0, width, 86, 'F');
    pdf.setFillColor(...BRAND);
    pdf.rect(0, 86, width, 4, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(terms.title || 'Zebron Partner Agreement', PAGE_MARGIN, 46);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Contract ${contract.contractNumber}  ·  ${organization.name}`, PAGE_MARGIN, 66);

    y = 108;

    // ---------------- Summary ----------------
    heading('Contract summary');
    row('Partner', organization.name);
    row('Provider', 'Zebron');
    row('Contract number', contract.contractNumber);
    row('Plan', contract.planName);
    row('Status', this.contractStatus(overview));
    row('Effective date', this.date(contract.effectiveDate));
    row('Notice period', `${contract.noticePeriodDays} days`);
    row('Agreement version', terms.version);
    y += 6;

    // ---------------- Billing ----------------
    heading('Billing contact');
    row('Name', contract.billingContact.name ?? '');
    row('Email', contract.billingContact.email ?? '');
    row('Phone', contract.billingContact.phone ?? '');
    row('Address', contract.billingContact.address ?? '');
    paragraph('Fees, if any, are set out in a separate order or invoice agreed with Zebron.', 9, MUTED);

    // ---------------- Applications ----------------
    heading('Provisioned applications');

    const provisioned = overview.applications.filter((application) =>
      ['active', 'suspended', 'provisioning', 'selected'].includes(application.status),
    );

    if (provisioned.length === 0) {
      paragraph('No applications are provisioned yet.', 10, MUTED);
    } else {
      y += 4;
      ensureSpace(24);
      pdf.setFillColor(240, 247, 247);
      pdf.rect(PAGE_MARGIN, y - 12, contentWidth, 18, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...DARK);
      pdf.text('Application', PAGE_MARGIN + 6, y);
      pdf.text('Status', PAGE_MARGIN + 250, y);
      pdf.text('Active since', PAGE_MARGIN + 360, y);
      y += 18;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      for (const application of provisioned) {
        ensureSpace(18);
        pdf.setTextColor(...TEXT);
        pdf.text(applicationName(application.applicationId), PAGE_MARGIN + 6, y);
        pdf.text(STATUS_LABELS[application.status] ?? application.status, PAGE_MARGIN + 250, y);
        pdf.text(this.date(application.activatedAt), PAGE_MARGIN + 360, y);
        pdf.setDrawColor(229, 231, 235);
        pdf.line(PAGE_MARGIN, y + 6, PAGE_MARGIN + contentWidth, y + 6);
        y += 18;
      }

      y += 8;
    }

    // ---------------- Termination ----------------
    if (contract.termination) {
      heading('Termination notice');
      row('Notice given', this.date(contract.termination.requestedAt));
      row('Given by', contract.termination.requestedByName ?? '');
      row('Access ends', this.date(contract.termination.effectiveDate));
      if (contract.termination.reason) {
        row('Reason', contract.termination.reason);
      }
      y += 6;
    }

    // ---------------- Agreement ----------------
    pdf.addPage();
    y = PAGE_MARGIN;
    heading(terms.title || 'Agreement', 16);
    paragraph(`Version ${terms.version}`, 9, MUTED);

    for (const section of terms.sections) {
      heading(section.heading, 11);
      paragraph(section.body);
    }

    // ---------------- Acceptance ----------------
    y += 10;
    heading('Acceptance');

    if (contract.acceptedAt) {
      paragraph(
        `Accepted on behalf of ${organization.name} by ${contract.acceptedByName ?? 'the organization owner'} ` +
          `on ${this.date(contract.acceptedAt)} (version ${contract.acceptedTermsVersion}).`,
      );

      if (contract.acceptedTermsVersion !== terms.version) {
        paragraph('Note: the agreement has been updated since it was accepted.', 9, MUTED);
      }
    } else {
      paragraph('Not yet accepted. The organization owner can accept it on the Contract & Billing page.', 10, MUTED);
    }

    // ---------------- Footer on every page ----------------
    const pages = pdf.getNumberOfPages();
    const generated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    for (let page = 1; page <= pages; page++) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...MUTED);
      pdf.text(`${organization.name} · ${contract.contractNumber} · Generated ${generated}`, PAGE_MARGIN, height - 28);
      pdf.text(`Page ${page} of ${pages}`, width - PAGE_MARGIN, height - 28, { align: 'right' });
    }

    const safeName = organization.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'organization';
    pdf.save(`zebron-contract-${safeName}-${contract.contractNumber}.pdf`);
  }

  private contractStatus(overview: ContractOverview): string {
    switch (overview.contract.status) {
      case 'notice':
        return `Ending on ${this.date(overview.contract.termination?.effectiveDate ?? null)} (notice given)`;
      case 'terminated':
        return `Ended ${this.date(overview.contract.terminatedAt)}`;
      default:
        return 'Active';
    }
  }

  private date(value: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
