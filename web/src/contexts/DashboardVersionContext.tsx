import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type DashboardVersion = 'A' | 'B';

type DashboardVersionContextType = {
  version: DashboardVersion;
  toggle: () => void;
};

const DashboardVersionContext = createContext<DashboardVersionContextType>({
  version: 'A',
  toggle: () => {},
});

const STORAGE_KEY = 'dashboard-version';

export function DashboardVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<DashboardVersion>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'A' || stored === 'B') return stored;
    } catch {
      // ignore
    }
    return 'A';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, version);
    } catch {
      // ignore
    }
  }, [version]);

  const toggle = () => {
    setVersion((prev) => (prev === 'A' ? 'B' : 'A'));
  };

  return (
    <DashboardVersionContext.Provider value={{ version, toggle }}>
      {children}
    </DashboardVersionContext.Provider>
  );
}

export function useDashboardVersion() {
  return useContext(DashboardVersionContext);
}
