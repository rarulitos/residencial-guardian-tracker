
import React, { useState } from 'react';
import { Worker } from '@/types/worker';
import WorkerForm from '@/components/WorkerForm';
import HospedajeCalendar from '@/components/HospedajeCalendar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Index = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const addWorker = (name: string, position: string) => {
    const newWorker: Worker = {
      id: Date.now().toString(),
      name,
      position,
      hospedaje: {}
    };
    setWorkers([...workers, newWorker]);
  };

  const deleteWorker = (workerId: string) => {
    setWorkers(workers.filter(worker => worker.id !== workerId));
  };

  const toggleHospedaje = (workerId: string, date: string) => {
    setWorkers(workers.map(worker => {
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
            Total trabajadores: {workers.length}
          </div>
        </div>

        {workers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">
              No hay trabajadores agregados aún
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Agrega trabajadores usando el formulario de arriba
            </p>
          </div>
        ) : (
          <HospedajeCalendar
            workers={workers}
            currentMonth={currentMonth}
            onToggleHospedaje={toggleHospedaje}
            onDeleteWorker={deleteWorker}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
