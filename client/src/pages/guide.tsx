import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/BookingModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Sparkles, 
  MessageSquare, 
  Mail, 
  PieChart, 
  Calendar, 
  Shield, 
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Zap,
  Target,
  Users,
  TrendingUp,
  Clock,
  Phone,
  BarChart3,
  Brain,
  FileCheck,
  Settings
} from "lucide-react";
import logo from '@assets/Leads By Nova Single Line Logo - Gradient_1759792360969.png';
import gptScreenshot from '@assets/gpt-assistant-screenshot.png';
import hotLeadNotification from '@assets/hot-lead-notification.png';
import dashboardScreenshot from '@assets/dashboard-screenshot.png';

export default function Guide() {
  const [, setLocation] = useLocation();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    document.title = "LeadsByNova™";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover how LeadsByNova™ automates lead capture, qualification, and nurturing with AI-powered chat, smart email follow-ups, and real-time pipeline tracking. The complete guide to modern lead generation.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Discover how LeadsByNova™ automates lead capture, qualification, and nurturing with AI-powered chat, smart email follow-ups, and real-time pipeline tracking. The complete guide to modern lead generation.';
      document.head.appendChild(meta);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'LeadsByNova™ - AI-Powered Lead Generation Platform');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      meta.content = 'LeadsByNova™ - AI-Powered Lead Generation Platform';
      document.head.appendChild(meta);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Automate your lead generation with AI chat, smart follow-ups, and real-time pipeline tracking. See how LeadsByNova™ transforms leads into customers.');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      meta.content = 'Automate your lead generation with AI chat, smart follow-ups, and real-time pipeline tracking. See how LeadsByNova™ transforms leads into customers.';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#1e40af] text-white py-20 px-4" data-testid="section-hero">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <img 
              src={logo} 
              alt="LeadsByNova™ Logo" 
              className="w-full max-w-2xl mx-auto object-contain"
              data-testid="img-hero-logo"
            />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white" data-testid="text-hero-title">
            Welcome!
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-blue-100" data-testid="text-hero-subtitle">
            You've Just Experienced LeadsByNova™
          </h2>
          
          <p className="text-lg md:text-xl max-w-4xl mx-auto mb-6 text-white/90 leading-relaxed" data-testid="text-hero-description-1">
            From the moment you clicked that link to the email that brought you here, you've already walked through the same process your future leads will take.
          </p>
          
          <p className="text-lg md:text-xl max-w-4xl mx-auto mb-6 text-white/90 leading-relaxed" data-testid="text-hero-description-2">
            LeadsByNova™ turns your expertise into shareable guides that attract your ideal audience — then asks questions relevant to your business to learn more about their goals and needs.
          </p>
          
          <p className="text-lg md:text-xl max-w-4xl mx-auto mb-6 text-white/90 leading-relaxed" data-testid="text-hero-description-3">
            There's a saying: <em>"People don't like to be sold to, but they love to buy."</em>
          </p>
          
          <p className="text-lg md:text-xl max-w-4xl mx-auto text-white/90 leading-relaxed" data-testid="text-hero-description-4">
            That's exactly why this works — your guide builds trust and starts the relationship naturally, long before a sales pitch is ever needed.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white" data-testid="section-how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#1e40af]" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-how-it-works-title">
              How It Works
            </h2>
            <p className="text-xl text-[#1e40af] max-w-3xl mx-auto" data-testid="text-how-it-works-subtitle">
              A seamless, automated journey from first contact to qualified lead
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: Initial Text Content */}
            <div className="flex-1 space-y-4">
              <p className="text-lg text-[#1e40af] leading-relaxed">
                You saw a link, clicked it, filled out a quick form, participated in our simulated chat, and received an email that brought you here.
                That seamless process is exactly what LeadsByNova™ builds for your business — automatically capturing leads, asking relevant questions to learn about their needs, and sending everything straight to you so you can focus your time and energy on what you do best, building your business.
              </p>
              
              <p className="text-lg text-[#1e40af] leading-relaxed">
                The real magic starts with the free guides you'll create — packed with value that draws people in because they're actually helpful, not a sales pitch.
                LeadsByNova™ helps you turn your own expertise into professional, value-packed guides — the kind that genuinely help your audience while positioning you as the go-to expert in your field. These guides become the magnet that draws people in from ads, social posts, or DMs.
              </p>
            </div>

            {/* Right: 2x2 Grid of Steps in Blue Gradient Container (Smaller) */}
            <div className="lg:w-[46%]">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5">
                <div className="grid grid-cols-2 gap-3">
                  {/* Step 1 */}
                  <Card className="border-2 border-white/80 hover:border-[#1e40af] transition-all hover:shadow-lg bg-white" data-testid="card-step-1">
                    <CardHeader className="text-center pb-2 px-2 pt-3">
                      <div className="mx-auto mb-2 w-10 h-10 bg-gradient-to-br from-[#1e40af] to-blue-600 rounded-full flex items-center justify-center">
                        <FileCheck className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-[#1e40af] text-sm" data-testid="text-step-1-title">1. Form Submission</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-2 pb-3">
                      <p className="text-center text-gray-600 text-xs leading-tight" data-testid="text-step-1-description">
                        Visitor fills out your custom lead form, providing basic contact details that unlock your guide and trigger the entire automated process.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Step 2 */}
                  <Card className="border-2 border-white/80 hover:border-[#1e40af] transition-all hover:shadow-lg bg-white" data-testid="card-step-2">
                    <CardHeader className="text-center pb-2 px-2 pt-3">
                      <div className="mx-auto mb-2 w-10 h-10 bg-gradient-to-br from-[#1e40af] to-blue-600 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-[#1e40af] text-sm" data-testid="text-step-2-title">2. Automated Chat Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-2 pb-3">
                      <p className="text-center text-gray-600 text-xs leading-tight" data-testid="text-step-2-description">
                        The simulated chat asks simple, focused questions that give you meaningful details about each lead and how they relate to your business.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Step 3 */}
                  <Card className="border-2 border-white/80 hover:border-[#1e40af] transition-all hover:shadow-lg bg-white" data-testid="card-step-3">
                    <CardHeader className="text-center pb-2 px-2 pt-3">
                      <div className="mx-auto mb-2 w-10 h-10 bg-gradient-to-br from-[#1e40af] to-blue-600 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-[#1e40af] text-sm" data-testid="text-step-3-title">3. Automated Emails</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-2 pb-3">
                      <p className="text-center text-gray-600 text-xs leading-tight" data-testid="text-step-3-description">
                        The system automatically sends your guide to the lead and notifies you with their contact details and key insights for instant response.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Step 4 */}
                  <Card className="border-2 border-white/80 hover:border-[#1e40af] transition-all hover:shadow-lg bg-white" data-testid="card-step-4">
                    <CardHeader className="text-center pb-2 px-2 pt-3">
                      <div className="mx-auto mb-2 w-10 h-10 bg-gradient-to-br from-[#1e40af] to-blue-600 rounded-full flex items-center justify-center">
                        <PieChart className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-[#1e40af] text-sm" data-testid="text-step-4-title">4. Pipeline Management</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-2 pb-3">
                      <p className="text-center text-gray-600 text-xs leading-tight" data-testid="text-step-4-description">
                        Track leads through customizable stages with real-time updates and analytics
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content Below Both */}
          <div className="space-y-4 mt-4">
            <p className="text-lg text-[#1e40af] leading-relaxed">
              Even better, each guide does more than attract — it connects. The built-in chat asks thoughtful, business-specific questions that let your future clients share what they're looking for, what they care about, and what challenges they're facing. This gives you the insight to shape a tailored plan in advance — so your first conversation starts with solutions, not questions.
            </p>
            
            <p className="text-lg text-[#1e40af] leading-relaxed">
              Now, let's pull back the curtain and walk through how it all comes together — what we'll gather from you, how we'll build your personalized system, and how that system turns your expertise into a consistent flow of high-quality, relationship-ready leads.
            </p>
          </div>
        </div>
      </section>

      {/* Step 1 - Creating Your Guide Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white relative" data-testid="section-creating-guide" style={{
        backgroundImage: `linear-gradient(to right, rgba(226, 232, 240, 0.65) 1px, transparent 1px), linear-gradient(to bottom, rgba(226, 232, 240, 0.65) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#1e40af]" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-creating-guide-title">
              Creating Your Guide
            </h2>
            <p className="text-lg text-[#1e40af]/90" data-testid="text-creating-guide-subtitle">
              The First Step in your onboarding process
            </p>
          </div>

          <div className="relative">
            {/* Floating GPT Screenshot on the left */}
            <div className="mb-6 w-full md:w-[480px] lg:w-[520px] md:float-left md:mr-20">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5">
                <img 
                  src={gptScreenshot} 
                  alt="Infinity AdvisorGPT Assistant Interface" 
                  className="w-full h-auto rounded-lg shadow-md"
                  data-testid="img-gpt-assistant"
                />
              </div>
            </div>

            {/* Text content that wraps around the image */}
            <div className="space-y-3 flex flex-col">
              <p className="text-base text-[#1e40af] leading-relaxed">
                Your guide is where the magic begins — it's the first step in turning your expertise into a lead-generating asset that works for you. Think of it as your opportunity to share value, not sell. You'll be giving potential clients something genuinely useful while positioning yourself as the go-to expert in your space.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                For example:
              </p>

              <ul className="space-y-2 ml-6">
                <li className="text-base text-[#1e40af] leading-relaxed list-disc">
                  If you're a real estate agent, you might create a guide on "Top 10 Reasons to Relocate to [Your City]."
                </li>
                <li className="text-base text-[#1e40af] leading-relaxed list-disc">
                  If you own a hair salon, maybe it's "25 Must-Know Hair Care Tips Every Client Should Follow."
                </li>
                <li className="text-base text-[#1e40af] leading-relaxed list-disc">
                  Or if you're a landscaper, it could be "10 Simple Ways to Keep Your Yard Beautiful Year-Round."
                </li>
              </ul>

              <p className="text-base text-[#1e40af] leading-relaxed">
                No matter your industry, the goal is the same — provide something helpful, engaging, and relevant that builds trust and starts a connection before the first conversation ever happens.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                To make the process simple, we'll send you a step-by-step guide template that walks you through exactly what we need from you to create your custom guide. Inside, you'll find clear prompts and spaces to share your ideas, insights, and expertise — and to make it even easier, we've built in a custom GPT assistant you can chat with for help, clarification, or creative suggestions as you complete it.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                By the time you're finished, you'll have given us everything we need to craft a polished, professional piece of content that attracts the right people and starts building relationships automatically.
              </p>

              {/* Attribution text at bottom, aligned with image bottom */}
              <p className="text-sm text-[#1e40af]/70 italic mt-auto pt-4">
                Infinity AdvisorGPT is the property of our parent company - Infinity Digital Studios, LLC.
              </p>
            </div>

            {/* Clear the float */}
            <div className="clear-both"></div>
          </div>
        </div>
      </section>

      {/* Turning Your Guide Into a Lead Machine */}
      <section className="py-20 px-4 bg-white" data-testid="section-lead-machine">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#1e40af]" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-lead-machine-title">
              Turning Your Guide Into a Lead Machine
            </h2>
            <p className="text-lg text-[#1e40af]/90 max-w-5xl mx-auto" data-testid="text-lead-machine-subtitle">
              Where we turn your free knowledge based resource into a hands-free, automated lead engine that attracts, captures, and connects while you focus on your business.
            </p>
          </div>

          <div>
            {/* Hot lead notification email image on the right */}
            <div className="float-right ml-20 mb-6 w-full md:w-[480px] lg:w-[520px]">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 flex items-center justify-center">
                <img 
                  src={hotLeadNotification} 
                  alt="Hot lead notification email showing contact information, chat qualification details, and scheduled call appointment" 
                  className="w-full h-auto rounded-lg shadow-lg"
                  data-testid="img-hot-lead-notification"
                />
              </div>
            </div>

            {/* Text content that wraps around the image */}
            <div className="space-y-3">
              <p className="text-base text-[#1e40af] leading-relaxed">
                Once your custom guide is ready, we'll connect it to a simple but powerful automated system that delivers it to your audience and starts collecting valuable insights about their interests.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                Here's how it works:
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                1. Sharing Your Link
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                You'll receive a custom link that can be shared anywhere — in an online ad, a social post, or even a direct message. When someone clicks that link, they're taken to your Submission Form Page, where they enter their basic information to access your free guide.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                If you'd like to run ads, we'll also help you create and deploy your campaign through Meta or Google Ads, ensuring your guide reaches the right audience and performs effectively.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                To keep everything fully compliant, we've incorporated legally required opt-in language for both SMS and email directly into the fine print of your submission form. By submitting the form, the user agrees to receive emails and SMS communication from you in the future — giving you the necessary opt-in to include them in any internal email or text campaigns you may already be running, or plan on running in the future.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                2. The Simulated Chat Experience
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                After clicking to access the guide, they're redirected to a short, web-based simulated chat — designed to look and feel like a real conversation, but fully automated. Rather than typing responses, users simply select from a list of multiple-choice answers that help you learn more about their goals, interests, or needs related to your business.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                Participation in the chat is optional, as required by law. If someone chooses not to participate, the system still captures their name, email, and phone number (with the phone field being optional at your request). If they do participate, however, the chat collects additional, business-relevant details — and at the end, it automatically prompts them to schedule an appointment.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                When a user schedules, you'll instantly receive a notification email (like the one shown here) with all the critical details: their contact information, chat responses, and scheduled appointment time — giving you a complete, ready-to-act profile of your new hot lead. The same information is also sent to your dashboard for tracking and follow-up.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                3. Delivering the Guide
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                Once they finish the chat (or skip it), the system immediately sends your guide straight to their inbox — giving them instant access while ensuring you have a verified, trackable lead in your dashboard.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                The result is a professional, compliant, and fully automated system that not only attracts attention but also starts building relationships — capturing interest, gathering insights, and setting appointments without lifting a finger.
              </p>
            </div>

            {/* Clear the float */}
            <div className="clear-both"></div>
          </div>
        </div>
      </section>

      {/* Inside Your Dashboard */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-200 to-slate-100" data-testid="section-dashboard" style={{
        backgroundImage: 'linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#1e40af]" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-dashboard-title">
              Inside Your Dashboard
            </h2>
            <p className="text-lg text-[#1e40af]/90 max-w-4xl mx-auto" data-testid="text-dashboard-subtitle">
              Once your LeadsByNova™ system is live, everything flows into one place — your Admin Dashboard. This is your control center, where you can monitor daily activity, manage agents, assign and organize leads, track consent, and keep your entire business running smoothly from one easy-to-use interface.
            </p>
          </div>

          <div>
            {/* Dashboard screenshot on the right */}
            <div className="float-right ml-20 mb-6 w-full md:w-[480px] lg:w-[520px]">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 flex items-center justify-center">
                <img 
                  src={dashboardScreenshot} 
                  alt="LeadsByNova™ Admin Dashboard showing pipeline view with lead cards, daily schedule, and sidebar navigation" 
                  className="w-full h-auto rounded-lg shadow-lg"
                  data-testid="img-dashboard-screenshot"
                />
              </div>
            </div>

            {/* Text content that wraps around the image */}
            <div className="space-y-3">
              <p className="text-base text-[#1e40af] leading-relaxed">
                Let's walk through each section so you know exactly how it all works:
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                1. Daily Planner
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                Your Daily Planner is where you'll see all calendar events for the current day — including appointments generated through your LeadsByNova™ system or ones you've added manually. You can easily add events directly to this section, whether they're client meetings, business reminders, or even personal notes like "pick up a gallon of milk on the way home." There's also a Notes area for jotting down thoughts, ideas, or to-do items throughout the day.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                2. Pipeline View
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                The Pipeline View gives you a clear visual overview of where every lead is in your process. Each lead's status — such as New, Active, Pre-Qualified, or Archived — can be updated right from their Lead Card using a simple dropdown menu. This view helps you instantly identify which leads need attention, which are moving forward, and which may require follow-up or nurturing.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                3. Agents
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                The Agents dropdown lists every agent connected to your system. New agents can be added — or existing ones managed — through the Configuration section, accessible via the button at the bottom of the sidebar. Only admins have access to the Configuration area, ensuring control and data integrity remain secure.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                4. Calendar
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                The Calendar tab provides a full monthly view of all scheduled events. This includes appointments created through your lead system as well as any events you add manually. You can easily add new events at any time using the Add Event button, helping you and your team stay organized and on track.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                5. New Leads
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                This is where every new lead first appears. Each new contact is displayed as a Lead Card, showing their details, simulated chat responses (if they participated), and any appointments they scheduled. From here, admins can assign leads to specific agents with just a few clicks, ensuring timely follow-up by the right person.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                6. Pre-Qualified
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                The Pre-Qualified section is designed for industries that require extra screening — such as real estate, automotive, or finance. This area separates leads that meet key criteria or answered certain questions during the simulated chat, allowing agents to prioritize the most promising opportunities.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                7. Active Leads
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                The Active Leads section houses all ongoing, in-progress leads currently being worked by you or your team. It's your hub for tracking conversations, appointments, and potential deals as they develop.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                8. Archived
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                The Archived section is where you can move leads that have gone cold but still have future potential. These leads remain safely stored for re-engagement campaigns, making it easy to nurture them later through email or SMS follow-ups.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                9. Trash
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                The Trash section holds any leads that have been marked as "no good" — meaning they're not a fit for your services or should no longer be pursued. While removed from active view, these records can still be referenced later if needed, ensuring nothing is lost accidentally.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold">
                10. Consent Forms
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                The Consent Forms section securely stores every opt-in record for SMS and email communication. These records remain accessible even if a lead is deleted or moved to Trash, ensuring you always have verified documentation of consent for compliance and internal campaign use.
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed font-semibold mt-6">
                In Short
              </p>

              <p className="text-base text-[#1e40af] leading-relaxed">
                Your Admin Dashboard gives you complete visibility and control over your entire operation — from scheduling and lead management to tracking and compliance. Every feature is designed to keep your workflow efficient, your team connected, and your business running smoothly — all in one place.
              </p>
            </div>

            {/* Clear the float */}
            <div className="clear-both"></div>
          </div>
        </div>
      </section>

      {/* From Setup to Launch — How Onboarding Works */}
      <section className="py-20 px-4 bg-white" data-testid="section-onboarding">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#1e40af]" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-onboarding-title">
              From Setup to Launch<br />
              How Onboarding Works
            </h2>
            <p className="text-lg text-[#1e40af]/90 max-w-4xl mx-auto mb-8" data-testid="text-onboarding-subtitle">
              Once you're ready to get started, our team walks you through every step to make sure your LeadsByNova™ system is built right and ready to perform. You don't have to worry about the tech — we handle the setup, guide creation, and integrations so you can focus on what you do best.
            </p>
            <p className="text-lg text-[#1e40af] font-semibold" data-testid="text-onboarding-intro">
              Here's what onboarding looks like:
            </p>
          </div>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-8 text-center" data-testid="step-kickoff">
              <h3 className="text-2xl font-bold text-[#1e40af] mb-4">Step 1: Kickoff & Discovery</h3>
              <p className="text-base text-[#1e40af]/90 max-w-3xl mx-auto leading-relaxed">
                After signing up, we'll send you a short onboarding form to gather key details about your business — things like your logo, brand colors, industry focus, and any services or offers you want highlighted. From there, we'll schedule a quick kickoff call to confirm your goals, review your system options, and make sure everything aligns with your vision.
              </p>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center">
              <ArrowDown className="h-8 w-8 text-[#1e40af]" data-testid="icon-arrow-down-1" />
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-8 text-center" data-testid="step-guide-creation">
              <h3 className="text-2xl font-bold text-[#1e40af] mb-4">Step 2: Guide Creation</h3>
              <p className="text-base text-[#1e40af]/90 max-w-3xl mx-auto leading-relaxed">
                Next, we'll send you your step-by-step guide template — complete with your custom GPT assistant built in to help you fill it out. This template walks you through everything we need to create your expert guide, so we can transform it into your lead magnet. Once completed, our team will professionally design and finalize your guide for launch.
              </p>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center">
              <ArrowDown className="h-8 w-8 text-[#1e40af]" data-testid="icon-arrow-down-2" />
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-8" data-testid="step-system-setup">
              <h3 className="text-2xl font-bold text-[#1e40af] mb-6 text-center">Step 3: System Setup</h3>
              <div className="max-w-xl mx-auto">
                <p className="text-base text-[#1e40af]/90 leading-relaxed mb-4 text-center">
                  This is where we build your entire LeadsByNova™ system:
                </p>
                <ul className="text-base text-[#1e40af]/90 leading-relaxed space-y-3 list-disc pl-5">
                  <li>Your branded Submission Form Page</li>
                  <li>The Simulated Chat Experience customized for your business</li>
                  <li>The Automated Email Delivery system that sends your guide instantly</li>
                  <li>Your Admin Dashboard setup, complete with lead tracking, consent storage, and calendar tools</li>
                  <li>We'll configure everything to match your brand and business flow — so it looks and feels like an extension of you.</li>
                </ul>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center">
              <ArrowDown className="h-8 w-8 text-[#1e40af]" data-testid="icon-arrow-down-3" />
            </div>

            {/* Step 4 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-8 text-center" data-testid="step-launch-training">
              <h3 className="text-2xl font-bold text-[#1e40af] mb-4">Step 4: Launch & Training</h3>
              <p className="text-base text-[#1e40af]/90 max-w-3xl mx-auto leading-relaxed">
                Once your system is complete, we'll provide a walkthrough showing you exactly how to manage leads, view chat responses, and use your dashboard tools. We'll also help you launch your first ad or post if you choose to promote your guide through Meta or Google Ads, making sure everything connects smoothly.
              </p>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center">
              <ArrowDown className="h-8 w-8 text-[#1e40af]" data-testid="icon-arrow-down-4" />
            </div>

            {/* Step 5 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-8 text-center" data-testid="step-go-live">
              <h3 className="text-2xl font-bold text-[#1e40af] mb-4">Step 5: Go Live</h3>
              <p className="text-base text-[#1e40af]/90 max-w-3xl mx-auto leading-relaxed">
                When everything's ready, we'll activate your system and run final tests to ensure every element — form, chat, email, and dashboard — is working perfectly. From there, your automated lead machine is live and ready to run.
              </p>
            </div>

            {/* In Short */}
            <div className="text-center mt-16 pt-12 border-t-2 border-[#1e40af]/20" data-testid="onboarding-summary">
              <h3 className="text-2xl font-bold text-[#1e40af] mb-4">In Short</h3>
              <p className="text-base text-[#1e40af]/90 max-w-3xl mx-auto leading-relaxed">
                From kickoff to launch, the entire onboarding process is simple, guided, and collaborative. We handle the setup — you provide your expertise. In just a few days, you'll have a fully automated system generating leads, collecting insights, and booking appointments 24/7 — all powered by the knowledge you already have.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#1e40af] text-white relative overflow-hidden" data-testid="section-final-cta">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-final-cta-title">
            Ready to Experience It for Real?
          </h2>
          
          <div className="space-y-6 text-lg text-white/95 mb-12">
            <p data-testid="text-final-cta-para1">
              You've just seen how LeadsByNova™ works — from creating your expert guide to launching a complete, automated system that captures leads, gathers insights, and books appointments for you.
            </p>
            
            <p data-testid="text-final-cta-para2">
              Now imagine that same system working for your business — connecting with potential clients, building trust before the first call, and keeping your pipeline full 24/7.
            </p>
            
            <p data-testid="text-final-cta-para3">
              Our team will handle the setup, customization, and launch from start to finish. All you need to do is bring your expertise — we'll do the rest.
            </p>
            
            <p data-testid="text-final-cta-para4">
              If you're ready to experience the power of automation that actually feels personal, schedule your onboarding today and let's start building your lead machine.
            </p>
          </div>
          
          <div className="flex justify-center mb-8">
            <Button 
              size="lg"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-2 border-white text-lg px-8 py-6"
              onClick={() => setIsBookingModalOpen(true)}
              data-testid="button-schedule-demo"
            >
              <Phone className="mr-2 h-5 w-5" /> Schedule a Demo
            </Button>
          </div>

          <div className="pt-8 border-t border-white/20">
            <p className="text-sm text-blue-100 mb-2" data-testid="text-contact-info">
              Questions? We're here to help.
            </p>
            <p className="text-lg font-semibold mb-3" data-testid="text-contact-email">
              Contact: chris@infinitydigitalstudios.com
            </p>
            <p className="text-xs text-blue-100/70" data-testid="text-ownership">
              LeadsByNova™ is Owned and Operated by Infinity Digital Studios
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4" data-testid="footer">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400" data-testid="text-footer-copyright">
            &copy; {new Date().getFullYear()} LeadsByNova™. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 mt-2" data-testid="text-footer-tagline">
            Automate Connections - Accelerate Growth
          </p>
        </div>
      </footer>

      <BookingModal 
        open={isBookingModalOpen} 
        onOpenChange={setIsBookingModalOpen} 
      />
    </div>
  );
}
