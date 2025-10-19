import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Shield, Eye, EyeOff, User } from 'lucide-react';
import { useLocation } from 'wouter';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(10, 'New password must be at least 10 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/, 
      'Password must contain: uppercase, lowercase, number, and special character (@$!%*?&)'),
  confirmPassword: z.string().min(10, 'Please confirm the new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function Settings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const changePasswordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const response = await apiRequest('PUT', '/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Password changed successfully',
        description: data.requireReauth ? 'Your password has been updated. You will be redirected to login for security.' : 'Your password has been updated. Please keep it secure.',
      });
      changePasswordForm.reset();
      
      // If re-authentication is required, redirect to login after a short delay
      if (data.requireReauth) {
        setTimeout(() => {
          setLocation('/login');
        }, 2000);
      }
    },
    onError: (error: any) => {
      console.error('Failed to change password:', error);
      toast({
        title: 'Failed to change password',
        description: 'There was an error changing your password. Please check your current password and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleChangePassword = (data: ChangePasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 border-b border-blue-400/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-white/70 text-sm">Manage your account preferences and security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="bg-white/10 border border-blue-400/30">
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white/70"
              data-testid="tab-security"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white/70"
              data-testid="tab-profile"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-white/5 border-blue-400/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-white/70">
                  Manage your password and account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Change Password</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Update your password to keep your account secure. Password must be at least 10 characters with uppercase, lowercase, number, and special character (@$!%*?&).
                  </p>
                  
                  <Form {...changePasswordForm}>
                    <form onSubmit={changePasswordForm.handleSubmit(handleChangePassword)} className="space-y-4" data-testid="form-change-password">
                      <FormField
                        control={changePasswordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70">Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showCurrentPassword ? "text" : "password"}
                                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50 pr-10"
                                  placeholder="Enter your current password"
                                  data-testid="input-current-password"
                                />
                                <Button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 bg-transparent hover:bg-white/10 text-white/70"
                                  data-testid="toggle-current-password-visibility"
                                >
                                  {showCurrentPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="bg-blue-400/30" />

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
                                  type={showNewPassword ? "text" : "password"}
                                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50 pr-10"
                                  placeholder="Enter your new password"
                                  data-testid="input-new-password"
                                />
                                <Button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 bg-transparent hover:bg-white/10 text-white/70"
                                  data-testid="toggle-new-password-visibility"
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
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
                            <FormLabel className="text-white/70">Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showConfirmPassword ? "text" : "password"}
                                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50 pr-10"
                                  placeholder="Confirm your new password"
                                  data-testid="input-confirm-password"
                                />
                                <Button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 bg-transparent hover:bg-white/10 text-white/70"
                                  data-testid="toggle-confirm-password-visibility"
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
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
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid="button-change-password"
                        >
                          {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => changePasswordForm.reset()}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          data-testid="button-reset-form"
                        >
                          Reset Form
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white/5 border-blue-400/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-white/70">
                  View your profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-white/70 text-sm font-medium">Email</label>
                    <div className="mt-1 p-3 bg-white/10 border border-blue-400/30 rounded-md">
                      <span className="text-white">{user?.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm font-medium">Role</label>
                    <div className="mt-1 p-3 bg-white/10 border border-blue-400/30 rounded-md">
                      <span className="text-white capitalize">{user?.role}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm font-medium">User ID</label>
                    <div className="mt-1 p-3 bg-white/10 border border-blue-400/30 rounded-md">
                      <span className="text-white/70 text-sm font-mono">{user?.id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}