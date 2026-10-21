import Papa from 'papaparse';
import { formatDate, formatMoney, formatTime } from './format';
import { renderPieDataUrl, toPieSlices } from './pieChart';

// Heavy libraries (jsPDF, ExcelJS, html2canvas) are imported on demand, so none
// of this code lands in the main bundle. Every user-facing string goes through
// the `t` function passed in by the caller, so reports follow the app language.

const APP_NAME = 'Expenser';

// ExcelJS is CommonJS: depending on the bundler the API sits on the namespace or on `default`.
async function loadExcel() {
  const mod = await import('exceljs');
  return mod.Workbook ? mod : mod.default;
}

// Brand palette for reports (matches the default expenser-theme.css: green on neutral)
const BRAND = [0, 130, 54];
const INK = [10, 10, 10];
const MUTED = [82, 82, 82];
const ZEBRA = [250, 250, 250];
const HEX = {
  brand: 'FF008236',
  ink: 'FF0A0A0A',
  muted: 'FF525252',
  zebra: 'FFFAFAFA',
  line: 'FFE5E5E5',
  white: 'FFFFFFFF',
  income: 'FF008236',
  expense: 'FFE7000B',
};

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const typeLabel = (type, t) => (type === 'income' ? t('export.type.income') : type === 'expense' ? t('export.type.expense') : t('export.type.transfer'));

function buildRows(transactions, getCategory, getWallet, t) {
  return transactions.map((tx) => ({
    [t('export.col.date')]: formatDate(tx.date),
    [t('export.col.time')]: formatTime(tx.date),
    [t('export.col.type')]: typeLabel(tx.type, t),
    [t('export.col.category')]: getCategory(tx.categoryId)?.name || '',
    [t('export.col.wallet')]: getWallet(tx.walletId)?.name || '',
    [t('export.col.amount')]: tx.amount,
    [t('export.col.note')]: tx.note || '',
  }));
}

// Category totals for one type -> [{ name, color, count, total, pct }] sorted desc
function categoryBreakdown(txs, type, getCategory, t) {
  const map = {};
  txs.filter((x) => x.type === type).forEach((x) => {
    map[x.categoryId] ||= { total: 0, count: 0 };
    map[x.categoryId].total += x.amount;
    map[x.categoryId].count += 1;
  });
  const sum = Object.values(map).reduce((s, v) => s + v.total, 0);
  return Object.entries(map)
    .map(([id, v]) => {
      const cat = getCategory(id);
      return { name: cat?.name || t('common.other'), color: cat?.color || '#94A3B8', count: v.count, total: v.total, pct: sum ? Math.round((v.total / sum) * 100) : 0 };
    })
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// PDF helpers (Roboto is embedded: Latin + Vietnamese diacritics)
// ---------------------------------------------------------------------------
async function newPdf() {
  const [pdfMod, tableMod, fonts] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('../assets/fonts/robotoVietnamese.js'),
  ]);
  const jsPDF = pdfMod.jsPDF || pdfMod.default?.jsPDF || pdfMod.default;
  const autoTable = tableMod.default?.default || tableMod.default || tableMod.autoTable;
  const doc = new jsPDF();
  doc.addFileToVFS('RobotoVN-Regular.ttf', fonts.ROBOTO_VN_REGULAR_BASE64);
  doc.addFont('RobotoVN-Regular.ttf', 'RobotoVN', 'normal');
  doc.addFileToVFS('RobotoVN-Bold.ttf', fonts.ROBOTO_VN_BOLD_BASE64);
  doc.addFont('RobotoVN-Bold.ttf', 'RobotoVN', 'bold');
  doc.setFont('RobotoVN', 'normal');
  return { doc, autoTable };
}

function pdfBanner(doc, title, subtitle) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, w, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('RobotoVN', 'bold');
  doc.setFontSize(13);
  doc.text(APP_NAME, 14, 12);
  doc.setFontSize(10.5);
  doc.text(title, 14, 20);
  doc.setFont('RobotoVN', 'normal');
  doc.setFontSize(8.5);
  doc.text(subtitle, 14, 26);
  doc.setTextColor(0, 0, 0);
  return 40;
}

function pdfFooter(doc, t) {
  const pages = doc.internal.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont('RobotoVN', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(APP_NAME, 14, h - 8);
    doc.text(t('export.page', { n: i, total: pages }), w - 14, h - 8, { align: 'right' });
  }
  doc.setTextColor(0, 0, 0);
}

function pdfHeading(doc, text, y) {
  doc.setFont('RobotoVN', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(text, 14, y);
  doc.setFont('RobotoVN', 'normal');
  doc.setTextColor(0, 0, 0);
}

// Pie chart + legend block. Returns the Y position to continue from.
function pdfPieSection(doc, heading, slices, y) {
  const pageH = doc.internal.pageSize.getHeight();
  const blockH = 10 + Math.max(58, slices.length * 6.5 + 6);
  let top = y;
  if (top + blockH > pageH - 16) {
    doc.addPage();
    top = 20;
  }
  pdfHeading(doc, heading, top);
  doc.addImage(renderPieDataUrl(slices), 'PNG', 14, top + 4, 56, 56);
  let ly = top + 12;
  doc.setFontSize(9);
  slices.forEach((s) => {
    doc.setFillColor(...hexToRgb(s.color));
    doc.roundedRect(78, ly - 3.2, 4, 4, 1, 1, 'F');
    doc.setTextColor(...INK);
    const name = s.name.length > 24 ? `${s.name.slice(0, 23)}…` : s.name;
    doc.text(name, 85, ly);
    doc.setTextColor(...MUTED);
    doc.text(`${Math.round(s.pct)}% · ${formatMoney(s.value)}`, 196, ly, { align: 'right' });
    ly += 6.5;
  });
  doc.setTextColor(0, 0, 0);
  return top + 4 + Math.max(56, ly - top - 8) + 8;
}

// ---------------------------------------------------------------------------
// Excel helpers
// ---------------------------------------------------------------------------
function styleHeaderRow(row, fill) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, color: { argb: HEX.white }, size: 10.5 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  row.height = 20;
}

function zebra(ws, from, to) {
  for (let i = from; i <= to; i += 1) {
    const stripe = (i - from) % 2 === 1;
    ws.getRow(i).eachCell({ includeEmpty: true }, (cell) => {
      if (stripe && !cell.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEX.zebra } };
      cell.border = { ...cell.border, bottom: { style: 'hair', color: { argb: HEX.line } } };
    });
  }
}

const MONEY_FMT = '#,##0" ₫"';

async function downloadWorkbook(wb, filename) {
  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(new Blob([buf], { type: 'application/octet-stream' }), filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function detailColumns(t) {
  return [
    { header: t('export.col.date'), key: 'date', width: 12 },
    { header: t('export.col.time'), key: 'time', width: 8 },
    { header: t('export.col.type'), key: 'type', width: 12 },
    { header: t('export.col.category'), key: 'category', width: 20 },
    { header: t('export.col.wallet'), key: 'wallet', width: 18 },
    { header: t('export.col.amount'), key: 'amount', width: 16 },
    { header: t('export.col.note'), key: 'note', width: 34 },
  ];
}

function addDetailSheet(wb, name, txs, getCategory, getWallet, t, fill) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = detailColumns(t);
  txs.forEach((tx) =>
    ws.addRow({
      date: formatDate(tx.date),
      time: formatTime(tx.date),
      type: typeLabel(tx.type, t),
      category: getCategory(tx.categoryId)?.name || '',
      wallet: getWallet(tx.walletId)?.name || '',
      amount: tx.amount,
      note: tx.note || '',
    }),
  );
  styleHeaderRow(ws.getRow(1), fill);
  ws.getColumn('amount').numFmt = MONEY_FMT;
  zebra(ws, 2, ws.rowCount);
  if (ws.rowCount > 1) ws.autoFilter = { from: 'A1', to: { row: 1, column: 7 } };
  return ws;
}

// ---------------------------------------------------------------------------
// Simple list exports (Settings -> Export data)
// ---------------------------------------------------------------------------
export function exportCSV(transactions, getCategory, getWallet, filename, t) {
  const csv = Papa.unparse(buildRows(transactions, getCategory, getWallet, t));
  downloadBlob(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

export function exportJSON(transactions, getCategory, getWallet, filename, t) {
  downloadBlob(new Blob([JSON.stringify(buildRows(transactions, getCategory, getWallet, t), null, 2)], { type: 'application/json;charset=utf-8;' }), `${filename}.json`);
}

export async function exportExcel(transactions, getCategory, getWallet, filename, t) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = APP_NAME;
  wb.created = new Date();
  addDetailSheet(wb, t('export.sheet.transactions'), transactions, getCategory, getWallet, t, HEX.brand);
  await downloadWorkbook(wb, `${filename}.xlsx`);
}

// ---------------------------------------------------------------------------
// Categories: export + "export everything"
// ---------------------------------------------------------------------------
const categoryRows = (categories, t) =>
  [...categories]
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
    .map((c) => ({
      [t('export.col.name')]: c.name,
      [t('export.col.type')]: typeLabel(c.type, t),
      [t('export.col.emoji')]: c.emoji || '',
      [t('export.col.color')]: c.color || '',
    }));

function addCategoriesSheet(wb, categories, t) {
  const ws = wb.addWorksheet(t('export.sheet.categories'), { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [
    { header: t('export.col.name'), key: 'name', width: 28 },
    { header: t('export.col.type'), key: 'type', width: 14 },
    { header: t('export.col.emoji'), key: 'emoji', width: 12 },
    { header: t('export.col.color'), key: 'color', width: 14 },
  ];
  categoryRows(categories, t).forEach((r) => ws.addRow(Object.values(r)));
  styleHeaderRow(ws.getRow(1), HEX.brand);
  zebra(ws, 2, ws.rowCount);
}

export async function exportCategories(categories, format, filename, t) {
  const rows = categoryRows(categories, t);
  if (format === 'csv') {
    downloadBlob(new Blob([`\uFEFF${Papa.unparse(rows)}`], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
  } else if (format === 'json') {
    downloadBlob(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json;charset=utf-8;' }), `${filename}.json`);
  } else {
    const ExcelJS = await loadExcel();
    const wb = new ExcelJS.Workbook();
    wb.creator = APP_NAME;
    addCategoriesSheet(wb, categories, t);
    await downloadWorkbook(wb, `${filename}.xlsx`);
  }
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Everything at once: one Excel workbook (a sheet each for transactions and
 * categories), one JSON file with both lists, plus a CSV per list. Downloads
 * are spaced out so browsers don't treat them as a burst and block them.
 */
export async function exportAll({ transactions, categories, getCategory, getWallet, filename = 'expenser-all', t }) {
  const realTx = transactions.filter((x) => x.type !== 'transfer');
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = APP_NAME;
  wb.created = new Date();
  addDetailSheet(wb, t('export.sheet.transactions'), realTx, getCategory, getWallet, t, HEX.brand);
  addCategoriesSheet(wb, categories, t);
  await downloadWorkbook(wb, `${filename}.xlsx`);
  await pause(350);
  downloadBlob(
    new Blob([JSON.stringify({ categories: categoryRows(categories, t), transactions: buildRows(realTx, getCategory, getWallet, t) }, null, 2)], { type: 'application/json;charset=utf-8;' }),
    `${filename}.json`,
  );
  await pause(350);
  exportCSV(realTx, getCategory, getWallet, `${filename}-transactions`, t);
  await pause(350);
  await exportCategories(categories, 'csv', `${filename}-categories`, t);
}

// ---------------------------------------------------------------------------
// Period report (Statistics page): Excel / PDF / image - all include pie charts
// ---------------------------------------------------------------------------
function addCategorySheet(wb, name, rows, fill, totalLabel, pieUrl, t) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [
    { header: t('export.col.category'), key: 'cat', width: 24 },
    { header: t('export.col.count'), key: 'count', width: 15 },
    { header: totalLabel, key: 'total', width: 18 },
    { header: t('export.col.pct'), key: 'pct', width: 12 },
  ];
  styleHeaderRow(ws.getRow(1), fill);
  rows.forEach((r) => ws.addRow({ cat: r.name, count: r.count, total: r.total, pct: r.pct }));
  ws.getColumn('total').numFmt = MONEY_FMT;
  zebra(ws, 2, ws.rowCount);
  if (pieUrl) {
    const id = wb.addImage({ base64: pieUrl, extension: 'png' });
    ws.addImage(id, { tl: { col: 5, row: 1 }, ext: { width: 340, height: 340 } });
  }
}

async function buildExcelReport(r) {
  const { title, subtitle, income, expense, count, expenseRows, incomeRows, expensePie, incomePie, rangeTx, getCategory, getWallet, t } = r;
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = APP_NAME;
  wb.created = new Date();

  const ov = wb.addWorksheet(t('export.sheet.overview'));
  ov.mergeCells('A1:B1');
  ov.getCell('A1').value = title;
  ov.getCell('A1').font = { bold: true, size: 14, color: { argb: HEX.ink } };
  ov.mergeCells('A2:B2');
  ov.getCell('A2').value = subtitle;
  ov.getCell('A2').font = { italic: true, size: 9.5, color: { argb: HEX.muted } };
  ov.getColumn(1).width = 30;
  ov.getColumn(2).width = 24;
  ov.getRow(4).values = [t('export.metric'), t('export.value')];
  styleHeaderRow(ov.getRow(4), HEX.brand);
  [
    [t('export.totalIncome'), income],
    [t('export.totalExpense'), expense],
    [t('export.difference'), income - expense],
    [t('export.totalCount'), count],
  ].forEach((row) => ov.addRow(row));
  for (let i = 5; i <= ov.rowCount; i += 1) {
    const cell = ov.getCell(i, 2);
    if (typeof cell.value === 'number' && i < 8) cell.numFmt = MONEY_FMT;
    ov.getCell(i, 1).font = { bold: true, color: { argb: HEX.muted } };
  }
  zebra(ov, 5, ov.rowCount);

  addCategorySheet(wb, t('export.sheet.expenseByCat'), expenseRows, HEX.expense, t('export.col.totalExpense'), expensePie, t);
  if (incomeRows.length) addCategorySheet(wb, t('export.sheet.incomeByCat'), incomeRows, HEX.income, t('export.col.totalIncome'), incomePie, t);
  addDetailSheet(wb, t('export.sheet.detail'), rangeTx, getCategory, getWallet, t, HEX.muted);
  return wb;
}

async function buildPdfReport(r) {
  const { title, subtitle, income, expense, count, expenseRows, expenseSlices, incomeSlices, rangeTx, getCategory, getWallet, t } = r;
  const { doc, autoTable } = await newPdf();
  let y = pdfBanner(doc, title, subtitle);
  const base = {
    styles: { font: 'RobotoVN', fontSize: 8.5, cellPadding: 3, textColor: INK },
    headStyles: { font: 'RobotoVN', fontStyle: 'bold', textColor: 255, fontSize: 8.5 },
    alternateRowStyles: { fillColor: ZEBRA },
    margin: { left: 14, right: 14 },
  };

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    margin: base.margin,
    body: [
      [t('export.totalIncome'), formatMoney(income)],
      [t('export.totalExpense'), formatMoney(expense)],
      [t('export.difference'), formatMoney(income - expense)],
      [t('export.totalCount'), String(count)],
    ],
    styles: { font: 'RobotoVN', fontSize: 10, cellPadding: 1.8 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: MUTED, cellWidth: 65 }, 1: { textColor: INK } },
  });
  y = doc.lastAutoTable.finalY + 10;

  // Pie charts
  if (expenseSlices.length) y = pdfPieSection(doc, t('export.pieExpense'), expenseSlices, y);
  if (incomeSlices.length) y = pdfPieSection(doc, t('export.pieIncome'), incomeSlices, y);

  if (expenseRows.length) {
    pdfHeading(doc, t('export.expenseByCat'), y);
    autoTable(doc, {
      ...base,
      startY: y + 4,
      head: [[t('export.col.category'), t('export.col.countShort'), t('export.col.totalExpense'), t('export.col.pct')]],
      body: expenseRows.map((x) => [x.name, x.count, formatMoney(x.total), `${x.pct}%`]),
      headStyles: { ...base.headStyles, fillColor: BRAND },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  pdfHeading(doc, t('export.detail'), y);
  autoTable(doc, {
    ...base,
    startY: y + 4,
    head: [[t('export.col.date'), t('export.col.time'), t('export.col.type'), t('export.col.category'), t('export.col.wallet'), t('export.col.amount'), t('export.col.note')]],
    body: rangeTx.map((tx) => [formatDate(tx.date), formatTime(tx.date), typeLabel(tx.type, t), getCategory(tx.categoryId)?.name || '', getWallet(tx.walletId)?.name || '', formatMoney(tx.amount), tx.note || '']),
    headStyles: { ...base.headStyles, fillColor: MUTED },
    styles: { ...base.styles, fontSize: 7.5 },
    columnStyles: { 5: { halign: 'right' } },
  });
  pdfFooter(doc, t);
  return doc;
}

// Renders a compact report card off-screen and captures it as a PNG.
// Legend rows have a fixed height + line-height and no overflow clipping: html2canvas
// crops the bottom of text inside `overflow:hidden` boxes, so long names are
// shortened in JS instead of with CSS ellipsis.
async function buildImageReport(r) {
  const { default: html2canvas } = await import('html2canvas');
  const { title, subtitle, income, expense, count, expenseSlices, expensePie, compareSlices, comparePie, t } = r;
  const ROW_H = 28;
  const shorten = (name, max = 24) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);
  const legend = (slices, showAmount) =>
    slices
      .slice(0, 10)
      .map(
        (x) =>
          `<div style="display:flex;align-items:center;gap:8px;height:${ROW_H}px;font-size:13px;line-height:${ROW_H}px">` +
          `<span style="flex:none;width:10px;height:10px;border-radius:3px;background:${escapeHtml(x.color)}"></span>` +
          `<span style="flex:1;min-width:0;white-space:nowrap;line-height:${ROW_H}px">${escapeHtml(shorten(x.name))}</span>` +
          (showAmount ? `<span style="flex:none;color:#525252;line-height:${ROW_H}px">${escapeHtml(formatMoney(x.value))}</span>` : '') +
          `<b style="flex:none;min-width:40px;text-align:right;line-height:${ROW_H}px">${Math.round(x.pct)}%</b>` +
          `</div>`,
      )
      .join('');
  const pieBlock = (heading, url, slices, showAmount) =>
    url
      ? `<div style="margin-top:22px"><div style="font-weight:700;font-size:15px;line-height:22px;margin-bottom:10px">${escapeHtml(heading)}</div><div style="display:flex;gap:20px;align-items:center"><img src="${url}" style="flex:none;width:190px;height:190px" alt=""/><div style="flex:1;min-width:0">${legend(slices, showAmount)}</div></div></div>`
      : '';
  const stat = (label, value, bg, fg) => `<div style="flex:1;background:${bg};color:${fg};border-radius:12px;padding:14px 16px"><div style="font-size:12px;opacity:.8">${escapeHtml(label)}</div><div style="font-size:17px;font-weight:700;margin-top:4px">${escapeHtml(value)}</div></div>`;

  const node = document.createElement('div');
  node.style.cssText = 'position:fixed;left:-10000px;top:0;width:640px;padding:28px;background:#FFFFFF;color:#0A0A0A;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif';
  node.innerHTML = `
    <div style="background:#008236;color:#fff;border-radius:14px;padding:20px 22px">
      <div style="font-size:13px;opacity:.8;font-weight:700">${APP_NAME}</div>
      <div style="font-size:22px;font-weight:700;margin-top:4px">${escapeHtml(title)}</div>
      <div style="font-size:12px;opacity:.8;margin-top:4px">${escapeHtml(subtitle)}</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px">
      ${stat(t('export.totalIncome'), formatMoney(income), '#E6F3EB', '#006B2D')}
      ${stat(t('export.totalExpense'), formatMoney(expense), '#FDE6E7', '#B80009')}
      ${stat(t('export.difference'), formatMoney(income - expense), '#F5F5F5', '#0A0A0A')}
    </div>
    <div style="font-size:12px;color:#525252;margin-top:10px">${escapeHtml(t('export.totalCount'))}: <b>${count}</b></div>
    ${pieBlock(t('export.pieExpense'), expensePie, expenseSlices, false)}
    ${pieBlock(t('stats.compare'), comparePie, compareSlices, true)}
    <div style="margin-top:22px;font-size:11px;color:#737373;text-align:right">${APP_NAME}</div>`;
  document.body.appendChild(node);
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#FFFFFF', useCORS: true });
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } finally {
    document.body.removeChild(node);
  }
}

/** Period report as Excel (multi-sheet), PDF or PNG image - all with pie charts. */
export async function exportRangeReport({ title, start, end, transactions, getCategory, getWallet, format = 'excel', t }) {
  const rangeTx = transactions.filter((x) => x.type !== 'transfer' && x.date >= start && x.date <= end);
  const income = rangeTx.filter((x) => x.type === 'income').reduce((s, x) => s + x.amount, 0);
  const expense = rangeTx.filter((x) => x.type === 'expense').reduce((s, x) => s + x.amount, 0);
  const expenseRows = categoryBreakdown(rangeTx, 'expense', getCategory, t);
  const incomeRows = categoryBreakdown(rangeTx, 'income', getCategory, t);
  const expenseSlices = toPieSlices(expenseRows.map((x) => ({ name: x.name, value: x.total, color: x.color })), t('common.other'));
  const incomeSlices = toPieSlices(incomeRows.map((x) => ({ name: x.name, value: x.total, color: x.color })), t('common.other'));
  // Income vs expense share (image report): two slices, zero values dropped.
  const compareSlices = toPieSlices(
    [
      { name: t('export.type.income'), value: income, color: '#008236' },
      { name: t('export.type.expense'), value: expense, color: '#E7000B' },
    ].filter((x) => x.value > 0),
    t('common.other'),
  );
  const ctx = {
    title,
    subtitle: t('export.subtitle', { from: formatDate(start), to: formatDate(end), date: formatDate(new Date()) }),
    income,
    expense,
    count: rangeTx.length,
    expenseRows,
    incomeRows,
    expenseSlices,
    incomeSlices,
    expensePie: expenseSlices.length ? renderPieDataUrl(expenseSlices) : null,
    incomePie: incomeSlices.length ? renderPieDataUrl(incomeSlices) : null,
    compareSlices,
    comparePie: compareSlices.length ? renderPieDataUrl(compareSlices) : null,
    rangeTx,
    getCategory,
    getWallet,
    t,
  };
  const fname = `expenser-report-${formatDate(start).replaceAll('/', '-')}_${formatDate(end).replaceAll('/', '-')}`;

  if (format === 'pdf') {
    (await buildPdfReport(ctx)).save(`${fname}.pdf`);
  } else if (format === 'image') {
    downloadBlob(await buildImageReport(ctx), `${fname}.png`);
  } else {
    await downloadWorkbook(await buildExcelReport(ctx), `${fname}.xlsx`);
  }
}

// ---------------------------------------------------------------------------
// Import: CSV, Excel (.xlsx) and JSON share one normaliser. Headers and type
// values are accepted in Vietnamese or English, with or without diacritics.
// Columns: Date, Time (optional), Type, Category, Wallet, Amount, Note
// ---------------------------------------------------------------------------
const strip = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim().toLowerCase();

const HEADER_ALIASES = {
  date: ['ngay', 'date'],
  time: ['gio', 'time'],
  type: ['loai', 'type'],
  category: ['danh muc', 'category'],
  wallet: ['vi', 'wallet'],
  amount: ['so tien', 'amount'],
  note: ['ghi chu', 'note'],
};

function parseAmount(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return 0;
  // "1.500.000" / "1,500,000" -> thousands separators; "1500.50" -> decimal
  if (/^\d+[.,]\d{1,2}$/.test(s)) return Math.round(parseFloat(s.replace(',', '.')));
  const n = parseInt(s.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function parseDateTime(dateVal, timeVal) {
  let d = null;
  if (dateVal instanceof Date) {
    d = new Date(dateVal);
  } else {
    const s = String(dateVal ?? '').trim();
    let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (m) d = new Date(+m[3], +m[2] - 1, +m[1]);
    else if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) d = new Date(+m[1], +m[2] - 1, +m[3]);
  }
  if (!d || Number.isNaN(d.getTime())) return null;
  const tm = String(timeVal ?? '').match(/(\d{1,2}):(\d{2})/);
  if (tm) d.setHours(+tm[1], +tm[2], 0, 0);
  return d;
}

function normalizeImportRows(rawRows, t) {
  const rows = [];
  const errors = [];
  rawRows.forEach((raw, idx) => {
    const norm = {};
    Object.keys(raw || {}).forEach((k) => {
      const key = strip(k);
      const field = Object.keys(HEADER_ALIASES).find((f) => HEADER_ALIASES[f].includes(key));
      if (field) norm[field] = raw[k];
    });
    const text = (f) => String(norm[f] instanceof Date ? '' : norm[f] ?? '').trim();
    const line = idx + 2;
    const categoryName = text('category');
    const walletName = text('wallet');
    const typeKey = strip(text('type'));
    if (['chuyen khoan', 'transfer'].includes(typeKey)) return; // transfers are not imported

    if (!norm.date || !text('amount') || !categoryName || !walletName) {
      errors.push(t('import.missing', { line }));
      return;
    }
    const amount = parseAmount(norm.amount);
    if (amount <= 0) {
      errors.push(t('import.badAmount', { line }));
      return;
    }
    const date = parseDateTime(norm.date, norm.time);
    if (!date) {
      errors.push(t('import.badDate', { line }));
      return;
    }
    const type = typeKey.startsWith('thu') || typeKey.startsWith('income') || typeKey === '+' ? 'income' : 'expense';
    rows.push({ date, type, categoryName, walletName, amount, note: text('note') });
  });
  return { rows, errors };
}

const cellValue = (v) => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v;
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((p) => p.text).join('');
    if ('result' in v) return cellValue(v.result);
    if (v.text) return v.text;
    return '';
  }
  return v;
};

/** Reads CSV / Excel (.xlsx) / JSON into an array of plain objects keyed by header. */
async function readRawRows(file, t) {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith('.csv')) {
      return await new Promise((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => resolve({ data: res.data }),
          error: () => resolve({ error: t('import.csvError') }),
        });
      });
    }
    if (name.endsWith('.xlsx')) {
      const ExcelJS = await loadExcel();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      return { sheets: wb.worksheets };
    }
    if (name.endsWith('.json')) {
      const parsed = JSON.parse(await file.text());
      return { json: parsed };
    }
    return { error: t('import.unsupported') };
  } catch (err) {
    console.error(err);
    return { error: name.endsWith('.json') ? t('import.jsonError') : t('import.excelError') };
  }
}

function sheetToRows(ws) {
  const headers = [];
  ws.getRow(1).eachCell((cell, col) => {
    headers[col] = String(cellValue(cell.value));
  });
  const data = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    headers.forEach((h, col) => {
      if (h) obj[h] = cellValue(row.getCell(col).value);
    });
    data.push(obj);
  });
  return data;
}

/**
 * Picks the rows for one dataset out of a parsed file. Excel workbooks and the
 * "export all" JSON hold several datasets - `keys` are the sheet / property
 * names (any language) that identify the wanted one.
 */
function pickRows(raw, keys) {
  if (raw.data) return raw.data;
  if (raw.sheets) {
    const wanted = raw.sheets.find((ws) => keys.includes(strip(ws.name))) || raw.sheets[0];
    return wanted ? sheetToRows(wanted) : [];
  }
  const j = raw.json;
  if (Array.isArray(j)) return j;
  const hit = Object.keys(j || {}).find((k) => keys.includes(strip(k)));
  return hit ? j[hit] : [];
}

const TX_KEYS = ['giao dich', 'transactions', 'chi tiet giao dich', 'transaction details', 'rows'];
const CAT_KEYS = ['danh muc', 'categories'];

export async function parseImportFile(file, t) {
  const raw = await readRawRows(file, t);
  if (raw.error) return { rows: [], errors: [raw.error] };
  return normalizeImportRows(pickRows(raw, TX_KEYS), t);
}

const CAT_ALIASES = {
  name: ['ten', 'ten danh muc', 'name', 'category'],
  type: ['loai', 'type'],
  emoji: ['bieu tuong', 'emoji', 'icon'],
  color: ['mau', 'mau sac', 'color', 'colour'],
};

/** Categories import -> { rows: [{ name, type, emoji, color }], errors } (dedupes within the file). */
export async function parseCategoryFile(file, t) {
  const raw = await readRawRows(file, t);
  if (raw.error) return { rows: [], errors: [raw.error] };
  const rows = [];
  const errors = [];
  const seen = new Set();
  pickRows(raw, CAT_KEYS).forEach((r, idx) => {
    const norm = {};
    Object.keys(r || {}).forEach((k) => {
      const field = Object.keys(CAT_ALIASES).find((f) => CAT_ALIASES[f].includes(strip(k)));
      if (field) norm[field] = r[k];
    });
    const name = String(norm.name ?? '').trim();
    const typeKey = strip(norm.type);
    if (!name || !typeKey || name.length > 40) {
      errors.push(t('import.catInvalid', { line: idx + 2 }));
      return;
    }
    const type = typeKey.startsWith('thu') || typeKey.startsWith('income') ? 'income' : 'expense';
    const key = `${type}:${name.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    const color = String(norm.color ?? '').trim();
    rows.push({ name, type, emoji: String(norm.emoji ?? '').trim() || '🏷️', color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#64748B' });
  });
  return { rows, errors };
}