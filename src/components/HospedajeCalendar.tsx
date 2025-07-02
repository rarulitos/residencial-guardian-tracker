import React, { useState, useRef } from 'react';
import { Worker } from '@/types/worker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Download, Calendar as CalendarIcon, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  const [unitPrice, setUnitPrice] = useState<number>(25000);
  
  // Date range selection states
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('all');

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

  const calculateFinancialSummary = () => {
    const days = getDaysInMonth(currentMonth);
    
    const totalWorkerDays = workers.reduce((total, worker) => {
      return total + days.reduce((workerTotal, day) => {
        const dateStr = formatDate(day);
        return workerTotal + (worker.hospedaje[dateStr] ? 1 : 0);
      }, 0);
    }, 0);

    const netTotal = totalWorkerDays * unitPrice;
    const iva = netTotal * 0.19;
    const totalToPay = netTotal + iva;

    return {
      totalWorkerDays,
      unitPrice,
      netTotal,
      iva,
      totalToPay
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
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

  // Date range functions
  const getDateRange = () => {
    if (!startDate || !endDate) return [];
    
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure dates are in current month
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const rangeStart = start < monthStart ? monthStart : start;
    const rangeEnd = end > monthEnd ? monthEnd : end;
    
    for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const applyRangeSelection = (markSelected: boolean) => {
    const dateRange = getDateRange();
    if (dateRange.length === 0) return;

    const workersToUpdate = selectedWorkerId === 'all' 
      ? workers 
      : workers.filter(w => w.id === selectedWorkerId);

    workersToUpdate.forEach(worker => {
      dateRange.forEach(dateStr => {
        const currentValue = worker.hospedaje[dateStr] || false;
        if (currentValue !== markSelected) {
          onToggleHospedaje(worker.id, dateStr);
        }
      });
    });
  };

  const resetRangeSelector = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedWorkerId('all');
    setShowRangeSelector(false);
  };

  const isDateInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const dateStr = formatDate(day);
    return getDateRange().includes(dateStr);
  };

  const exportToExcel = () => {
    const days = getDaysInMonth(currentMonth);
    const dayTotals = getDayTotals();
    const financialSummary = calculateFinancialSummary();
    
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
      financialSummary.totalWorkerDays
    ];
    excelData.push(totalRow);
    
    // Espacios en blanco
    excelData.push([]);
    excelData.push([]);
    
    // Resumen Financiero
    excelData.push(['RESUMEN FINANCIERO']);
    excelData.push([]);
    excelData.push(['Concepto', 'Valor']);
    excelData.push(['Total de trabajadores hospedados (días)', financialSummary.totalWorkerDays]);
    excelData.push(['Precio unitario por alojamiento', formatCurrency(financialSummary.unitPrice)]);
    excelData.push(['Total neto (sin IVA)', formatCurrency(financialSummary.netTotal)]);
    excelData.push(['IVA (19%)', formatCurrency(financialSummary.iva)]);
    excelData.push(['MONTO TOTAL A PAGAR', formatCurrency(financialSummary.totalToPay)]);
    
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
  const financialSummary = calculateFinancialSummary();

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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="unitPrice" className="text-sm">Precio unitario:</Label>
              <Input
                id="unitPrice"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-32"
                placeholder="Precio por día"
              />
            </div>
            <Button onClick={exportToExcel} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumen financiero rápido */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total días hospedaje:</span>
              <div className="text-lg font-bold">{financialSummary.totalWorkerDays}</div>
            </div>
            <div>
              <span className="font-medium">Total neto:</span>
              <div className="text-lg font-bold">{formatCurrency(financialSummary.netTotal)}</div>
            </div>
            <div>
              <span className="font-medium">IVA (19%):</span>
              <div className="text-lg font-bold">{formatCurrency(financialSummary.iva)}</div>
            </div>
            <div>
              <span className="font-medium">Total a pagar:</span>
              <div className="text-lg font-bold text-green-600">{formatCurrency(financialSummary.totalToPay)}</div>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="mb-4">
          <Button
            onClick={() => setShowRangeSelector(!showRangeSelector)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Seleccionar Rango de Fechas
          </Button>
          
          {showRangeSelector && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Start Date */}
                <div>
                  <Label>Fecha inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => {
                          const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                          const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                          return date < monthStart || date > monthEnd;
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div>
                  <Label>Fecha final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => {
                          const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                          const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                          return date < monthStart || date > monthEnd || (startDate && date < startDate);
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Worker Selector */}
                <div>
                  <Label>Trabajador</Label>
                  <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar trabajador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los trabajadores</SelectItem>
                      {workers.map(worker => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Label>Acciones</Label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => applyRangeSelection(true)}
                      disabled={!startDate || !endDate}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <CheckSquare className="h-4 w-4" />
                      Marcar
                    </Button>
                    <Button
                      onClick={() => applyRangeSelection(false)}
                      disabled={!startDate || !endDate}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Square className="h-4 w-4" />
                      Desmarcar
                    </Button>
                  </div>
                  <Button
                    onClick={resetRangeSelector}
                    variant="ghost"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
              
              {startDate && endDate && (
                <div className="mt-3 p-2 bg-blue-100 rounded text-sm">
                  <strong>Rango seleccionado:</strong> {getDateRange().length} días 
                  ({format(startDate, "dd/MM")} - {format(endDate, "dd/MM")})
                  {selectedWorkerId !== 'all' && (
                    <span> para {workers.find(w => w.id === selectedWorkerId)?.name}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

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
                      const inRange = isDateInRange(day);
                      return (
                        <td key={day} className={`border p-1 text-center ${inRange ? 'bg-yellow-50' : ''}`}>
                          <div
                            onMouseDown={() => handleMouseDown(worker.id, dateStr)}
                            onMouseEnter={() => handleMouseEnter(worker.id, dateStr)}
                            className={`w-6 h-6 mx-auto rounded border-2 transition-colors cursor-pointer flex items-center justify-center ${
                              isChecked 
                                ? 'bg-blue-500 border-blue-500' 
                                : inRange
                                  ? 'bg-yellow-200 border-yellow-400 hover:border-yellow-500'
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
                  {financialSummary.totalWorkerDays}
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
