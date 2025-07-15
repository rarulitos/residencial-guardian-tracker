import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BillingPeriod, Worker, WorkerHospedaje, WorkerWithHospedaje } from '@/types/database';

export const useDatabase = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createOrGetBillingPeriod = useCallback(async (year: number, month: number): Promise<BillingPeriod | null> => {
    if (!user) {
      console.log('No user found');
      return null;
    }
    
    console.log('Creating/getting billing period for user:', user.id, 'year:', year, 'month:', month);
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    try {
      setLoading(true);
      
      // First try to get existing period
      console.log('Searching for existing period...');
      const { data: existing, error: fetchError } = await supabase
        .from('billing_periods')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing period:', fetchError);
        throw fetchError;
      }

      if (existing) {
        console.log('Found existing period:', existing);
        return existing;
      }

      // Create new period if it doesn't exist
      console.log('Creating new period...');
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

      if (error) {
        console.error('Error creating period:', error);
        throw error;
      }
      
      console.log('Created new period:', data);
      return data;
    } catch (error) {
      console.error('Error creating/getting billing period:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getWorkersForPeriod = useCallback(async (billingPeriodId: string): Promise<WorkerWithHospedaje[]> => {
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
  }, [user]);

  const addWorker = useCallback(async (billingPeriodId: string, name: string, position: string): Promise<Worker | null> => {
    if (!user) {
      console.log('No user found for addWorker');
      return null;
    }

    console.log('Adding worker:', { billingPeriodId, name, position, userId: user.id });

    try {
      // Step 1: Find if a canonical version of this worker exists for the user (case-insensitive search)
      const { data: canonicalWorker, error: fetchError } = await supabase
        .from('workers')
        .select('name, position')
        .eq('user_id', user.id)
        .ilike('name', name)
        .ilike('position', position)
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching canonical worker:', fetchError);
        throw fetchError;
      }

      // Step 2: Determine the canonical name and position to use for consistency
      const canonicalName = canonicalWorker ? canonicalWorker.name : name;
      const canonicalPosition = canonicalWorker ? canonicalWorker.position : position;

      // Step 3: Check if this worker already exists in the *current* billing period
      const { data: workerInPeriod, error: periodFetchError } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', user.id)
        .eq('billing_period_id', billingPeriodId)
        .eq('name', canonicalName)
        .eq('position', canonicalPosition)
        .maybeSingle();

      if (periodFetchError) {
        console.error('Error fetching worker in current period:', periodFetchError);
        throw periodFetchError;
      }

      if (workerInPeriod) {
        console.log('Worker already exists in this billing period:', workerInPeriod);
        return workerInPeriod;
      }

      // Step 4: If the worker does not exist in the current period, insert them.
      // This uses the canonical name/position to ensure consistency across periods.
      const { data, error } = await supabase
        .from('workers')
        .insert({
          user_id: user.id,
          billing_period_id: billingPeriodId,
          name: canonicalName,
          position: canonicalPosition
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting worker:', error);
        throw error;
      }
      
      console.log('Worker inserted successfully for the new period:', data);
      return data;
    } catch (error) {
      console.error('Error adding worker:', error);
      return null;
    }
  }, [user]);

  const deleteWorker = useCallback(async (workerId: string): Promise<boolean> => {
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
  }, []);

  const toggleHospedaje = useCallback(async (workerId: string, date: string): Promise<boolean> => {
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
  }, []);

  return {
    loading,
    createOrGetBillingPeriod,
    getWorkersForPeriod,
    addWorker,
    deleteWorker,
    toggleHospedaje
  };
};