import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function usePendingExchangeRequests() {
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let channel;

    const loadCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { count, error } = await supabase
        .from("exchange_requests")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (!error && mounted) {
        setPendingRequestCount(count || 0);
      }
    };

    const subscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      await loadCount();

      channel = supabase
        .channel(`pending-exchange-requests-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "exchange_requests",
            filter: `receiver_id=eq.${user.id}`,
          },
          loadCount
        )
        .subscribe();
    };

    subscribe();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return pendingRequestCount;
}
