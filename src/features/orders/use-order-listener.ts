import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useOrderListener() {
    const { toast } = useToast();

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | undefined;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const startTime = new Date().toISOString();

                channel = supabase.channel('public:orders')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
                        const newDoc = payload.new as any;
                        if (newDoc.created_at && newDoc.created_at > startTime && newDoc.status === 'pending') {
                            
                            toast({
                                title: "New Order",
                                description: `New order from ${newDoc.customer_name || 'Customer'} - ₹${newDoc.total_amount}`,
                                variant: "default",
                            });

                            // Add notification 
                            await supabase.from('notifications').insert({
                                title: 'New Order Received',
                                message: `New order placed by ${newDoc.customer_name || 'Customer'} for ₹${newDoc.total_amount}`,
                                type: 'order',
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
