import express from "express";
import { IStorage } from "./storage.js";
import { insertChatMessageSchema } from "@real-estate/shared";

export function createRoutes(storage: IStorage) {
  const router = express.Router();

  // Create or update lead from chat data
  router.post("/chat/update-lead", async (req, res) => {
    try {
      const leadData = req.body;
      
      // Get existing lead by email or create new one
      let lead = await storage.getLeadByEmail(leadData.email);
      
      if (lead) {
        // Update existing lead with chat data
        const updatedLead = await storage.updateLead(lead.id, {
          chatTimestamp: new Date(),
          prequalified: leadData.prequalified,
          preQualificationRange: leadData.preQualificationRange,
          moveTimeline: leadData.moveTimeline,
          haveAgent: leadData.haveAgent,
          budgetRange: leadData.budgetRange,
          propertyType: leadData.propertyType,
          bookedCall: leadData.bookedCall,
          daySelected: leadData.daySelected,
          completedChat: "true"
        });
        res.json({ success: true, leadId: updatedLead?.id });
      } else {
        // Create new lead from chat data
        const newLead = await storage.createLead({
          fullName: leadData.name,
          email: leadData.email,
          phone: leadData.phone || "",
          guideType: "Chat Lead",
          formTimestamp: new Date(),
          chatTimestamp: new Date(),
          prequalified: leadData.prequalified,
          preQualificationRange: leadData.preQualificationRange,
          moveTimeline: leadData.moveTimeline,
          haveAgent: leadData.haveAgent,
          budgetRange: leadData.budgetRange,
          propertyType: leadData.propertyType,
          bookedCall: leadData.bookedCall,
          daySelected: leadData.daySelected,
          completedChat: "true",
          archived: "false"
        });
        res.json({ success: true, leadId: newLead.id });
      }
    } catch (error) {
      console.error("Chat lead update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Save chat message
  router.post("/chat/message", async (req, res) => {
    try {
      const result = insertChatMessageSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid message data", 
          details: result.error.errors 
        });
      }

      const messageData = result.data;
      const message = await storage.createChatMessage(messageData);
      
      res.json({ success: true, messageId: message.id });
    } catch (error) {
      console.error("Chat message save error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}