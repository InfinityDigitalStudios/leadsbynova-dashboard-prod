import sgMail from '@sendgrid/mail';
import { type InsertFormSubmission } from "../shared/schema.js";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'sarah@sarahjohnsonrealty.com';

// Simple email sending function using SendGrid
export async function sendEmailToLead(formData: InsertFormSubmission): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SENDGRID_API_KEY not configured, skipping email send');
    return;
  }

  const { fullName, email, guideType } = formData;
  
  const subject = `Welcome ${fullName}! 🏠 Your ${guideType} Guide is Here`;
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
      <div style="border: 1px solid #e9ecef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 35px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Sarah Johnson Realty! 🏠</h1>
          <p style="color: #bfdbfe; margin: 15px 0 0 0; font-size: 16px; font-weight: 400;">Your ${guideType} guide is ready</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #374151; margin: 0 0 25px 0; font-size: 17px; line-height: 1.6; font-weight: 500;">Hi ${fullName},</p>
          
          <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px; line-height: 1.7;">Thank you for requesting your ${guideType} guide! I'm excited to help you with your real estate journey.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="tel:+15551234567" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">📞 Call Me Now: (555) 123-4567</a>
          </div>
          
          <div style="margin-top: 30px;">
            <p style="color: #555; margin: 0; line-height: 1.6; font-size: 15px;">
              📧 <strong>Email me anytime</strong> with questions<br>
              📞 <strong>Call directly</strong> at (555) 123-4567 for immediate assistance
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef; text-align: center;">
          <p style="color: #666; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
            <strong style="color: #333;">Sarah Johnson</strong><br>
            Licensed Real Estate Agent<br>
            📧 sarah@sarahjohnsonrealty.com | 📱 (555) 123-4567
          </p>
        </div>
      </div>
    </div>
  `;

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject,
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}