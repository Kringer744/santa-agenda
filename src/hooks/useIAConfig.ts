import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { IAConfig, WhatsAppTemplate, IALog } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// ---- IA Config ----
export function useIAConfig() {
  return useQuery<IAConfig | null>({
    queryKey: ['ia_config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ia_config').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as IAConfig;
    },
  });
}

export function useUpdateIAConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Partial<IAConfig> & { id?: string }) => {
      const payload = { ...config, updated_at: new Date().toISOString() };

      if (config.id) {
        const { data, error } = await supabase
          .from('ia_config')
          .update(payload)
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as IAConfig;
      } else {
        const { data, error } = await supabase
          .from('ia_config')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as IAConfig;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ia_config'] });
      toast({ title: 'Configuração da IA salva!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });
}

// ---- Templates ----
export function useTemplates() {
  return useQuery<WhatsAppTemplate[]>({
    queryKey: ['whatsapp_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_templates').select('*').order('tipo').order('delay_horas');
      if (error) throw error;
      return data as unknown as WhatsAppTemplate[];
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('whatsapp_templates').insert(template).select().single();
      if (error) throw error;
      return data as unknown as WhatsAppTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast({ title: 'Template criado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar template', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...template }: Partial<WhatsAppTemplate> & { id: string }) => {
      const { data, error } = await supabase.from('whatsapp_templates').update(template).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as WhatsAppTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast({ title: 'Template atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast({ title: 'Template removido!' });
    },
  });
}

// ---- Logs da IA ----
export function useIALogs(limit = 50) {
  return useQuery<IALog[]>({
    queryKey: ['ia_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ia_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as IALog[];
    },
    refetchInterval: 30000, // Atualiza a cada 30s
  });
}
