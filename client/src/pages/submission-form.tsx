import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertFormSubmissionSchema, type InsertFormSubmission } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useConfiguration } from "@/hooks/useConfiguration";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { CheckCircle, XCircle, X } from "lucide-react";
import { PreviewListener } from "@/components/PreviewListener";
import defaultAgentAvatar from '@assets/LeadsByNova Favicon_White Transparent_1759371035489.png';
import logo from '@assets/LeadsByNova Favicon_White Transparent (Small)_1759772687413.png';

// SHA-256 hash helper for disclosure text verification
async function sha256Hex(str: string): Promise<string> {
  const data = new TextEncoder().encode(str.normalize());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function SubmissionForm() {
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { getConfigValue } = useConfiguration();

  // Build disclosure text dynamically from config - MUST match what's displayed
  const smsOptinText = getConfigValue('sms_optin_text', 'SMS Opt-in (Program: LeadsByNova™ Platform Updates & Promotions): By providing your phone number and submitting this form, you agree to receive marketing and informational text messages from LeadsByNova™ regarding product updates, feature releases, and promotional offers at the number provided. Consent is not a condition of purchase. Message frequency may vary. Message & data rates may apply. Reply STOP to opt out or HELP for help.');
  const emailOptinText = getConfigValue('email_optin_text', 'Email Opt-in (Program: LeadsByNova™ Platform Updates & Promotions): By submitting this form, you agree to receive marketing emails from LeadsByNova™, including product announcements, feature updates, special offers, and educational content designed to help you grow your business. You can unsubscribe at any time.');
  const DISCLOSURE_TEXT = `${smsOptinText} See our Privacy Policy and Terms.\n\n${emailOptinText} See our Privacy Policy and Terms.`;
  const [showError, setShowError] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    document.title = "LeadsByNova™";
  }, []);

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
      setShowError(false);
      setIsRedirecting(true);
      
      const { fullName, email, phone, guideType } = vars;
      
      // Store form data in sessionStorage for chat component to access
      sessionStorage.setItem('userFullName', fullName);
      sessionStorage.setItem('userEmail', email);
      sessionStorage.setItem('userPhone', phone);
      sessionStorage.setItem('userGuideType', guideType);
      
      
      // Redirect after 2 seconds to chat page
      setTimeout(() => {
        setLocation('/chat');
      }, 2000);
    },
    onError: (error) => {
      setShowError(true);
      setIsRedirecting(false);
      toast({
        title: getConfigValue('error_toast_title', 'Error'),
        description: getConfigValue('error_toast_description', 'There was an error submitting your form. Please try again.'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertFormSubmission) => {
    setShowError(false);
    setIsRedirecting(false);
    
    // Capture source URL from browser
    const sourceUrl = window.location.href;
    
    // Compute SHA-256 hash of disclosure text
    const disclosureHash = await sha256Hex(DISCLOSURE_TEXT.trim());
    
    // Include compliance metadata with form submission
    submitFormMutation.mutate({
      ...data,
      sourceUrl,
      disclosureHash,
      consentText: DISCLOSURE_TEXT.trim(),
    } as any);
  };

  return (
    <div className="min-h-screen">
      <PreviewListener />
      <div className="w-full max-w-md mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-4">
          {/* Logo */}
          <div className="relative mb-3">
            <div className="w-32 h-32 mx-auto flex items-center justify-center">
              <img 
                src={getConfigValue('main_agent_headshot_url', logo)} 
                alt="LeadsByNova™" 
                className="w-24 h-24 object-contain"
                data-testid="img-logo"
                data-config-key="main_agent_headshot_url"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-2">
            {getConfigValue('headline_logo_position', 'before') === 'before' && getConfigValue('page_headline_image') && (
              <img 
                src={getConfigValue('page_headline_image')} 
                alt="Headline logo" 
                className="h-8 w-auto object-contain"
                data-config-key="page_headline_image"
              />
            )}
            <h1 
              className="text-3xl font-bold text-white whitespace-nowrap" 
              style={{ fontFamily: "var(--font-sans)" }} 
              data-testid="text-main-title"
              data-config-key="page_headline"
            >
              {getConfigValue('page_headline', 'Experience LeadsByNova™')}
            </h1>
            {getConfigValue('headline_logo_position', 'before') === 'after' && getConfigValue('page_headline_image') && (
              <img 
                src={getConfigValue('page_headline_image')} 
                alt="Headline logo" 
                className="h-8 w-auto object-contain"
                data-config-key="page_headline_image"
              />
            )}
          </div>
          
          <p 
            className="text-lg font-semibold text-white/90 mb-1" 
            style={{ fontFamily: "var(--font-sans)" }} 
            data-testid="text-tagline"
            data-config-key="page_subheader"
          >
            {getConfigValue('page_subheader', 'Automate Connections - Accelerate Growth')}
          </p>
          
          <p 
            className="text-xs text-white/80 mb-0" 
            style={{ fontFamily: "var(--font-sans)" }} 
            data-testid="text-description"
            data-config-key="page_header_description"
          >
            {getConfigValue('page_header_description', 'Step inside the all-in-one lead automation platform trusted by modern businesses. See how automation turns your time into growth.')}
          </p>
          
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border border-border bg-card" data-testid="card-form">
          <CardContent className="p-4">
            <div className="mb-3">
              <h2 
                className="text-base font-semibold mb-1" 
                style={{ fontFamily: "var(--font-sans)" }} 
                data-testid="text-form-title"
                data-config-key="submission_form_header"
              >
                {getConfigValue('submission_form_header', 'Create Your Free Access Account')}
              </h2>
              <p 
                className="text-xs" 
                style={{ fontFamily: "var(--font-sans)" }} 
                data-testid="text-form-description"
                data-config-key="submission_form_description"
              >
                {getConfigValue('submission_form_description', "Unlock a guided experience that shows you exactly how LeadsByNova™ captures, qualifies, and delivers leads — automatically.")}
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
                      <FormLabel style={{ fontFamily: "var(--font-sans)" }} data-testid="label-fullname">
                        {getConfigValue('fullname_label', 'Full Name')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={getConfigValue('name_placeholder', 'Enter your full name')} 
                          {...field}
                          data-testid="input-fullname"
                          className="px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent custom-input"
                          style={{ fontFamily: "var(--font-sans)" }}
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
                      <FormLabel style={{ fontFamily: "var(--font-sans)" }} data-testid="label-email">
                        {getConfigValue('email_label', 'Email Address')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder={getConfigValue('email_placeholder', 'Enter your email address')} 
                          {...field}
                          data-testid="input-email"
                          className="px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent custom-input"
                          style={{ fontFamily: "var(--font-sans)" }}
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
                  render={({ field }) => {
                    // Format phone number as (xxx) xxx-xxxx
                    const formatPhoneNumber = (value: string) => {
                      if (!value) return value;
                      
                      // Remove all non-digits
                      const phoneNumber = value.replace(/[^\d]/g, '');
                      
                      // Format based on length
                      if (phoneNumber.length < 4) {
                        return phoneNumber;
                      } else if (phoneNumber.length < 7) {
                        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
                      } else {
                        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "var(--font-sans)" }} data-testid="label-phone">
                          {getConfigValue('phone_label', 'Phone Number')} <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder={getConfigValue('phone_placeholder', '(555) 123-4567')} 
                            value={field.value || ''}
                            onChange={(e) => {
                              const formattedValue = formatPhoneNumber(e.target.value);
                              field.onChange(formattedValue);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            data-testid="input-phone"
                            className="px-3 py-2 focus:ring-2 focus:ring-ring focus:border-transparent custom-input"
                            style={{ fontFamily: "var(--font-sans)" }}
                          />
                        </FormControl>
                        <FormMessage className="min-h-5" data-testid="error-phone" />
                      </FormItem>
                    );
                  }}
                />

                {/* Guide Selections Radio Buttons */}
                <FormField
                  control={form.control}
                  name="guideType"
                  render={({ field }) => {
                    // Get guide options from config
                    const guideOptions = [
                      getConfigValue('guide_option_1', "I'm a Business Owner"),
                      getConfigValue('guide_option_2', "I'm a Sales Agent"),
                      getConfigValue('guide_option_3', "I'm a Marketing Professional"),
                      getConfigValue('guide_option_4', "I'm Just Exploring")
                    ].filter(option => option && option.trim() !== '');

                    return (
                      <FormItem>
                        <FormLabel 
                          style={{ fontFamily: "var(--font-sans)" }} 
                          data-testid="label-guidetype"
                          data-config-key="guide_selections_title"
                        >
                          {getConfigValue('guide_selections_title', 'Account Type')} <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-2"
                            data-testid="radiogroup-guidetype"
                          >
                            {guideOptions.map((option, index) => {
                              const id = `guide-option-${index + 1}`;
                              return (
                                <div key={id} className="flex items-center space-x-2 p-2 rounded-lg custom-radio-container hover:bg-muted/50 transition-colors">
                                  <RadioGroupItem 
                                    value={option} 
                                    id={id}
                                    data-testid={`radio-guide-option-${index + 1}`}
                                  />
                                  <label 
                                    htmlFor={id}
                                    className="flex-1 text-sm font-medium cursor-pointer"
                                    style={{ fontFamily: "var(--font-sans)" }}
                                    data-testid={`label-guide-option-${index + 1}`}
                                    data-config-key={`guide_option_${index + 1}`}
                                  >
                                    {option}
                                  </label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage className="min-h-5" data-testid="error-guidetype" />
                      </FormItem>
                    );
                  }}
                />

                {/* Required field notice */}
                <p className="text-[9px] text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-required-notice">
                  *required field
                </p>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full font-semibold py-3 px-4 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card shadow-sm bg-primary text-primary-foreground"
                  style={{ fontFamily: "var(--font-sans)" }}
                  disabled={submitFormMutation.isPending || isRedirecting}
                  data-testid="button-submit"
                  data-config-key="form_button_text"
                >
                  {isRedirecting ? 'Redirecting to Chat...' : submitFormMutation.isPending ? 'Submitting...' : getConfigValue('form_button_text', 'Experience LeadsByNova™')}
                </Button>

                {/* Form footer notice */}
                <p 
                  className="text-xs text-center text-muted-foreground" 
                  style={{ fontFamily: "var(--font-sans)" }} 
                  data-testid="text-free-notice"
                  data-config-key="form_footer_text"
                >
                  {getConfigValue('form_footer_text', 'No Credit Card Required - See How It Works 100% Free')}
                </p>

                {/* Legal Notices */}
                <div className="space-y-2 pt-3 border-t border-border" data-testid="section-privacy">
                  <h3 className="text-xs font-semibold mb-2" style={{ fontFamily: "var(--font-sans)" }}>Legal Notices</h3>
                  
                  <p className="text-[9px]" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-privacy-notice">
                    <strong>Privacy Notice:</strong> Your information is secure and will never be shared with third parties.
                  </p>
                  
                  <p className="text-[9px]" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-sms-optin" data-config-key="sms_optin_text">
                    {smsOptinText} See our{' '}
                    {getConfigValue('sms_privacy_url', '') ? (
                      <a
                        href={getConfigValue('sms_privacy_url', '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-600"
                        data-testid="link-sms-privacy-policy"
                      >
                        Privacy Policy
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPrivacyPolicy(true)}
                        className="underline hover:text-blue-600 cursor-pointer"
                        data-testid="button-privacy-policy"
                      >
                        Privacy Policy
                      </button>
                    )}
                    {' '}and{' '}
                    {getConfigValue('sms_terms_url', '') ? (
                      <a
                        href={getConfigValue('sms_terms_url', '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-600"
                        data-testid="link-sms-terms"
                      >
                        Terms
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="underline hover:text-blue-600 cursor-pointer"
                        data-testid="button-terms"
                      >
                        Terms
                      </button>
                    )}.
                  </p>
                  
                  <p className="text-[9px]" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-email-optin" data-config-key="email_optin_text">
                    {emailOptinText} See our{' '}
                    {getConfigValue('email_privacy_url', '') ? (
                      <a
                        href={getConfigValue('email_privacy_url', '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-600"
                        data-testid="link-email-privacy-policy"
                      >
                        Privacy Policy
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPrivacyPolicy(true)}
                        className="underline hover:text-blue-600 cursor-pointer"
                        data-testid="button-privacy-policy-email"
                      >
                        Privacy Policy
                      </button>
                    )}
                    {' '}and{' '}
                    {getConfigValue('email_terms_url', '') ? (
                      <a
                        href={getConfigValue('email_terms_url', '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-600"
                        data-testid="link-email-terms"
                      >
                        Terms
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="underline hover:text-blue-600 cursor-pointer"
                        data-testid="button-terms-email"
                      >
                        Terms
                      </button>
                    )}.
                  </p>
                </div>
              </form>
            </Form>

            {/* Error Message */}
            {showError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md" data-testid="message-error">
                <div className="flex">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {getConfigValue('form_error_message', 'There was an error submitting your form. Please try again.')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="modal-privacy-policy">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "var(--font-sans)" }}>
                Privacy Policy
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  data-testid="button-close-privacy"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="space-y-4 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
            <p className="text-muted-foreground">Last Updated: 10/6/2025</p>
            
            <div>
              <h3 className="font-semibold text-base mb-2">1. Introduction</h3>
              <p className="text-muted-foreground">
                Infinity Digital Studios, LLC ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">2. Information We Collect</h3>
              <p className="text-muted-foreground mb-2">We may collect the following types of information:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Personal information such as name, email address, phone number, and company details that you voluntarily provide when contacting us</li>
                <li>Information about your business and project requirements</li>
                <li>Log data and usage information when you visit our website</li>
                <li>Information collected through cookies and similar technologies</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">3. How We Use Your Information</h3>
              <p className="text-muted-foreground mb-2">We may use the information we collect for various purposes, including:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Providing, maintaining, and improving our services</li>
                <li>Responding to your requests and inquiries</li>
                <li>Communicating with you about our services</li>
                <li>Analyzing website usage to enhance user experience</li>
                <li>Complying with legal obligations</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">4. Sharing Your Information</h3>
              <p className="text-muted-foreground mb-2">We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>With service providers who perform services on our behalf</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>In connection with a business transfer, such as a merger or acquisition</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">5. Data Security</h3>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">6. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have any questions or concerns about our Privacy Policy, please contact us at sales@infinitydigitalstudios.com.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="modal-terms">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "var(--font-sans)" }}>
                Terms of Service
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  data-testid="button-close-terms"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="space-y-4 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
            <p className="text-muted-foreground">Last Updated: 10/6/2025</p>
            
            <div>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing or using the services provided by Infinity Digital Studios, LLC ("we," "our," or "us"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">2. Services</h3>
              <p className="text-muted-foreground">
                We provide digital design and visualization services for the flooring industry, including room scene creation, digital asset manipulation, and related services. We reserve the right to modify, suspend, or discontinue our services at any time without notice.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">3. Client Responsibilities</h3>
              <p className="text-muted-foreground mb-2">As a client, you are responsible for:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Providing accurate and complete information for your projects</li>
                <li>Ensuring you have appropriate rights to all materials provided to us</li>
                <li>Reviewing and approving the final deliverables</li>
                <li>Making timely payments as agreed</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">4. Intellectual Property</h3>
              <p className="text-muted-foreground">
                Upon full payment, you will receive a license to use the deliverables for your business purposes. We retain ownership of all working files and the right to use the work in our portfolio unless otherwise specified in a separate agreement.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">5. Payment Terms</h3>
              <p className="text-muted-foreground">
                Payment terms will be specified in your project proposal or agreement. Generally, we require a deposit before beginning work, with the balance due upon completion. Late payments may incur additional fees.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">6. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                We strive to provide high-quality services, but we cannot guarantee specific results. To the fullest extent permitted by law, our liability is limited to the amount paid for the specific services in question.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">7. Governing Law</h3>
              <p className="text-muted-foreground">
                These Terms of Service shall be governed by and construed in accordance with the laws of the State of Georgia, without regard to its conflict of law provisions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">8. Contact Information</h3>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at sales@infinitydigitalstudios.com.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                onClick={() => setShowTerms(false)}
                className="px-6"
                data-testid="button-close-terms-bottom"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
