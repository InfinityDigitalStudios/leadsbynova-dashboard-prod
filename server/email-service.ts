import nodemailer from 'nodemailer';
import { storage } from './storage';

interface FormData {
  timestamp: string;
  name: string;
  email: string;
  phone: string;
  guide_type: string;
}

interface ChatData {
  name: string;
  prequalified: string;
  preQualificationRange: string;
  moveTimeline: string;
  haveAgent: string;
  budgetRange: string;
  propertyType: string;
  bookedCall: string;
  daySelected?: string;
}

interface ConsolidatedData {
  // Form data
  formTimestamp?: string;
  name: string;
  email?: string;
  phone?: string;
  guide_type?: string;
  
  // LeadsByNova chat data
  chatTimestamp?: string;
  userType?: string;
  mainGoal?: string;
  leadManagement?: string;
  timeline?: string;
  communicationPreference?: string;
  bookedCall?: string;
  daySelected?: string;
  
  // Status
  completedChat: boolean;
}

class EmailService {
  protected transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Get the configured sender email address
  private getSenderEmail(): string {
    return process.env.EMAIL_USER || 'configure-your-email@example.com';
  }

  // Get configuration value from environment with fallback
  private getConfigValue(key: string, fallback: string): string {
    // Use environment variables directly since appConfig table doesn't exist
    const envMap: Record<string, string> = {
      'company_name': process.env.COMPANY_NAME || fallback,
      'agent_signature_name': process.env.AGENT_NAME || fallback,
      'agent_signature_title': process.env.AGENT_TITLE || fallback,
      'primary_phone': process.env.PRIMARY_PHONE || fallback,
      'email_closing_message': process.env.EMAIL_CLOSING || fallback,
      'fallback_redirect_url': process.env.REDIRECT_URL || fallback,
    };
    return envMap[key] || fallback;
  }

  // Format timestamp to "1:25 AM EST" format
  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  // Safety check for email configuration
  private async isEmailConfigSafe(email: string): Promise<boolean> {
    if (email.includes('example.com') || email.includes('localhost') || email === 'configure-your-email@example.com') {
      console.log(`Email not configured properly (using placeholder: ${email}). Please configure your email settings.`);
      return false;
    }
    return true;
  }

  // AGENT NOTIFICATION EMAIL
  async sendConsolidatedNotification(data: ConsolidatedData): Promise<void> {
    const senderEmail = this.getSenderEmail();
    if (!(await this.isEmailConfigSafe(senderEmail))) {
      return;
    }
    const isCallBooked = data.bookedCall?.includes('Yes') && data.bookedCall?.includes('schedule');
    
    // Get configuration values
    const companyName = this.getConfigValue('company_name', 'LeadsByNova');
    const subject = `${isCallBooked ? '🔥 HOT LEAD' : '📝 New Lead'}: ${data.name}${isCallBooked ? ' - CALL BOOKED 📞' : ''}`;
    
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: radial-gradient(ellipse at 20% 50%, #60a5fa, #3b82f6, #1e40af, #1e3a8a); border-radius: 15px;">
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid rgba(59, 130, 246, 0.3);">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%); padding: 25px; margin: -30px -30px 25px -30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              ${isCallBooked ? '🔥 HOT LEAD - CALL BOOKED!' : '📝 New Lead Generated'} - ${companyName}
            </h2>
          </div>
        
          <!-- Contact Information -->
          <div style="background: radial-gradient(ellipse at center right, #60a5fa 0%, #3b82f6 30%, #2563eb 60%, #1d4ed8 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid rgba(59, 130, 246, 0.3); color: white;">
            <h3 style="color: white; margin-top: 0; font-weight: 600;">Contact Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: rgba(255,255,255,0.9);">Name:</td>
              <td style="padding: 8px 0; font-weight: bold; color: white;">${data.name}</td>
            </tr>
            ${data.email ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: rgba(255,255,255,0.9);">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: white; text-decoration: underline;">${data.email}</a></td>
            </tr>
            ` : ''}
            ${data.phone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: rgba(255,255,255,0.9);">Phone:</td>
              <td style="padding: 8px 0;"><a href="tel:${data.phone}" style="color: white; text-decoration: underline;">${data.phone}</a></td>
            </tr>
            ` : ''}
            ${data.guide_type ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: rgba(255,255,255,0.9);">Interested In:</td>
              <td style="padding: 8px 0; color: #fbbf24; font-weight: bold;">${data.guide_type}</td>
            </tr>
            ` : ''}
            ${data.formTimestamp ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: rgba(255,255,255,0.9);">Form Submitted:</td>
              <td style="padding: 8px 0; color: white;">${this.formatTimestamp(data.formTimestamp)}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${data.completedChat ? `
          <!-- LeadsByNova Qualification Details -->
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #16a34a; border: 1px solid rgba(34, 197, 94, 0.2);">
            <h3 style="color: #15803d; margin-top: 0; font-weight: 600;">✅ LeadsByNova Chat Completed</h3>
          <table style="width: 100%; border-collapse: collapse;">
            
            ${data.userType ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">User Type:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #3b82f6;">${data.userType}</td>
              </tr>
            ` : ''}
            
            ${data.mainGoal ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Main Goal:</td>
                <td style="padding: 8px 0; color: #374151;">${data.mainGoal}</td>
              </tr>
            ` : ''}
            
            ${data.leadManagement ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Current Lead Management:</td>
                <td style="padding: 8px 0; color: #374151;">${data.leadManagement}</td>
              </tr>
            ` : ''}
            
            ${data.timeline ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Timeline:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #3b82f6;">${data.timeline}</td>
              </tr>
            ` : ''}
            
            ${data.communicationPreference ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Communication Preference:</td>
                <td style="padding: 8px 0; color: #374151;">${data.communicationPreference}</td>
              </tr>
            ` : ''}
            
            ${data.chatTimestamp ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Chat Completed:</td>
              <td style="padding: 8px 0; color: #374151;">${this.formatTimestamp(data.chatTimestamp)}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        ` : `
          <!-- No Chat Completion -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 15px; border-radius: 12px; border-left: 4px solid #f59e0b; margin: 20px 0; border: 1px solid rgba(245, 158, 11, 0.3);">
            <h3 style="color: #92400e; margin-top: 0; font-weight: 600;">⚠️ Chat Not Completed</h3>
            <p style="margin: 0; color: #92400e;">
            Lead downloaded the guide but did not complete the qualification chat. 
            Follow up quickly to capture their interest while it's fresh!
          </p>
        </div>
        `}
        
        ${isCallBooked ? `
          <!-- Call Appointment -->
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #16a34a; margin: 20px 0; border: 2px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0; font-weight: 600;">📞 CALL APPOINTMENT SCHEDULED!</h3>
            <p style="margin: 0; color: #15803d; font-weight: bold; font-size: 16px;">
            🗓️ ${data.daySelected || 'Time not specified'}
          </p>
            <p style="margin: 10px 0 0 0; color: #15803d; font-weight: bold;">
            🔥 This is a HOT LEAD ready to move forward. Prioritize this appointment!
          </p>
        </div>
        ` : data.completedChat ? `
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 15px; border-radius: 12px; border-left: 4px solid #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">
            <p style="margin: 0; color: #92400e;">
            <strong>Follow-up Needed:</strong> Lead completed qualification but didn't book a call. 
            Reach out within 2 hours while interest is high.
          </p>
        </div>
        ` : ''}
        
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            ${companyName} Lead Notification System
          </p>
        </div>
      </div>
    `;
    
    try {
      await this.transporter.sendMail({
        from: senderEmail,
        to: process.env.EMAIL_TO, // Configurable agent email per fork
        subject,
        html: htmlContent
      });
      console.log(`✅ Agent notification sent successfully to ${process.env.EMAIL_TO}`);
    } catch (error) {
      console.error('❌ Failed to send agent notification email:', error);
      throw error;
    }
  }

  // CLIENT WELCOME EMAIL
  async sendWelcomeEmail(leadData: { name: string; email: string; guide_type: string; scheduledCall?: string; isUpdated?: boolean }): Promise<void> {
    const { name, email, guide_type, scheduledCall, isUpdated } = leadData;
    const senderEmail = this.getSenderEmail();
    if (!(await this.isEmailConfigSafe(senderEmail))) {
      return;
    }
    
    // Get configuration values
    const companyName = this.getConfigValue('company_name', 'LeadsByNova');
    const agentName = this.getConfigValue('agent_signature_name', 'LeadsByNova Team');
    const agentTitle = this.getConfigValue('agent_signature_title', 'Lead Generation Specialist');
    const primaryPhone = this.getConfigValue('primary_phone', '(000) 000-0000');
    const emailClosing = this.getConfigValue('email_closing_message', 'Your Lead Generation Expert');
    
    // Use fallback redirect URL for all emails
    const guideLink = this.getConfigValue('fallback_redirect_url', 'https://leadsbynova.replit.app/guide');
    const subject = isUpdated ? `📞 Call Confirmed - Your link to Experience LeadsByNova` : `Your link to Experience LeadsByNova`;
    
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: radial-gradient(ellipse at 20% 50%, #60a5fa, #3b82f6, #1e40af, #1e3a8a);">
        <div style="background-color: white; padding: 0; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid rgba(59, 130, 246, 0.3); overflow: hidden;">
          
          <!-- Header with gradient -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">
              ${companyName}
            </h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">${emailClosing}</p>
            <div style="width: 60px; height: 3px; background: rgba(255,255,255,0.3); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <!-- Main content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin: 0 0 25px 0; font-size: 24px; font-weight: 400;">
              Hi ${name}! 👋
            </h2>
            
            <p style="color: #555; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Thank you for your interest! I'm excited to help you with your journey and provide you with expert guidance every step of the way.
            </p>
            
            <!-- CTA Button with enhanced styling -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${guideLink}" 
                 style="background: radial-gradient(ellipse at center right, #60a5fa 0%, #3b82f6 30%, #2563eb 60%, #1d4ed8 100%); 
                        color: white; 
                        text-decoration: none; 
                        font-weight: 600; 
                        font-size: 18px; 
                        padding: 15px 30px; 
                        border-radius: 50px; 
                        display: inline-block; 
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                        transition: all 0.3s ease;">
                Experience LeadsByNova →
              </a>
            </div>
            
            <!-- What's Next Section -->
            <div style="background: linear-gradient(135deg, #f0f6ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2);">
              <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px; font-weight: 500;">✨ What's Next?</h3>
              
              ${scheduledCall ? `
              <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #16a34a; border: 1px solid rgba(34, 197, 94, 0.2);">
                <p style="color: #155724; margin: 0; line-height: 1.7; font-weight: 600; font-size: 16px;">
                  📞 <strong>Your Call is Scheduled!</strong><br>
                  <span style="font-size: 18px; color: #0d4622;">🗓️ ${scheduledCall}</span><br>
                  <span style="font-weight: 400; font-size: 15px;">Thank you for scheduling your live demo via Zoom. You will receive a Zoom meeting link shortly—please keep an eye on your inbox.</span>
                </p>
              </div>
              <p style="color: #555; margin: 0; line-height: 1.6; font-size: 15px;">
                📧 <strong>Have questions before our call?</strong> Simply reply to this email anytime.
              </p>
              ` : `
              <p style="color: #555; margin: 0; line-height: 1.7; font-size: 16px;">
                📧 <strong>Have questions?</strong> Simply reply to this email anytime.
              </p>
              `}
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="color: #666; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
              <strong style="color: #333;">${agentName}</strong><br>
              ${agentTitle}<br>
              📧 ${senderEmail}
            </p>
            <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 15px;">
              <p style="color: #999; margin: 0 0 8px 0; font-size: 12px;">
                LeadsByNova
              </p>
              <p style="color: #adb5bd; margin: 0 0 12px 0; font-size: 11px; font-style: italic;">
                LeadsByNova is owned and operated by Infinity Digital Studios
              </p>
              <p style="color: #999; margin: 0; font-size: 10px; line-height: 1.5;">
                To unsubscribe from future emails, please email 
                <a href="mailto:chris@infinitydigitalstudios.com?subject=Unsubscribe%20Request&body=Please%20remove%20me%20from%20your%20email%20list." 
                   style="color: #3b82f6; text-decoration: underline;">chris@infinitydigitalstudios.com</a> 
                with "Unsubscribe" in the subject line.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: senderEmail,
        to: email,
        replyTo: process.env.EMAIL_TO,
        subject,
        html: htmlContent
      });
      console.log(`✅ Welcome email sent successfully to ${email} from ${senderEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }

  // BOOKING CONFIRMATION EMAIL (to lead)
  async sendBookingConfirmation(bookingData: { 
    name: string; 
    email: string; 
    date: string; 
    time: string;
  }): Promise<void> {
    const { name, email, date, time } = bookingData;
    const senderEmail = this.getSenderEmail();
    if (!(await this.isEmailConfigSafe(senderEmail))) {
      return;
    }
    
    const companyName = this.getConfigValue('company_name', 'LeadsByNova');
    const agentName = this.getConfigValue('agent_signature_name', 'LeadsByNova Team');
    const agentTitle = this.getConfigValue('agent_signature_title', 'Lead Generation Specialist');
    
    // Format date nicely
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    const subject = `Demo Scheduled - ${formattedDate}`;
    
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: radial-gradient(ellipse at 20% 50%, #60a5fa, #3b82f6, #1e40af, #1e3a8a);">
        <div style="background-color: white; padding: 0; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid rgba(59, 130, 246, 0.3); overflow: hidden;">
          
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">
              ${companyName}
            </h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Your Lead Generation Expert</p>
            <div style="width: 60px; height: 3px; background: rgba(255,255,255,0.3); margin: 15px auto; border-radius: 2px;"></div>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin: 0 0 25px 0; font-size: 24px; font-weight: 400;">
              Hi ${name}! 👋
            </h2>
            
            <p style="color: #555; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Your demo has been successfully scheduled! We're excited to show you how LeadsByNova can transform your lead generation.
            </p>
            
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #16a34a; border: 1px solid rgba(34, 197, 94, 0.2);">
              <h3 style="color: #155724; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">📅 Your Demo Details</h3>
              <p style="color: #155724; margin: 0; line-height: 1.8; font-size: 16px;">
                <strong>Date:</strong> ${formattedDate}<br>
                <strong>Time:</strong> ${time} ET<br>
                <strong>Call Type:</strong> Zoom Call
              </p>
              <p style="color: #155724; margin: 15px 0 0 0; line-height: 1.6; font-size: 15px;">
                You will receive a Zoom meeting link shortly—please keep an eye on your inbox.
              </p>
            </div>
            
            <div style="background: linear-gradient(135deg, #f0f6ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2);">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 20px; font-weight: 500;">✨ What to Expect</h3>
              <p style="color: #555; margin: 0; line-height: 1.7; font-size: 15px;">
                We've set aside two full hours for our discovery call, so you'll have plenty of time to ask questions and dive into every detail of how LeadsByNova works.
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.7; margin-top: 25px; font-size: 16px;">
              📧 <strong>Have questions before our call?</strong> Simply reply to this email anytime.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="color: #666; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
              <strong style="color: #333;">${agentName}</strong><br>
              ${agentTitle}<br>
              📧 ${senderEmail}
            </p>
            <div style="border-top: 1px solid #dee2e6; padding-top: 15px; margin-top: 15px;">
              <p style="color: #999; margin: 0 0 8px 0; font-size: 12px;">
                LeadsByNova
              </p>
              <p style="color: #adb5bd; margin: 0 0 12px 0; font-size: 11px; font-style: italic;">
                LeadsByNova is owned and operated by Infinity Digital Studios
              </p>
              <p style="color: #999; margin: 0; font-size: 10px; line-height: 1.5;">
                To unsubscribe from future emails, please email 
                <a href="mailto:chris@infinitydigitalstudios.com?subject=Unsubscribe%20Request&body=Please%20remove%20me%20from%20your%20email%20list." 
                   style="color: #3b82f6; text-decoration: underline;">chris@infinitydigitalstudios.com</a> 
                with "Unsubscribe" in the subject line.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: senderEmail,
        to: email,
        replyTo: process.env.EMAIL_TO,
        subject,
        html: htmlContent
      });
      console.log(`✅ Booking confirmation sent successfully to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send booking confirmation to ${email}:`, error);
      throw error;
    }
  }

  // BOOKING AGENT NOTIFICATION
  async sendBookingAgentNotification(bookingData: {
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
  }): Promise<void> {
    const { name, email, phone, date, time } = bookingData;
    const senderEmail = this.getSenderEmail();
    if (!(await this.isEmailConfigSafe(senderEmail))) {
      return;
    }
    
    const companyName = this.getConfigValue('company_name', 'LeadsByNova');
    
    // Format date nicely
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    const subject = `🔥 HOT LEAD - DEMO BOOKED: ${name} - ${formattedDate}`;
    
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: radial-gradient(ellipse at 20% 50%, #60a5fa, #3b82f6, #1e40af, #1e3a8a); border-radius: 15px;">
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid rgba(59, 130, 246, 0.3);">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%); padding: 25px; margin: -30px -30px 25px -30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              🔥 HOT LEAD - DEMO BOOKED! - ${companyName}
            </h2>
          </div>
        
          <div style="background: radial-gradient(ellipse at center right, #60a5fa 0%, #3b82f6 30%, #2563eb 60%, #1d4ed8 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid rgba(59, 130, 246, 0.3); color: white;">
            <h3 style="color: white; margin-top: 0; font-weight: 600;">Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: white; font-weight: 600;">Name:</td>
                <td style="padding: 8px 0; color: white;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: white; font-weight: 600;">Email:</td>
                <td style="padding: 8px 0; color: white;"><a href="mailto:${email}" style="color: white; text-decoration: underline;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: white; font-weight: 600;">Phone:</td>
                <td style="padding: 8px 0; color: white;"><a href="tel:${phone}" style="color: white; text-decoration: underline;">${phone}</a></td>
              </tr>
            </table>
          </div>

          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #16a34a; border: 1px solid rgba(34, 197, 94, 0.2);">
            <h3 style="color: #155724; margin-top: 0; font-weight: 600;">📅 Demo Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: 600;">Date:</td>
                <td style="padding: 8px 0; color: #155724;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: 600;">Time:</td>
                <td style="padding: 8px 0; color: #155724;">${time} ET (2-hour block)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: 600;">Call Type:</td>
                <td style="padding: 8px 0; color: #155724; font-weight: 700;">📹 Zoom Call</td>
              </tr>
            </table>
          </div>

          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">
            <p style="color: #92400e; margin: 0; font-weight: 600; font-size: 15px;">
              ⚡ Action Required: Send the Zoom meeting link to the lead.
            </p>
          </div>
        
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            ${companyName} Lead Notification System
          </p>
        </div>
      </div>
    `;
    
    try {
      await this.transporter.sendMail({
        from: senderEmail,
        to: process.env.EMAIL_TO,
        subject,
        html: htmlContent
      });
      console.log(`✅ Booking agent notification sent successfully to ${process.env.EMAIL_TO}`);
    } catch (error) {
      console.error('❌ Failed to send booking agent notification:', error);
      throw error;
    }
  }

  // Password Reset Email
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const senderEmail = this.getSenderEmail();
    if (!(await this.isEmailConfigSafe(senderEmail))) {
      return;
    }

    const companyName = this.getConfigValue('company_name', 'LeadsByNova');
    const resetUrl = `${process.env.REPLIT_DEPLOYMENT_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: radial-gradient(ellipse at 20% 50%, #60a5fa, #3b82f6, #1e40af, #1e3a8a); border-radius: 15px;">
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid rgba(59, 130, 246, 0.3);">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%); padding: 25px; margin: -30px -30px 25px -30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              🔐 Password Reset Request
            </h2>
          </div>
        
          <div style="padding: 20px 0;">
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hello,
            </p>
            <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your ${companyName} account. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                Reset Password
              </a>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                ⏰ <strong>This link will expire in 1 hour</strong> for security reasons.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #3b82f6; font-size: 13px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 6px; margin: 10px 0;">
              ${resetUrl}
            </p>

            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="color: #991b1b; margin: 0; font-size: 14px;">
                ⚠️ <strong>Security Note:</strong> If you didn't request this password reset, please ignore this email. Your account is secure.
              </p>
            </div>
          </div>
        
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            ${companyName} Security System<br/>
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    
    try {
      await this.transporter.sendMail({
        from: senderEmail,
        to: email,
        subject: `🔐 Password Reset Request - ${companyName}`,
        html: htmlContent
      });
      console.log(`✅ Password reset email sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();