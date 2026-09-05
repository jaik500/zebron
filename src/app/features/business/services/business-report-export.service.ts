import { Injectable } from '@angular/core';

export interface BusinessReportExportData {
  businessName: string;
  periodLabel: string;

  revenue: number;
  expenses: number;
  netIncome: number;
  transactionCount: number;

  revenueTransactionCount: number;
  expenseTransactionCount: number;

  overdueCompliance: number;
  actionRequiredCompliance: number;
  upcomingCompliance: number;

  documentCount: number;
  activityCount: number;

  financialTrend: Array<{
    label: string;
    revenue: number;
    expenses: number;
    netIncome: number;
  }>;

  categoryBreakdown: Array<{
    name: string;
    type: 'revenue' | 'expense';
    amount: number;
  }>;

  transactions: Array<{
    date: string;
    type: string;
    category: string;
    amount: number;
    status: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class BusinessReportExportService {

  // ============================================================
  // PDF EXPORT
  // ============================================================

 async exportPdf(report: BusinessReportExportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();

    let y = 20;

    // ----------------------------------------------------------
    // Header
    // ----------------------------------------------------------

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Business Report', 20, y);

    y += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(report.businessName || 'Business', 20, y);

    y += 7;

    pdf.setFontSize(10);
    pdf.text(`Reporting Period: ${report.periodLabel}`, 20, y);

    y += 15;

    // ----------------------------------------------------------
    // Financial Summary
    // ----------------------------------------------------------

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Summary', 20, y);

    y += 9;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const financialRows = [
      ['Revenue', this.formatCurrency(report.revenue)],
      ['Expenses', this.formatCurrency(report.expenses)],
      ['Net Income', this.formatCurrency(report.netIncome)],
      ['Transactions', String(report.transactionCount)],
    ];

    for (const [label, value] of financialRows) {
      pdf.text(label, 25, y);
      pdf.text(value, pageWidth - 25, y, { align: 'right' });
      y += 7;
    }

    y += 8;

    // ----------------------------------------------------------
    // Transaction Breakdown
    // ----------------------------------------------------------

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Transaction Breakdown', 20, y);

    y += 9;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    pdf.text(
      `Revenue Transactions: ${report.revenueTransactionCount}`,
      25,
      y
    );

    y += 7;

    pdf.text(
      `Expense Transactions: ${report.expenseTransactionCount}`,
      25,
      y
    );

    y += 15;

    // ----------------------------------------------------------
    // Business Health
    // ----------------------------------------------------------

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Business Health', 20, y);

    y += 9;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const healthRows = [
      ['Overdue Compliance', report.overdueCompliance],
      ['Action Required', report.actionRequiredCompliance],
      ['Upcoming Compliance', report.upcomingCompliance],
      ['Documents', report.documentCount],
      ['Activities', report.activityCount],
    ];

    for (const [label, value] of healthRows) {
      pdf.text(String(label), 25, y);
      pdf.text(String(value), pageWidth - 25, y, {
        align: 'right',
      });

      y += 7;
    }

    // ----------------------------------------------------------
    // Financial Trend
    // ----------------------------------------------------------

    y += 8;

    if (y > 245) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Trend', 20, y);

    y += 10;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');

    pdf.text('Period', 20, y);
    pdf.text('Revenue', 75, y, { align: 'right' });
    pdf.text('Expenses', 120, y, { align: 'right' });
    pdf.text('Net Income', 170, y, { align: 'right' });

    y += 6;

    pdf.setFont('helvetica', 'normal');

    for (const period of report.financialTrend) {
      if (y > 275) {
        pdf.addPage();
        y = 20;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Financial Trend', 20, y);

        y += 10;

        pdf.setFontSize(9);
        pdf.text('Period', 20, y);
        pdf.text('Revenue', 75, y, { align: 'right' });
        pdf.text('Expenses', 120, y, { align: 'right' });
        pdf.text('Net Income', 170, y, { align: 'right' });

        y += 6;
        pdf.setFont('helvetica', 'normal');
      }

      pdf.text(period.label, 20, y);

      pdf.text(
        this.formatCurrency(period.revenue),
        75,
        y,
        { align: 'right' }
      );

      pdf.text(
        this.formatCurrency(period.expenses),
        120,
        y,
        { align: 'right' }
      );

      pdf.text(
        this.formatCurrency(period.netIncome),
        170,
        y,
        { align: 'right' }
      );

      y += 6;
    }

    // ----------------------------------------------------------
    // Category Breakdown
    // ----------------------------------------------------------

    if (y > 240) {
      pdf.addPage();
      y = 20;
    }

    y += 8;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Category Breakdown', 20, y);

    y += 10;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');

    pdf.text('Category', 20, y);
    pdf.text('Type', 120, y);
    pdf.text('Amount', 175, y, { align: 'right' });

    y += 6;

    pdf.setFont('helvetica', 'normal');

    for (const category of report.categoryBreakdown) {
      if (y > 275) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(category.name.substring(0, 45), 20, y);
      pdf.text(category.type, 120, y);

      pdf.text(
        this.formatCurrency(category.amount),
        175,
        y,
        { align: 'right' }
      );

      y += 6;
    }

    // ----------------------------------------------------------
    // Footer / Page Numbers
    // ----------------------------------------------------------

    const pageCount = pdf.getNumberOfPages();

    for (let page = 1; page <= pageCount; page++) {
      pdf.setPage(page);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');

      pdf.text(
        `Generated ${new Date().toLocaleDateString()}`,
        20,
        290
      );

      pdf.text(
        `Page ${page} of ${pageCount}`,
        pageWidth - 20,
        290,
        { align: 'right' }
      );
    }

    const fileName =
      `${this.safeFileName(report.businessName)}-business-report.pdf`;

    pdf.save(fileName);
  }

  // ============================================================
  // EXCEL EXPORT
  // ============================================================

  async exportExcel(
  report: BusinessReportExportData
): Promise<void> {
  const XLSX = await import('xlsx');

  const workbook = XLSX.utils.book_new();

    // ----------------------------------------------------------
    // Summary
    // ----------------------------------------------------------

    const summaryRows = [
      ['Business Report'],
      [],
      ['Business', report.businessName],
      ['Reporting Period', report.periodLabel],
      [],
      ['Financial Summary'],
      ['Revenue', report.revenue],
      ['Expenses', report.expenses],
      ['Net Income', report.netIncome],
      ['Transactions', report.transactionCount],
      [],
      ['Transaction Breakdown'],
      ['Revenue Transactions', report.revenueTransactionCount],
      ['Expense Transactions', report.expenseTransactionCount],
      [],
      ['Business Health'],
      ['Overdue Compliance', report.overdueCompliance],
      ['Action Required', report.actionRequiredCompliance],
      ['Upcoming Compliance', report.upcomingCompliance],
      ['Documents', report.documentCount],
      ['Activities', report.activityCount],
    ];

    const summarySheet =
      XLSX.utils.aoa_to_sheet(summaryRows);

    summarySheet['!cols'] = [
      { wch: 28 },
      { wch: 25 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      'Summary'
    );

    // ----------------------------------------------------------
    // Transactions
    // ----------------------------------------------------------

    const transactionRows = report.transactions.map(
      transaction => ({
        Date: transaction.date,
        Type: transaction.type,
        Category: transaction.category,
        Amount: transaction.amount,
        Status: transaction.status,
      })
    );

    const transactionSheet =
      XLSX.utils.json_to_sheet(transactionRows);

    transactionSheet['!cols'] = [
      { wch: 18 },
      { wch: 15 },
      { wch: 30 },
      { wch: 18 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      transactionSheet,
      'Transactions'
    );

    // ----------------------------------------------------------
    // Financial Trend
    // ----------------------------------------------------------

    const trendRows = report.financialTrend.map(
      period => ({
        Period: period.label,
        Revenue: period.revenue,
        Expenses: period.expenses,
        'Net Income': period.netIncome,
      })
    );

    const trendSheet =
      XLSX.utils.json_to_sheet(trendRows);

    trendSheet['!cols'] = [
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      trendSheet,
      'Financial Trend'
    );

    // ----------------------------------------------------------
    // Categories
    // ----------------------------------------------------------

    const categoryRows = report.categoryBreakdown.map(
      category => ({
        Category: category.name,
        Type: category.type,
        Amount: category.amount,
      })
    );

    const categorySheet =
      XLSX.utils.json_to_sheet(categoryRows);

    categorySheet['!cols'] = [
      { wch: 35 },
      { wch: 15 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      categorySheet,
      'Categories'
    );

    // ----------------------------------------------------------
    // Export
    // ----------------------------------------------------------

    const fileName =
      `${this.safeFileName(report.businessName)}-business-report.xlsx`;

    XLSX.writeFile(workbook, fileName);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  private safeFileName(value: string): string {
    return (value || 'business')
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  
}