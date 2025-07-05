import React, { useState, useRef } from 'react';
import { Worker } from '@/types/worker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Download, Calendar as CalendarIcon, CheckSquare, Square, X, ChevronDown, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  // Custom period configuration states
  const [useCustomPeriod, setUseCustomPeriod] = useState(false);
  const [customPeriodStart, setCustomPeriodStart] = useState<Date | undefined>();
  const [customPeriodEnd, setCustomPeriodEnd] = useState<Date | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Date range selection states
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);

  const getBillingPeriodRange = (date: Date) => {
    // Use custom period if enabled and configured
    if (useCustomPeriod && customPeriodStart && customPeriodEnd) {
      return { startDate: customPeriodStart, endDate: customPeriodEnd };
    }
    
    // Default billing period: from 21st of previous month to 21st of current month
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month - 1, 21);
    const endDate = new Date(year, month, 21);
    
    return { startDate, endDate };
  };

  const getCustomPeriodDays = () => {
    if (!customPeriodStart || !customPeriodEnd) return 0;
    const diffTime = Math.abs(customPeriodEnd.getTime() - customPeriodStart.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const applyCustomPeriod = () => {
    if (!customPeriodStart || !customPeriodEnd) return;
    if (customPeriodStart >= customPeriodEnd) return;
    
    setUseCustomPeriod(true);
    setIsModalOpen(false);
    
    const totalDays = Math.ceil((customPeriodEnd.getTime() - customPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    toast({
      title: "Período personalizado aplicado",
      description: `Período configurado: ${format(customPeriodStart, 'dd/MM/yyyy')} - ${format(customPeriodEnd, 'dd/MM/yyyy')} (${totalDays} días)`,
    });
  };

  const resetToStandardPeriod = () => {
    setUseCustomPeriod(false);
    setCustomPeriodStart(undefined);
    setCustomPeriodEnd(undefined);
    setIsModalOpen(false);
    
    toast({
      title: "Período estándar aplicado",
      description: "Se ha restablecido el período estándar (21-21)",
    });
  };

  const getBillingPeriodDays = (date: Date) => {
    const { startDate, endDate } = getBillingPeriodRange(date);
    const days: { day: number, month: number, year: number, date: Date }[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        date: new Date(d)
      });
    }
    
    return days;
  };

  const getDayOfWeek = (date: Date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return days[date.getDay()];
  };

  const formatDateFromDayData = (dayData: { day: number, month: number, year: number }) => {
    return new Date(dayData.year, dayData.month, dayData.day).toISOString().split('T')[0];
  };

  const getDayTotals = () => {
    const days = getBillingPeriodDays(currentMonth);
    return days.map(dayData => {
      const dateStr = formatDateFromDayData(dayData);
      const count = workers.reduce((total, worker) => {
        return total + (worker.hospedaje[dateStr] ? 1 : 0);
      }, 0);
      return { dayData, count };
    });
  };

  const calculateFinancialSummary = () => {
    const days = getBillingPeriodDays(currentMonth);
    
    const totalWorkerDays = workers.reduce((total, worker) => {
      return total + days.reduce((workerTotal, dayData) => {
        const dateStr = formatDateFromDayData(dayData);
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
    
    // Ensure dates are in current billing period
    const { startDate: periodStart, endDate: periodEnd } = getBillingPeriodRange(currentMonth);
    
    const rangeStart = start < periodStart ? periodStart : start;
    const rangeEnd = end > periodEnd ? periodEnd : end;
    
    for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const applyRangeSelection = (markSelected: boolean) => {
    const dateRange = getDateRange();
    if (dateRange.length === 0) return;

    const workersToUpdate = selectedWorkerIds.length === 0 
      ? workers 
      : workers.filter(w => selectedWorkerIds.includes(w.id));

    workersToUpdate.forEach(worker => {
      dateRange.forEach(dateStr => {
        const currentValue = worker.hospedaje[dateStr] || false;
        if (currentValue !== markSelected) {
          onToggleHospedaje(worker.id, dateStr);
        }
      });
    });
  };

  const toggleWorkerSelection = (workerId: string) => {
    setSelectedWorkerIds(prev => 
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const resetRangeSelector = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedWorkerIds([]);
    setShowRangeSelector(false);
  };

  const isDateInRange = (dayData: { day: number, month: number, year: number }) => {
    if (!startDate || !endDate) return false;
    const dateStr = formatDateFromDayData(dayData);
    return getDateRange().includes(dateStr);
  };

  const exportToExcel = () => {
    const days = getBillingPeriodDays(currentMonth);
    const dayTotals = getDayTotals();
    const financialSummary = calculateFinancialSummary();
    
    // Crear los datos para Excel
    const excelData = [];
    
    // Header con días y meses
    const header = ['Trabajador', 'Cargo', ...days.map(d => `${d.day}/${d.month + 1}`), 'Total'];
    excelData.push(header);
    
    // Datos de trabajadores
    workers.forEach(worker => {
      const workerTotal = days.reduce((total, dayData) => {
        const dateStr = formatDateFromDayData(dayData);
        return total + (worker.hospedaje[dateStr] ? 1 : 0);
      }, 0);
      
      const row = [
        worker.name,
        worker.position,
        ...days.map(dayData => {
          const dateStr = formatDateFromDayData(dayData);
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
      ...days.map(() => ({ wch: 6 })), // Días
      { wch: 8 } // Total
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Hospedaje');
    
    // Generar nombre del archivo con período de facturación
    const { startDate: periodStart, endDate: periodEnd } = getBillingPeriodRange(currentMonth);
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const fileName = `Hospedaje_Periodo_${format(periodStart, 'dd-MMM')}_${format(periodEnd, 'dd-MMM')}_${currentMonth.getFullYear()}.xlsx`;
    
    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
  };

  const days = getBillingPeriodDays(currentMonth);
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
            Período {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            <div className="text-sm font-normal text-gray-600">
              {format(getBillingPeriodRange(currentMonth).startDate, 'dd MMM')} - {format(getBillingPeriodRange(currentMonth).endDate, 'dd MMM')}
            </div>
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
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurar Período
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Configurar Período de Facturación</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Custom Start Date */}
                    <div>
                      <Label>Fecha de inicio del período</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !customPeriodStart && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customPeriodStart ? format(customPeriodStart, "dd/MM/yyyy") : "Seleccionar fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customPeriodStart}
                            onSelect={setCustomPeriodStart}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Custom End Date */}
                    <div>
                      <Label>Fecha de fin del período</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !customPeriodEnd && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customPeriodEnd ? format(customPeriodEnd, "dd/MM/yyyy") : "Seleccionar fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customPeriodEnd}
                            onSelect={setCustomPeriodEnd}
                            disabled={(date) => customPeriodStart && date <= customPeriodStart}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Period Summary */}
                  <div className="p-3 bg-blue-50 rounded text-sm">
                    <div className="font-medium mb-1">
                      {useCustomPeriod ? 'Período Personalizado Activo' : 'Período Estándar (21-21)'}
                    </div>
                    <div>
                      <strong>Rango:</strong> {format(getBillingPeriodRange(currentMonth).startDate, 'dd/MM/yyyy')} - {format(getBillingPeriodRange(currentMonth).endDate, 'dd/MM/yyyy')}
                    </div>
                    <div>
                      <strong>Total días:</strong> {days.length} días
                      {useCustomPeriod && customPeriodStart && customPeriodEnd && (
                        <span className="text-green-600 font-medium"> (personalizado)</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={resetToStandardPeriod}
                      variant="outline"
                    >
                      Período Estándar
                    </Button>
                    <Button
                      onClick={applyCustomPeriod}
                      disabled={!customPeriodStart || !customPeriodEnd || customPeriodStart >= customPeriodEnd}
                    >
                      Aplicar Período
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                          const { startDate: periodStart, endDate: periodEnd } = getBillingPeriodRange(currentMonth);
                          return date < periodStart || date > periodEnd;
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
                          const { startDate: periodStart, endDate: periodEnd } = getBillingPeriodRange(currentMonth);
                          return date < periodStart || date > periodEnd || (startDate && date < startDate);
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Worker Multi-Selector */}
                <div>
                  <Label>Trabajadores</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal"
                      >
                        <span>
                          {selectedWorkerIds.length === 0 
                            ? "Todos los trabajadores" 
                            : selectedWorkerIds.length === workers.length
                              ? "Todos seleccionados"
                              : `${selectedWorkerIds.length} seleccionados`
                          }
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="select-all"
                            checked={selectedWorkerIds.length === workers.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedWorkerIds(workers.map(w => w.id));
                              } else {
                                setSelectedWorkerIds([]);
                              }
                            }}
                          />
                          <Label htmlFor="select-all" className="font-medium">
                            Seleccionar todos
                          </Label>
                        </div>
                        <div className="border-t pt-2">
                          {workers.map(worker => (
                            <div key={worker.id} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={worker.id}
                                checked={selectedWorkerIds.includes(worker.id)}
                                onCheckedChange={() => toggleWorkerSelection(worker.id)}
                              />
                              <Label htmlFor={worker.id} className="text-sm">
                                {worker.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
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
                    <Button
                      onClick={resetRangeSelector}
                      variant="ghost"
                      size="sm"
                      className="flex items-center justify-center w-8 h-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {startDate && endDate && (
                <div className="mt-3 p-2 bg-blue-100 rounded text-sm">
                  <strong>Rango seleccionado:</strong> {getDateRange().length} días 
                  ({format(startDate, "dd/MM")} - {format(endDate, "dd/MM")})
                  {selectedWorkerIds.length > 0 && selectedWorkerIds.length < workers.length && (
                    <span> para {selectedWorkerIds.length} trabajador{selectedWorkerIds.length > 1 ? 'es' : ''} seleccionado{selectedWorkerIds.length > 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse select-none">
            <thead>
              {/* Primera fila: días de la semana */}
              <tr>
                <th className="border p-1 bg-gray-50 text-left min-w-[150px]" rowSpan={2}>Trabajador</th>
                <th className="border p-1 bg-gray-50 text-left min-w-[100px]" rowSpan={2}>Cargo</th>
                {days.map(dayData => (
                  <th key={`dow-${dayData.day}-${dayData.month}`} className="border p-1 bg-gray-50 text-center min-w-[35px] text-xs">
                    {getDayOfWeek(dayData.date)}
                  </th>
                ))}
                <th className="border p-1 bg-gray-50 text-center min-w-[60px]" rowSpan={2}>Total</th>
                <th className="border p-1 bg-gray-50 text-center min-w-[50px]" rowSpan={2}>Acción</th>
              </tr>
              {/* Segunda fila: números de días */}
              <tr>
                {days.map(dayData => (
                  <th key={`day-${dayData.day}-${dayData.month}`} className="border p-1 bg-gray-50 text-center min-w-[35px] text-xs">
                    {dayData.day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              {workers.map(worker => {
                const workerTotal = days.reduce((total, dayData) => {
                  const dateStr = formatDateFromDayData(dayData);
                  return total + (worker.hospedaje[dateStr] ? 1 : 0);
                }, 0);

                return (
                  <tr key={worker.id}>
                    <td className="border p-2 font-medium">{worker.name}</td>
                    <td className="border p-2 text-sm text-gray-600">{worker.position}</td>
                    {days.map(dayData => {
                      const dateStr = formatDateFromDayData(dayData);
                      const isChecked = worker.hospedaje[dateStr] || false;
                      const inRange = isDateInRange(dayData);
                      const isNewMonth = dayData.month !== currentMonth.getMonth();
                      return (
                        <td key={`cell-${dayData.day}-${dayData.month}`} className={`border p-1 text-center ${inRange ? 'bg-yellow-50' : ''} ${isNewMonth ? 'bg-gray-100' : ''}`}>
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
                {dayTotals.map(({ dayData, count }) => (
                  <td key={`total-${dayData.day}-${dayData.month}`} className="border p-2 text-center">
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
