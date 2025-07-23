import React, { useMemo, useState, useEffect } from 'react';
import { WorkerWithHospedaje } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle } from 'lucide-react';
import { format, eachDayOfInterval, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface WorkerForCalendar {
  id: string;
  name: string;
  position: string;
  faena: string;
  hospedaje: { [date: string]: boolean };
}

interface HospedajeCalendarProps {
  workers: WorkerForCalendar[];
  currentMonth: Date;
  startDate: Date;
  endDate: Date;
  onToggleHospedaje: (workerId: string, date: string) => void;
  onBulkToggleHospedaje: (workerId: string, dates: string[], select: boolean) => void;
  onDeleteWorker: (workerId: string) => void;
  onAddWorker: (name: string, position: string, faena: string) => void;
}

const HospedajeCalendar: React.FC<HospedajeCalendarProps> = ({
  workers,
  currentMonth,
  startDate,
  endDate,
  onToggleHospedaje,
  onBulkToggleHospedaje,
  onDeleteWorker,
  onAddWorker,
}) => {
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerPosition, setNewWorkerPosition] = useState("");
  const [newWorkerFaena, setNewWorkerFaena] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [dragSelectState, setDragSelectState] = useState(false);

  const handleSaveNewWorker = () => {
    if (newWorkerName.trim() === "") return;
    onAddWorker(newWorkerName.trim(), newWorkerPosition.trim(), newWorkerFaena.trim());
    setNewWorkerName("");
    setNewWorkerPosition("");
    setNewWorkerFaena("");
    setIsAddingWorker(false);
  };

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate }).filter(day => isSameMonth(day, currentMonth));
  }, [currentMonth, startDate, endDate]);

  const handleMouseDown = (workerId: string, dateKey: string) => {
    setIsDragging(true);
    const initialValue = workers.find(w => w.id === workerId)?.hospedaje[dateKey] || false;
    const newSelectState = !initialValue;
    setDragSelectState(newSelectState);
    onToggleHospedaje(workerId, dateKey);
  };

  const handleMouseOver = (workerId: string, dateKey: string) => {
    if (isDragging) {
      const currentValue = workers.find(w => w.id === workerId)?.hospedaje[dateKey] || false;
      if (currentValue !== dragSelectState) {
        onToggleHospedaje(workerId, dateKey);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div onMouseUp={handleMouseUp}>
      <Table className="select-none">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-white z-10 w-auto min-w-[240px]">Trabajador</TableHead>
            <TableHead className="w-auto min-w-[180px]">Cargo</TableHead>
            <TableHead className="w-auto min-w-[180px]">Faena</TableHead>
            {daysInMonth.map(day => (
              <TableHead key={day.toString()} className="text-center w-[60px]">
                <div className="flex flex-col items-center">
                  <span>{format(day, 'dd')}</span>
                  <span className="text-xs text-gray-500">{format(day, 'EEE', { locale: es })}</span>
                </div>
              </TableHead>
            ))}
            <TableHead className="text-right w-[100px]">Total Días</TableHead>
            <TableHead className="text-center w-[120px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map(worker => {
            const workerTotalNights = Object.values(worker.hospedaje).filter(Boolean).length;
            return (
              <TableRow key={worker.id}>
                <TableCell className="sticky left-0 bg-white z-10 font-medium">{worker.name}</TableCell>
                <TableCell>{worker.position || 'N/A'}</TableCell>
                <TableCell>{worker.faena || 'N/A'}</TableCell>
                {daysInMonth.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const hasHospedaje = worker.hospedaje[dateKey] || false;
                  return (
                    <TableCell
                      key={dateKey}
                      className="p-0 cursor-pointer"
                      onMouseDown={() => handleMouseDown(worker.id, dateKey)}
                      onMouseOver={() => handleMouseOver(worker.id, dateKey)}
                    >
                      <div className="flex items-center justify-center h-full">
                        <Checkbox
                          className="h-5 w-5 pointer-events-none"
                          checked={hasHospedaje}
                          tabIndex={-1}
                        />
                      </div>
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-semibold">{workerTotalNights}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" onClick={() => onDeleteWorker(worker.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          
          {isAddingWorker ? (
            <TableRow>
              <TableCell className="sticky left-0 bg-white z-10">
                <Input 
                  placeholder="Nombre y apellido"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  autoFocus
                />
              </TableCell>
              <TableCell>
                <Input 
                  placeholder="Cargo"
                  value={newWorkerPosition}
                  onChange={(e) => setNewWorkerPosition(e.target.value)}
                />
              </TableCell>
              <TableCell className="relative">
                <Input 
                  placeholder="Faena"
                  value={newWorkerFaena}
                  onChange={(e) => setNewWorkerFaena(e.target.value)}
                />
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-20 flex gap-1">
                  <Button onClick={handleSaveNewWorker} size="sm">Guardar</Button>
                  <Button variant="ghost" onClick={() => setIsAddingWorker(false)} size="sm">Cancelar</Button>
                </div>
              </TableCell>
              <TableCell colSpan={daysInMonth.length + 2} />
            </TableRow>
          ) : (
            <TableRow>
              <TableCell colSpan={daysInMonth.length + 5}>
                <Button variant="ghost" onClick={() => setIsAddingWorker(true)} className="w-full justify-start text-primary">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Añadir Nuevo Trabajador
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default HospedajeCalendar;