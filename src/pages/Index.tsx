import React, { useState, useEffect } from 'react';
import { WorkerWithHospedaje, BillingPeriod } from '@/types/database';
import WorkerForm from '@/components/WorkerForm';
import HospedajeCalendar from '@/components/HospedajeCalendar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';

const Index = () => {
  const { user, signOut } = useAuth();
  const { createOrGetBillingPeriod, getWorkersForPeriod, addWorker, deleteWorker, toggleHospedaje, loading } = useDatabase();
  const [currentPeriod, setCurrentPeriod] = useState<BillingPeriod | null>(null);
  const [workers, setWorkers] = useState<WorkerWithHospedaje[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load current period and workers when month changes
  useEffect(() => {
    const loadPeriodData = async () => {
      const period = await createOrGetBillingPeriod(currentMonth.getFullYear(), currentMonth.getMonth());
      setCurrentPeriod(period);
      
      if (period) {
        const periodWorkers = await getWorkersForPeriod(period.id);
        setWorkers(periodWorkers);
      }
    };

    if (user) {
      loadPeriodData();
    }
  }, [currentMonth, user, createOrGetBillingPeriod, getWorkersForPeriod]);

  const handleAddWorker = async (name: string, position: string) => {
    console.log('handleAddWorker called with:', { name, position, currentPeriod });
    if (!currentPeriod) {
      console.log('No current period available');
      return;
    }

    console.log('Adding worker to period:', currentPeriod.id);
    const newWorker = await addWorker(currentPeriod.id, name, position);
    console.log('Worker added result:', newWorker);
    
    if (newWorker) {
      console.log('Reloading workers for period:', currentPeriod.id);
      // Reload workers to get updated data
      const updatedWorkers = await getWorkersForPeriod(currentPeriod.id);
      console.log('Updated workers:', updatedWorkers);
      setWorkers(updatedWorkers);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    const success = await deleteWorker(workerId);
    if (success && currentPeriod) {
      // Reload workers to get updated data
      const updatedWorkers = await getWorkersForPeriod(currentPeriod.id);
      setWorkers(updatedWorkers);
    }
  };

  const handleToggleHospedaje = async (workerId: string, date: string) => {
    const success = await toggleHospedaje(workerId, date);
    if (success && currentPeriod) {
      // Reload workers to get updated data
      const updatedWorkers = await getWorkersForPeriod(currentPeriod.id);
      setWorkers(updatedWorkers);
    }
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

  // Convert database workers to the format expected by the calendar
  const currentWorkers = workers.map(worker => ({
    id: worker.id,
    name: worker.name,
    position: worker.position,
    hospedaje: worker.hospedaje.reduce((acc, h) => {
      acc[h.date] = h.has_hospedaje;
      return acc;
    }, {} as { [date: string]: boolean }),
    monthYear: `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
  }));

  const handleSignOut = async () => {
    await signOut();
  };

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
          <p className="text-gray-600">
            Gestiona el hospedaje diario de trabajadores de forma individual y flexible
          </p>
        </div>

        <WorkerForm onAddWorker={handleAddWorker} />

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

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando datos...</p>
          </div>
        ) : currentWorkers.length === 0 ? (
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
              onToggleHospedaje={handleToggleHospedaje}
              onDeleteWorker={handleDeleteWorker}
            />
            
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
