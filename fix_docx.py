import re

path = '/Users/natalias./Documents/kimi/workspace/design-calculator/src/utils/docxExport.ts'
with open(path, 'r') as f:
    content = f.read()

# Update import to include extras
old_import = "import { formatTimeline, type ServiceConfig } from '../data/pricing';"
new_import = "import { formatTimeline, extras, type ServiceConfig } from '../data/pricing';"
content = content.replace(old_import, new_import)

# Add conditions paragraph after the extras table row if there are extras with conditions
old_extras_row = """  if (data.extrasTotal > 0) {
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
  }"""

new_extras_section = """  if (data.extrasTotal > 0) {
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
  }"""

content = content.replace(old_extras_row, new_extras_section)

with open(path, 'w') as f:
    f.write(content)

print('Done')
