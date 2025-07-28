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
import GroupDetailNavbar from '@/components/navbars/GroupDetailNavbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

import { SendEmailDialog } from '@/components/SendEmailDialog';
import { supabase } from '@/integrations/supabase/client';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';



// Helper function to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

const SaveStatusIndicator = ({ status }: { status: SaveStatus }) => {
  if (status === 'saving') {
    return (
      <Badge variant="secondary" className="inline-flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Guardando...
      </Badge>
    );
  }
  if (status === 'saved') {
    return (
      <Badge variant="secondary" className="inline-flex items-center gap-1 bg-green-100 text-green-700 border-green-300">
        <CheckCircle className="h-3 w-3" />
        Guardado
      </Badge>
    );
  }
  if (status === 'error') {
    return (
      <Badge variant="destructive" className="inline-flex items-center gap-1">
        Error
      </Badge>
    );
  }
  return null;
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
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false);
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
    exportToExcel(group, workers, { output: 'download' });
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    if (!group) return;

    try {
      // 1. Generar el Blob del archivo Excel
      const blob = await exportToExcel(group, workers, { output: 'blob' });
      if (!blob) {
        throw new Error("No se pudo generar el archivo Excel.");
      }

      // const attachment = await blobToBase64(blob);

      // 2. Convertir a Base64
      const attachment = await blobToBase64(blob);

      // 3. Invocar la Edge Function
      const { error } = await supabase.functions.invoke('send-excel-email', {
        body: { to, subject, body, attachment },
      });

      if (error) {
        throw new Error(`Error al invocar la función: ${error.message}`);
      }

      toast({
        title: "Correo Enviado",
        description: `El reporte ha sido enviado a ${to} exitosamente.`,
      });

    } catch (error) {
      console.error("Error al enviar el correo:", error);
      toast({
        title: "Error al Enviar",
        description: (error as Error).message || "Ocurrió un error desconocido.",
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-gray-50">
      <GroupDetailNavbar 
        group={group}
        onExport={handleExportToExcel}
        onEdit={() => setIsEditDialogOpen(true)}
        onSendEmail={() => setIsSendEmailDialogOpen(true)}
      />
      <main className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 p-6">
              <div className="space-y-1">
                <CardTitle>Calendario de Hospedaje</CardTitle>
                <CardDescription>
                  Selecciona los días de hospedaje para cada trabajador.
                </CardDescription>
              </div>
              <div className="self-start md:self-auto">
                <SaveStatusIndicator status={saveStatus} />
              </div>
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

          <SendEmailDialog
            isOpen={isSendEmailDialogOpen}
            onClose={() => setIsSendEmailDialogOpen(false)}
            onSend={handleSendEmail}
            groupName={group.name}
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
      </main>
    </div>
  );
};

export default GroupDetail;