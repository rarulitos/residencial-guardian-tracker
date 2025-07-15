import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '@/hooks/useDatabase';
import { Group, WorkerWithHospedaje } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import WorkerForm from '@/components/WorkerForm';
import HospedajeCalendar from '@/components/HospedajeCalendar';
import { format } from 'date-fns';
import { parseDateString } from '@/lib/utils';

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, signOut } = useAuth();
  const { getGroupById, getWorkersForGroup, addWorker, deleteWorker, toggleHospedaje, loading } = useDatabase();
  const [group, setGroup] = useState<Group | null>(null);
  const [workers, setWorkers] = useState<WorkerWithHospedaje[]>([]);

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId || !user) return;

      const fetchedGroup = await getGroupById(groupId);
      setGroup(fetchedGroup);

      if (fetchedGroup) {
        const fetchedWorkers = await getWorkersForGroup(groupId);
        setWorkers(fetchedWorkers);
      }
    };

    loadGroupData();
  }, [groupId, user, getGroupById, getWorkersForGroup]);

  const handleAddWorker = async (name: string, position: string) => {
    if (!groupId) return;
    const newWorker = await addWorker(groupId, name, position);
    if (newWorker) {
      const updatedWorkers = await getWorkersForGroup(groupId);
      setWorkers(updatedWorkers);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (!groupId) return;
    const success = await deleteWorker(workerId);
    if (success) {
      const updatedWorkers = await getWorkersForGroup(groupId);
      setWorkers(updatedWorkers);
    }
  };

  const handleToggleHospedaje = async (workerId: string, date: string) => {
    // Optimistic update
    setWorkers(prevWorkers =>
      prevWorkers.map(worker => {
        if (worker.id === workerId) {
          const newHospedaje = [...worker.hospedaje];
          const hospedajeIndex = newHospedaje.findIndex(h => h.date === date);

          if (hospedajeIndex > -1) {
            newHospedaje[hospedajeIndex] = {
              ...newHospedaje[hospedajeIndex],
              has_hospedaje: !newHospedaje[hospedajeIndex].has_hospedaje
            };
          } else {
            newHospedaje.push({
              id: `temp-${Date.now()}`,
              worker_id: workerId,
              date,
              has_hospedaje: true
            });
          }

          return { ...worker, hospedaje: newHospedaje };
        }
        return worker;
      })
    );

    toggleHospedaje(workerId, date).catch(error => {
      console.error("Failed to update hospedaje:", error);
      if (groupId) {
        getWorkersForGroup(groupId).then(setWorkers);
      }
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando detalles de la agrupación...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <h1 className="text-2xl font-bold mb-2">Agrupación no encontrada</h1>
          <p>La agrupación con ID "{groupId}" no existe o no tienes permiso para verla.</p>
          <Link to="/">
            <Button className="mt-4">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = parseDateString(group.start_date);
  const endDate = parseDateString(group.end_date);
  const currentMonth = startDate;

  const currentWorkersForCalendar = workers.map(worker => ({
    id: worker.id,
    name: worker.name,
    position: worker.position,
    hospedaje: worker.hospedaje.reduce((acc, h) => {
      acc[h.date] = h.has_hospedaje;
      return acc;
    }, {} as { [date: string]: boolean }),
  }));

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
        </div>

        <div className="mb-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Volver a Período
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-semibold">Agrupación: {group.name}</h2>
            <p className="text-gray-600 text-sm">
              Período: {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <WorkerForm onAddWorker={handleAddWorker} />

        {currentWorkersForCalendar.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">
              No hay trabajadores agregados a esta agrupación.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Agrega trabajadores usando el formulario de arriba.
            </p>
          </div>
        ) : (
          <HospedajeCalendar
            workers={currentWorkersForCalendar}
            currentMonth={currentMonth}
            startDate={startDate}
            endDate={endDate}
            onToggleHospedaje={handleToggleHospedaje}
            onDeleteWorker={handleDeleteWorker}
          />
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
