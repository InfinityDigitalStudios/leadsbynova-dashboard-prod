import express from "express";
import { IStorage } from "./storage.js";
import { insertEventSchema, insertLeadSchema } from "../shared/schema.js";

export function createRoutes(storage: IStorage) {
  const router = express.Router();

  // Server-Sent Events (SSE) for real-time lead updates
  const sseClients = new Set<any>();
  
  // Broadcast function to send events to all connected SSE clients
  function broadcastToClients(eventType: string, data: any) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        // Remove dead connections
        sseClients.delete(client);
      }
    });
  }

  // SSE endpoint for real-time updates
  router.get('/lead-stream', (req, res) => {
    // Set SSE headers with secure CORS
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Credentials': 'true',
    });

    // Add client to the set
    sseClients.add(res);
    
    // Send initial connection confirmation
    res.write('event: connected\ndata: {"message":"Connected to lead stream"}\n\n');
    
    // Optional heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write('event: heartbeat\ndata: {"timestamp":"' + new Date().toISOString() + '"}\n\n');
      } catch (error) {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 30000); // 30 second heartbeat
    
    // Handle client disconnection
    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
      console.log('SSE client disconnected');
    });
  });

  // CRUD Operations for Leads
  
  // Get all leads
  router.get("/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Get leads error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new lead
  router.post("/leads", async (req, res) => {
    try {
      const result = insertLeadSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid lead data", 
          details: result.error.errors 
        });
      }

      const leadData = result.data;
      const lead = await storage.createLead(leadData);
      
      // Broadcast new lead to connected SSE clients
      broadcastToClients('lead_created', lead);
      
      res.json({ success: true, lead });
    } catch (error) {
      console.error("Create lead error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update lead
  router.put("/leads/:id", async (req, res) => {
    try {
      const leadId = req.params.id;
      const updates = req.body;
      
      const updatedLead = await storage.updateLead(leadId, updates);
      
      if (!updatedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Broadcast lead update to connected SSE clients
      broadcastToClients('lead_updated', updatedLead);
      
      res.json({ success: true, lead: updatedLead });
    } catch (error) {
      console.error("Update lead error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update lead notes
  router.put("/leads/:id/notes", async (req, res) => {
    try {
      const leadId = req.params.id;
      const { notes } = req.body;
      
      if (!notes || typeof notes !== 'string') {
        return res.status(400).json({ error: "Invalid note content" });
      }

      const updatedLead = await storage.updateLeadNotes(leadId, notes);
      
      if (!updatedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({ success: true, lead: updatedLead });
    } catch (error) {
      console.error("Update lead notes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Assign lead to agent
  router.put("/leads/:id/assign", async (req, res) => {
    try {
      const leadId = req.params.id;
      const { assignedTo } = req.body;
      
      if (!assignedTo || typeof assignedTo !== 'string') {
        return res.status(400).json({ error: "Invalid assignedTo value" });
      }

      const updatedLead = await storage.updateLead(leadId, { assignedTo });
      
      if (!updatedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Broadcast lead update to connected SSE clients
      broadcastToClients('lead_updated', updatedLead);
      
      res.json({ success: true, lead: updatedLead });
    } catch (error) {
      console.error("Assign lead error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Archive/unarchive lead
  router.put("/leads/:id/archive", async (req, res) => {
    try {
      const leadId = req.params.id;
      const { archived, assignedTo } = req.body;
      
      if (!archived || typeof archived !== 'string') {
        return res.status(400).json({ error: "Invalid archived value" });
      }

      const updates: any = { archived };
      if (assignedTo !== undefined) {
        updates.assignedTo = assignedTo;
      }

      const updatedLead = await storage.updateLead(leadId, updates);
      
      if (!updatedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Broadcast lead update to connected SSE clients
      broadcastToClients('lead_updated', updatedLead);
      
      res.json({ success: true, lead: updatedLead });
    } catch (error) {
      console.error("Archive lead error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Soft delete lead (move to trash)
  router.put("/leads/:id/delete", async (req, res) => {
    try {
      const leadId = req.params.id;
      
      const updatedLead = await storage.updateLead(leadId, { 
        deletedAt: new Date().toISOString(),
        assignedTo: null // Clear assignment when moving to trash
      });
      
      if (!updatedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Broadcast lead update to connected SSE clients
      broadcastToClients('lead_updated', updatedLead);
      
      res.json({ success: true, lead: updatedLead });
    } catch (error) {
      console.error("Delete lead error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Permanently delete lead
  router.delete("/leads/:id/permanent", async (req, res) => {
    try {
      const leadId = req.params.id;
      
      // Check if storage has permanent delete method
      if ('permanentlyDeleteLead' in storage) {
        const deleted = await (storage as any).permanentlyDeleteLead(leadId);
        
        if (!deleted) {
          return res.status(404).json({ error: "Lead not found" });
        }
      } else {
        return res.status(501).json({ error: "Permanent deletion not supported by storage backend" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Permanent delete lead error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // CRUD Operations for Events

  // Get all events
  router.get("/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new event
  router.post("/events", async (req, res) => {
    try {
      const result = insertEventSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid event data", 
          details: result.error.errors 
        });
      }

      const eventData = result.data;
      const event = await storage.createEvent(eventData);
      
      res.json({ success: true, event });
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update event
  router.put("/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const updates = req.body;
      
      const updatedEvent = await storage.updateEvent(eventId, updates);
      
      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json({ success: true, event: updatedEvent });
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete event
  router.delete("/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      
      const deleted = await storage.deleteEvent(eventId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}