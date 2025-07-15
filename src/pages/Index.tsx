import React, { useState, useEffect } from 'react';
import { BillingPeriod, Group } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LogOut, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre de la agrupación debe tener al menos 2 caracteres.",
  }),
  startDate: z.date({
    required_error: "La fecha de inicio es requerida.",
  }),
  endDate: z.date({
    required_error: "La fecha de fin es requerida.",
  }),
});

const Index = () => {
  const { user, signOut } = useAuth();
  const { createOrGetBillingPeriod, getGroupsForPeriod, createGroup, loading } = useDatabase();
  const [currentPeriod, setCurrentPeriod] = useState<BillingPeriod | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isNewGroupDialogOpen, setIsNewGroupDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      startDate: new Date(),
            endDate: new Date(),
    },
  });

  // Load current period and groups when month changes or user changes
  useEffect(() => {
    const loadPeriodData = async () => {
      if (!user) return;
      
      console.log('Loading period data for:', currentMonth.getFullYear(), currentMonth.getMonth());
      const period = await createOrGetBillingPeriod(currentMonth.getFullYear(), currentMonth.getMonth());
      setCurrentPeriod(period);
      
      if (period) {
        console.log('Loading groups for period:', period.id);
        const periodGroups = await getGroupsForPeriod(period.id);
        console.log('Groups loaded:', periodGroups);
        setGroups(periodGroups);
      } else {
        setGroups([]);
      }
    };

    loadPeriodData();
  }, [currentMonth, user, createOrGetBillingPeriod, getGroupsForPeriod]);

  const handleCreateGroup = async (values: z.infer<typeof formSchema>) => {
    if (!currentPeriod) {
      console.log('No current period available');
      return;
    }

    const newGroup = await createGroup(currentPeriod.id, values.name, values.startDate, values.endDate);
    if (newGroup) {
      setGroups(prev => [...prev, newGroup]);
      setIsNewGroupDialogOpen(false);
      form.reset();
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
            Total agrupaciones: {groups.length}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando datos...</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Agrupaciones para {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
              <Button onClick={() => setIsNewGroupDialogOpen(true)} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Crear Nueva Agrupación
              </Button>
            </div>
            {groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay agrupaciones para este período. Crea una nueva para empezar.
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h4 className="font-medium">{group.name}</h4>
                      <p className="text-sm text-gray-500">
                        {format(new Date(group.start_date), 'dd/MM/yyyy')} - {format(new Date(group.end_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Link to={`/groups/${group.id}`}>
                      <Button variant="outline">Ver Detalles</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isNewGroupDialogOpen} onOpenChange={setIsNewGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Agrupación</DialogTitle>
            <DialogDescription>
              Define el nombre y el rango de fechas para tu nueva agrupación.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateGroup)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Agrupación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Cima Camino 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={es}
                          weekStartsOn={1}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={es}
                          weekStartsOn={1}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Crear Agrupación</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;