import { useQuery } from '@tanstack/react-query';
// Simple type definition for configurations
type AppConfiguration = {
  configKey: string;
  configValue: string;
};

export const useConfiguration = () => {
  // Load configurations from API
  const { data: configurations = [], isLoading } = useQuery<AppConfiguration[]>({
    queryKey: ['/api/app-config'],
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Helper function to get configuration value by key
  const getConfigValue = (key: string, defaultValue?: string): string | undefined => {
    const config = configurations.find(c => c.configKey === key);
    return config?.configValue || defaultValue;
  };

  return {
    configurations,
    isLoading,
    getConfigValue,
  };
};