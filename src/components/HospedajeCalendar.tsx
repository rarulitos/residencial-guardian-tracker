
import React, { useState, useRef } from 'react';
import { Worker } from '@/types/worker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface HospedajeCalendarProps {
  workers: Worker[];
  currentMonth: Date;
  onToggleHospedaje: (workerId: string, date: string) => void;
  onDeleteWorker: (workerId: string) => void;
}

const HospedajeCalendar = ({ 
  workers, 
  currentMonth, 
  onToggleHospedaje, 
  onDeleteWorker 
}: HospedajeCalendarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean>(false);
  const [dragStartCell, setDragStartCell] = useState<{workerId: string, date: string} | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const getDayTotals = () => {
    const days = getDaysInMonth(currentMonth);
    return days.map(day => {
      const dateStr = formatDate(day);
      const count = workers.reduce((total, worker) => {
        return total + (worker.hospedaje[dateStr] ? 1 : 0);
      }, 0);
      return { day, count };
    });
  };

  const handleMouseDown = (workerId: string, date: string) => {
    const currentValue = workers.find(w => w.id === workerId)?.hospedaje[date] || false;
    setIsDragging(true);
    setDragValue(!currentValue);
    setDragStartCell({ workerId, date });
    onToggleHospedaje(workerId, date);
  };

  const handleMouseEnter = (workerId: string, date: string) => {
    if (isDragging) {
      const currentValue = workers.find(w => w.id === workerId)?.hospedaje[date] || false;
      if (currentValue !== dragValue) {
        onToggleHospedaje(workerId, date);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartCell(null);
  };

  const exportToExcel = () => {
    const days = getDaysInMonth(currentMonth);
    const dayTotals = getDayTotals();
    
    // Crear los datos para Excel
    const excelData = [];
    
    // Header
    const header = ['Trabajador', 'Cargo', ...days.map(d => d.toString()), 'Total'];
    excelData.push(header);
    
    // Datos de trabajadores
    workers.forEach(worker => {
      const workerTotal = days.reduce((total, day) => {
        const dateStr = formatDate(day);
        return total + (worker.hospedaje[dateStr] ? 1 : 0);
      }, 0);
      
      const row = [
        worker.name,
        worker.position,
        ...days.map(day => {
          const dateStr = formatDate(day);
          return worker.hospedaje[dateStr] ? 'X' : '';
        }),
        workerTotal
      ];
      excelData.push(row);
    });
    
    // Fila de totales
    const totalRow = [
      'TOTAL POR DÍA',
      '',
      ...dayTotals.map(({ count }) => count > 0 ? count : ''),
      workers.reduce((total, worker) => {
        return total + days.reduce((workerTotal, day) => {
          const dateStr = formatDate(day);
          return workerTotal + (worker.hospedaje[dateStr] ? 1 : 0);
        }, 0);
      }, 0)
    ];
    excelData.push(totalRow);
    
    // Crear el libro de trabajo
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // Configurar ancho de columnas
    const colWidths = [
      { wch: 20 }, // Trabajador
      { wch: 15 }, // Cargo
      ...days.map(() => ({ wch: 4 })), // Días
      { wch: 8 } // Total
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Hospedaje');
    
    // Generar nombre del archivo
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const fileName = `Hospedaje_${monthNames[currentMonth.getMonth()]}_${currentMonth.getFullYear()}.xlsx`;
    
    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
  };

  const days = getDaysInMonth(currentMonth);
  const dayTotals = getDayTotals();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </CardTitle>
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse select-none">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-50 text-left min-w-[150px]">Trabajador</th>
                <th className="border p-2 bg-gray-50 text-left min-w-[100px]">Cargo</th>
                {days.map(day => (
                  <th key={day} className="border p-2 bg-gray-50 text-center min-w-[30px] text-xs">
                    {day}
                  </th>
                ))}
                <th className="border p-2 bg-gray-50 text-center min-w-[60px]">Total</th>
                <th className="border p-2 bg-gray-50 text-center min-w-[50px]">Acción</th>
              </tr>
            </thead>
            <tbody onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              {workers.map(worker => {
                const workerTotal = days.reduce((total, day) => {
                  const dateStr = formatDate(day);
                  return total + (worker.hospedaje[dateStr] ? 1 : 0);
                }, 0);

                return (
                  <tr key={worker.id}>
                    <td className="border p-2 font-medium">{worker.name}</td>
                    <td className="border p-2 text-sm text-gray-600">{worker.position}</td>
                    {days.map(day => {
                      const dateStr = formatDate(day);
                      const isChecked = worker.hospedaje[dateStr] || false;
                      return (
                        <td key={day} className="border p-1 text-center">
                          <div
                            onMouseDown={() => handleMouseDown(worker.id, dateStr)}
                            onMouseEnter={() => handleMouseEnter(worker.id, dateStr)}
                            className={`w-6 h-6 mx-auto rounded border-2 transition-colors cursor-pointer flex items-center justify-center ${
                              isChecked 
                                ? 'bg-blue-500 border-blue-500' 
                                : 'bg-white border-gray-300 hover:border-blue-300'
                            }`}
                          >
                            {isChecked && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                        </td>
                      );
                    })}
                    <td className="border p-2 text-center font-medium">{workerTotal}</td>
                    <td className="border p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteWorker(worker.id)}
                        className="p-1 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {/* Fila de totales */}
              <tr className="bg-gray-100 font-bold">
                <td className="border p-2" colSpan={2}>TOTAL POR DÍA</td>
                {dayTotals.map(({ day, count }) => (
                  <td key={day} className="border p-2 text-center">
                    {count > 0 ? count : '-'}
                  </td>
                ))}
                <td className="border p-2 text-center">
                  {workers.reduce((total, worker) => {
                    return total + days.reduce((workerTotal, day) => {
                      const dateStr = formatDate(day);
                      return workerTotal + (worker.hospedaje[dateStr] ? 1 : 0);
                    }, 0);
                  }, 0)}
                </td>
                <td className="border p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HospedajeCalendar;
