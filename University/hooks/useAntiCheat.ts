import { useEffect, useRef, useState } from 'react';
import { createAntiCheatMonitor, AntiCheatMonitor } from '@/lib/anti-cheat';
import { GRE_API_URL } from '@/lib/config';

interface UseAntiCheatProps {
  allocationId: string;
  token: string;
  enabled?: boolean;
}

interface AntiCheatState {
  isMonitoring: boolean;
  violationCount: number;
  isTerminated: boolean;
  terminationReason?: string;
  isFullscreen: boolean;
}

export function useAntiCheat({
  allocationId,
  token,
  enabled = true,
}: UseAntiCheatProps) {
  const monitorRef = useRef<AntiCheatMonitor | null>(null);
  const [state, setState] = useState<AntiCheatState>({
    isMonitoring: false,
    violationCount: 0,
    isTerminated: false,
    isFullscreen: false,
  });

  useEffect(() => {
    if (!enabled || !allocationId || !token) return;

    // Create monitor
    monitorRef.current = createAntiCheatMonitor(allocationId, token, GRE_API_URL);

    // Set up event listeners
    if (monitorRef.current) {
      monitorRef.current.on('violation', (data: any) => {
        setState(prev => ({
          ...prev,
          violationCount: data.count,
        }));
      });

      monitorRef.current.on('terminated', (data: any) => {
        setState(prev => ({
          ...prev,
          isTerminated: true,
          terminationReason: data.reason,
        }));
      });

      monitorRef.current.on('fullscreen_change', (data: any) => {
        setState(prev => ({
          ...prev,
          isFullscreen: data.isFullscreen,
        }));
      });

      // Start monitoring
      monitorRef.current.start();
      setState(prev => ({ ...prev, isMonitoring: true }));
    }

    // Cleanup
    return () => {
      if (monitorRef.current) {
        monitorRef.current.stop();
      }
    };
  }, [allocationId, token, enabled]);

  const requestFullscreen = () => {
    if (monitorRef.current) {
      monitorRef.current.requestFullscreen();
    }
  };

  return {
    ...state,
    monitor: monitorRef.current,
    requestFullscreen,
  };
}
