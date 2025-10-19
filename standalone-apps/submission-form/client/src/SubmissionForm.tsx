import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertFormSubmissionSchema, type InsertFormSubmission } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, XCircle } from "lucide-react";

export default function SubmissionForm() {
  
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const form = useForm<InsertFormSubmission>({
    resolver: zodResolver(insertFormSubmissionSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      guideType: undefined,
    },
  });

  const submitFormMutation = useMutation({
    mutationFn: async (data: InsertFormSubmission) => {
      const response = await apiRequest("POST", "/api/form-submission", data);
      return response.json();
    },
    onSuccess: (_resp, vars) => {
      setShowSuccess(true);
      setShowError(false);
      
      // Store all user data for email sending
      const { fullName, email, phone, guideType } = vars;
      sessionStorage.setItem('userFullName', fullName);
      sessionStorage.setItem('userEmail', email);
      sessionStorage.setItem('userPhone', phone);
      sessionStorage.setItem('userGuideType', guideType);
      
      toast({
        title: "Success!",
        description: "Your guide will be sent to your email in a few minutes.",
      });
      
      form.reset();
    },
    onError: (error) => {
      setShowError(true);
      setShowSuccess(false);
      toast({
        title: "Error",
        description: "There was an error submitting your form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFormSubmission) => {
    setShowSuccess(false);
    setShowError(false);
    submitFormMutation.mutate(data);
  };

  return (
    <div className="min-h-[100dvh] animated-gradient-bg py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header Section */}
        <div className="text-center mb-4">
          {/* Sarah Johnson Professional Headshot */}
          <div className="relative mb-3">
            <div className="w-8 h-8 mx-auto rounded-full overflow-hidden">
              <img 
                src="/placeholder-headshot.png" 
                alt="Sarah Johnson - Real Estate Expert" 
                className="w-full h-full object-cover"
                data-testid="img-sarah-headshot"
              />
            </div>
          </div>
          
          <h1 className="text-xl font-bold luxury-text mb-1" data-testid="text-main-title">
            Get Your Free Real Estate Guide
          </h1>
          
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border border-border soft-blue-bg" data-testid="card-form">
          <CardContent className="p-4">
            <div className="mb-3">
              <h2 className="text-base font-semibold form-title-dark mb-1" data-testid="text-form-title">
                Download Your Free Guide
              </h2>
              <p className="text-xs form-luxury-text" data-testid="text-form-description">
                Get instant access to your comprehensive real estate guide with expert insights and local market knowledge.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" data-testid="form-submission">
                {/* Full Name Field */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-luxury-text" data-testid="label-fullname">
                        Full Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          {...field}
                          data-testid="input-fullname"
                          className="px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent custom-input"
                        />
                      </FormControl>
                      <FormMessage className="min-h-5" data-testid="error-fullname" />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-luxury-text" data-testid="label-email">
                        Email Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Enter your email address" 
                          {...field}
                          data-testid="input-email"
                          className="px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent custom-input"
                        />
                      </FormControl>
                      <FormMessage className="min-h-5" data-testid="error-email" />
                    </FormItem>
                  )}
                />

                {/* Phone Field */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-luxury-text" data-testid="label-phone">
                        Phone Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="tel"
                          placeholder="Enter your phone number" 
                          {...field}
                          data-testid="input-phone"
                          className="px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent custom-input"
                        />
                      </FormControl>
                      <FormMessage className="min-h-5" data-testid="error-phone" />
                    </FormItem>
                  )}
                />

                {/* Guide Type Radio Buttons */}
                <FormField
                  control={form.control}
                  name="guideType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-luxury-text" data-testid="label-guidetype">
                        Guide Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-2"
                          data-testid="radiogroup-guidetype"
                        >
                          <div className="flex items-center space-x-2 p-2 rounded-lg custom-radio-container hover:bg-muted/50 transition-colors">
                            <RadioGroupItem 
                              value="Relocation Guide" 
                              id="relocation-guide"
                              data-testid="radio-relocation"
                            />
                            <label 
                              htmlFor="relocation-guide"
                              className="flex-1 text-sm font-medium cursor-pointer form-luxury-text"
                              data-testid="label-relocation"
                            >
                              Relocation Guide
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 p-2 rounded-lg custom-radio-container hover:bg-muted/50 transition-colors">
                            <RadioGroupItem 
                              value="First Time Home Buyer Guide" 
                              id="firsttime-guide"
                              data-testid="radio-firsttime"
                            />
                            <label 
                              htmlFor="firsttime-guide"
                              className="flex-1 text-sm font-medium cursor-pointer form-luxury-text"
                              data-testid="label-firsttime"
                            >
                              First Time Home Buyer Guide
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 p-2 rounded-lg custom-radio-container hover:bg-muted/50 transition-colors">
                            <RadioGroupItem 
                              value="Sellers Guide" 
                              id="sellers-guide"
                              data-testid="radio-sellers"
                            />
                            <label 
                              htmlFor="sellers-guide"
                              className="flex-1 text-sm font-medium cursor-pointer form-luxury-text"
                              data-testid="label-sellers"
                            >
                              Sellers Guide
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="min-h-5" data-testid="error-guidetype" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full font-semibold py-3 px-4 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card shadow-sm"
                  style={{ backgroundColor: '#0D1A3A', color: 'white', fontFamily: "'Playfair Display', serif" }}
                  disabled={submitFormMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitFormMutation.isPending ? "Submitting..." : "Access Free Guide"}
                </Button>

                {/* Privacy and Opt-in Notices */}
                <div className="space-y-2 pt-3 border-t border-border" data-testid="section-privacy">
                  <p className="text-xs form-luxury-text" data-testid="text-privacy-notice">
                    <strong>Privacy Notice:</strong> Your information is secure and will never be shared with third parties.
                  </p>
                  
                  <p className="text-xs form-luxury-text" data-testid="text-email-optin">
                    <strong>Email Opt-in:</strong> By submitting this form, you agree to receive helpful real estate tips and market updates. You can unsubscribe at any time.
                  </p>
                  
                  <p className="text-xs form-luxury-text" data-testid="text-sms-optin">
                    <strong>SMS Opt-in:</strong> You may receive occasional text messages with important market updates. Standard message rates apply. Reply STOP to opt out.
                  </p>
                </div>
              </form>
            </Form>

            {/* Success Message */}
            {showSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md" data-testid="message-success">
                <div className="flex">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Success! Your guide will be sent to your email in a few minutes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {showError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md" data-testid="message-error">
                <div className="flex">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      There was an error submitting your form. Please try again.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
