import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '@/hooks/useDatabase';
import { Group, WorkerWithHospedaje } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LogOut, FileDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import WorkerForm from '@/components/WorkerForm';
import HospedajeCalendar from '@/components/HospedajeCalendar';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateString } from '@/lib/utils';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, signOut } = useAuth();
  const { getGroupById, getWorkersForGroup, addWorker, deleteWorker, toggleHospedaje, loading } = useDatabase();
  const [group, setGroup] = useState<Group | null>(null);
  const [workers, setWorkers] = useState<WorkerWithHospedaje[]>([]);

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId || !user) return;

      const fetchedGroup = await getGroupById(groupId);
      setGroup(fetchedGroup);
      if (fetchedGroup) {
        console.log(`[GroupDetail] Group state updated. pricePerNight: ${fetchedGroup.price_per_night}`);
        const fetchedWorkers = await getWorkersForGroup(groupId);
        setWorkers(fetchedWorkers);
      }
    };

    loadGroupData();
  }, [groupId, user, getGroupById, getWorkersForGroup, location.key]);

  const handleAddWorker = async (name: string, position: string, faena: string) => {
    if (!groupId) return;
    const newWorker = await addWorker(groupId, name, position, faena);
    if (newWorker) {
      const updatedWorkers = await getWorkersForGroup(groupId);
      setWorkers(updatedWorkers);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (!groupId) return;
    const success = await deleteWorker(workerId);
    if (success) {
      const updatedWorkers = await getWorkersForGroup(groupId);
      setWorkers(updatedWorkers);
    }
  };

  const handleToggleHospedaje = async (workerId: string, date: string) => {
    // Optimistic update
    setWorkers(prevWorkers =>
      prevWorkers.map(worker => {
        if (worker.id === workerId) {
          const newHospedaje = [...worker.hospedaje];
          const hospedajeIndex = newHospedaje.findIndex(h => h.date === date);

          if (hospedajeIndex > -1) {
            newHospedaje[hospedajeIndex] = {
              ...newHospedaje[hospedajeIndex],
              has_hospedaje: !newHospedaje[hospedajeIndex].has_hospedaje
            };
          } else {
            newHospedaje.push({
              id: `temp-${Date.now()}`,
              worker_id: workerId,
              date,
              has_hospedaje: true
            });
          }

          return { ...worker, hospedaje: newHospedaje };
        }
        return worker;
      })
    );

    toggleHospedaje(workerId, date).catch(error => {
      console.error("Failed to update hospedaje:", error);
      if (groupId) {
        getWorkersForGroup(groupId).then(setWorkers);
      }
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleExportToExcel = async () => {
    if (!group || workers.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hospedaje');

    const startDate = parseDateString(group.start_date);
    const endDate = parseDateString(group.end_date);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const pricePerNight = group.price_per_night || 0;

    // --- Column Definitions ---
    const columns = [
        { key: 'worker', header: 'Trabajador', width: 30 },
        { key: 'position', header: 'Cargo', width: 20 },
        { key: 'faena', header: 'Faena', width: 20 },
        ...days.map(day => ({
            key: format(day, 'yyyy-MM-dd'),
            header: format(day, 'dd/MM'),
            dayHeader: format(day, 'EEE', { locale: es }),
            width: 7
        })),
        { key: 'totalDays', header: 'Total Días', width: 15 },
    ];

    // --- Double Header ---
    const headerRow1 = worksheet.getRow(1);
    const headerRow2 = worksheet.getRow(2);
    headerRow1.font = { bold: true };
    headerRow2.font = { bold: true };
    headerRow1.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow2.alignment = { horizontal: 'center', vertical: 'middle' };

    let currentCol = 1;
    // Worker, Position and Faena columns
    worksheet.mergeCells(1, currentCol, 2, currentCol);
    worksheet.getCell(1, currentCol).value = columns[0].header;
    worksheet.getColumn(currentCol).width = columns[0].width;
    currentCol++;
    
    worksheet.mergeCells(1, currentCol, 2, currentCol);
    worksheet.getCell(1, currentCol).value = columns[1].header;
    worksheet.getColumn(currentCol).width = columns[1].width;
    currentCol++;

    worksheet.mergeCells(1, currentCol, 2, currentCol);
    worksheet.getCell(1, currentCol).value = columns[2].header;
    worksheet.getColumn(currentCol).width = columns[2].width;
    currentCol++;

    // Date columns
    days.forEach((day, index) => {
        const dayColIndex = index + 3; // +3 for worker, position and faena
        worksheet.getCell(1, currentCol).value = columns[dayColIndex].dayHeader;
        worksheet.getCell(2, currentCol).value = columns[dayColIndex].header;
        worksheet.getColumn(currentCol).width = columns[dayColIndex].width;
        currentCol++;
    });

    const totalDaysColNum = currentCol;
    worksheet.mergeCells(1, totalDaysColNum, 2, totalDaysColNum);
    worksheet.getCell(1, totalDaysColNum).value = 'Total Días';
    worksheet.getColumn(totalDaysColNum).width = 15;
    worksheet.getColumn(totalDaysColNum).alignment = { horizontal: 'right' };

    worksheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 2, activeCell: 'D3' }];

    // --- Data Rows ---
    const dataStartRow = 3;
    workers.forEach((worker, index) => {
        const rowNumber = dataStartRow + index;
        const row = worksheet.getRow(rowNumber);
        row.getCell(1).value = worker.name;
        row.getCell(2).value = worker.position;
        row.getCell(3).value = worker.faena;

        let totalDaysCount = 0;
        const hospedajeMap = worker.hospedaje.reduce((acc, h) => {
            acc[h.date] = h.has_hospedaje;
            return acc;
        }, {} as { [date: string]: boolean });

        days.forEach((day, dayIndex) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            if (hospedajeMap[dateKey]) {
                const cell = row.getCell(dayIndex + 4); // +4 for worker, position, faena
                cell.value = '✓';
                cell.alignment = { horizontal: 'center' };
                totalDaysCount++;
            }
        });

        row.getCell(totalDaysColNum).value = totalDaysCount;
    });

    // --- Totals Row ---
    const totalRow = worksheet.getRow(dataStartRow + workers.length);
    totalRow.font = { bold: true };
    totalRow.getCell(1).value = 'Total por día';
    worksheet.mergeCells(totalRow.number, 1, totalRow.number, 3);
    totalRow.getCell(1).alignment = { horizontal: 'right' };

    let totalOfTotals = 0;
    days.forEach((day, dayIndex) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dailyTotal = workers.reduce((sum, worker) => {
            const hospedajeMap = worker.hospedaje.reduce((acc, h) => {
                acc[h.date] = h.has_hospedaje;
                return acc;
            }, {} as { [date: string]: boolean });
            return sum + (hospedajeMap[dateKey] ? 1 : 0);
        }, 0);
        totalRow.getCell(dayIndex + 4).value = dailyTotal;
        totalOfTotals += dailyTotal;
    });
    totalRow.getCell(totalDaysColNum).value = totalOfTotals;

    // --- Summary Section ---
    const summaryStartRow = dataStartRow + workers.length + 2;
    const labelColNum = totalDaysColNum - 1;
    const valueColNum = totalDaysColNum;

    const totalDaysSumAddress = totalRow.getCell(totalDaysColNum).address;
    const pricePerNightCellAddress = `${worksheet.getColumn(valueColNum).letter}${summaryStartRow + 1}`;
    const totalNetoCellAddress = `${worksheet.getColumn(valueColNum).letter}${summaryStartRow + 2}`;
    const ivaCellAddress = `${worksheet.getColumn(valueColNum).letter}${summaryStartRow + 3}`;
    const totalToPayCellAddress = `${worksheet.getColumn(valueColNum).letter}${summaryStartRow + 4}`;

    const summaryData = [
        { label: 'Total días hospedaje:', formula: totalDaysSumAddress, format: '#,##0' },
        { label: 'Precio unitario:', value: pricePerNight, format: '"$"#,##0.00' },
        
        { label: 'Total neto:', formula: `${totalDaysSumAddress}*${pricePerNightCellAddress}`, format: '"$"#,##0.00' },
        { label: 'IVA (19%):', formula: `${totalNetoCellAddress}*0.19`, format: '"$"#,##0.00' },
        { label: 'Total a pagar:', formula: `${totalNetoCellAddress}+${ivaCellAddress}`, format: '"$"#,##0.00', isBold: true }
    ];

    summaryData.forEach((item, index) => {
        const row = worksheet.getRow(summaryStartRow + index);
        
        const labelCell = row.getCell(labelColNum);
        labelCell.value = item.label;
        labelCell.alignment = { horizontal: 'right' };
        labelCell.font = { bold: item.isBold || false };

        const valueCell = row.getCell(valueColNum);
        if (item.formula) {
            valueCell.value = { formula: item.formula };
        } else {
            valueCell.value = item.value;
        }
        valueCell.numFmt = item.format;
        valueCell.font = { bold: item.isBold || false };
    });

    // --- Save File ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Hospedaje_${group.name.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando detalles de la agrupación...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <h1 className="text-2xl font-bold mb-2">Agrupación no encontrada</h1>
          <p>La agrupación con ID "{groupId}" no existe o no tienes permiso para verla.</p>
          <Link to="/">
            <Button className="mt-4">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = parseDateString(group.start_date);
  const endDate = parseDateString(group.end_date);
  const currentMonth = startDate;

  const currentWorkersForCalendar = workers.map(worker => ({
    id: worker.id,
    name: worker.name,
    position: worker.position,
    faena: worker.faena,
    hospedaje: worker.hospedaje.reduce((acc, h) => {
      acc[h.date] = h.has_hospedaje;
      return acc;
    }, {} as { [date: string]: boolean }),
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Control de Hospedaje de Trabajadores
              </h1>
              <p className="text-gray-600">
                Bienvenido, {user?.email}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Link to="/">
                    <Button variant="outline" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a Período
                    </Button>
                </Link>
                <Button onClick={handleExportToExcel} variant="secondary" className="flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    Exportar a Excel
                </Button>
            </div>
          <div>
            <h2 className="text-xl font-semibold">Agrupación: {group.name}</h2>
            <p className="text-gray-600 text-sm">
              Período: {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <WorkerForm onAddWorker={handleAddWorker} />

        {currentWorkersForCalendar.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">
              No hay trabajadores agregados a esta agrupación.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Agrega trabajadores usando el formulario de arriba.
            </p>
          </div>
        ) : (
          <HospedajeCalendar
            workers={currentWorkersForCalendar}
            currentMonth={currentMonth}
            startDate={startDate}
            endDate={endDate}
            onToggleHospedaje={handleToggleHospedaje}
            onDeleteWorker={handleDeleteWorker}
          />
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
