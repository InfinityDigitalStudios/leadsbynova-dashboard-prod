import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Key, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/, 
      'Password must contain: uppercase, lowercase, number, and special character (@$!%*?&)'),
  confirmPassword: z.string().min(10, 'Please confirm the new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Verify token on mount
  const { data: tokenValidation, isLoading: isVerifying, error: verifyError } = useQuery({
    queryKey: ['/api/auth/verify-reset-token', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      const response = await fetch(`/api/auth/verify-reset-token/${token}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid token');
      }
      return response.json();
    },
    enabled: !!token,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      const response = await apiRequest('POST', '/api/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Failed to reset password:', error);
    },
  });

  const handleSubmit = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-blue-400/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Invalid Reset Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70 mb-4">
              This password reset link is invalid or missing a token.
            </p>
            <Button
              onClick={() => setLocation('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-back-to-login"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-blue-400/30 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center text-white">
              <p>Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifyError || !tokenValidation?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-blue-400/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Link Expired or Invalid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70 mb-4">
              This password reset link has expired or is invalid. Please request a new one.
            </p>
            <Button
              onClick={() => setLocation('/forgot-password')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-request-new-link"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 border-blue-400/30 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              onClick={() => setLocation('/login')}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 p-0"
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Button>
          </div>
          <CardTitle className="text-white text-2xl flex items-center gap-2">
            <Key className="w-6 h-6" />
            Reset Password
          </CardTitle>
          <CardDescription className="text-white/70">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500/20 p-3">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-white text-lg font-semibold">Password Reset Successful!</h3>
                <p className="text-white/70 text-sm">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <p className="text-white/60 text-xs mt-4">
                  Redirecting to login...
                </p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" data-testid="form-reset-password">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50 pr-10"
                            placeholder="Enter your new password"
                            data-testid="input-new-password"
                          />
                          <Button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 bg-transparent hover:bg-white/10 text-white/70"
                            data-testid="toggle-password-visibility"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-white/50 text-xs mt-1">
                        Must be 10+ characters with uppercase, lowercase, number, and special character (@$!%*?&)
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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

                <Button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-reset-password"
                >
                  {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
