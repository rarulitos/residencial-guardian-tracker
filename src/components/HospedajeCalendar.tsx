
import React from 'react';
import { Worker } from '@/types/worker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

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

  const days = getDaysInMonth(currentMonth);
  const dayTotals = getDayTotals();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
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
            <tbody>
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
                          <button
                            onClick={() => onToggleHospedaje(worker.id, dateStr)}
                            className={`w-6 h-6 rounded border-2 transition-colors ${
                              isChecked 
                                ? 'bg-blue-500 border-blue-500' 
                                : 'bg-white border-gray-300 hover:border-blue-300'
                            }`}
                          >
                            {isChecked && <span className="text-white text-xs">✓</span>}
                          </button>
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
