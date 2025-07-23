import * as XLSX from 'xlsx';
import { Group, WorkerWithHospedaje } from '@/types/database';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const parseDateString = (dateString: string): Date => {
  return parseISO(dateString);
};

// Helper to ensure a cell object exists at a given address
const ensureCell = (worksheet: XLSX.WorkSheet, cellAddress: string) => {
  if (!worksheet[cellAddress]) {
    worksheet[cellAddress] = {};
  }
  return worksheet[cellAddress];
};

export const exportToExcel = async (group: Group, workers: WorkerWithHospedaje[]) => {
  if (!group || workers.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  const startDate = parseDateString(group.start_date);
  const endDate = parseDateString(group.end_date);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // --- Cabeceras ---
  const header1 = ['Trabajador', 'Cargo', 'Faena', ...dateRange.map(date => format(date, 'EEE', { locale: es })), 'Total de días'];
  const header2 = ['', '', '', ...dateRange.map(date => format(date, 'dd/MM')), ''];

  // --- Datos de los trabajadores ---
  const data = workers.map(worker => {
    const hospedajeMap = worker.hospedaje.reduce((acc, h) => {
      acc[format(parseDateString(h.date), 'yyyy-MM-dd')] = h.has_hospedaje;
      return acc;
    }, {} as { [key: string]: boolean });
    return [
      worker.name, worker.position, worker.faena,
      ...dateRange.map(date => (hospedajeMap[format(date, 'yyyy-MM-dd')] ? '✓' : ''))
    ];
  });

  const sheetData = [header1, header2, ...data, ['Total por día']];
  const ws = XLSX.utils.aoa_to_sheet(sheetData, { cellStyles: true });

  // --- Estilos y Fórmulas ---
  const boldStyle = { font: { bold: true } };
  const rightAlign = { alignment: { horizontal: 'right' } };
  const boldRightAlign = { font: { bold: true }, alignment: { horizontal: 'right' } };
  const centerAlign = { alignment: { horizontal: 'center', vertical: 'middle' } };
  const boldAndCenter = { ...boldStyle, ...centerAlign };
  const currencyFormat = '$#,##0';

  // Estilos de cabecera
  header1.forEach((_, c) => {
    ensureCell(ws, XLSX.utils.encode_cell({ r: 0, c })).s = boldAndCenter;
    ensureCell(ws, XLSX.utils.encode_cell({ r: 1, c })).s = boldAndCenter;
  });

  // Fórmulas y estilos para filas de datos
  workers.forEach((_, r) => {
    const rowIndex = r + 2;
    const startColAddr = XLSX.utils.encode_col(3);
    const endColAddr = XLSX.utils.encode_col(3 + dateRange.length - 1);
    const totalCellAddr = XLSX.utils.encode_cell({ r: rowIndex, c: header1.length - 1 });
    const totalCell = ensureCell(ws, totalCellAddr);
    totalCell.t = 'n';
    totalCell.f = `COUNTIF(${startColAddr}${rowIndex + 1}:${endColAddr}${rowIndex + 1}, "✓")`;
    totalCell.s = boldAndCenter;

    dateRange.forEach((_, dayIndex) => {
      const checkCellAddr = XLSX.utils.encode_cell({ r: rowIndex, c: 3 + dayIndex });
      ensureCell(ws, checkCellAddr).s = centerAlign;
    });
  });

  // Fórmulas y estilos para fila de total
  const totalRowIndex = 2 + workers.length;
  ensureCell(ws, XLSX.utils.encode_cell({ r: totalRowIndex, c: 0 })).s = boldStyle;

  dateRange.forEach((_, c) => {
    const colIndex = c + 3;
    const colLetter = XLSX.utils.encode_col(colIndex);
    const dailyTotalAddr = XLSX.utils.encode_cell({ r: totalRowIndex, c: colIndex });
    const dailyTotalCell = ensureCell(ws, dailyTotalAddr);
    dailyTotalCell.t = 'n';
    dailyTotalCell.f = `COUNTIF(${colLetter}3:${colLetter}${totalRowIndex}, "✓")`;
    dailyTotalCell.s = boldAndCenter;
  });

  // Gran total
  const grandTotalColIndex = header1.length - 1;
  const grandTotalAddr = XLSX.utils.encode_cell({ r: totalRowIndex, c: grandTotalColIndex });
  const grandTotalCell = ensureCell(ws, grandTotalAddr);
  grandTotalCell.t = 'n';
  const startTotalColAddr = XLSX.utils.encode_col(3);
  const endTotalColAddr = XLSX.utils.encode_col(grandTotalColIndex - 1);
  grandTotalCell.f = `SUM(${startTotalColAddr}${totalRowIndex}:${endTotalColAddr}${totalRowIndex})`;
  grandTotalCell.s = boldAndCenter;

  // --- Resumen Financiero ---
  const summaryStartRow = totalRowIndex + 2;
  const summaryLabelCol = grandTotalColIndex - 1;
  const summaryValueCol = grandTotalColIndex;

  const addSummaryRow = (r: number, label: string, value: any, isFormula: boolean, numFmt: string, isBold: boolean) => {
    const labelCell = ensureCell(ws, XLSX.utils.encode_cell({ r, c: summaryLabelCol }));
    const valueCell = ensureCell(ws, XLSX.utils.encode_cell({ r, c: summaryValueCol }));
    labelCell.v = label;
    
    if (isFormula) {
      valueCell.f = value;
    } else {
      valueCell.v = value;
    }
    valueCell.t = 'n';
    valueCell.z = numFmt;

    if (isBold) {
      labelCell.s = boldRightAlign;
      valueCell.s = { ...boldStyle, numFmt };
    } else {
      labelCell.s = rightAlign;
    }
  };

  const pricePerNight = group.price_per_night || 0;
  const priceAddr = XLSX.utils.encode_cell({ r: summaryStartRow + 1, c: summaryValueCol });
  const netTotalAddr = XLSX.utils.encode_cell({ r: summaryStartRow + 2, c: summaryValueCol });
  const ivaAddr = XLSX.utils.encode_cell({ r: summaryStartRow + 3, c: summaryValueCol });

  addSummaryRow(summaryStartRow, 'Total días hospedaje:', grandTotalAddr, true, '0', false);
  addSummaryRow(summaryStartRow + 1, 'Precio unitario:', pricePerNight, false, currencyFormat, false);
  addSummaryRow(summaryStartRow + 2, 'Total neto:', `${grandTotalAddr}*${priceAddr}`, true, currencyFormat, false);
  addSummaryRow(summaryStartRow + 3, 'IVA (19%):', `${netTotalAddr}*0.19`, true, currencyFormat, false);
  addSummaryRow(summaryStartRow + 4, 'Total a pagar:', `${netTotalAddr}+${ivaAddr}`, true, currencyFormat, true);

  // --- Anchos de columna y Merges ---
  ws['!cols'] = [
    { wch: 30 }, { wch: 25 }, { wch: 25 },
    ...dateRange.map(() => ({ wch: 7 })),
    { wch: 15 } // Ancho para la columna de valores del resumen
  ];
  ws['!cols'][summaryLabelCol] = { wch: 22 }; // Ancho para la columna de etiquetas del resumen


  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
    { s: { r: 0, c: grandTotalColIndex }, e: { r: 1, c: grandTotalColIndex } }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hospedaje');
  XLSX.writeFile(wb, `Hospedaje_${group.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};