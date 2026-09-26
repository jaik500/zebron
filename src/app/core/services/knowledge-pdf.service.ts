import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

import { KnowledgeArticle } from '../models/knowledge-article.model';

interface PdfBlock {
  type:
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'paragraph'
    | 'bullet'
    | 'numbered'
    | 'quote'
    | 'code';
  text: string;
  number?: number;
}

@Injectable({
  providedIn: 'root',
})
export class KnowledgePdfService {
  private readonly pageWidth = 210;
  private readonly pageHeight = 297;

  private readonly marginLeft = 20;
  private readonly marginRight = 20;
  private readonly marginTop = 28;
  private readonly marginBottom = 22;

  private readonly contentWidth =
    this.pageWidth -
    this.marginLeft -
    this.marginRight;

  async download(
    article: KnowledgeArticle,
  ): Promise<void> {
    if (!article.downloadable) {
      throw new Error(
        'This knowledge article is not available for download.',
      );
    }

    if (!article.title.trim()) {
      throw new Error(
        'A knowledge article title is required to generate a PDF.',
      );
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    let y = this.renderDocumentHeader(
      pdf,
      article,
    );

    y = this.renderMetadata(
      pdf,
      article,
      y,
    );

    if (article.summary?.trim()) {
      y = this.renderSectionHeading(
        pdf,
        'Summary',
        y,
      );

      y = this.renderParagraph(
        pdf,
        article.summary.trim(),
        y,
        {
          fontSize: 10.5,
          lineHeight: 5.2,
        },
      );

      y += 4;
    }

 const blocks = this.parseContent(
  article.content,
  article.title,
);

    for (const block of blocks) {
      y = this.renderBlock(
        pdf,
        block,
        y,
      );
    }

    this.renderFooters(pdf, article);

    const filename =
      `${this.slugify(article.title)}` +
      `-v${article.version}.pdf`;

    pdf.save(filename);
  }

  // ============================================================
  // DOCUMENT HEADER
  // ============================================================

  private renderDocumentHeader(
    pdf: jsPDF,
    article: KnowledgeArticle,
  ): number {
    pdf.setFillColor(0, 67, 91);

    pdf.rect(
      0,
      0,
      this.pageWidth,
      18,
      'F',
    );

    pdf.setTextColor(255, 255, 255);

    pdf.setFont(
      'helvetica',
      'bold',
    );

    pdf.setFontSize(10);

    pdf.text(
      'ZEBRON',
      this.marginLeft,
      11,
    );

    pdf.setFont(
      'helvetica',
      'normal',
    );

    pdf.setFontSize(8.5);

    pdf.text(
      'Knowledge Article',
      this.pageWidth -
        this.marginRight,
      11,
      {
        align: 'right',
      },
    );

    let y = 31;

    pdf.setTextColor(20, 30, 45);

    pdf.setFont(
      'helvetica',
      'bold',
    );

    pdf.setFontSize(22);

    const titleLines =
      pdf.splitTextToSize(
        this.cleanInlineMarkdown(
          article.title,
        ),
        this.contentWidth,
      );

    pdf.text(
      titleLines,
      this.marginLeft,
      y,
    );

    y +=
      titleLines.length *
        8 +
      5;

    pdf.setFont(
      'helvetica',
      'normal',
    );

    pdf.setFontSize(9);

    pdf.setTextColor(
      90,
      100,
      110,
    );

    const updatedText =
      `Last updated: ${this.formatDate(article.updatedAt)}`;

    pdf.text(
      updatedText,
      this.marginLeft,
      y,
    );

    return y + 8;
  }

  // ============================================================
  // METADATA
  // ============================================================

  private renderMetadata(
    pdf: jsPDF,
    article: KnowledgeArticle,
    startY: number,
  ): number {
    const rows: Array<
      [string, string]
    > = [
      [
        'Application',
        this.displayValue(
          article.applicationKey,
        ),
      ],
      [
        'Category',
        this.displayValue(
          article.category,
        ),
      ],
      [
        'Content Type',
        this.formatLabel(
          article.contentType,
        ),
      ],
      [
        'Status',
        this.formatLabel(
          article.status,
        ),
      ],
      [
        'Version',
        `Version ${article.version}`,
      ],
    ];

    const boxHeight =
      9 +
      rows.length * 7;

    let y = this.ensureSpace(
      pdf,
      startY,
      boxHeight,
    );

    pdf.setFillColor(
      247,
      250,
      252,
    );

    pdf.setDrawColor(
      215,
      225,
      232,
    );

    pdf.roundedRect(
      this.marginLeft,
      y,
      this.contentWidth,
      boxHeight,
      3,
      3,
      'FD',
    );

    y += 7;

    for (const [label, value] of rows) {
      pdf.setFont(
        'helvetica',
        'bold',
      );

      pdf.setFontSize(8.5);

      pdf.setTextColor(
        70,
        85,
        95,
      );

      pdf.text(
        `${label}:`,
        this.marginLeft + 5,
        y,
      );

      pdf.setFont(
        'helvetica',
        'normal',
      );

      pdf.setTextColor(
        30,
        40,
        50,
      );

      pdf.text(
        value,
        this.marginLeft + 38,
        y,
      );

      y += 7;
    }

    return y + 6;
  }

  // ============================================================
  // CONTENT PARSER
  // ============================================================

  private parseContent(
  content: string,
  articleTitle: string,
): PdfBlock[] {
    const normalized =
      content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();

    if (!normalized) {
      return [];
    }

    const lines =
      normalized.split('\n');

    const blocks: PdfBlock[] = [];

    let paragraphLines: string[] = [];

    const flushParagraph = (): void => {
      if (!paragraphLines.length) {
        return;
      }

      const text =
        paragraphLines
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

      if (text) {
        blocks.push({
          type: 'paragraph',
          text,
        });
      }

      paragraphLines = [];
    };

    let insideCodeBlock = false;
    let codeLines: string[] = [];

    const flushCode = (): void => {
      if (!codeLines.length) {
        return;
      }

      blocks.push({
        type: 'code',
        text: codeLines.join('\n'),
      });

      codeLines = [];
    };

    for (const rawLine of lines) {
      const line =
        rawLine.trimEnd();

      const trimmed =
        line.trim();

      // ----------------------------------------------------------
      // Code block
      // ----------------------------------------------------------

      if (
        trimmed.startsWith('```')
      ) {
        flushParagraph();

        if (insideCodeBlock) {
          flushCode();
        }

        insideCodeBlock =
          !insideCodeBlock;

        continue;
      }

      if (insideCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // ----------------------------------------------------------
      // Blank line
      // ----------------------------------------------------------

      if (!trimmed) {
        flushParagraph();
        continue;
      }

      // ----------------------------------------------------------
      // Headings
      // ----------------------------------------------------------

  const headingMatch =
  trimmed.match(
    /^(#{1,3})\s+(.+)$/,
  );

if (headingMatch) {
  flushParagraph();

  const level =
    headingMatch[1].length;

  const headingText =
    headingMatch[2].trim();

  /*
   * The PDF already renders the article title
   * in the document header.
   *
   * If the article body also begins with an H1
   * containing the same title, don't render it
   * a second time.
   */
  if (
    level === 1 &&
    this.normalizeForComparison(
      headingText,
    ) ===
      this.normalizeForComparison(
        articleTitle,
      )
  ) {
    continue;
  }

  blocks.push({
    type:
      level === 1
        ? 'heading1'
        : level === 2
          ? 'heading2'
          : 'heading3',
    text: headingText,
  });

  continue;
}

      // ----------------------------------------------------------
      // Bullet
      // ----------------------------------------------------------

      const bulletMatch =
        trimmed.match(
          /^[-*+]\s+(.+)$/,
        );

      if (bulletMatch) {
        flushParagraph();

        blocks.push({
          type: 'bullet',
          text: bulletMatch[1].trim(),
        });

        continue;
      }

      // ----------------------------------------------------------
      // Numbered list
      // ----------------------------------------------------------

      const numberedMatch =
        trimmed.match(
          /^(\d+)[.)]\s+(.+)$/,
        );

      if (numberedMatch) {
        flushParagraph();

        blocks.push({
          type: 'numbered',
          number: Number(
            numberedMatch[1],
          ),
          text: numberedMatch[2].trim(),
        });

        continue;
      }

      // ----------------------------------------------------------
      // Block quote
      // ----------------------------------------------------------

      const quoteMatch =
        trimmed.match(
          /^>\s?(.+)$/,
        );

      if (quoteMatch) {
        flushParagraph();

        blocks.push({
          type: 'quote',
          text: quoteMatch[1].trim(),
        });

        continue;
      }

      // ----------------------------------------------------------
      // Normal paragraph
      // ----------------------------------------------------------

      paragraphLines.push(trimmed);
    }

    flushParagraph();

    if (insideCodeBlock) {
      flushCode();
    }

    return blocks;
  }

  // ============================================================
  // BLOCK RENDERING
  // ============================================================

  private renderBlock(
    pdf: jsPDF,
    block: PdfBlock,
    startY: number,
  ): number {
    switch (block.type) {
      case 'heading1':
        return this.renderHeading(
          pdf,
          block.text,
          startY,
          16,
          7,
        );

      case 'heading2':
        return this.renderHeading(
          pdf,
          block.text,
          startY,
          13,
          6,
        );

      case 'heading3':
        return this.renderHeading(
          pdf,
          block.text,
          startY,
          11,
          5,
        );

      case 'paragraph':
        return this.renderParagraph(
          pdf,
          block.text,
          startY,
          {
            fontSize: 10.5,
            lineHeight: 5.2,
          },
        );

      case 'bullet':
        return this.renderBullet(
          pdf,
          block.text,
          startY,
        );

      case 'numbered':
        return this.renderNumbered(
          pdf,
          block,
          startY,
        );

      case 'quote':
        return this.renderQuote(
          pdf,
          block.text,
          startY,
        );

      case 'code':
        return this.renderCode(
          pdf,
          block.text,
          startY,
        );

      default:
        return startY;
    }
  }

  // ============================================================
  // HEADINGS
  // ============================================================

  private renderHeading(
    pdf: jsPDF,
    text: string,
    startY: number,
    fontSize: number,
    spacingAfter: number,
  ): number {
    let y =
      this.ensureSpace(
        pdf,
        startY,
        fontSize === 16
          ? 18
          : 15,
      );

    pdf.setFont(
      'helvetica',
      'bold',
    );

    pdf.setFontSize(
      fontSize,
    );

    pdf.setTextColor(
      20,
      45,
      60,
    );

    const cleanText =
      this.cleanInlineMarkdown(
        text,
      );

    const lines =
      pdf.splitTextToSize(
        cleanText,
        this.contentWidth,
      );

    pdf.text(
      lines,
      this.marginLeft,
      y,
    );

    y +=
      lines.length *
        (fontSize * 0.42) +
      spacingAfter;

    return y;
  }

  // ============================================================
  // PARAGRAPHS
  // ============================================================

  private renderParagraph(
    pdf: jsPDF,
    text: string,
    startY: number,
    options: {
      fontSize: number;
      lineHeight: number;
    },
  ): number {
    let y =
      this.ensureSpace(
        pdf,
        startY,
        options.lineHeight * 2,
      );

    pdf.setFont(
      'helvetica',
      'normal',
    );

    pdf.setFontSize(
      options.fontSize,
    );

    pdf.setTextColor(
      45,
      55,
      65,
    );

    const cleanText =
      this.cleanInlineMarkdown(
        text,
      );

    const lines =
      pdf.splitTextToSize(
        cleanText,
        this.contentWidth,
      );

    for (const line of lines) {
      y =
        this.ensureSpace(
          pdf,
          y,
          options.lineHeight,
        );

      pdf.text(
        line,
        this.marginLeft,
        y,
      );

      y += options.lineHeight;
    }

    return y + 2;
  }

  // ============================================================
  // BULLETS
  // ============================================================

private renderBullet(
  pdf: jsPDF,
  text: string,
  startY: number,
): number {
  const bulletX =
    this.marginLeft + 2;

  const textX =
    this.marginLeft + 7;

  const width =
    this.contentWidth - 7;

  const lineHeight = 5.2;

  let y = this.ensureSpace(
    pdf,
    startY,
    lineHeight,
  );

  pdf.setFont(
    'helvetica',
    'normal',
  );

  pdf.setFontSize(10.5);

  pdf.setTextColor(
    45,
    55,
    65,
  );

  const lines =
    pdf.splitTextToSize(
      this.cleanInlineMarkdown(text),
      width,
    );

  for (
    let index = 0;
    index < lines.length;
    index++
  ) {
    y = this.ensureSpace(
      pdf,
      y,
      lineHeight,
    );

    // Only draw the bullet for the
    // first line of a wrapped item.
    if (index === 0) {
      pdf.text(
        '•',
        bulletX,
        y,
      );
    }

    pdf.text(
      lines[index],
      textX,
      y,
    );

    // IMPORTANT:
    // Always advance the cursor.
    y += lineHeight;
  }

  return y + 1.5;
}

  // ============================================================
  // NUMBERED LIST
  // ============================================================

  private renderNumbered(
    pdf: jsPDF,
    block: PdfBlock,
    startY: number,
  ): number {
    const number =
      `${block.number ?? 1}.`;

    const numberX =
      this.marginLeft;

    const textX =
      this.marginLeft + 8;

    const width =
      this.contentWidth - 8;

    let y =
      this.ensureSpace(
        pdf,
        startY,
        6,
      );

    pdf.setFont(
      'helvetica',
      'normal',
    );

    pdf.setFontSize(10.5);

    pdf.setTextColor(
      45,
      55,
      65,
    );

    pdf.text(
      number,
      numberX,
      y,
    );

    const lines =
      pdf.splitTextToSize(
        this.cleanInlineMarkdown(
          block.text,
        ),
        width,
      );

    for (
      let index = 0;
      index < lines.length;
      index++
    ) {
      y =
        this.ensureSpace(
          pdf,
          y,
          5.2,
        );

      pdf.text(
        lines[index],
        textX,
        y,
      );

      if (index < lines.length - 1) {
        y += 5.2;
      }
    }

    return y + 2;
  }

  // ============================================================
  // QUOTE
  // ============================================================

  private renderQuote(
    pdf: jsPDF,
    text: string,
    startY: number,
  ): number {
    const width =
      this.contentWidth - 8;

    let y =
      this.ensureSpace(
        pdf,
        startY,
        12,
      );

    const lines =
      pdf.splitTextToSize(
        this.cleanInlineMarkdown(
          text,
        ),
        width,
      );

    const height =
      Math.max(
        10,
        lines.length * 5.2 + 6,
      );

    y =
      this.ensureSpace(
        pdf,
        y,
        height,
      );

    pdf.setFillColor(
      245,
      248,
      250,
    );

    pdf.roundedRect(
      this.marginLeft,
      y - 4,
      this.contentWidth,
      height,
      2,
      2,
      'F',
    );

    pdf.setFillColor(
      0,
      121,
      121,
    );

    pdf.rect(
      this.marginLeft,
      y - 4,
      2,
      height,
      'F',
    );

    pdf.setFont(
      'helvetica',
      'italic',
    );

    pdf.setFontSize(10);

    pdf.setTextColor(
      65,
      75,
      85,
    );

    for (const line of lines) {
      pdf.text(
        line,
        this.marginLeft + 7,
        y,
      );

      y += 5.2;
    }

    return y + 4;
  }

  // ============================================================
  // CODE
  // ============================================================

  private renderCode(
    pdf: jsPDF,
    text: string,
    startY: number,
  ): number {
    const lines =
      text.split('\n');

    const lineHeight = 4.8;

    const height =
      lines.length *
        lineHeight +
      8;

    let y =
      this.ensureSpace(
        pdf,
        startY,
        Math.min(height, 30),
      );

    /*
     * Long code blocks can span pages.
     * Render them line-by-line rather than
     * forcing the entire block onto one page.
     */

    for (const line of lines) {
      y =
        this.ensureSpace(
          pdf,
          y,
          lineHeight + 2,
        );

      pdf.setFillColor(
        245,
        247,
        249,
      );

      pdf.roundedRect(
        this.marginLeft,
        y - 3.5,
        this.contentWidth,
        lineHeight + 1,
        1,
        1,
        'F',
      );

      pdf.setFont(
        'courier',
        'normal',
      );

      pdf.setFontSize(8.5);

      pdf.setTextColor(
        45,
        55,
        65,
      );

      const cleanLine =
        line.length > 0
          ? line
          : ' ';

      const wrapped =
        pdf.splitTextToSize(
          cleanLine,
          this.contentWidth - 6,
        );

      for (const wrappedLine of wrapped) {
        pdf.text(
          wrappedLine,
          this.marginLeft + 3,
          y,
        );

        y += lineHeight;
      }

      y += 1;
    }

    return y + 3;
  }

  // ============================================================
  // SECTION HEADING
  // ============================================================

  private renderSectionHeading(
    pdf: jsPDF,
    title: string,
    startY: number,
  ): number {
    let y =
      this.ensureSpace(
        pdf,
        startY,
        12,
      );

    pdf.setFont(
      'helvetica',
      'bold',
    );

    pdf.setFontSize(12);

    pdf.setTextColor(
      0,
      85,
      100,
    );

    pdf.text(
      title,
      this.marginLeft,
      y,
    );

    y += 3;

    pdf.setDrawColor(
      210,
      225,
      230,
    );

    pdf.line(
      this.marginLeft,
      y,
      this.pageWidth -
        this.marginRight,
      y,
    );

    return y + 7;
  }

  // ============================================================
  // PAGE MANAGEMENT
  // ============================================================

  private ensureSpace(
    pdf: jsPDF,
    currentY: number,
    requiredHeight: number,
  ): number {
    if (
      currentY +
        requiredHeight >
      this.pageHeight -
        this.marginBottom
    ) {
      pdf.addPage();

      return this.marginTop;
    }

    return currentY;
  }

  // ============================================================
  // FOOTERS
  // ============================================================

  private renderFooters(
    pdf: jsPDF,
    article: KnowledgeArticle,
  ): void {
    const pageCount =
      pdf.getNumberOfPages();

    for (
      let page = 1;
      page <= pageCount;
      page++
    ) {
      pdf.setPage(page);

      pdf.setDrawColor(
        220,
        228,
        232,
      );

      pdf.line(
        this.marginLeft,
        this.pageHeight -
          15,
        this.pageWidth -
          this.marginRight,
        this.pageHeight -
          15,
      );

      pdf.setFont(
        'helvetica',
        'normal',
      );

      pdf.setFontSize(7.5);

      pdf.setTextColor(
        110,
        120,
        130,
      );

      pdf.text(
        `Zebron Knowledge Center • ${this.cleanInlineMarkdown(article.title)}`,
        this.marginLeft,
        this.pageHeight - 9,
      );

      pdf.text(
        `Page ${page} of ${pageCount}`,
        this.pageWidth -
          this.marginRight,
        this.pageHeight - 9,
        {
          align: 'right',
        },
      );
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private cleanInlineMarkdown(
    value: string,
  ): string {
    return value
      .replace(
        /\*\*(.*?)\*\*/g,
        '$1',
      )
      .replace(
        /__(.*?)__/g,
        '$1',
      )
      .replace(
        /\*(.*?)\*/g,
        '$1',
      )
      .replace(
        /_(.*?)_/g,
        '$1',
      )
      .replace(
        /`([^`]+)`/g,
        '$1',
      )
      .replace(
        /\[([^\]]+)\]\([^)]+\)/g,
        '$1',
      )
      .trim();
  }

  private formatLabel(
    value: string,
  ): string {
    return value
      .replace(/[-_]/g, ' ')
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      );
  }

  private displayValue(
    value: string | undefined,
  ): string {
    return value?.trim()
      ? value
      : 'Not specified';
  }

  private formatDate(
    value: string,
  ): string {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return 'Not specified';
    }

    return date.toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );
  }

  private normalizeForComparison(
  value: string,
): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

  private slugify(
    value: string,
  ): string {
    const slug =
      value
        .toLowerCase()
        .normalize('NFKD')
        .replace(
          /[\u0300-\u036f]/g,
          '',
        )
        .replace(
          /[^a-z0-9]+/g,
          '-',
        )
        .replace(
          /^-+|-+$/g,
          '',
        );

    return (
      slug ||
      'knowledge-article'
    );
  }
}