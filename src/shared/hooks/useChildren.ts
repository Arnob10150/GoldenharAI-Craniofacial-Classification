import { useEffect, useState } from "react";
import { listChildren } from "@/shared/lib/data";
import type { Child, Profile } from "@/shared/lib/types";

export const useChildren = (profile: Profile | null) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!profile) {
        setChildren([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await listChildren(profile);
      if (!ignore) {
        setChildren(data);
        setLoading(false);
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [profile]);

  return { children, loading, setChildren };
};
