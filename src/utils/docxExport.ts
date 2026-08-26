import {
  Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun,
  AlignmentType, WidthType, BorderStyle,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import { formatTimeline, extras, type ServiceConfig } from '../data/pricing';

interface LineItem {
  config: ServiceConfig;
  serviceName: string;
  unitName: string;
  quantity: number;
  price: number;
  total: number;
  timeline: number;
}

interface ExportData {
  items: LineItem[];
  baseSubtotal: number;
  afterUrgencyPrice: number;
  baseTimeline: number;
  afterUrgencyTimeline: number;
  extrasTotal: number;
  total: number;
  urgencyLabel: string;
  urgencyMultiplier: number;
  selectedExtras: string[];
}

function createCell(text: string, options: {
  bold?: boolean;
  align?: any;
  width?: number;
  shading?: { fill: string };
  fontSize?: number;
} = {}): TableCell {
  return new TableCell({
    width: { size: options.width ?? 20, type: WidthType.PERCENTAGE },
    shading: options.shading,
    verticalAlign: 'center',
    children: [
      new Paragraph({
        alignment: options.align ?? AlignmentType.LEFT,
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text,
            bold: options.bold ?? false,
            size: options.fontSize ?? 20,
            font: 'Inter',
          }),
        ],
      }),
    ],
  });
}

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
};

export async function exportDOCX(data: ExportData) {
  const docNumber = `КП-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
  const dateStr = new Date().toLocaleDateString('ru-RU');

  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell('№', { bold: true, align: AlignmentType.CENTER, width: 6, shading: { fill: '1A1A1A' }, fontSize: 18 }),
        createCell('Наименование услуги', { bold: true, align: AlignmentType.LEFT, width: 35, shading: { fill: '1A1A1A' }, fontSize: 18 }),
        createCell('Кол-во', { bold: true, align: AlignmentType.CENTER, width: 10, shading: { fill: '1A1A1A' }, fontSize: 18 }),
        createCell('Ед.', { bold: true, align: AlignmentType.CENTER, width: 10, shading: { fill: '1A1A1A' }, fontSize: 18 }),
        createCell('Цена, ₽', { bold: true, align: AlignmentType.RIGHT, width: 14, shading: { fill: '1A1A1A' }, fontSize: 18 }),
        createCell('Сумма, ₽', { bold: true, align: AlignmentType.RIGHT, width: 15, shading: { fill: '1A1A1A' }, fontSize: 18 }),
        createCell('Срок', { bold: true, align: AlignmentType.CENTER, width: 10, shading: { fill: '1A1A1A' }, fontSize: 18 }),
      ],
    }),
  ];

  data.items.forEach((item, idx) => {
    tableRows.push(
      new TableRow({
        children: [
          createCell(String(idx + 1), { align: AlignmentType.CENTER, width: 6, fontSize: 18 }),
          createCell(item.serviceName, { align: AlignmentType.LEFT, width: 35, fontSize: 18 }),
          createCell(String(item.quantity), { align: AlignmentType.CENTER, width: 10, fontSize: 18 }),
          createCell(item.unitName, { align: AlignmentType.CENTER, width: 10, fontSize: 18 }),
          createCell(item.price.toLocaleString('ru-RU'), { align: AlignmentType.RIGHT, width: 14, fontSize: 18 }),
          createCell(item.total.toLocaleString('ru-RU'), { align: AlignmentType.RIGHT, width: 15, fontSize: 18 }),
          createCell(formatTimeline(item.timeline), { align: AlignmentType.CENTER, width: 10, fontSize: 18 }),
        ],
      })
    );
  });

  if (data.extrasTotal > 0) {
    tableRows.push(
      new TableRow({
        children: [
          createCell('', { width: 6 }),
          createCell('Дополнительные опции', { bold: true, width: 35, fontSize: 18 }),
          createCell('', { width: 10 }),
          createCell('', { width: 10 }),
          createCell('', { width: 14 }),
          createCell(data.extrasTotal.toLocaleString('ru-RU'), { bold: true, align: AlignmentType.RIGHT, width: 15, fontSize: 18 }),
          createCell('', { width: 10 }),
        ],
      })
    );
    // Add conditions for extras that have them
    data.selectedExtras.forEach((extraId) => {
      const extra = extras.find((e) => e.id === extraId);
      if (extra?.conditions) {
        tableRows.push(
          new TableRow({
            children: [
              createCell('', { width: 6 }),
              createCell(`Условия «${extra.name}»: ${extra.conditions}`, { width: 35, fontSize: 16 }),
              createCell('', { width: 10 }),
              createCell('', { width: 10 }),
              createCell('', { width: 14 }),
              createCell('', { width: 15 }),
              createCell('', { width: 10 }),
            ],
          })
        );
      }
    });
  }

  if (data.urgencyMultiplier > 1) {
    tableRows.push(
      new TableRow({
        children: [
          createCell('', { width: 6 }),
          createCell(`Срочность: ${data.urgencyLabel}`, { bold: true, width: 35, fontSize: 18 }),
          createCell('', { width: 10 }),
          createCell('', { width: 10 }),
          createCell('', { width: 14 }),
          createCell(`×${data.urgencyMultiplier}`, { bold: true, align: AlignmentType.RIGHT, width: 15, fontSize: 18 }),
          createCell('', { width: 10 }),
        ],
      })
    );
  }

  tableRows.push(
    new TableRow({
      children: [
        createCell('', { width: 6, shading: { fill: 'F5F5F3' } }),
        createCell('ИТОГО', { bold: true, width: 35, shading: { fill: 'F5F5F3' }, fontSize: 20 }),
        createCell('', { width: 10, shading: { fill: 'F5F5F3' } }),
        createCell('', { width: 10, shading: { fill: 'F5F5F3' } }),
        createCell('', { width: 14, shading: { fill: 'F5F5F3' } }),
        createCell(data.total.toLocaleString('ru-RU'), { bold: true, align: AlignmentType.RIGHT, width: 15, shading: { fill: 'F5F5F3' }, fontSize: 20 }),
        createCell(formatTimeline(data.afterUrgencyTimeline), { bold: true, align: AlignmentType.CENTER, width: 10, shading: { fill: 'F5F5F3' }, fontSize: 18 }),
      ],
    })
  );

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: '4NS AGENCY', bold: true, size: 32, font: 'Unbounded', color: '1A1A1A' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: 'Коммуникационное агентство', size: 18, font: 'Inter', color: '666666' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: `Дата: ${dateStr}`, size: 18, font: 'Inter', color: '666666' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', bold: true, size: 32, font: 'Unbounded', color: '1A1A1A' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: docNumber, size: 20, font: 'Inter', color: '666666' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'Уважаемый клиент,', size: 20, font: 'Inter' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'Настоящим предлагаем Вам следующий перечень услуг с указанием стоимости и сроков выполнения:',
          size: 20,
          font: 'Inter',
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: tableRows,
    }),
    new Paragraph({ spacing: { before: 300 } }),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: 'Условия сотрудничества:', bold: true, size: 22, font: 'Unbounded' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `• Общий срок выполнения работ: `, size: 20, font: 'Inter' }),
        new TextRun({ text: formatTimeline(data.afterUrgencyTimeline), bold: true, size: 20, font: 'Inter' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `• Стоимость указана без учёта НДС`, size: 20, font: 'Inter' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `• Предоплата: 50%`, size: 20, font: 'Inter' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `• Финальная оплата: 50% по факту сдачи проекта`, size: 20, font: 'Inter' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `• Количество правок включено в стоимость согласно выбранному пакету`, size: 20, font: 'Inter' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({ text: `• Ориентировочная стоимость. Финальная цена и сроки зависят от технического задания.`, size: 20, font: 'Inter', italics: true }),
      ],
    }),
    new Paragraph({
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({ text: 'С уважением,', size: 20, font: 'Inter' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'Команда 4NS Agency', bold: true, size: 20, font: 'Inter' }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `kp-4ns-agency-${docNumber}.docx`);
}
