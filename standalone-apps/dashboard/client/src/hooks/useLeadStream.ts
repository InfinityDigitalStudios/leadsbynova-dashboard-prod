import { useEffect, useRef } from 'react';
import { queryClient } from '@/lib/queryClient';
import type { Lead } from '@shared/schema';

export function useLeadStream() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    // Don't connect if already connected
    if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN) {
      return;
    }

    // Only connect if document is visible and online
    if (document.visibilityState !== 'visible' || !navigator.onLine) {
      return;
    }

    try {
      const eventSource = new EventSource('/api/lead-stream', {
        withCredentials: true
      });
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', (event) => {
      });

      eventSource.addEventListener('lead_created', (event) => {
        try {
          const newLead: Lead = JSON.parse(event.data);
          
          // Update React Query cache with new lead
          queryClient.setQueryData(['/api/leads'], (oldData: Lead[] | undefined) => {
            if (!oldData) return [newLead];
            
            // Check if lead already exists (avoid duplicates)
            const exists = oldData.some(lead => lead.id === newLead.id);
            if (exists) return oldData;
            
            // Add new lead to the beginning of the list
            return [newLead, ...oldData];
          });
          
          // Also invalidate queries to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
          
        } catch (error) {
          console.error('Error processing new lead:', error);
        }
      });

      eventSource.addEventListener('heartbeat', (event) => {
        // Silent heartbeat - just keep connection alive
      });

      eventSource.onerror = (error) => {
        disconnect();
        
        // Attempt reconnection with exponential backoff
        const reconnectDelay = Math.min(1000 * Math.pow(2, Math.random()), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      };

    } catch (error) {
      console.error('Failed to create EventSource:', error);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Reconnect when tab becomes visible
      connect();
      // Also refresh data in case we missed updates
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    } else {
      // Disconnect when tab is hidden to save battery
      disconnect();
    }
  };

  const handleOnlineStatusChange = () => {
    if (navigator.onLine) {
      // Reconnect when coming back online
      connect();
      // Refresh data to catch up on missed updates
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    } else {
      // Disconnect when going offline
      disconnect();
    }
  };

  useEffect(() => {
    // Initial connection
    connect();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Cleanup on unmount
    return () => {
      disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    connect,
    disconnect
  };
}