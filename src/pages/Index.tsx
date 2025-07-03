import React, { useState } from 'react';
import { Worker, MonthlyWorkers } from '@/types/worker';
import WorkerForm from '@/components/WorkerForm';
import HospedajeCalendar from '@/components/HospedajeCalendar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Index = () => {
  const [monthlyWorkers, setMonthlyWorkers] = useState<MonthlyWorkers>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getBillingPeriodKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}`;
  };

  const getCurrentPeriodWorkers = () => {
    const periodKey = getBillingPeriodKey(currentMonth);
    return monthlyWorkers[periodKey] || [];
  };

  const addWorker = (name: string, position: string) => {
    const periodKey = getBillingPeriodKey(currentMonth);
    const newWorker: Worker = {
      id: Date.now().toString(),
      name,
      position,
      hospedaje: {},
      monthYear: periodKey
    };
    
    setMonthlyWorkers(prev => ({
      ...prev,
      [periodKey]: [...(prev[periodKey] || []), newWorker]
    }));
  };

  const deleteWorker = (workerId: string) => {
    const periodKey = getBillingPeriodKey(currentMonth);
    setMonthlyWorkers(prev => ({
      ...prev,
      [periodKey]: (prev[periodKey] || []).filter(worker => worker.id !== workerId)
    }));
  };

  const toggleHospedaje = (workerId: string, date: string) => {
    const periodKey = getBillingPeriodKey(currentMonth);
    setMonthlyWorkers(prev => ({
      ...prev,
      [periodKey]: (prev[periodKey] || []).map(worker => {
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

  const currentWorkers = getCurrentPeriodWorkers();

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
              Período Anterior
            </Button>
            <h2 className="text-xl font-semibold">
              Período {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <Button
              variant="outline"
              onClick={() => changeMonth('next')}
              className="flex items-center gap-2"
            >
              Período Siguiente
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
              No hay trabajadores agregados para este período
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
            
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
