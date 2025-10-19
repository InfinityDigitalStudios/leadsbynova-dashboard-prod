import express from "express";
import { IStorage } from "./storage.js";
import { insertFormSubmissionSchema } from "../../../packages/shared/schema.js";
import { sendEmailToLead } from "./email-service.js";

export function createRoutes(storage: IStorage) {
  const router = express.Router();

  // Submit form endpoint
  router.post("/form-submission", async (req, res) => {
    try {
      const result = insertFormSubmissionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid form data", 
          details: result.error.errors 
        });
      }

      const formData = result.data;
      
      // Store form submission
      const submission = await storage.createFormSubmission(formData);
      
      // Also create a lead record from this form submission
      const lead = await storage.createLead({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        guideType: formData.guideType,
        formTimestamp: new Date(),
        completedChat: "false",
        archived: "false"
      });

      // Send email with the guide
      try {
        await sendEmailToLead(formData);
        console.log(`Email sent successfully to ${formData.email}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }

      res.json({ 
        success: true, 
        submissionId: submission.id,
        leadId: lead.id 
      });
    } catch (error) {
      console.error("Form submission error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}