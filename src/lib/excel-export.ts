import { Workbook, Fill, Alignment, Font } from 'exceljs';
import { saveAs } from 'file-saver';
import { Group, WorkerWithHospedaje } from '@/types/database';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const parseDateString = (dateString: string): Date => {
  return parseISO(dateString);
};

// --- Estilos reutilizables ---
const headerFill: Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }; // Gris claro
const totalRowFill: Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }; // Azul claro
const centerAlignment: Partial<Alignment> = { horizontal: 'center', vertical: 'middle' };
const boldFont: Partial<Font> = { bold: true };

export const exportToExcel = async (
  group: Group,
  workers: WorkerWithHospedaje[],
) => {
  if (!group || workers.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Hospedaje');

  const startDate = parseDateString(group.start_date);
  const endDate = parseDateString(group.end_date);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const dateColumns = dateRange.map(date => ({
    header: format(date, 'EEE', { locale: es }),
    key: format(date, 'yyyy-MM-dd'),
    width: 7,
  }));

  // --- 1. Configurar Columnas y Vistas ---
  worksheet.columns = [
    { header: 'Trabajador', key: 'name', width: 30 },
    { header: 'Cargo', key: 'position', width: 25 },
    { header: 'Faena', key: 'faena', width: 25 },
    ...dateColumns,
    { header: 'Total Días', key: 'totalDays', width: 12 },
  ];

  worksheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 2 }];

  // --- 2. Estilos y Contenido de Cabeceras ---
  const headerRow1 = worksheet.getRow(1);
  const headerRow2 = worksheet.getRow(2);
  headerRow1.font = boldFont;
  headerRow2.font = boldFont;
  headerRow1.alignment = centerAlignment;
  headerRow2.alignment = centerAlignment;

  headerRow1.eachCell(cell => cell.fill = headerFill);
  headerRow2.eachCell(cell => cell.fill = headerFill);

  dateRange.forEach((date, index) => {
    headerRow2.getCell(4 + index).value = format(date, 'dd/MM');
  });

  // --- 3. Añadir Datos de Trabajadores y Fórmulas ---
  const firstDateCol = 4;
  const lastDateCol = firstDateCol + dateRange.length - 1;
  const totalDaysCol = lastDateCol + 1;

  workers.forEach((worker, index) => {
    const rowNumber = index + 3; // Los datos empiezan en la fila 3
    const hospedajeMap = worker.hospedaje.reduce((acc, h) => {
      acc[format(parseDateString(h.date), 'yyyy-MM-dd')] = h.has_hospedaje;
      return acc;
    }, {} as { [key: string]: boolean });

    const rowData: any = {
      name: worker.name,
      position: worker.position,
      faena: worker.faena,
    };

    dateRange.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      rowData[dateKey] = hospedajeMap[dateKey] ? '✓' : '';
    });

    const addedRow = worksheet.addRow(rowData);
    addedRow.alignment = centerAlignment;
    addedRow.getCell('name').alignment = { horizontal: 'left', vertical: 'middle' };
    addedRow.getCell('position').alignment = { horizontal: 'left', vertical: 'middle' };
    addedRow.getCell('faena').alignment = { horizontal: 'left', vertical: 'middle' };

    // Fórmula para total de días por trabajador
    const totalDaysCell = addedRow.getCell(totalDaysCol);
    totalDaysCell.font = boldFont;
    totalDaysCell.value = { formula: `COUNTIF(D${rowNumber}:${worksheet.getColumn(lastDateCol).letter}${rowNumber}, "✓")` };
  });

  // --- 4. Añadir Fila de Totales por Día ---
  const totalRowNumber = worksheet.rowCount + 1;
  const totalRow = worksheet.getRow(totalRowNumber);
  totalRow.getCell(1).value = 'Total por día';
  totalRow.font = boldFont;
  totalRow.alignment = centerAlignment;
  totalRow.fill = totalRowFill;

  const firstWorkerRow = 3;
  const lastWorkerRow = totalRowNumber - 1;

  dateRange.forEach((_, index) => {
    const colLetter = worksheet.getColumn(firstDateCol + index).letter;
    totalRow.getCell(firstDateCol + index).value = { formula: `COUNTIF(${colLetter}${firstWorkerRow}:${colLetter}${lastWorkerRow}, "✓")` };
  });

  const grandTotalColLetter = worksheet.getColumn(totalDaysCol).letter;
  const grandTotalCell = totalRow.getCell(totalDaysCol);
  grandTotalCell.value = { formula: `SUM(${grandTotalColLetter}${firstWorkerRow}:${grandTotalColLetter}${lastWorkerRow})` };
  grandTotalCell.font = { ...boldFont, size: 12 };

  // --- 5. Añadir Resumen Financiero con Fórmulas ---
  const summaryStartRow = totalRowNumber + 3;
  const pricePerNight = group.price_per_night || 0;

  const addSummaryRow = (row: number, label: string, value: any, isBold = false, numFmt?: string) => {
    const labelCell = worksheet.getCell(`A${row}`);
    labelCell.value = label;
    labelCell.alignment = { horizontal: 'right' };
    labelCell.font = { bold: isBold };

    const valueCell = worksheet.getCell(`B${row}`);
    valueCell.value = value;
    if (numFmt) valueCell.numFmt = numFmt;
    valueCell.font = { bold: isBold };
  };

  const grandTotalFormula = `${grandTotalColLetter}${totalRowNumber}`;
  const priceCellAddress = `B${summaryStartRow + 1}`;
  const netTotalCellAddress = `B${summaryStartRow + 2}`;
  const ivaCellAddress = `B${summaryStartRow + 3}`;

  addSummaryRow(summaryStartRow, 'Total días hospedaje:', { formula: grandTotalFormula }, false, '0');
  addSummaryRow(summaryStartRow + 1, 'Precio unitario:', pricePerNight, false, '"$"#,##0');
  addSummaryRow(summaryStartRow + 2, 'Total neto:', { formula: `${grandTotalFormula}*${priceCellAddress}` }, false, '"$"#,##0');
  addSummaryRow(summaryStartRow + 3, 'IVA (19%):', { formula: `${netTotalCellAddress}*0.19` }, false, '"$"#,##0');
  addSummaryRow(summaryStartRow + 4, 'Total a pagar:', { formula: `${netTotalCellAddress}+${ivaCellAddress}` }, true, '"$"#,##0');

  // --- 6. Generar y Descargar Archivo ---
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Hospedaje_${group.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  });
};