import React, { useState } from 'react';
import { WorkerWithHospedaje } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Calendar as CalendarIcon, CheckSquare, Square, X, ChevronDown, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, isBefore, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


// Define the interface for the transformed worker data that matches what Index.tsx passes
interface CalendarWorker {
  id: string;
  name: string;
  position: string;
  faena: string;
  hospedaje: { [date: string]: boolean };
}

interface HospedajeCalendarProps {
  workers: CalendarWorker[];
  currentMonth: Date; // Still useful for month name display
  startDate: Date; // New prop for the start date of the group's period
  endDate: Date;   // New prop for the end date of the group's period
  onToggleHospedaje: (workerId: string, date: string) => void;
  onDeleteWorker: (workerId: string) => void;
}

const HospedajeCalendar = ({
  workers,
  currentMonth,
  startDate,
  endDate,
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
  const [rangeStartDate, setRangeStartDate] = useState<Date | undefined>();
  const [rangeEndDate, setRangeEndDate] = useState<Date | undefined>();
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isRangeStartOpen, setIsRangeStartOpen] = useState(false);
  const [isRangeEndOpen, setIsRangeEndOpen] = useState(false);

  const getBillingPeriodDays = () => {
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
    const days = getBillingPeriodDays();
    return days.map(dayData => {
      const dateStr = formatDateFromDayData(dayData);
      const count = workers.reduce((total, worker) => {
        return total + (worker.hospedaje[dateStr] ? 1 : 0);
      }, 0);
      return { dayData, count };
    });
  };

  const calculateFinancialSummary = () => {
    const days = getBillingPeriodDays();
    
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
    console.log('handleMouseDown called for:', workerId, date);
    const currentValue = workers.find(w => w.id === workerId)?.hospedaje[date] || false;
    setIsDragging(true);
    setDragValue(!currentValue);
    setDragStartCell({ workerId, date });
    onToggleHospedaje(workerId, date);
  };

  const handleMouseEnter = (workerId: string, date: string) => {
    if (isDragging) {
      console.log('handleMouseEnter called for:', workerId, date);
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

  // Date range selection functions
  const getDateRange = () => {
    if (!rangeStartDate || !rangeEndDate) return [];
    
    const dates = [];
    const start = new Date(rangeStartDate);
    const end = new Date(rangeEndDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
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
    setRangeStartDate(undefined);
    setRangeEndDate(undefined);
    setSelectedWorkerIds([]);
    setShowRangeSelector(false);
  };

  const isDateInRange = (dayData: { day: number, month: number, year: number }) => {
    if (!rangeStartDate || !rangeEndDate) return false;
    const dateStr = formatDateFromDayData(dayData);
    return getDateRange().includes(dateStr);
  };

  const days = getBillingPeriodDays();
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
            Hospedaje de Trabajadores
              <div className="text-sm font-normal text-gray-600">
                {format(startDate, 'dd MMM yyyy', { locale: es })} - {format(endDate, 'dd MMM yyyy', { locale: es })}
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
          </div>
        </div>
      </CardHeader>
      <CardContent>

        {/* Date Range Selector */}
        <div className="mb-4">
          <Button
            onClick={() => setShowRangeSelector(!showRangeSelector)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Selección masiva
          </Button>
          
          {showRangeSelector && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Start Date */}
                <div>
                  <Label>Fecha inicial</Label>
                  <Popover open={isRangeStartOpen} onOpenChange={setIsRangeStartOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !rangeStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {rangeStartDate ? format(rangeStartDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={rangeStartDate}
                        onSelect={(date) => {
                          setRangeStartDate(date);
                          setIsRangeStartOpen(false);
                        }}
                        disabled={(date) => {
                          return isBefore(date, startOfDay(startDate)) || isAfter(date, startOfDay(endDate));
                        }}
                        initialFocus
                        locale={es}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div>
                  <Label>Fecha final</Label>
                  <Popover open={isRangeEndOpen} onOpenChange={setIsRangeEndOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !rangeEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {rangeEndDate ? format(rangeEndDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={rangeEndDate}
                        onSelect={(date) => {
                          setRangeEndDate(date);
                          setIsRangeEndOpen(false);
                        }}
                        disabled={(date) => {
                          return isBefore(date, startOfDay(startDate)) || isAfter(date, startOfDay(endDate)) || (rangeStartDate && isBefore(date, startOfDay(rangeStartDate)));
                        }}
                        initialFocus
                        locale={es}
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
                      disabled={!rangeStartDate || !rangeEndDate}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <CheckSquare className="h-4 w-4" />
                      Marcar
                    </Button>
                    <Button
                      onClick={() => applyRangeSelection(false)}
                      disabled={!rangeStartDate || !rangeEndDate}
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
              
              {rangeStartDate && rangeEndDate && (
                <div className="mt-3 p-2 bg-blue-100 rounded text-sm">
                  <strong>Rango seleccionado:</strong> {getDateRange().length} días 
                  ({format(rangeStartDate, "dd/MM", { locale: es })} - {format(rangeEndDate, "dd/MM", { locale: es })})
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
                <th className="border p-1 bg-gray-50 text-left min-w-[100px]" rowSpan={2}>Faena</th>
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
                    <td className="border p-2 text-sm text-gray-600">{worker.faena}</td>
                    {days.map(dayData => {
                      const dateStr = formatDateFromDayData(dayData);
                      const isChecked = worker.hospedaje[dateStr] || false;
                      const inRange = isDateInRange(dayData);
                      return (
                        <td key={`cell-${dayData.day}-${dayData.month}`} className={`border p-1 text-center ${inRange ? 'bg-yellow-50' : ''}`}>
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
                <td className="border p-2" colSpan={3}>TOTAL POR DÍA</td>
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

        {/* Resumen financiero */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Resumen Financiero</h3>
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
      </CardContent>
    </Card>
  );
};

export default HospedajeCalendar;