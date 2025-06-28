
import React, { useState } from 'react';
import { Worker, MonthlyWorkers } from '@/types/worker';
import WorkerForm from '@/components/WorkerForm';
import HospedajeCalendar from '@/components/HospedajeCalendar';
import FinancialSummary from '@/components/FinancialSummary';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Index = () => {
  const [monthlyWorkers, setMonthlyWorkers] = useState<MonthlyWorkers>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}`;
  };

  const getCurrentMonthWorkers = () => {
    const monthKey = getMonthKey(currentMonth);
    return monthlyWorkers[monthKey] || [];
  };

  const addWorker = (name: string, position: string) => {
    const monthKey = getMonthKey(currentMonth);
    const newWorker: Worker = {
      id: Date.now().toString(),
      name,
      position,
      hospedaje: {},
      monthYear: monthKey
    };
    
    setMonthlyWorkers(prev => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] || []), newWorker]
    }));
  };

  const deleteWorker = (workerId: string) => {
    const monthKey = getMonthKey(currentMonth);
    setMonthlyWorkers(prev => ({
      ...prev,
      [monthKey]: (prev[monthKey] || []).filter(worker => worker.id !== workerId)
    }));
  };

  const toggleHospedaje = (workerId: string, date: string) => {
    const monthKey = getMonthKey(currentMonth);
    setMonthlyWorkers(prev => ({
      ...prev,
      [monthKey]: (prev[monthKey] || []).map(worker => {
        if (worker.id === workerId) {
          return {
            ...worker,
            hospedaje: {
              ...worker.hospedaje,
              [date]: !worker.hospedaje[date]
            }
          };
        }
        return worker;
      })
    }));
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentWorkers = getCurrentMonthWorkers();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Control de Hospedaje de Trabajadores
          </h1>
          <p className="text-gray-600">
            Gestiona el hospedaje diario de trabajadores de forma individual y flexible
          </p>
        </div>

        <WorkerForm onAddWorker={addWorker} />

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => changeMonth('prev')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Mes Anterior
            </Button>
            <h2 className="text-xl font-semibold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <Button
              variant="outline"
              onClick={() => changeMonth('next')}
              className="flex items-center gap-2"
            >
              Mes Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Total trabajadores: {currentWorkers.length}
          </div>
        </div>

        {currentWorkers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">
              No hay trabajadores agregados para este mes
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Agrega trabajadores usando el formulario de arriba
            </p>
          </div>
        ) : (
          <>
            <HospedajeCalendar
              workers={currentWorkers}
              currentMonth={currentMonth}
              onToggleHospedaje={toggleHospedaje}
              onDeleteWorker={deleteWorker}
            />
            
            <FinancialSummary workers={currentWorkers} currentMonth={currentMonth} />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
