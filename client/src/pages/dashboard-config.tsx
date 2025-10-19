import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type Agent } from '@shared/schema';
import { 
  Settings, 
  UserPlus, 
  User, 
  Trash2, 
  Upload, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Shield,
  UserCheck,
  Key,
  HelpCircle
} from 'lucide-react';
import { useLocation } from 'wouter';

// Help Tooltip Component
const HelpTooltip = ({ content }: { content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="ml-2 text-white/50 hover:text-white/80 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    </TooltipTrigger>
    <TooltipContent 
      side="bottom" 
      className="max-w-sm bg-slate-800 border-blue-400/30 text-white p-4 text-sm leading-relaxed"
    >
      <p>{content}</p>
    </TooltipContent>
  </Tooltip>
);

const addAgentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().refine(
    (value) => value.replace(/\D/g, '').length === 10,
    'Please enter a valid 10-digit phone number'
  ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['agent', 'owner'], {
    required_error: 'Please select a role'
  }),
  bio: z.string().optional(),
  headshotUrl: z.string().optional(),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm the password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AddAgentForm = z.infer<typeof addAgentSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// Phone formatting function
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const phoneNumber = value.replace(/\D/g, '');
  
  // Don't format if empty
  if (!phoneNumber) return '';
  
  // Format based on length
  if (phoneNumber.length <= 3) {
    return `(${phoneNumber}`;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
};

export default function DashboardConfig() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [agentToChangePassword, setAgentToChangePassword] = useState<Agent | null>(null);
  const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);
  const [uploadingHeadshot, setUploadingHeadshot] = useState<string | null>(null);

  // Check if user has admin access
  const hasAdminAccess = user?.role === 'superadmin' || user?.role === 'owner';

  // Fetch agents - always call hooks in the same order
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    enabled: !!user && hasAdminAccess, // Only fetch if user has access
  });

  // All other hooks and mutations stay in the same order...
  const form = useForm<AddAgentForm>({
    resolver: zodResolver(addAgentSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      role: 'agent',
      password: '',
    },
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Redirect if no admin access - do this in useEffect to avoid hooks order issues
  useEffect(() => {
    if (user && !hasAdminAccess) {
      setLocation('/');
    }
  }, [user, hasAdminAccess, setLocation]);

  // Show loading or unauthorized state after all hooks are called
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Access denied. Redirecting...</div>
      </div>
    );
  }

  // Add agent form
  const addAgentForm = useForm<AddAgentForm>({
    resolver: zodResolver(addAgentSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'agent',
      bio: '',
      headshotUrl: '',
    },
  });

  // Change password form
  const changePasswordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Add agent mutation
  const addAgentMutation = useMutation({
    mutationFn: async (data: AddAgentForm) => {
      const response = await apiRequest('POST', '/api/agents', data);
      return response.json();
    },
    onSuccess: () => {
      addAgentForm.reset();
      setShowAddAgentModal(false);
      setAgentToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
    onError: (error) => {
      console.error('Failed to add agent:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add agent',
        description: 'There was an error creating the agent. Please try again.',
      });
    },
  });

  // Edit agent mutation
  const editAgentMutation = useMutation({
    mutationFn: async (data: AddAgentForm & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PUT', `/api/agents/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Agent updated successfully',
        description: 'The agent information has been updated.',
      });
      addAgentForm.reset();
      setShowAddAgentModal(false);
      setAgentToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
    onError: (error) => {
      console.error('Failed to update agent:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update agent',
        description: 'There was an error updating the agent. Please try again.',
      });
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      await apiRequest('DELETE', `/api/agents/${agentId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Agent deleted',
        description: 'The agent has been successfully removed.',
      });
      setShowDeleteModal(false);
      setAgentToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
    onError: (error) => {
      console.error('Failed to delete agent:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete agent',
        description: 'There was an error deleting the agent. Please try again.',
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { agentId: string; newPassword: string }) => {
      const response = await apiRequest('PUT', `/api/agents/${data.agentId}/password`, {
        password: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password changed',
        description: 'The agent password has been updated successfully.',
      });
      changePasswordForm.reset();
      setShowChangePasswordModal(false);
      setAgentToChangePassword(null);
    },
    onError: (error) => {
      console.error('Failed to change password:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to change password',
        description: 'There was an error updating the password. Please try again.',
      });
    },
  });

  // Upload headshot mutation
  const uploadHeadshotMutation = useMutation({
    mutationFn: async (data: { agentId: string; file: File }) => {
      const formData = new FormData();
      formData.append('image', data.file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      
      // Update agent with new headshot URL
      await apiRequest('PUT', `/api/agents/${data.agentId}`, {
        headshotUrl: result.url,
      });
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Headshot updated',
        description: 'The agent headshot has been uploaded successfully.',
      });
      setUploadingHeadshot(null);
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
    onError: (error) => {
      console.error('Failed to upload headshot:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to upload headshot',
        description: 'There was an error uploading the image. Please try again.',
      });
      setUploadingHeadshot(null);
    },
  });

  const handleAddAgent = (data: AddAgentForm) => {
    if (agentToEdit) {
      // Editing existing agent
      editAgentMutation.mutate({ ...data, id: agentToEdit.id });
    } else {
      // Adding new agent
      addAgentMutation.mutate(data);
    }
  };

  const handleDeleteAgent = (agent: Agent) => {
    setAgentToDelete(agent);
    setShowDeleteModal(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setAgentToEdit(agent);
    // Populate the form with agent data
    addAgentForm.reset({
      name: agent.name,
      email: agent.email || '',
      phone: agent.phone || '',
      role: agent.role || 'agent',
      bio: agent.bio || '',
      headshotUrl: agent.headshotUrl || '',
      password: '', // Don't populate password for security
    });
    setShowAddAgentModal(true);
  };

  const handleChangePassword = (agent: Agent) => {
    setAgentToChangePassword(agent);
    setShowChangePasswordModal(true);
  };

  const handleHeadshotUpload = async (agentId: string, file: File) => {
    setUploadingHeadshot(agentId);
    uploadHeadshotMutation.mutate({ agentId, file });
  };

  const confirmDeleteAgent = () => {
    if (agentToDelete) {
      deleteAgentMutation.mutate(agentToDelete.id);
    }
  };

  const confirmChangePassword = (data: ChangePasswordForm) => {
    if (agentToChangePassword) {
      changePasswordMutation.mutate({
        agentId: agentToChangePassword.id,
        newPassword: data.newPassword,
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="w-4 h-4" />;
      case 'owner':
        return <UserCheck className="w-4 h-4" />;
      case 'agent':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-600';
      case 'owner':
        return 'bg-blue-600';
      case 'agent':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'owner':
        return 'Admin';
      case 'agent':
        return 'Agent';
      default:
        return 'Agent';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading configuration...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 border-b border-blue-400/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/')}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-white" />
              <h1 className="text-2xl font-bold text-white">Dashboard Configuration</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getRoleIcon(user?.role || 'agent')}
            <span className="text-white font-medium">{user?.email}</span>
            <Badge className={`${getRoleBadgeColor(user?.role || 'agent')} text-white font-medium`}>
              {getRoleDisplayName(user?.role || 'agent')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-white mb-2">Agent Management</h2>
                <HelpTooltip content="This page allows you to manage all agents in your organization. Add new agents by clicking 'Add Agent' - you'll need to provide their name, email, phone, and set an initial password for their login account. You can use a generic password when creating agents, and they can change to a more secure password in their settings once they login and launch their dashboard. Each agent card shows their profile photo, contact information, and role. Use 'Edit' to update agent details, 'Change Password' to reset their login credentials, or the trash icon to remove agents. You can upload profile photos by clicking the upload icon on their headshot. Only admin users can access this configuration page and manage agent accounts." />
              </div>
              <p className="text-white/70">Manage agents, passwords, and profile settings</p>
            </div>
            <Button
              onClick={() => setShowAddAgentModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-add-agent"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="bg-white/10 border-blue-400/30">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={agent.headshotUrl || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23e5e7eb"/><text x="32" y="38" font-family="Arial" font-size="12" text-anchor="middle" fill="%23374151">Agent</text></svg>`}
                      alt={agent.name}
                      className="w-16 h-16 rounded-full object-cover"
                      data-testid={`img-agent-headshot-${agent.id}`}
                    />
                    <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-1 rounded-full cursor-pointer transition-colors">
                      <Upload className="w-3 h-3 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleHeadshotUpload(agent.id, file);
                          }
                        }}
                        data-testid={`input-upload-headshot-${agent.id}`}
                      />
                    </label>
                    {uploadingHeadshot === agent.id && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="text-white text-xs">Uploading...</div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                    <CardDescription className="text-white/70">{agent.email}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getRoleBadgeColor(agent.role)} text-white text-xs`}>
                        {getRoleDisplayName(agent.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-white/70">
                  <div>Phone: {agent.phone || 'N/A'}</div>
                  {agent.bio && <div>Bio: {agent.bio}</div>}
                </div>
                <Separator className="my-4 bg-blue-400/30" />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditAgent(agent)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    data-testid={`button-edit-agent-${agent.id}`}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleChangePassword(agent)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    data-testid={`button-change-password-${agent.id}`}
                  >
                    <Key className="w-3 h-3 mr-1" />
                    Change Password
                  </Button>
                  <Button
                    onClick={() => handleDeleteAgent(agent)}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    aria-label={`Delete agent ${agent.name}`}
                    data-testid={`button-delete-agent-${agent.id}`}
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {agents.length === 0 && (
          <Card className="bg-white/10 border-blue-400/30">
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 text-white/50 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No agents found</h3>
              <p className="text-white/70 mb-4">Get started by adding your first agent</p>
              <Button
                onClick={() => setShowAddAgentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-add-first-agent"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Agent
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Agent Modal */}
      <Dialog open={showAddAgentModal} onOpenChange={(open) => {
        if (!open) {
          setAgentToEdit(null);
          addAgentForm.reset();
        }
        setShowAddAgentModal(open);
      }}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{agentToEdit ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
            <DialogDescription className="text-white/70">
              {agentToEdit ? 'Update the agent information' : 'Create a new agent account with login credentials'}
            </DialogDescription>
          </DialogHeader>
          <Form {...addAgentForm}>
            <form onSubmit={addAgentForm.handleSubmit(handleAddAgent)} className="space-y-4" data-testid="form-add-agent">
              <FormField
                control={addAgentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        placeholder="Enter agent name"
                        data-testid="input-agent-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addAgentForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        placeholder="Enter email address"
                        data-testid="input-agent-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addAgentForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        placeholder="Enter phone number"
                        data-testid="input-agent-phone"
                        inputMode="numeric"
                        autoComplete="tel"
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={14} // Maximum length for (xxx) xxx-xxxx format
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addAgentForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPasswordInForm ? 'text' : 'password'}
                          className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                          placeholder="Enter password"
                          data-testid="input-agent-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                          data-testid="button-toggle-password-visibility"
                        >
                          {showPasswordInForm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addAgentForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/10 border-blue-400/30 text-white" data-testid="select-agent-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="owner">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addAgentForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Bio (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        placeholder="Enter agent bio"
                        data-testid="input-agent-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={addAgentMutation.isPending || editAgentMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  data-testid={agentToEdit ? "button-submit-edit-agent" : "button-submit-add-agent"}
                >
                  {agentToEdit 
                    ? (editAgentMutation.isPending ? 'Updating...' : 'Update Agent')
                    : (addAgentMutation.isPending ? 'Adding...' : 'Add Agent')
                  }
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAddAgentModal(false)}
                  className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  data-testid="button-cancel-add-agent"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Agent Modal */}
      <AlertDialog 
        open={showDeleteModal} 
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) {
            setAgentToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete {agentToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAgent}
              disabled={deleteAgentMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-delete"
            >
              {deleteAgentMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Modal */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription className="text-white/70">
              Change password for {agentToChangePassword?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...changePasswordForm}>
            <form onSubmit={changePasswordForm.handleSubmit(confirmChangePassword)} className="space-y-4" data-testid="form-change-password">
              <FormField
                control={changePasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNewPassword ? 'text' : 'password'}
                          className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                          placeholder="Enter new password"
                          data-testid="input-new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          data-testid="button-toggle-new-password"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={changePasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                          placeholder="Confirm new password"
                          data-testid="input-confirm-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  data-testid="button-submit-change-password"
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  data-testid="button-cancel-change-password"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}