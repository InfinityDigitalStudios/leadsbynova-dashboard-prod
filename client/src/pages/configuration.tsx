import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, FileText, MessageSquare, Home, ArrowLeft, Maximize2, Monitor, Trash2, Plus } from "lucide-react";
import { Link } from "wouter";
import { ImageUpload } from "@/components/ui/image-upload";
import { type AppConfiguration } from "@shared/schema";

interface ConfigField {
  key: string;
  label: string;
  description: string;
  type: "text" | "textarea" | "url" | "color" | "image" | "checkbox";
  placeholder?: string;
}

// Configuration fields organized by page
const PAGE_CONFIGS: Record<string, { title: string; icon: any; previewUrl: string; fields: ConfigField[] }> = {
  "submission-form": {
    title: "Submission Form",
    icon: FileText,
    previewUrl: "/submission-form",
    fields: [
      {
        key: "primary_color",
        label: "Primary Color",
        description: "Main brand color for buttons and accents",
        type: "color"
      },
      {
        key: "main_agent_headshot_url",
        label: "Image/Logo",
        description: "Upload top icon/logo shown on form",
        type: "image"
      },
      {
        key: "page_headline",
        label: "Headline Text",
        description: "Main headline text at top of page",
        type: "text",
        placeholder: "Experience LeadsByNova"
      },
      {
        key: "page_headline_image",
        label: "Headline Image (Optional)",
        description: "Image to display with headline",
        type: "image"
      },
      {
        key: "headline_logo_position",
        label: "Logo Position",
        description: "Place logo before or after headline text",
        type: "checkbox",
        placeholder: "before"
      },
      {
        key: "page_subheader",
        label: "SubHeader",
        description: "Tagline below headline",
        type: "text",
        placeholder: "Automate Connections - Accelerate Growth"
      },
      {
        key: "page_header_description",
        label: "Header Description",
        description: "Description text below subheader",
        type: "textarea",
        placeholder: "Step inside the all-in-one lead automation platform..."
      },
      {
        key: "submission_form_header",
        label: "Form Header",
        description: "Header text inside the form card",
        type: "text",
        placeholder: "Create Your Free Access Account"
      },
      {
        key: "submission_form_description",
        label: "Form Description",
        description: "Description text inside the form card",
        type: "textarea",
        placeholder: "Unlock a guided experience..."
      },
      {
        key: "guide_selections_title",
        label: "Guide Selections Title",
        description: "Section title for guide selection options",
        type: "text",
        placeholder: "Account Type"
      },
      {
        key: "guide_option_1",
        label: "Guide Option 1",
        description: "First guide selection option (required)",
        type: "text",
        placeholder: "I'm a Business Owner"
      },
      {
        key: "guide_option_2",
        label: "Guide Option 2",
        description: "Second guide selection option (required)",
        type: "text",
        placeholder: "I'm a Sales Agent"
      },
      {
        key: "guide_option_3",
        label: "Guide Option 3 ",
        description: "Third guide selection option (required)",
        type: "text",
        placeholder: "I'm a Marketing Professional"
      },
      {
        key: "guide_option_4",
        label: "Guide Option 4",
        description: "Fourth guide selection option (required)",
        type: "text",
        placeholder: "I'm Just Exploring"
      },
      {
        key: "form_button_text",
        label: "Form Button",
        description: "Text on the submit button",
        type: "text",
        placeholder: "Experience LeadsByNova"
      },
      {
        key: "form_footer_text",
        label: "Form Footer",
        description: "Text shown below the submit button",
        type: "text",
        placeholder: "No Credit Card Required - See How It Works 100% Free"
      },
      {
        key: "sms_optin_text",
        label: "SMS Opt-in Text",
        description: "Full text for SMS consent disclosure",
        type: "textarea",
        placeholder: "SMS Opt-in (Program: LeadsByNova™ Platform Updates & Promotions): By providing your phone number and submitting this form, you agree to receive marketing and informational text messages from LeadsByNova™ regarding product updates, feature releases, and promotional offers at the number provided. Consent is not a condition of purchase. Message frequency may vary. Message & data rates may apply. Reply STOP to opt out or HELP for help."
      },
      {
        key: "sms_privacy_url",
        label: "SMS Privacy Policy URL",
        description: "Link to Privacy Policy for SMS opt-in",
        type: "url",
        placeholder: "https://yoursite.com/privacy"
      },
      {
        key: "sms_terms_url",
        label: "SMS Terms URL",
        description: "Link to Terms & Conditions for SMS opt-in",
        type: "url",
        placeholder: "https://yoursite.com/terms"
      },
      {
        key: "email_optin_text",
        label: "Email Opt-in Text",
        description: "Full text for email consent disclosure",
        type: "textarea",
        placeholder: "Email Opt-in (Program: LeadsByNova™ Platform Updates & Promotions): By submitting this form, you agree to receive marketing emails from LeadsByNova™, including product announcements, feature updates, special offers, and educational content designed to help you grow your business. You can unsubscribe at any time."
      },
      {
        key: "email_privacy_url",
        label: "Email Privacy Policy URL",
        description: "Link to Privacy Policy for email opt-in",
        type: "url",
        placeholder: "https://yoursite.com/privacy"
      },
      {
        key: "email_terms_url",
        label: "Email Terms URL",
        description: "Link to Terms & Conditions for email opt-in",
        type: "url",
        placeholder: "https://yoursite.com/terms"
      }
    ]
  },
  "chat": {
    title: "Chat Page (Primary)",
    icon: MessageSquare,
    previewUrl: "/chat",
    fields: [
      {
        key: "chat_header_title",
        label: "Chat Header Title",
        description: "Title shown in chat header",
        type: "text",
        placeholder: "Chat with Real Estate Expert"
      },
      {
        key: "main_agent_headshot_url",
        label: "Image/Logo",
        description: "Upload icon/logo shown in chat",
        type: "image"
      },
      {
        key: "chat_redirect_url",
        label: "Chat Redirect URL",
        description: "Where to send users after chat completion",
        type: "url",
        placeholder: "https://example.com/next-page"
      }
    ]
  },
  "chat2": {
    title: "Chat Page 2 (Alternative)",
    icon: MessageSquare,
    previewUrl: "/chat2",
    fields: [
      {
        key: "chat_header_title",
        label: "Chat Header Title",
        description: "Title shown in chat header (shared with Chat 1)",
        type: "text",
        placeholder: "Chat with Real Estate Expert"
      },
      {
        key: "main_agent_headshot_url",
        label: "Image/Logo",
        description: "Upload icon/logo shown in chat (shared with Chat 1)",
        type: "image"
      }
    ]
  },
  "dashboard": {
    title: "Dashboard (Home)",
    icon: Home,
    previewUrl: "/",
    fields: [
      {
        key: "company_name",
        label: "Company Name",
        description: "Company name shown in dashboard header",
        type: "text",
        placeholder: "Your Company Name"
      },
      {
        key: "app_title",
        label: "Browser Tab Title",
        description: "Title shown in browser tab",
        type: "text",
        placeholder: "LeadsByNova™"
      }
    ]
  }
};

export default function Configuration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("submission-form");
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [showFullscreen, setShowFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load all configurations
  const { data: configurations = [], isLoading } = useQuery<AppConfiguration[]>({
    queryKey: ['/api/app-config'],
    staleTime: 30000,
  });

  // Helper to get current value (edited or original)
  const getCurrentValue = (key: string): string => {
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    const config = configurations.find(c => c.configKey === key);
    return config?.configValue || "";
  };

  // Get guide options (always show all 4 by default)
  const getGuideOptions = () => {
    return [
      { key: 'guide_option_1', value: getCurrentValue('guide_option_1') },
      { key: 'guide_option_2', value: getCurrentValue('guide_option_2') },
      { key: 'guide_option_3', value: getCurrentValue('guide_option_3') },
      { key: 'guide_option_4', value: getCurrentValue('guide_option_4') },
    ];
  };

  // Delete a guide option
  const handleDeleteGuideOption = (optionKey: string) => {
    setEditedValues({ ...editedValues, [optionKey]: '' });
  };

  // Add a new guide option (fill in the first empty slot)
  const handleAddGuideOption = () => {
    const options = getGuideOptions();
    const emptyOption = options.find(opt => !opt.value || opt.value.trim() === '');
    if (emptyOption) {
      // Set a placeholder value to make the field visible, then focus it
      setEditedValues({ ...editedValues, [emptyOption.key]: `Option ${emptyOption.key.slice(-1)}` });
      setTimeout(() => {
        const element = document.getElementById(emptyOption.key) as HTMLInputElement;
        if (element) {
          element.focus();
          element.select(); // Select the text so user can immediately type to replace it
        }
      }, 100);
    }
  };

  // Send preview updates to iframe using postMessage
  useEffect(() => {
    if (iframeRef.current && Object.keys(editedValues).length > 0) {
      const previewData = {
        type: 'PREVIEW_CONFIG_UPDATE',
        configs: editedValues
      };
      
      iframeRef.current.contentWindow?.postMessage(previewData, window.location.origin);
    }
  }, [editedValues]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      return apiRequest("POST", "/api/app-config/update", {
        configKey: data.key,
        configValue: data.value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
      toast({
        title: "Saved!",
        description: "Configuration updated successfully",
      });
      setEditedValues({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  // Save all edited values for current page
  const handleSavePage = async () => {
    const pageFields = PAGE_CONFIGS[activeTab].fields;
    const updates = pageFields
      .filter(field => editedValues[field.key] !== undefined)
      .map(field => ({ key: field.key, value: editedValues[field.key] }));

    if (updates.length === 0) {
      toast({
        title: "No changes",
        description: "No fields have been modified",
      });
      return;
    }

    for (const update of updates) {
      await updateMutation.mutateAsync(update);
    }
  };

  const hasUnsavedChanges = Object.keys(editedValues).length > 0;
  const currentPreviewUrl = PAGE_CONFIGS[activeTab].previewUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950">
      <div className="container mx-auto py-8 px-4 max-w-[1600px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2" data-testid="text-page-title">
                Page Editor
              </h1>
              <p className="text-slate-600 dark:text-slate-400" data-testid="text-page-description">
                Customize content and settings with live preview
              </p>
            </div>
            {hasUnsavedChanges && (
              <Button 
                onClick={handleSavePage} 
                disabled={updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-save-changes"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>

        {/* Page Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8" data-testid="tabs-page-selector">
            {Object.entries(PAGE_CONFIGS).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="flex items-center gap-2"
                  data-testid={`tab-${key}`}
                >
                  <Icon className="h-4 w-4" />
                  {config.title}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(PAGE_CONFIGS).map(([pageKey, pageConfig]) => (
            <TabsContent key={pageKey} value={pageKey} className="space-y-6">
              {/* Split Screen Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Edit Fields */}
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <pageConfig.icon className="h-5 w-5" />
                      {pageConfig.title} Settings
                    </CardTitle>
                    <CardDescription>
                      Configure how your {pageConfig.title.toLowerCase()} appears to visitors
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
                    {isLoading ? (
                      <div className="text-center py-8 text-slate-500">Loading configuration...</div>
                    ) : (
                      <>
                        {pageConfig.fields
                          .filter(field => !field.key.startsWith('guide_option_'))
                          .map((field) => {
                            // Custom rendering for Guide Selections
                            if (field.key === 'guide_selections_title' && activeTab === 'submission-form') {
                              return (
                                <div key={field.key}>
                                  {/* Guide Title Field */}
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <Label htmlFor={field.key} className="text-base font-semibold">
                                          {field.label}
                                        </Label>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                          {field.description}
                                        </p>
                                      </div>
                                      {editedValues[field.key] !== undefined && (
                                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                                          Modified
                                        </span>
                                      )}
                                    </div>
                                    <Input
                                      id={field.key}
                                      value={getCurrentValue(field.key)}
                                      onChange={(e) => setEditedValues({ ...editedValues, [field.key]: e.target.value })}
                                      placeholder={field.placeholder}
                                      className="font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                      data-testid={`input-${field.key}`}
                                    />
                                  </div>

                                  <Separator className="mt-4" />

                                  {/* Guide Options with Delete Buttons */}
                                  <div className="space-y-3 mt-4">
                                    <Label className="text-base font-semibold">Guide Options</Label>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 -mt-1">
                                      Customize the selection options (up to 4)
                                    </p>
                                    
                                    {getGuideOptions()
                                      .filter(opt => opt.value && opt.value.trim() !== '')
                                      .map((option, idx) => (
                                        <div key={option.key} className="flex items-center gap-2">
                                          <Input
                                            id={option.key}
                                            value={option.value}
                                            onChange={(e) => setEditedValues({ ...editedValues, [option.key]: e.target.value })}
                                            placeholder={`Option ${idx + 1}`}
                                            className="flex-1 font-mono text-sm"
                                            data-testid={`input-${option.key}`}
                                          />
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteGuideOption(option.key)}
                                            data-testid={`button-delete-${option.key}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}

                                    {/* Add Guide Option Button */}
                                    {getGuideOptions().filter(opt => opt.value && opt.value.trim() !== '').length < 4 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddGuideOption}
                                        className="w-full"
                                        data-testid="button-add-guide-option"
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Guide Option
                                      </Button>
                                    )}
                                  </div>
                                  <Separator className="mt-4" />
                                </div>
                              );
                            }

                            // Regular field rendering
                            return (
                              <div key={field.key}>
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <Label htmlFor={field.key} className="text-base font-semibold">
                                        {field.label}
                                      </Label>
                                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        {field.description}
                                      </p>
                                    </div>
                                    {editedValues[field.key] !== undefined && (
                                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                                        Modified
                                      </span>
                                    )}
                                  </div>
                            
                            {field.type === "textarea" ? (
                              <Textarea
                                id={field.key}
                                value={getCurrentValue(field.key)}
                                onChange={(e) => setEditedValues({ ...editedValues, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                rows={3}
                                className="font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                data-testid={`input-${field.key}`}
                              />
                            ) : field.type === "color" ? (
                              <div className="flex items-center gap-4">
                                <Input
                                  id={field.key}
                                  type="color"
                                  value={getCurrentValue(field.key) || "#3B82F6"}
                                  onChange={(e) => setEditedValues({ ...editedValues, [field.key]: e.target.value })}
                                  className="w-24 h-12"
                                  data-testid={`input-${field.key}`}
                                />
                                <Input
                                  type="text"
                                  value={getCurrentValue(field.key) || "#3B82F6"}
                                  onChange={(e) => setEditedValues({ ...editedValues, [field.key]: e.target.value })}
                                  placeholder="#3B82F6"
                                  className="font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                  data-testid={`input-${field.key}-text`}
                                />
                              </div>
                            ) : field.type === "image" ? (
                              <ImageUpload
                                currentImageUrl={getCurrentValue(field.key)}
                                onImageUploaded={(url) => setEditedValues({ ...editedValues, [field.key]: url })}
                                className="mt-2"
                              />
                            ) : field.type === "checkbox" ? (
                              <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                  id={field.key}
                                  checked={getCurrentValue(field.key) === "after"}
                                  onCheckedChange={(checked) => 
                                    setEditedValues({ ...editedValues, [field.key]: checked ? "after" : "before" })
                                  }
                                  data-testid={`checkbox-${field.key}`}
                                />
                                <label
                                  htmlFor={field.key}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Place logo after headline text
                                </label>
                              </div>
                            ) : (
                              <Input
                                id={field.key}
                                type={field.type === "url" ? "url" : "text"}
                                value={getCurrentValue(field.key)}
                                onChange={(e) => setEditedValues({ ...editedValues, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                className="font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                data-testid={`input-${field.key}`}
                              />
                            )}
                            
                            {field.key !== pageConfig.fields[pageConfig.fields.length - 1].key && (
                              <Separator className="mt-4" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                    {/* Page-specific save button */}
                    <div className="pt-4">
                      <Button 
                        onClick={handleSavePage}
                        disabled={!hasUnsavedChanges || updateMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        data-testid={`button-save-${pageKey}`}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateMutation.isPending ? "Saving..." : "Save Page Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Live Preview */}
                <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        <CardTitle>Live Preview</CardTitle>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowFullscreen(true)}
                        data-testid="button-expand-preview"
                      >
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Expand
                      </Button>
                    </div>
                    <CardDescription>
                      See your changes in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-slate-100 dark:bg-slate-900 h-[600px] relative">
                      <iframe
                        ref={iframeRef}
                        src={currentPreviewUrl}
                        className="w-full h-full border-0"
                        title="Page Preview"
                        data-testid="iframe-preview"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Info Footer */}
        <Card className="mt-8 border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-white mb-1">
                  Page Editor vs Admin Config
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This Page Editor is for customizing public-facing content (forms, chat, dashboard). 
                  For user management, agents, and system settings, use the{" "}
                  <Link href="/config" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Admin Config
                  </Link>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Preview Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Fullscreen Preview - {PAGE_CONFIGS[activeTab].title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(95vh-120px)]">
            <iframe
              src={currentPreviewUrl}
              className="w-full h-full border-0 rounded-lg"
              title="Fullscreen Page Preview"
              data-testid="iframe-fullscreen-preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
