import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type AppConfiguration } from '@shared/schema';

interface ConfigurationContextValue {
  configurations: AppConfiguration[];
  isLoading: boolean;
  getConfigValue: {
    (key: string): string | undefined;
    (key: string, defaultValue: string): string;
  };
  applyCSSVariables: () => void;
}

const ConfigurationContext = createContext<ConfigurationContextValue | undefined>(undefined);

export const useConfiguration = () => {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
};

export const ConfigurationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Load configurations from API
  const { data: configurations = [], isLoading } = useQuery<AppConfiguration[]>({
    queryKey: ['/api/app-config'],
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Fetch CLIENT_NAME directly from environment (bypasses config system)
  const { data: clientNameData } = useQuery<{ clientName: string }>({
    queryKey: ['/api/client-name'],
    staleTime: Infinity, // Cache forever - this won't change during session
  });

  // Helper function to get configuration value by key
  const getConfigValue = ((key: string, defaultValue?: string): string | undefined => {
    const config = configurations.find(c => c.configKey === key);
    return config?.configValue !== undefined ? config.configValue : defaultValue;
  }) as {
    (key: string): string | undefined;
    (key: string, defaultValue: string): string;
  };

  // Function to apply configurations to CSS variables
  const applyCSSVariables = () => {
    if (!configurations.length) return;

    const root = document.documentElement;
    
    // Apply color configurations
    const primaryColor = getConfigValue('primary_color');
    const secondaryColor = getConfigValue('secondary_color');
    
    if (primaryColor) {
      // Convert hex to HSL for better CSS compatibility
      const hsl = hexToHsl(primaryColor);
      const hslValue = `hsl(${hsl})`;
      root.style.setProperty('--primary', hslValue);
      root.style.setProperty('--sidebar-primary', hslValue);
      root.style.setProperty('--ring', hslValue);
      
      console.log('🎨 Applied primary color:', primaryColor, '→', hslValue);
    }
    
    if (secondaryColor) {
      const hsl = hexToHsl(secondaryColor);
      const hslValue = `hsl(${hsl})`;
      root.style.setProperty('--secondary', hslValue);
      root.style.setProperty('--accent', hslValue);
      
      console.log('🎨 Applied secondary color:', secondaryColor, '→', hslValue);
    }

    // Apply font configurations only to specific pages (exclude dashboard)
    const fontFamily = getConfigValue('font_family');
    if (fontFamily) {
      // Check if we're on the dashboard page - if so, don't apply font changes
      const currentPath = window.location.pathname;
      const isDashboard = currentPath === '/';
      
      if (!isDashboard) {
        root.style.setProperty('--font-sans', fontFamily);
        console.log('📝 Applied font family:', fontFamily);
      } else {
        // Ensure dashboard always uses Inter font
        root.style.setProperty('--font-sans', 'Inter, system-ui, -apple-system, sans-serif');
        console.log('📝 Dashboard font isolated - keeping Inter');
      }
    }

    // Apply document title directly from CLIENT_NAME (bypasses config system)
    if (clientNameData?.clientName) {
      document.title = clientNameData.clientName;
      console.log('📑 Applied CLIENT_NAME as document title:', clientNameData.clientName);
    } else {
      document.title = 'LeadsByNova™';
      console.log('📑 Using default title: LeadsByNova™');
    }

    console.log('✅ Configuration variables applied successfully');
  };

  // Apply CSS variables whenever configurations or client name changes
  useEffect(() => {
    if (configurations.length > 0 && !isLoading) {
      applyCSSVariables();
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  }, [configurations, isLoading, isInitialized, clientNameData]);

  // Apply CSS variables on component mount (in case configurations are cached)
  useEffect(() => {
    if (configurations.length > 0 || clientNameData) {
      applyCSSVariables();
    }
  }, [clientNameData]);

  const value: ConfigurationContextValue = {
    configurations,
    isLoading,
    getConfigValue,
    applyCSSVariables,
  };

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};

// Utility function to convert hex color to HSL for CSS variables
function hexToHsl(hex: string): string {
  // Remove the hash if present
  hex = hex.replace('#', '');
  
  // Convert 3-digit hex to 6-digit hex (e.g., #abc -> #aabbcc)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Parse the hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  // Convert to percentages and return in HSL format
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return `${hDeg}, ${sPercent}%, ${lPercent}%`;
}