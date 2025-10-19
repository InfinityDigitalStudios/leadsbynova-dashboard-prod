import express from "express";
import { IStorage } from "./storage.js";
import { insertChatMessageSchema } from "@real-estate/shared";

export function createRoutes(storage: IStorage) {
  const router = express.Router();

  // Create or update lead from seller chat data
  router.post("/chat/update-lead", async (req, res) => {
    try {
      const leadData = req.body;
      
      // Get existing lead by email or create new one
      let lead = await storage.getLeadByEmail(leadData.email);
      
      if (lead) {
        // Update existing lead with seller chat data (mapping fields to schema)
        const updatedLead = await storage.updateLead(lead.id, {
          chatTimestamp: new Date(),
          moveTimeline: leadData.timeline,        // timeline -> moveTimeline
          haveAgent: leadData.haveAgent,
          // needToBuy maps to a custom field we'll store in notes
          propertyType: leadData.propertyType,
          // occupancyStatus, priceRange, recentUpgrades can be stored in notes
          bookedCall: leadData.bookedCall,
          daySelected: leadData.daySelected,
          completedChat: "true",
          // Store additional seller info in notes
          notes: [
            ...(lead.notes || []),
            {
              timestamp: new Date().toISOString(),
              content: `Seller Chat Data: Need to buy: ${leadData.needToBuy || 'N/A'}, Occupancy: ${leadData.occupancyStatus || 'N/A'}, Price range: ${leadData.priceRange || 'N/A'}, Recent upgrades: ${leadData.recentUpgrades || 'N/A'}`
            }
          ]
        });
        res.json({ success: true, leadId: updatedLead?.id });
      } else {
        // Create new lead from seller chat data (mapping fields to schema)
        const newLead = await storage.createLead({
          fullName: leadData.name,
          email: leadData.email,
          phone: leadData.phone || "",
          guideType: "Seller Chat Lead",
          formTimestamp: new Date(),
          chatTimestamp: new Date(),
          moveTimeline: leadData.timeline,        // timeline -> moveTimeline
          haveAgent: leadData.haveAgent,
          propertyType: leadData.propertyType,
          bookedCall: leadData.bookedCall,
          daySelected: leadData.daySelected,
          completedChat: "true",
          archived: "false",
          // Store additional seller info in notes
          notes: [
            {
              timestamp: new Date().toISOString(),
              content: `Seller Chat Data: Need to buy: ${leadData.needToBuy || 'N/A'}, Occupancy: ${leadData.occupancyStatus || 'N/A'}, Price range: ${leadData.priceRange || 'N/A'}, Recent upgrades: ${leadData.recentUpgrades || 'N/A'}`
            }
          ]
        });
        res.json({ success: true, leadId: newLead.id });
      }
    } catch (error) {
      console.error("Seller chat lead update error:", error);
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