import { useEffect } from 'react';
import { useConfiguration } from '@/hooks/useConfiguration';

/**
 * PreviewListener component that listens for preview configuration updates
 * from the parent configuration page via postMessage
 */
export function PreviewListener() {
  const { applyCSSVariables } = useConfiguration();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      // Check if this is a preview config update
      if (event.data?.type === 'PREVIEW_CONFIG_UPDATE') {
        const configs = event.data.configs;
        
        // Apply configurations to the page
        Object.entries(configs).forEach(([key, value]) => {
          const element = document.querySelector(`[data-config-key="${key}"]`);
          
          if (element) {
            // Handle guide option visibility - hide entire container if empty
            if (key.startsWith('guide_option_') && element.tagName === 'LABEL') {
              const container = element.closest('.custom-radio-container');
              if (container) {
                if (value && String(value).trim() !== '') {
                  (container as HTMLElement).style.display = 'flex';
                  element.textContent = value as string;
                } else {
                  (container as HTMLElement).style.display = 'none';
                }
              }
            }
            // Update text content for text elements
            else if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'P' || element.tagName === 'BUTTON' || element.tagName === 'LABEL') {
              element.textContent = value as string;
            }
            // Update placeholder for inputs
            else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              (element as HTMLInputElement).placeholder = value as string;
            }
            // Update src for images
            else if (element.tagName === 'IMG') {
              (element as HTMLImageElement).src = value as string;
            }
          }

          // Handle color updates
          if (key === 'primary_color' && typeof value === 'string') {
            const root = document.documentElement;
            const hsl = hexToHsl(value);
            const hslValue = `hsl(${hsl})`;
            root.style.setProperty('--primary', hslValue);
            root.style.setProperty('--sidebar-primary', hslValue);
            root.style.setProperty('--ring', hslValue);
          }
          
          if (key === 'secondary_color' && typeof value === 'string') {
            const root = document.documentElement;
            const hsl = hexToHsl(value);
            const hslValue = `hsl(${hsl})`;
            root.style.setProperty('--secondary', hslValue);
            root.style.setProperty('--accent', hslValue);
          }
        });

        // Reapply CSS variables
        applyCSSVariables();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [applyCSSVariables]);

  return null;
}

// Utility function to convert hex color to HSL
function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
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

  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return `${hDeg}, ${sPercent}%, ${lPercent}%`;
}
