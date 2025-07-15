import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BillingPeriod, Worker, Group, WorkerHospedaje, WorkerWithHospedaje } from '@/types/database';

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

  const getGroupsForPeriod = useCallback(async (billingPeriodId: string): Promise<Group[]> => {
    if (!user) return [];

    try {
      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('billing_period_id', billingPeriodId)
        .eq('user_id', user.id);

      if (error) throw error;
      return groups || [];
    } catch (error) {
      console.error('Error getting groups for period:', error);
      return [];
    }
  }, [user]);

  const getGroupById = useCallback(async (groupId: string): Promise<Group | null> => {
    if (!user) return null;

    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return group;
    } catch (error) {
      console.error('Error getting group by ID:', error);
      return null;
    }
  }, [user]);

  const createGroup = useCallback(async (billingPeriodId: string, name: string, startDate: Date, endDate: Date): Promise<Group | null> => {
    if (!user) {
      console.log('No user found for createGroup');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          user_id: user.id,
          billing_period_id: billingPeriodId,
          name,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }, [user]);

  const getWorkersForGroup = useCallback(async (groupId: string): Promise<WorkerWithHospedaje[]> => {
    if (!user) return [];
    
    try {
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .eq('group_id', groupId)
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
      console.error('Error getting workers for group:', error);
      return [];
    }
  }, [user]);

  const addWorker = useCallback(async (groupId: string, name: string, position: string): Promise<Worker | null> => {
    if (!user) {
      console.log('No user found for addWorker');
      return null;
    }

    console.log('Adding worker:', { groupId, name, position, userId: user.id });

    try {
      // Get the group to infer billing_period_id
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('billing_period_id')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group for addWorker:', groupError);
        throw groupError;
      }

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

      // Step 3: Check if this worker already exists in the *current* group
      const { data: workerInGroup, error: groupFetchError } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', groupId)
        .eq('name', canonicalName)
        .eq('position', canonicalPosition)
        .maybeSingle();

      if (groupFetchError) {
        console.error('Error fetching worker in current group:', groupFetchError);
        throw groupFetchError;
      }

      if (workerInGroup) {
        console.log('Worker already exists in this group:', workerInGroup);
        return workerInGroup;
      }

      // Step 4: If the worker does not exist in the current group, insert them.
      // This uses the canonical name/position to ensure consistency across periods.
      const { data, error } = await supabase
        .from('workers')
        .insert({
          user_id: user.id,
          group_id: groupId,
          billing_period_id: group.billing_period_id, // Infer from group
          name: canonicalName,
          position: canonicalPosition
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting worker:', error);
        throw error;
      }
      
      console.log('Worker inserted successfully for the new group:', data);
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
    console.log('toggleHospedaje called for:', workerId, date);
    try {
      // First check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from('worker_hospedaje')
        .select('*')
        .eq('worker_id', workerId)
        .eq('date', date)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing hospedaje record:', fetchError);
        return false;
      }
      console.log('Existing hospedaje record:', existing);

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('worker_hospedaje')
          .update({ has_hospedaje: !existing.has_hospedaje })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating hospedaje record:', updateError);
          return false;
        }
        console.log('Hospedaje record updated.');
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('worker_hospedaje')
          .insert({
            worker_id: workerId,
            date,
            has_hospedaje: true
          });

        if (insertError) {
          console.error('Error inserting new hospedaje record:', insertError);
          return false;
        }
        console.log('New hospedaje record inserted.');
      }

      return true;
    } catch (error) {
      console.error('Error toggling hospedaje (general catch):', error);
      return false;
    }
  }, []);

  return {
    loading,
    createOrGetBillingPeriod,
    getGroupsForPeriod,
    getGroupById,
    createGroup,
    getWorkersForGroup,
    addWorker,
    deleteWorker,
    toggleHospedaje,
  };
};