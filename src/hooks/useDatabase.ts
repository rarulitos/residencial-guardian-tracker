import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BillingPeriod, Worker, WorkerHospedaje, WorkerWithHospedaje } from '@/types/database';

export const useDatabase = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createOrGetBillingPeriod = async (year: number, month: number): Promise<BillingPeriod | null> => {
    if (!user) return null;
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    try {
      // First try to get existing period
      const { data: existing, error: fetchError } = await supabase
        .from('billing_periods')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (existing && !fetchError) {
        return existing;
      }

      // Create new period if it doesn't exist
      const { data, error } = await supabase
        .from('billing_periods')
        .insert({
          user_id: user.id,
          year,
          month,
          name: `${monthNames[month]} ${year}`
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/getting billing period:', error);
      return null;
    }
  };

  const getWorkersForPeriod = async (billingPeriodId: string): Promise<WorkerWithHospedaje[]> => {
    if (!user) return [];
    
    try {
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .eq('billing_period_id', billingPeriodId)
        .eq('user_id', user.id);

      if (workersError) throw workersError;

      // Get hospedaje data for all workers
      const workersWithHospedaje: WorkerWithHospedaje[] = await Promise.all(
        (workers || []).map(async (worker) => {
          const { data: hospedaje, error: hospedajeError } = await supabase
            .from('worker_hospedaje')
            .select('*')
            .eq('worker_id', worker.id);

          if (hospedajeError) throw hospedajeError;

          return {
            ...worker,
            hospedaje: hospedaje || []
          };
        })
      );

      return workersWithHospedaje;
    } catch (error) {
      console.error('Error getting workers for period:', error);
      return [];
    }
  };

  const addWorker = async (billingPeriodId: string, name: string, position: string): Promise<Worker | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('workers')
        .insert({
          user_id: user.id,
          billing_period_id: billingPeriodId,
          name,
          position
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding worker:', error);
      return null;
    }
  };

  const deleteWorker = async (workerId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', workerId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting worker:', error);
      return false;
    }
  };

  const toggleHospedaje = async (workerId: string, date: string): Promise<boolean> => {
    try {
      // First check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from('worker_hospedaje')
        .select('*')
        .eq('worker_id', workerId)
        .eq('date', date)
        .maybeSingle();

      if (existing && !fetchError) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('worker_hospedaje')
          .update({ has_hospedaje: !existing.has_hospedaje })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('worker_hospedaje')
          .insert({
            worker_id: workerId,
            date,
            has_hospedaje: true
          });

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error toggling hospedaje:', error);
      return false;
    }
  };

  return {
    loading,
    createOrGetBillingPeriod,
    getWorkersForPeriod,
    addWorker,
    deleteWorker,
    toggleHospedaje
  };
};