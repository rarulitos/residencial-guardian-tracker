import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '@/hooks/useDatabase';
import { Group, Worker, WorkerWithHospedaje } from '@/types/database';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, FileDown, Settings, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import HospedajeCalendar from '@/components/HospedajeCalendar';
import { format } from 'date-fns';
import { exportToExcel } from '@/lib/excel-export';
import { parseDateString, cn } from '@/lib/utils';
import GroupEditDialog from '@/components/GroupEditDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SaveStatusIndicator = ({ status }: { status: SaveStatus }) => {
  if (status === 'saving') {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Guardando...
      </div>
    );
  }
  if (status === 'saved') {
    return (
      <div className="flex items-center text-sm text-green-600">
        <CheckCircle className="mr-2 h-4 w-4" />
        Guardado
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex items-center text-sm text-red-600">
        Error al guardar. Se restauró el estado anterior.
      </div>
    );
  }
  return <span>Selecciona los días de hospedaje para cada trabajador.</span>;
};


const FinancialSummary = ({
  totalNights,
  totalNeto,
  iva,
  totalConIva,
}: {
  totalNights: number;
  totalNeto: number;
  iva: number;
  totalConIva: number;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen Financiero</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-md border">
            <p className="text-sm text-gray-500">Total Días/Noches</p>
            <p className="text-xl font-bold text-primary">{totalNights}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md border">
            <p className="text-sm text-gray-500">Total Neto</p>
            <p className="text-xl font-bold text-primary">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(totalNeto)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md border">
            <p className="text-sm text-gray-500">IVA (19%)</p>
            <p className="text-xl font-bold text-primary">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(iva)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md border">
            <p className="text-sm text-gray-500">Total a Pagar</p>
            <p className="text-xl font-bold text-green-600">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(totalConIva)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    getGroupById, 
    getWorkersForGroup, 
    addWorker, 
    deleteWorker, 
    bulkToggleHospedaje, 
    bulkUpdateHospedaje,
    updateGroup, 
    loading 
  } = useDatabase();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [workers, setWorkers] = useState<WorkerWithHospedaje[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const originalWorkersRef = useRef<WorkerWithHospedaje[]>([]);

  const financialTotals = useMemo(() => {
    const totalNights = workers.reduce((total, worker) => {
      return total + worker.hospedaje.filter(h => h.has_hospedaje).length;
    }, 0);
    const pricePerNight = group?.price_per_night || 0;
    const totalNeto = totalNights * pricePerNight;
    const iva = totalNeto * 0.19;
    const totalConIva = totalNeto + iva;
    return { totalNights, totalNeto, iva, totalConIva };
  }, [workers, group]);

  const handleExportToExcel = () => {
    if (!group) return;
    exportToExcel(group, workers);
  };

  const loadGroupData = useCallback(async () => {
    if (!groupId || !user) return;
    const fetchedGroup = await getGroupById(groupId);
    setGroup(fetchedGroup);
    if (fetchedGroup) {
      const fetchedWorkers = await getWorkersForGroup(groupId);
      setWorkers(fetchedWorkers);
      originalWorkersRef.current = JSON.parse(JSON.stringify(fetchedWorkers));
    }
  }, [groupId, user, getGroupById, getWorkersForGroup]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const savePendingChanges = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    setSaveStatus('saving');
    const changesToSave = { ...pendingChanges };
    setPendingChanges({});

    const success = await bulkUpdateHospedaje(changesToSave);
    if (success) {
      setSaveStatus('saved');
      originalWorkersRef.current = JSON.parse(JSON.stringify(workers));
    } else {
      setSaveStatus('error');
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Se restauró el estado anterior.",
        variant: "destructive",
      });
      setWorkers(originalWorkersRef.current);
    }
  }, [pendingChanges, bulkUpdateHospedaje, toast, workers]);

  // Debounce effect
  useEffect(() => {
    if (Object.keys(pendingChanges).length > 0) {
      setSaveStatus('idle'); // Reset status if user starts typing again
      if (statusResetTimerRef.current) clearTimeout(statusResetTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      
      debounceTimerRef.current = setTimeout(() => {
        savePendingChanges();
      }, 2000);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [pendingChanges, savePendingChanges]);

  // Effect to reset 'saved' or 'error' status to 'idle'
  useEffect(() => {
    if (saveStatus === 'saved' || saveStatus === 'error') {
      if (statusResetTimerRef.current) clearTimeout(statusResetTimerRef.current);
      statusResetTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
    return () => {
      if (statusResetTimerRef.current) clearTimeout(statusResetTimerRef.current);
    }
  }, [saveStatus]);

  // Save on unmount
  useEffect(() => {
    return () => {
      savePendingChanges();
    };
  }, [savePendingChanges]);

  const handleToggleHospedaje = (workerId: string, date: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    const hospedajeEntry = worker.hospedaje.find(h => h.date === date);
    const currentStatus = hospedajeEntry ? hospedajeEntry.has_hospedaje : false;
    const newStatus = !currentStatus;

    setWorkers(prevWorkers =>
      prevWorkers.map(w => w.id === workerId ? {
        ...w,
        hospedaje: w.hospedaje.find(h => h.date === date)
          ? w.hospedaje.map(h => h.date === date ? { ...h, has_hospedaje: newStatus } : h)
          : [...w.hospedaje, { id: '', worker_id: workerId, date, has_hospedaje: newStatus }]
      } : w)
    );

    const changeKey = `${workerId}|${date}`;
    setPendingChanges(prev => ({ ...prev, [changeKey]: newStatus }));
  };

  const currentWorkersForCalendar = useMemo(() => workers.map(worker => ({
    id: worker.id,
    name: worker.name,
    position: worker.position,
    faena: worker.faena,
    hospedaje: worker.hospedaje.reduce((acc, h) => {
      acc[h.date] = h.has_hospedaje;
      return acc;
    }, {} as { [date: string]: boolean }),
  })), [workers]);

  const handleAddWorker = async (name: string, position: string, faena: string) => {
    if (!groupId) return;
    await savePendingChanges();
    const newWorker = await addWorker(groupId, name, position, faena);
    if (newWorker) {
      await loadGroupData();
      toast({ title: "Trabajador agregado", description: `El trabajador ${newWorker.name} ha sido agregado.` });
    }
  };

  const handleDeleteWorker = async () => {
    if (!workerToDelete || !groupId) return;
    await savePendingChanges();
    const success = await deleteWorker(workerToDelete.id);
    if (success) {
      await loadGroupData();
      toast({ title: "Trabajador eliminado", description: `El trabajador ${workerToDelete.name} ha sido eliminado.` });
    }
    setWorkerToDelete(null);
  };

  const handleBulkToggleHospedaje = async (workerId: string, dates: string[], select: boolean) => {
    if (!groupId) return;
    await savePendingChanges();
    await bulkToggleHospedaje(workerId, dates, select);
    await loadGroupData();
  };

  const handleUpdateGroup = async (updatedGroup: Partial<Group>) => {
    if (!groupId) return;
    await savePendingChanges();
    // The 'updateGroup' function from useDatabase might need to be adjusted
    // if it strictly expects certain types, but here we cast to Partial<Group>
    const success = await updateGroup(groupId, updatedGroup as Partial<Group>);
    if (success) {
      const fetchedGroup = await getGroupById(groupId);
      setGroup(fetchedGroup);
      toast({ title: "Agrupación actualizada", description: "Los datos de la agrupación han sido actualizados." });
      setIsEditDialogOpen(false);
    }
  };

  if (loading && !group) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Agrupación no encontrada</h1>
          <Link to="/"><Button className="mt-4">Volver a Períodos</Button></Link>
        </div>
      </div>
    );
  }

  const startDate = parseDateString(group.start_date);
  const endDate = parseDateString(group.end_date);
  const currentMonth = startDate;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link to="/" className="text-sm text-gray-500 hover:underline flex items-center gap-1 mb-2">
              <ChevronLeft className="h-4 w-4" />
              Volver a Períodos
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-600">
              Período: {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportToExcel}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar a Excel
            </Button>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Calendario de Hospedaje</CardTitle>
            <CardDescription>
              <SaveStatusIndicator status={saveStatus} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HospedajeCalendar
              workers={currentWorkersForCalendar}
              currentMonth={currentMonth}
              startDate={startDate}
              endDate={endDate}
              onToggleHospedaje={handleToggleHospedaje}
              onBulkToggleHospedaje={handleBulkToggleHospedaje}
              onAddWorker={handleAddWorker}
              onDeleteWorker={(workerId) => {
                const worker = workers.find(w => w.id === workerId);
                if (worker) setWorkerToDelete(worker);
              }}
            />
          </CardContent>
        </Card>

        {workers.length > 0 && (
          <FinancialSummary {...financialTotals} />
        )}
        
        <GroupEditDialog
          group={group}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleUpdateGroup}
        />

        <AlertDialog open={!!workerToDelete} onOpenChange={() => setWorkerToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará al trabajador y todos sus registros de hospedaje.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteWorker}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
};

export default GroupDetail;