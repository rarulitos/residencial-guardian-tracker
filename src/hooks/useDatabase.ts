import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BillingPeriod, Worker, Group, WorkerHospedaje, WorkerWithHospedaje } from '@/types/database';

// Helper to format a Date object to 'YYYY-MM-DD' in the local timezone
const toYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const useDatabase = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createOrGetBillingPeriod = useCallback(async (year: number, month: number): Promise<BillingPeriod | null> => {
    if (!user) {
      console.log('No user found');
      return null;
    }
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    try {
      setLoading(true);
      
      const { data: existing, error: fetchError } = await supabase
        .from('billing_periods')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existing) return existing;

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
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getGroupsForPeriod = useCallback(async (billingPeriodId: string): Promise<GroupWithWorkers[]> => {
    if (!user) return [];
    try {
      const { data: groups, error } = await supabase
        .from('groups')
        .select(`
          *,
          workers (
            *,
            worker_hospedaje (*)
          )
        `)
        .eq('billing_period_id', billingPeriodId);

      if (error) throw error;
      
      // The type from Supabase should be compatible with GroupWithWorkers
      // but we cast it to ensure type safety in the rest of the app.
      return (groups as any) || [];
    } catch (error) {
      console.error('Error getting groups for period:', error);
      return [];
    }
  }, [user]);

  const getGroupById = useCallback(async (groupId: string): Promise<Group | null> => {
    if (!user) return null;
    console.log(`[getGroupById] Attempting to fetch group ${groupId}`);
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      console.log(`[getGroupById] Successfully fetched group. price_per_night: ${group?.price_per_night}`);
      return group;
    } catch (error) {
      console.error('Error getting group by ID:', error);
      return null;
    }
  }, [user]);

  const createGroup = useCallback(async (billingPeriodId: string, name: string, startDate: Date, endDate: Date, pricePerNight: number): Promise<Group | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          billing_period_id: billingPeriodId,
          name,
          start_date: toYYYYMMDD(startDate),
          end_date: toYYYYMMDD(endDate),
          price_per_night: pricePerNight,
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

  const updateGroup = useCallback(async (groupId: string, name: string, startDate: Date, endDate: Date, pricePerNight: number): Promise<Group | null> => {
    if (!user) return null;
    console.log(`[updateGroup] Attempting to update group ${groupId} with pricePerNight: ${pricePerNight}`);
    try {
      const { data, error } = await supabase
        .from('groups')
        .update({
          name,
          start_date: toYYYYMMDD(startDate),
          end_date: toYYYYMMDD(endDate),
          price_per_night: pricePerNight,
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      console.log(`[updateGroup] Successfully updated group. Returned data price_per_night: ${data?.price_per_night}`);
      return data;
    } catch (error) {
      console.error('Error updating group:', error);
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

  const addWorker = useCallback(async (groupId: string, name: string, position: string, faena: string): Promise<Worker | null> => {
    if (!user) return null;
    try {
      const { data: group } = await supabase.from('groups').select('billing_period_id').eq('id', groupId).single();
      if (!group) throw new Error("Group not found");

      const { data: canonicalWorker } = await supabase.from('workers').select('name, position, faena').eq('user_id', user.id).ilike('name', name).ilike('position', position).ilike('faena', faena).limit(1).maybeSingle();
      const canonicalName = canonicalWorker ? canonicalWorker.name : name;
      const canonicalPosition = canonicalWorker ? canonicalWorker.position : position;
      const canonicalFaena = canonicalWorker ? canonicalWorker.faena : faena;

      const { data: workerInGroup } = await supabase.from('workers').select('*').eq('user_id', user.id).eq('group_id', groupId).eq('name', canonicalName).eq('position', canonicalPosition).eq('faena', canonicalFaena).maybeSingle();
      if (workerInGroup) return workerInGroup;

      const { data, error } = await supabase
        .from('workers')
        .insert({
          user_id: user.id,
          group_id: groupId,
          billing_period_id: group.billing_period_id,
          name: canonicalName,
          position: canonicalPosition,
          faena: canonicalFaena
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding worker:', error);
      return null;
    }
  }, [user]);

  const deleteWorker = useCallback(async (workerId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('workers').delete().eq('id', workerId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting worker:', error);
      return false;
    }
  }, []);

  const toggleHospedaje = useCallback(async (workerId: string, date: string): Promise<boolean> => {
    try {
      const { data: existing } = await supabase.from('worker_hospedaje').select('*').eq('worker_id', workerId).eq('date', date).maybeSingle();

      if (existing) {
        const { error } = await supabase.from('worker_hospedaje').update({ has_hospedaje: !existing.has_hospedaje }).eq('id', existing.id);
        if (error) return false;
      } else {
        const { error } = await supabase.from('worker_hospedaje').insert({ worker_id: workerId, date, has_hospedaje: true });
        if (error) return false;
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
    getGroupsForPeriod,
    getGroupById,
    createGroup,
    updateGroup,
    getWorkersForGroup,
    addWorker,
    deleteWorker,
    toggleHospedaje,
  };
};
