import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Save, Settings, Users, Palette, Link, Mail, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { type Agent, type AppConfiguration, type InsertAgent, type InsertAppConfig } from "@shared/schema";

// Configuration categories and their descriptions
const CONFIG_CATEGORIES = {
  branding: "Company branding, logos, and visual identity",
  metadata: "App titles, descriptions, and browser metadata",
  contact: "Contact information and business details", 
  forms: "Form content, headers, and placeholder text",
  urls: "Guide destination URLs and redirect links", 
  emails: "Email addresses, signatures, and notification content",
  styling: "Color schemes, fonts, and visual theming"
};

// Professional Color Palettes - 10 Options Including Current Theme
const COLOR_PALETTES = [
  {
    id: "current-blue",
    name: "Professional Blue (Current)",
    description: "Deep navy and sky blue - trustworthy and professional",
    colors: ["#0F172A", "#1E3A8A", "#3B82F6", "#60A5FA", "#BFDBFE"]
  },
  {
    id: "sophisticated-gray",
    name: "Sophisticated Gray",
    description: "Elegant grayscale with subtle warmth",
    colors: ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"]
  },
  {
    id: "emerald-luxury",
    name: "Emerald Luxury",
    description: "Rich emerald green with mint accents",
    colors: ["#022C22", "#047857", "#10B981", "#34D399", "#A7F3D0"]
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Deep purple with lavender highlights",
    colors: ["#3C1361", "#5B21B6", "#8B5CF6", "#A78BFA", "#DDD6FE"]
  },
  {
    id: "warm-amber",
    name: "Warm Amber",
    description: "Rich amber with golden accents",
    colors: ["#78350F", "#D97706", "#F59E0B", "#FBBF24", "#FEF3C7"]
  },
  {
    id: "modern-teal",
    name: "Modern Teal",
    description: "Contemporary teal with cyan highlights",
    colors: ["#042F2E", "#0D9488", "#14B8A6", "#2DD4BF", "#99F6E4"]
  },
  {
    id: "burgundy-wine",
    name: "Burgundy Wine",
    description: "Deep burgundy with rose accents",
    colors: ["#7F1D1D", "#991B1B", "#DC2626", "#F87171", "#FECACA"]
  },
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Deep forest green with sage highlights",
    colors: ["#052E16", "#166534", "#22C55E", "#4ADE80", "#BBF7D0"]
  },
  {
    id: "midnight-slate",
    name: "Midnight Slate",
    description: "Dark slate with steel blue accents",
    colors: ["#0F172A", "#1E293B", "#475569", "#64748B", "#CBD5E1"]
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    description: "Vibrant orange with coral highlights",
    colors: ["#9A3412", "#EA580C", "#FB923C", "#FDBA74", "#FED7AA"]
  }
];

// Premium Font Options - 10 Professional Choices
const FONT_OPTIONS = [
  {
    id: "inter",
    name: "Inter (Current)",
    description: "Modern, clean, and highly readable",
    value: "Inter, sans-serif",
    category: "Sans-serif"
  },
  {
    id: "playfair",
    name: "Playfair Display",
    description: "Elegant serif for luxury brands",
    value: "Playfair Display, serif",
    category: "Serif"
  },
  {
    id: "poppins",
    name: "Poppins",
    description: "Geometric and friendly",
    value: "Poppins, sans-serif",
    category: "Sans-serif"
  },
  {
    id: "cormorant",
    name: "Cormorant Garamond",
    description: "Classic and sophisticated serif",
    value: "Cormorant Garamond, serif",
    category: "Serif"
  },
  {
    id: "montserrat",
    name: "Montserrat",
    description: "Bold and contemporary",
    value: "Montserrat, sans-serif",
    category: "Sans-serif"
  },
  {
    id: "crimson",
    name: "Crimson Text",
    description: "Refined and readable serif",
    value: "Crimson Text, serif",
    category: "Serif"
  },
  {
    id: "nunito",
    name: "Nunito Sans",
    description: "Warm and approachable",
    value: "Nunito Sans, sans-serif",
    category: "Sans-serif"
  },
  {
    id: "lora",
    name: "Lora",
    description: "Balanced serif with personality",
    value: "Lora, serif",
    category: "Serif"
  },
  {
    id: "work-sans",
    name: "Work Sans",
    description: "Professional and versatile",
    value: "Work Sans, sans-serif",
    category: "Sans-serif"
  },
  {
    id: "eb-garamond",
    name: "EB Garamond",
    description: "Timeless and elegant",
    value: "EB Garamond, serif",
    category: "Serif"
  }
];

// Predefined configuration keys for easy setup
const PREDEFINED_CONFIGS = [
  {
    category: "branding",
    key: "company_name",
    description: "Main company name displayed across the app",
    type: "text",
    defaultValue: "Your Real Estate Company"
  },
  {
    category: "branding", 
    key: "main_agent_headshot_url",
    description: "Primary agent headshot URL for submission form and chat pages",
    type: "url",
    defaultValue: "/placeholder-headshot.png"
  },
  {
    category: "branding",
    key: "chat_header_title", 
    description: "Title shown in chat header (e.g. 'Chat with Real Estate Expert')",
    type: "text",
    defaultValue: "Chat with Real Estate Expert"
  },
  {
    category: "branding",
    key: "company_logo",
    description: "Main company logo displayed on forms and headers",
    type: "image",
    defaultValue: "/placeholder-logo.png"
  },
  {
    category: "branding",
    key: "header_logo",
    description: "Logo displayed in the application header/navigation",
    type: "image", 
    defaultValue: "/placeholder-logo.png"
  },
  {
    category: "branding",
    key: "footer_logo",
    description: "Logo displayed in the application footer",
    type: "image",
    defaultValue: "/placeholder-logo.png"
  },
  {
    category: "metadata",
    key: "app_title",
    description: "Browser tab title (e.g. 'Lead Dashboard - Your Company')",
    type: "text",
    defaultValue: "Real Estate Lead Dashboard"
  },
  {
    category: "metadata",
    key: "app_name",
    description: "Application name shown in manifests and PWA",
    type: "text",
    defaultValue: "Real Estate Lead Dashboard"
  },
  {
    category: "contact",
    key: "primary_phone",
    description: "Primary phone number for email templates and contact info",
    type: "text",
    defaultValue: "(000) 000-0000"
  },
  {
    category: "contact",
    key: "business_address",
    description: "Business address for email signatures (optional)",
    type: "text",
    defaultValue: ""
  },
  {
    category: "forms",
    key: "submission_form_header",
    description: "Main header text on submission form",
    type: "text",
    defaultValue: "Get Your Free Real Estate Guide"
  },
  {
    category: "forms",
    key: "submission_form_description",
    description: "Description text under form header",
    type: "text",
    defaultValue: "Get instant access to your comprehensive real estate guide with expert insights and local market knowledge."
  },
  {
    category: "forms",
    key: "phone_placeholder",
    description: "Placeholder text for phone input fields",
    type: "text",
    defaultValue: "(000) 000-0000"
  },
  {
    category: "urls",
    key: "relocation_guide_url",
    description: "URL where users are redirected after requesting Relocation Guide",
    type: "url", 
    defaultValue: "https://infinitydigitalstudios.com"
  },
  {
    category: "urls",
    key: "first_time_buyer_guide_url",
    description: "URL where users are redirected after requesting First Time Home Buyer Guide", 
    type: "url",
    defaultValue: "https://infinitydigitalstudios.com"
  },
  {
    category: "urls",
    key: "sellers_guide_url",
    description: "URL where users are redirected after requesting Sellers Guide",
    type: "url",
    defaultValue: "/"
  },
  {
    category: "urls",
    key: "chat_redirect_url",
    description: "URL to redirect users after chat completion",
    type: "url",
    defaultValue: "/"
  },
  {
    category: "urls",
    key: "fallback_redirect_url",
    description: "Fallback URL for various redirects",
    type: "url",
    defaultValue: "/"
  },
  {
    category: "emails",
    key: "primary_agent_email",
    description: "Main agent email for lead notifications",
    type: "email",
    defaultValue: "configure-your-email@example.com"
  },
  {
    category: "emails",
    key: "sender_email",
    description: "Email address used to send emails to leads",
    type: "email",
    defaultValue: "configure-your-email@example.com"
  },
  {
    category: "emails",
    key: "agent_signature_name",
    description: "Agent name for email signatures",
    type: "text",
    defaultValue: "Your Real Estate Agent"
  },
  {
    category: "emails",
    key: "agent_signature_title",
    description: "Agent title/position for email signatures",
    type: "text",
    defaultValue: "Licensed Real Estate Agent"
  },
  {
    category: "emails",
    key: "email_closing_message",
    description: "Closing message in welcome emails",
    type: "text",
    defaultValue: "Your Real Estate Expert"
  },
  {
    category: "styling",
    key: "primary_color",
    description: "Primary brand color (hex code)",
    type: "color",
    defaultValue: "#1E3A8A"
  },
  {
    category: "styling",
    key: "secondary_color", 
    description: "Secondary brand color (hex code)",
    type: "color",
    defaultValue: "#3B82F6"
  },
  {
    category: "styling",
    key: "font_family",
    description: "Primary font family for headings",
    type: "font",
    defaultValue: "Playfair Display"
  }
] as const;

// Validation helper functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUrl = (url: string): boolean => {
  if (!url.trim()) return true; // Empty URLs are optional
  
  // Allow relative URLs starting with /
  if (url.startsWith('/')) {
    return true;
  }
  
  // Validate absolute URLs
  try {
    const parsedUrl = new URL(url);
    // Security: Only allow http and https protocols
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

export default function ConfigurationForm() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("agents");
  const [newAgent, setNewAgent] = useState<Partial<InsertAgent>>({
    name: "",
    headshotUrl: "/images/generic-silhouette.png",
    displayOrder: "0",
    isActive: "true"
  });

  // Edit agent state
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editAgent, setEditAgent] = useState<Partial<InsertAgent>>({
    name: "",
    headshotUrl: "",
    displayOrder: "0", 
    isActive: "true"
  });

  // Validation state for new agent form
  const [newAgentErrors, setNewAgentErrors] = useState<{
    email?: string;
    headshotUrl?: string;
  }>({});

  // Validation state for config inputs
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  
  // Local draft state for config inputs to allow intermediate invalid values
  const [draftConfigs, setDraftConfigs] = useState<Record<string, string>>({});
  
  // Auto-save feedback state
  const [savingConfigs, setSavingConfigs] = useState<Record<string, boolean>>({});
  
  // Debouncing state for auto-save
  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Confirmation dialog state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'agent' | 'config';
    id: string;
    name: string;
  } | null>(null);

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading, refetch: refetchAgents } = useQuery({
    queryKey: ["/api/agents"],
    queryFn: () => fetch("/api/agents").then(res => res.json()) as Promise<Agent[]>
  });

  // Fetch app configurations
  const { data: configs = [], isLoading: configsLoading, refetch: refetchConfigs } = useQuery({
    queryKey: ["/api/app-config"],
    queryFn: () => fetch("/api/app-config").then(res => res.json()) as Promise<AppConfiguration[]>
  });

  // Agent mutations
  const createAgentMutation = useMutation({
    mutationFn: (agentData: InsertAgent) => apiRequest("POST", "/api/agents", agentData),
    onSuccess: () => {
      refetchAgents();
      setNewAgent({ name: "", headshotUrl: "", displayOrder: "0", isActive: "true" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create agent",
        variant: "destructive" 
      });
    }
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertAgent> }) =>
      apiRequest("PUT", `/api/agents/${id}`, data),
    onSuccess: () => {
      refetchAgents();
      handleCancelEdit();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update agent", 
        variant: "destructive"
      });
    }
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/agents/${id}`),
    onSuccess: () => {
      refetchAgents();
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete agent",
        variant: "destructive"
      });
    }
  });

  // Configuration mutations
  const createConfigMutation = useMutation({
    mutationFn: (configData: InsertAppConfig) => apiRequest("POST", "/api/app-config", configData),
    onSuccess: () => {
      refetchConfigs();
      // Invalidate config query to trigger immediate CSS updates
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create configuration",
        variant: "destructive"
      });
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ key, data }: { key: string; data: Partial<InsertAppConfig> }) =>
      apiRequest("PUT", `/api/app-config/${key}`, data),
    onSuccess: (_, variables) => {
      // Clear saving state for this config
      setSavingConfigs(prev => {
        const next = { ...prev };
        delete next[variables.key];
        return next;
      });
      // Suppress toast for auto-saves to reduce UI noise  
      // Only show toast for manual saves (future enhancement)
      refetchConfigs();
      // Invalidate config query to trigger immediate CSS updates
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
    },
    onError: (error: any, variables) => {
      // Clear saving state for this config
      setSavingConfigs(prev => {
        const next = { ...prev };
        delete next[variables.key];
        return next;
      });
      toast({
        title: "Error",
        description: error.message || `Failed to update ${variables.key}`,
        variant: "destructive"
      });
    }
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (key: string) => apiRequest("DELETE", `/api/app-config/${key}`),
    onSuccess: () => {
      refetchConfigs();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete configuration", 
        variant: "destructive"
      });
    }
  });

  // Note: Configuration initialization is handled server-side in storage.ts 
  // to prevent race conditions and ensure data consistency

  // Initialize draft configs from server configs
  useEffect(() => {
    if (!configsLoading && configs.length > 0) {
      const initialDrafts: Record<string, string> = {};
      configs.forEach(config => {
        initialDrafts[config.configKey] = config.configValue;
      });
      setDraftConfigs(initialDrafts);
    }
  }, [configsLoading, configs]);

  // Auto-create missing PREDEFINED_CONFIGS (disabled - image configs manually created)
  // useEffect(() => {
  //   if (!configsLoading && configs) {
  //     const existingKeys = new Set(configs.map(c => c.configKey));
  //     const missingConfigs = PREDEFINED_CONFIGS.filter(p => !existingKeys.has(p.key));
  //     
  //     if (missingConfigs.length > 0) {
  //       console.log(`🔄 Auto-creating ${missingConfigs.length} missing configurations:`, missingConfigs.map(c => c.key));
  //       
  //       // Create all missing configs
  //       missingConfigs.forEach(predefinedConfig => {
  //         createConfigMutation.mutate({
  //           configKey: predefinedConfig.key,
  //           configValue: predefinedConfig.defaultValue,
  //           configType: predefinedConfig.type as any,
  //           description: predefinedConfig.description,
  //           category: predefinedConfig.category
  //         });
  //       });
  //     }
  //   }
  // }, [configsLoading, configs, createConfigMutation]);

  // Cleanup debounce timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Validation handlers for new agent form

  const handleNewAgentHeadshotChange = (url: string) => {
    setNewAgent(prev => ({ ...prev, headshotUrl: url }));
    if (url && !validateUrl(url)) {
      setNewAgentErrors(prev => ({ ...prev, headshotUrl: "Please enter a valid URL" }));
    } else {
      setNewAgentErrors(prev => ({ ...prev, headshotUrl: undefined }));
    }
  };

  // Edit agent handlers
  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setEditAgent({
      name: agent.name,
      email: agent.email || "",
      headshotUrl: agent.headshotUrl || "/images/generic-silhouette.png",
      displayOrder: agent.displayOrder || "0",
      isActive: (agent.isActive as "true" | "false") || "true"
    });
  };

  const handleEditAgentHeadshotChange = (url: string) => {
    setEditAgent(prev => ({ ...prev, headshotUrl: url }));
  };

  const handleCancelEdit = () => {
    setEditingAgent(null);
    setEditAgent({
      name: "",
      headshotUrl: "/images/generic-silhouette.png",
      displayOrder: "0", 
      isActive: "true"
    });
  };

  const handleSaveEdit = () => {
    if (!editingAgent || !editAgent.name?.trim()) {
      toast({
        title: "Error",
        description: "Agent name is required",
        variant: "destructive"
      });
      return;
    }

    updateAgentMutation.mutate({
      id: editingAgent.id,
      data: {
        name: editAgent.name.trim(),
        email: editAgent.email?.trim() || "",
        headshotUrl: editAgent.headshotUrl || "",
        displayOrder: editAgent.displayOrder || "0",
        isActive: editAgent.isActive as "true" | "false"
      }
    });
  };

  const handleCreateAgent = () => {
    // Validate all fields before submission
    const errors: typeof newAgentErrors = {};
    
    if (!newAgent.name) {
      toast({
        title: "Error",
        description: "Agent name is required",
        variant: "destructive"
      });
      return;
    }

    if (newAgent.email && !validateEmail(newAgent.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (newAgent.headshotUrl && !validateUrl(newAgent.headshotUrl)) {
      errors.headshotUrl = "Please enter a valid URL";
    }

    if (Object.keys(errors).length > 0) {
      setNewAgentErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before submitting",
        variant: "destructive"
      });
      return;
    }

    createAgentMutation.mutate(newAgent as InsertAgent);
  };

  const handleUpdateAgent = (agent: Agent, field: keyof InsertAgent, value: string) => {
    updateAgentMutation.mutate({
      id: agent.id,
      data: { [field]: value }
    });
  };

  // Validation handler for config inputs using draft state with debouncing
  const handleUpdateConfig = (config: AppConfiguration, value: string) => {
    // Update draft state immediately (allows intermediate invalid values)
    setDraftConfigs(prev => ({ ...prev, [config.configKey]: value }));
    
    // Validate input based on type
    let error = "";
    
    switch (config.configType) {
      case "email":
        if (value && !validateEmail(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "url":
        if (value && !validateUrl(value)) {
          error = "Please enter a valid URL";
        }
        break;
      case "color":
        if (value && !validateHexColor(value)) {
          error = "Please enter a valid hex color (e.g., #000000)";
        }
        break;
    }

    // Update validation state using functional updates
    if (error) {
      setConfigErrors(prev => ({ ...prev, [config.configKey]: error }));
      // Clear any pending update for invalid values
      if (debounceTimeouts.current[config.configKey]) {
        clearTimeout(debounceTimeouts.current[config.configKey]);
        delete debounceTimeouts.current[config.configKey];
      }
    } else {
      setConfigErrors(prev => {
        const next = { ...prev };
        delete next[config.configKey];
        return next;
      });
      
      // Clear existing timeout for this config key
      if (debounceTimeouts.current[config.configKey]) {
        clearTimeout(debounceTimeouts.current[config.configKey]);
      }
      
      // Set debounced update (500ms delay)
      debounceTimeouts.current[config.configKey] = setTimeout(() => {
        setSavingConfigs(prev => ({ ...prev, [config.configKey]: true }));
        updateConfigMutation.mutate({
          key: config.configKey,
          data: { configValue: value }
        });
        delete debounceTimeouts.current[config.configKey];
      }, 500);
    }
  };

  const handleDeleteAgent = (agent: Agent) => {
    setDeleteConfirmation({
      type: 'agent',
      id: agent.id,
      name: agent.name
    });
  };

  const handleDeleteConfig = (config: AppConfiguration) => {
    setDeleteConfirmation({
      type: 'config',
      id: config.configKey,
      name: config.description || config.configKey
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    
    if (deleteConfirmation.type === 'agent') {
      deleteAgentMutation.mutate(deleteConfirmation.id);
    } else {
      deleteConfigMutation.mutate(deleteConfirmation.id);
    }
    
    setDeleteConfirmation(null);
  };

  // Color Palette Application with Upsert Logic
  const handleApplyColorPalette = (palette: typeof COLOR_PALETTES[0]) => {
    const primaryConfig = configs.find(c => c.configKey === "primary_color");
    const secondaryConfig = configs.find(c => c.configKey === "secondary_color");

    // Handle primary color - update if exists, create if missing
    if (primaryConfig) {
      updateConfigMutation.mutate({
        key: "primary_color",
        data: { configValue: palette.colors[1] } // Use second shade as primary
      });
    } else {
      createConfigMutation.mutate({
        configKey: "primary_color",
        configValue: palette.colors[1],
        configType: "color",
        description: "Primary brand color (hex code)",
        category: "styling"
      });
    }
    
    // Handle secondary color - update if exists, create if missing
    if (secondaryConfig) {
      updateConfigMutation.mutate({
        key: "secondary_color", 
        data: { configValue: palette.colors[2] }
      });
    } else {
      createConfigMutation.mutate({
        configKey: "secondary_color",
        configValue: palette.colors[2],
        configType: "color",
        description: "Secondary brand color (hex code)",
        category: "styling"
      });
    }

    toast({
      title: "Color Palette Applied",
      description: `${palette.name} has been applied to your theme.`
    });
  };

  // Font Application with Upsert Logic
  const handleApplyFont = (font: typeof FONT_OPTIONS[0]) => {
    const fontConfig = configs.find(c => c.configKey === "font_family");
    
    // Handle font family - update if exists, create if missing
    if (fontConfig) {
      updateConfigMutation.mutate({
        key: "font_family",
        data: { configValue: font.value }
      });
    } else {
      createConfigMutation.mutate({
        configKey: "font_family",
        configValue: font.value,
        configType: "font",
        description: "Primary font family for headings",
        category: "styling"
      });
    }

    toast({
      title: "Font Applied",
      description: `${font.name} has been applied as your primary font.`
    });
  };

  const getConfigsByCategory = (category: string) => {
    return configs.filter(config => config.category === category);
  };

  const renderConfigInput = (config: AppConfiguration) => {
    const hasError = !!configErrors[config.configKey];
    const isSaving = !!savingConfigs[config.configKey];
    const errorClassName = hasError ? "border-red-500 focus:border-red-500" : "";
    // Use draft value if available, otherwise fall back to server value
    const currentValue = draftConfigs[config.configKey] ?? config.configValue;

    switch (config.configType) {
      case "color":
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="color"
                value={currentValue}
                onChange={(e) => handleUpdateConfig(config, e.target.value)}
                className="w-16"
                data-testid={`input-color-${config.configKey}`}
              />
              <Input
                type="text"
                value={currentValue}
                onChange={(e) => handleUpdateConfig(config, e.target.value)}
                className={`flex-1 font-mono text-sm ${errorClassName}`}
                placeholder="#000000"
                data-testid={`input-color-text-${config.configKey}`}
              />
              {isSaving && (
                <div className="flex items-center text-xs text-gray-500" data-testid={`saving-indicator-${config.configKey}`}>
                  <Save size={12} className="animate-pulse mr-1" />
                  Saving...
                </div>
              )}
            </div>
            {hasError && (
              <p className="text-sm text-red-600" data-testid={`error-config-${config.configKey}`}>
                {configErrors[config.configKey]}
              </p>
            )}
          </div>
        );
      case "email":
        return (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Input
                type="email"
                value={currentValue}
                onChange={(e) => handleUpdateConfig(config, e.target.value)}
                placeholder="agent@example.com"
                className={`flex-1 ${errorClassName}`}
                data-testid={`input-email-${config.configKey}`}
              />
              {isSaving && (
                <div className="flex items-center text-xs text-gray-500" data-testid={`saving-indicator-${config.configKey}`}>
                  <Save size={12} className="animate-pulse mr-1" />
                  Saving...
                </div>
              )}
            </div>
            {hasError && (
              <p className="text-sm text-red-600" data-testid={`error-config-${config.configKey}`}>
                {configErrors[config.configKey]}
              </p>
            )}
          </div>
        );
      case "url":
        // Use ImageUpload for headshot URLs, regular URL input for others
        if (config.configKey.includes('headshot')) {
          return (
            <div className="space-y-2">
              <ImageUpload
                onImageUploaded={(imageUrl) => handleUpdateConfig(config, imageUrl)}
                currentImageUrl={currentValue}
                className="mt-2"
                maxSizeKB={500}
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              />
              {isSaving && (
                <div className="flex items-center text-xs text-gray-500 mt-2" data-testid={`saving-indicator-${config.configKey}`}>
                  <Save size={12} className="animate-pulse mr-1" />
                  Saving...
                </div>
              )}
              {hasError && (
                <p className="text-sm text-red-600 mt-2" data-testid={`error-config-${config.configKey}`}>
                  {configErrors[config.configKey]}
                </p>
              )}
            </div>
          );
        }
        
        // Regular URL input for non-headshot URLs
        return (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Input
                type="url"
                value={currentValue}
                onChange={(e) => handleUpdateConfig(config, e.target.value)}
                placeholder="https://example.com"
                className={`flex-1 ${errorClassName}`}
                data-testid={`input-url-${config.configKey}`}
              />
              {isSaving && (
                <div className="flex items-center text-xs text-gray-500" data-testid={`saving-indicator-${config.configKey}`}>
                  <Save size={12} className="animate-pulse mr-1" />
                  Saving...
                </div>
              )}
            </div>
            {hasError && (
              <p className="text-sm text-red-600" data-testid={`error-config-${config.configKey}`}>
                {configErrors[config.configKey]}
              </p>
            )}
          </div>
        );
      case "image":
        return (
          <div className="space-y-2">
            <ImageUpload
              onImageUploaded={(imageUrl) => handleUpdateConfig(config, imageUrl)}
              currentImageUrl={currentValue}
              className="mt-2"
              maxSizeKB={500}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            />
            {isSaving && (
              <div className="flex items-center text-xs text-gray-500 mt-2" data-testid={`saving-indicator-${config.configKey}`}>
                <Save size={12} className="animate-pulse mr-1" />
                Saving...
              </div>
            )}
            {hasError && (
              <p className="text-sm text-red-600 mt-2" data-testid={`error-config-${config.configKey}`}>
                {configErrors[config.configKey]}
              </p>
            )}
          </div>
        );
      default:
        return (
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              value={currentValue}
              onChange={(e) => handleUpdateConfig(config, e.target.value)}
              placeholder="Enter value..."
              className="flex-1"
              data-testid={`input-text-${config.configKey}`}
            />
            {isSaving && (
              <div className="flex items-center text-xs text-gray-500" data-testid={`saving-indicator-${config.configKey}`}>
                <Save size={12} className="animate-pulse mr-1" />
                Saving...
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid="text-config-title">
            App Configuration
          </h1>
          <p className="text-gray-600" data-testid="text-config-subtitle">
            Customize your real estate lead generation app for each client fork.
            Manage agents, branding, URLs, and styling options.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8" data-testid="tabs-config-navigation">
            <TabsTrigger value="agents" className="flex items-center gap-1 text-sm px-2" data-testid="tab-agents">
              <Users size={14} />
              Agents
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-1 text-sm px-2" data-testid="tab-branding">
              <Palette size={14} />
              Branding
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex items-center gap-1 text-sm px-2" data-testid="tab-metadata">
              <Settings size={14} />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-1 text-sm px-2" data-testid="tab-contact">
              <Users size={14} />
              Contact
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center gap-1 text-sm px-2" data-testid="tab-forms">
              <Settings size={14} />
              Forms
            </TabsTrigger>
            <TabsTrigger value="urls" className="flex items-center gap-1 text-sm px-2" data-testid="tab-urls">
              <Link size={14} />
              URLs
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-1 text-sm px-2" data-testid="tab-emails">
              <Mail size={14} />
              Emails
            </TabsTrigger>
            <TabsTrigger value="styling" className="flex items-center gap-1 text-sm px-2" data-testid="tab-styling">
              <Settings size={14} />
              Styling
            </TabsTrigger>
          </TabsList>

          {/* AGENTS TAB */}
          <TabsContent value="agents" className="space-y-6">
            <Card data-testid="card-agents-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  Agent Management
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Add and manage real estate agents. Each fork can have multiple agents with their own contact information and headshots.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Agent Form */}
                <div className="border rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                  <h3 className="font-semibold text-lg mb-6 text-center text-gray-800" data-testid="text-add-agent-title">
                    Add New Agent
                  </h3>
                  
                  {/* Main Form Layout */}
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Left: Agent Photo Section */}
                    <div className="flex flex-col items-center space-y-3 lg:w-1/3">
                      <div className="text-center">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Agent Photo</Label>
                        
                        <div className="flex items-center justify-center mb-4">
                          {/* Default Generic Silhouette Preview */}
                          <div className="text-center">
                            <img 
                              src={newAgent.headshotUrl || "/images/generic-silhouette.png"}
                              alt="Agent Profile" 
                              className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-gray-300"
                            />
                            <p className="text-xs text-gray-600 mt-2">Default Profile Image</p>
                          </div>
                        </div>
                        
                        <ImageUpload
                          onImageUploaded={(imageUrl) => handleNewAgentHeadshotChange(imageUrl)}
                          currentImageUrl={newAgent.headshotUrl}
                          className="mx-auto"
                          maxSizeKB={500}
                          acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                        />
                        {newAgentErrors.headshotUrl && (
                          <p className="text-sm text-red-600 mt-2" data-testid="error-new-agent-headshot">
                            {newAgentErrors.headshotUrl}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Form Fields */}
                    <div className="flex-1 space-y-4">
                      {/* Agent Name - Full Width */}
                      <div>
                        <Label htmlFor="agent-name" className="text-sm font-medium text-gray-700">
                          Agent Name *
                        </Label>
                        <Input
                          id="agent-name"
                          value={newAgent.name || ""}
                          onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                          placeholder="Enter agent's full name"
                          className="mt-1 text-base"
                          data-testid="input-new-agent-name"
                        />
                      </div>

                      {/* Display Order and Status - Side by Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="agent-order" className="text-sm font-medium text-gray-700">
                            Display Order
                          </Label>
                          <Input
                            id="agent-order"
                            type="number"
                            value={newAgent.displayOrder || "0"}
                            onChange={(e) => setNewAgent({ ...newAgent, displayOrder: e.target.value })}
                            placeholder="0"
                            className="mt-1"
                            data-testid="input-new-agent-order"
                          />
                          <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                        </div>
                        <div>
                          <Label htmlFor="agent-active" className="text-sm font-medium text-gray-700">
                            Status
                          </Label>
                          <Select
                            value={newAgent.isActive || "true"}
                            onValueChange={(value: "true" | "false") => setNewAgent({ ...newAgent, isActive: value })}
                          >
                            <SelectTrigger className="mt-1" data-testid="select-new-agent-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Add Agent Button */}
                      <div className="pt-4">
                        <Button
                          onClick={handleCreateAgent}
                          disabled={createAgentMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                          data-testid="button-add-agent"
                        >
                          <Plus size={18} className="mr-2" />
                          {createAgentMutation.isPending ? "Adding Agent..." : "Add Agent"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Agent Form */}
                {editingAgent && (
                  <div className="border rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-sm">
                    <h3 className="font-semibold text-lg mb-6 text-center text-gray-800" data-testid="text-edit-agent-title">
                      Edit Agent: {editingAgent.name}
                    </h3>
                    
                    {/* Main Form Layout */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      {/* Left: Agent Photo Section */}
                      <div className="flex flex-col items-center space-y-3 lg:w-1/3">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Agent Photo</Label>
                          
                          <div className="flex items-center justify-center gap-4 mb-4">
                            {/* Current Agent Image Preview */}
                            <div className="text-center">
                              <img 
                                src={editAgent.headshotUrl || "/images/generic-silhouette.png"}
                                alt="Agent Profile" 
                                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-gray-300"
                              />
                              <p className="text-xs text-gray-600 mt-2">Current Profile Image</p>
                            </div>
                          </div>
                          
                          <ImageUpload
                            onImageUploaded={(imageUrl) => handleEditAgentHeadshotChange(imageUrl)}
                            currentImageUrl={editAgent.headshotUrl}
                            className="mx-auto"
                            maxSizeKB={500}
                            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                          />
                        </div>
                      </div>

                      {/* Right: Form Fields */}
                      <div className="flex-1 space-y-4">
                        {/* Agent Name - Full Width */}
                        <div>
                          <Label htmlFor="edit-agent-name" className="text-sm font-medium text-gray-700">
                            Agent Name *
                          </Label>
                          <Input
                            id="edit-agent-name"
                            value={editAgent.name || ""}
                            onChange={(e) => setEditAgent({ ...editAgent, name: e.target.value })}
                            placeholder="Enter agent's full name"
                            className="mt-1 text-base"
                            data-testid="input-edit-agent-name"
                          />
                        </div>

                        {/* Display Order and Status - Side by Side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-agent-order" className="text-sm font-medium text-gray-700">
                              Display Order
                            </Label>
                            <Input
                              id="edit-agent-order"
                              type="number"
                              value={editAgent.displayOrder || "0"}
                              onChange={(e) => setEditAgent({ ...editAgent, displayOrder: e.target.value })}
                              placeholder="0"
                              className="mt-1"
                              data-testid="input-edit-agent-order"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-agent-status" className="text-sm font-medium text-gray-700">
                              Status
                            </Label>
                            <Select 
                              value={editAgent.isActive || "true"} 
                              onValueChange={(value: "true" | "false") => setEditAgent({ ...editAgent, isActive: value })}
                            >
                              <SelectTrigger className="mt-1" data-testid="select-edit-agent-status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleSaveEdit}
                            disabled={updateAgentMutation.isPending || !editAgent.name?.trim()}
                            className="flex-1"
                            data-testid="button-save-edit-agent"
                          >
                            {updateAgentMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateAgentMutation.isPending}
                            data-testid="button-cancel-edit-agent"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Agents List */}
                <div className="space-y-4">
                  <h3 className="font-semibold" data-testid="text-existing-agents-title">
                    Existing Agents ({agents.length})
                  </h3>
                  {agentsLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[120px]" />
                            <Skeleton className="h-3 w-[180px]" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No agents configured yet. Add your first agent above.
                    </div>
                  ) : (
                    agents.map((agent) => (
                      <Card key={agent.id} className="p-4" data-testid={`card-agent-${agent.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={agent.headshotUrl || "/images/generic-silhouette.png"}
                              alt={agent.name}
                              className="w-12 h-12 rounded-full object-cover"
                              data-testid={`img-agent-headshot-${agent.id}`}
                            />
                            <div>
                              <h4 className="font-medium" data-testid={`text-agent-name-${agent.id}`}>
                                {agent.name}
                              </h4>
                              <p className="text-sm text-gray-600" data-testid={`text-agent-email-${agent.id}`}>
                                {agent.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={agent.isActive === "true" ? "default" : "secondary"}
                                  data-testid={`badge-agent-status-${agent.id}`}
                                >
                                  {agent.isActive === "true" ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline" data-testid={`badge-agent-order-${agent.id}`}>
                                  Order: {agent.displayOrder}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAgent(agent)}
                              data-testid={`button-edit-agent-${agent.id}`}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAgent(agent)}
                              data-testid={`button-delete-agent-${agent.id}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BRANDING TAB */}
          <TabsContent value="branding" className="space-y-6">
            <Card data-testid="card-branding-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette size={20} />
                  Branding Configuration
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {CONFIG_CATEGORIES.branding}
                </p>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getConfigsByCategory("branding").map((config) => (
                      <div key={config.id} className="space-y-2" data-testid={`config-item-${config.configKey}`}>
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">{config.description}</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" data-testid={`badge-config-type-${config.configKey}`}>
                              {config.configType}
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteConfig(config)}
                              data-testid={`button-delete-config-${config.configKey}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        {renderConfigInput(config)}
                        {config.configKey === "main_agent_headshot_url" && config.configValue && (
                          <img
                            src={config.configValue}
                            alt="Agent headshot preview"
                            className="w-16 h-16 rounded-full object-cover border"
                            data-testid={`img-headshot-preview-${config.configKey}`}
                          />
                        )}
                        {config.configType === "image" && config.configValue && (
                          <img
                            src={config.configValue}
                            alt={`${config.description} preview`}
                            className="w-20 h-20 object-contain border rounded-md bg-gray-50"
                            data-testid={`img-preview-${config.configKey}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* METADATA TAB */}
          <TabsContent value="metadata" className="space-y-6">
            <Card data-testid="card-metadata-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  App Metadata
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {CONFIG_CATEGORIES.metadata}
                </p>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="space-y-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getConfigsByCategory("metadata").map((config) => (
                    <div key={config.id} className="space-y-2" data-testid={`config-item-${config.configKey}`}>
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">{config.description}</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" data-testid={`badge-config-type-${config.configKey}`}>
                            {config.configType}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteConfig(config)}
                            data-testid={`button-delete-config-${config.configKey}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      {renderConfigInput(config)}
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACT TAB */}
          <TabsContent value="contact" className="space-y-6">
            <Card data-testid="card-contact-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  Contact Information
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {CONFIG_CATEGORIES.contact}
                </p>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="space-y-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getConfigsByCategory("contact").map((config) => (
                    <div key={config.id} className="space-y-2" data-testid={`config-item-${config.configKey}`}>
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">{config.description}</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" data-testid={`badge-config-type-${config.configKey}`}>
                            {config.configType}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteConfig(config)}
                            data-testid={`button-delete-config-${config.configKey}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      {renderConfigInput(config)}
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FORMS TAB */}
          <TabsContent value="forms" className="space-y-6">
            <Card data-testid="card-forms-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  Form Content
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {CONFIG_CATEGORIES.forms}
                </p>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getConfigsByCategory("forms").map((config) => (
                    <div key={config.id} className="space-y-2" data-testid={`config-item-${config.configKey}`}>
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">{config.description}</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" data-testid={`badge-config-type-${config.configKey}`}>
                            {config.configType}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteConfig(config)}
                            data-testid={`button-delete-config-${config.configKey}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      {renderConfigInput(config)}
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* URLS TAB */}
          <TabsContent value="urls" className="space-y-6">
            <Card data-testid="card-urls-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link size={20} />
                  URL Configuration
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {CONFIG_CATEGORIES.urls}
                </p>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getConfigsByCategory("urls").map((config) => (
                      <div key={config.id} className="space-y-2" data-testid={`config-item-${config.configKey}`}>
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">{config.description}</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" data-testid={`badge-config-type-${config.configKey}`}>
                              {config.configType}
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteConfig(config)}
                              data-testid={`button-delete-config-${config.configKey}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        {renderConfigInput(config)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* EMAILS TAB */}
          <TabsContent value="emails" className="space-y-6">
            <Card data-testid="card-emails-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail size={20} />
                  Email Configuration
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {CONFIG_CATEGORIES.emails}
                </p>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getConfigsByCategory("emails").map((config) => (
                      <div key={config.id} className="space-y-2" data-testid={`config-item-${config.configKey}`}>
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">{config.description}</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" data-testid={`badge-config-type-${config.configKey}`}>
                              {config.configType}
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteConfig(config)}
                              data-testid={`button-delete-config-${config.configKey}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        {renderConfigInput(config)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* STYLING TAB */}
          <TabsContent value="styling" className="space-y-6">
            {/* COLOR PALETTES */}
            <Card data-testid="card-color-palettes">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette size={20} />
                  Professional Color Palettes
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Choose from 10 carefully curated color schemes, including sophisticated grays and your current theme.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COLOR_PALETTES.map((palette) => {
                    const currentPrimary = configs.find(c => c.configKey === "primary_color")?.configValue;
                    const currentSecondary = configs.find(c => c.configKey === "secondary_color")?.configValue;
                    const isCurrentPalette = currentPrimary === palette.colors[1] && currentSecondary === palette.colors[2];
                    
                    return (
                      <Card 
                        key={palette.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${isCurrentPalette ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                        onClick={() => handleApplyColorPalette(palette)}
                        data-testid={`palette-${palette.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex gap-1">
                              {palette.colors.map((color, index) => (
                                <div 
                                  key={index}
                                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{palette.name}</h4>
                              {isCurrentPalette && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">{palette.description}</p>
                          <div className="flex gap-px h-4 rounded overflow-hidden">
                            {palette.colors.map((color, index) => (
                              <div 
                                key={index}
                                className="flex-1" 
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2 text-xs text-gray-500">
                            {palette.colors.slice(0, 2).map((color, index) => (
                              <span key={index}>{color}</span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* FONT OPTIONS */}
            <Card data-testid="card-font-options">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  Premium Font Selection
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Choose from 10 carefully selected professional fonts, balanced between serif and sans-serif options.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FONT_OPTIONS.map((font) => {
                    const currentFont = configs.find(c => c.configKey === "font_family")?.configValue;
                    const isCurrentFont = currentFont === font.value;
                    
                    return (
                      <Card 
                        key={font.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${isCurrentFont ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                        onClick={() => handleApplyFont(font)}
                        data-testid={`font-${font.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{font.name}</h4>
                              <Badge variant="outline" className="text-xs mt-1">{font.category}</Badge>
                              {isCurrentFont && (
                                <Badge variant="default" className="text-xs ml-2">Current</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">{font.description}</p>
                          <div 
                            className="text-lg font-medium p-2 bg-gray-50 rounded border text-center"
                            style={{ fontFamily: font.value }}
                          >
                            Real Estate Excellence
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">{font.value}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* CUSTOM STYLING OPTIONS */}
            <Card data-testid="card-custom-styling">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  Custom Styling Options
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Manual configuration for advanced customization beyond the preset options.
                </p>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getConfigsByCategory("styling").map((config) => (
                      <div key={config.id} className="space-y-2" data-testid={`config-item-${config.configKey}`}>
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">{config.description}</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" data-testid={`badge-config-type-${config.configKey}`}>
                              {config.configType}
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteConfig(config)}
                              data-testid={`button-delete-config-${config.configKey}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        {renderConfigInput(config)}
                        {config.configKey === "primary_color" && (
                          <div
                            className="w-full h-8 rounded border"
                            style={{ backgroundColor: config.configValue }}
                            data-testid={`preview-primary-color`}
                          />
                        )}
                        {config.configKey === "secondary_color" && (
                          <div
                            className="w-full h-8 rounded border"
                            style={{ backgroundColor: config.configValue }}
                            data-testid={`preview-secondary-color`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer with key information */}
        <Card className="mt-8 bg-blue-50 border-blue-200" data-testid="card-config-info">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-800">
              <h3 className="font-semibold mb-2">Configuration Notes:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Each fork uses separate DATABASE_URL and EMAIL_TO environment variables</li>
                <li>Agent management allows unlimited agents per fork for scalability</li>
                <li>All visual changes affect submission-form, chat, and chat2 pages only</li>
                <li>Dashboard appearance remains consistent across all forks</li>
                <li>Changes are saved automatically when modified</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => { if (!open) setDeleteConfirmation(null); }}>
          <AlertDialogContent data-testid="dialog-delete-confirmation">
            <AlertDialogHeader>
              <AlertDialogTitle data-testid="text-delete-title">
                Delete {deleteConfirmation?.type === 'agent' ? 'Agent' : 'Configuration'}
              </AlertDialogTitle>
              <AlertDialogDescription data-testid="text-delete-description">
                Are you sure you want to delete{' '}
                <strong>"{deleteConfirmation?.name}"</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-delete-cancel">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                data-testid="button-delete-confirm"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}