import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePrescriptionListener() {
    const { toast } = useToast();

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | undefined;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const startTime = new Date().toISOString();

                channel = supabase.channel('public:prescriptions')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prescriptions' }, async (payload) => {
                        const newDoc = payload.new as any;
                        if (newDoc.created_at && newDoc.created_at > startTime && newDoc.status === 'pending') {
                            
                            toast({
                                title: "New Prescription",
                                description: `New prescription from ${newDoc.patient_name || 'Customer'}`,
                                variant: "default",
                            });

                            // Add notification 
                            await supabase.from('notifications').insert({
                                title: 'New Prescription Received',
                                message: `New prescription uploaded by ${newDoc.patient_name || 'Customer'}`,
                                type: 'prescription',
                                is_read: false,
                            });
                        }
                    })
                    .subscribe();
            }
        });

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [toast]);
}
