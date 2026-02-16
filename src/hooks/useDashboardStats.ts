import { useState, useEffect } from "react";

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    pendingCounts: 0,
    lastUpdate: null as Date | null,
    loading: true,
  });

  // Mock data fetching for now
  useEffect(() => {
    const fetchStats = async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStats({
        totalProducts: 124,
        lowStock: 8,
        pendingCounts: 2,
        lastUpdate: new Date(),
        loading: false,
      });
    };

    fetchStats();
  }, []);

  return stats;
}
