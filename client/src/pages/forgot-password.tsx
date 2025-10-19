import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await apiRequest('POST', '/api/auth/forgot-password', data);
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (error: any) => {
      console.error('Failed to request password reset:', error);
    },
  });

  const handleSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

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
            <Mail className="w-6 h-6" />
            Forgot Password
          </CardTitle>
          <CardDescription className="text-white/70">
            Enter your email address and we'll send you a link to reset your password
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
                <h3 className="text-white text-lg font-semibold">Check Your Email</h3>
                <p className="text-white/70 text-sm">
                  If an account exists with this email, we've sent a password reset link. 
                  Please check your inbox and follow the instructions.
                </p>
                <p className="text-white/60 text-xs mt-4">
                  The link will expire in 1 hour for security reasons.
                </p>
              </div>
              <Button
                onClick={() => setLocation('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-back-to-login-success"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" data-testid="form-forgot-password">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                          placeholder="Enter your work email address"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-send-reset-link"
                >
                  {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
