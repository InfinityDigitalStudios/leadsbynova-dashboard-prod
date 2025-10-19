import { type User, type InsertUser, type FormSubmission, type InsertFormSubmission, type ChatMessage, type InsertChatMessage, type Lead, type InsertLead, type Event, type InsertEvent, leads, events, chatMessages } from "../../../packages/shared/schema.js";
import { randomUUID } from "crypto";
import { eq, desc } from "drizzle-orm";
// Database import will be lazy loaded to avoid immediate connection issues
let db: any;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  getFormSubmissions(): Promise<FormSubmission[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  updateLeadNotes(id: string, noteContent: string): Promise<Lead | undefined>;
  getLeads(): Promise<Lead[]>;
  getLeadByEmail(email: string): Promise<Lead | undefined>;
  permanentlyDeleteLead(id: string): Promise<boolean>;
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private formSubmissions: Map<string, FormSubmission>;
  private chatMessages: Map<string, ChatMessage>;
  private leads: Map<string, Lead>;
  private events: Map<string, Event>;

  constructor() {
    this.users = new Map();
    this.formSubmissions = new Map();
    this.chatMessages = new Map();
    this.leads = new Map();
    this.events = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFormSubmission(insertSubmission: InsertFormSubmission): Promise<FormSubmission> {
    const id = randomUUID();
    const submission: FormSubmission = { 
      ...insertSubmission, 
      id,
      createdAt: new Date()
    };
    this.formSubmissions.set(id, submission);
    return submission;
  }

  async getFormSubmissions(): Promise<FormSubmission[]> {
    return Array.from(this.formSubmissions.values());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = { 
      id,
      fullName: insertLead.fullName,
      email: insertLead.email,
      phone: insertLead.phone,
      guideType: insertLead.guideType,
      formTimestamp: insertLead.formTimestamp,
      chatTimestamp: insertLead.chatTimestamp || null,
      prequalified: insertLead.prequalified || null,
      preQualificationRange: insertLead.preQualificationRange || null,
      moveTimeline: insertLead.moveTimeline || null,
      haveAgent: insertLead.haveAgent || null,
      budgetRange: insertLead.budgetRange || null,
      propertyType: insertLead.propertyType || null,
      bookedCall: insertLead.bookedCall || null,
      daySelected: insertLead.daySelected || null,
      completedChat: insertLead.completedChat || "false",
      notes: (insertLead.notes || []) as Array<{ timestamp: string; content: string }> | null,
      assignedTo: insertLead.assignedTo || null,
      archived: insertLead.archived || "false",
      deletedAt: insertLead.deletedAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const existingLead = this.leads.get(id);
    if (!existingLead) return undefined;
    
    const updatedLead: Lead = { 
      ...existingLead, 
      ...updates,
      notes: updates.notes as Array<{ timestamp: string; content: string }> | null | undefined || existingLead.notes,
      updatedAt: new Date()
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    return Array.from(this.leads.values())
      .filter(lead => lead.email === email)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async updateLeadNotes(id: string, noteContent: string): Promise<Lead | undefined> {
    const existingLead = this.leads.get(id);
    if (!existingLead) return undefined;
    
    const existingNotes = existingLead.notes || [];
    const newNoteEntry = {
      timestamp: new Date().toISOString(),
      content: noteContent
    };
    const updatedNotes = [...existingNotes, newNoteEntry];
    
    return this.updateLead(id, { notes: updatedNotes });
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      id,
      title: insertEvent.title,
      description: insertEvent.description || null,
      date: insertEvent.date,
      startTime: insertEvent.startTime,
      endTime: insertEvent.endTime,
      createdAt: new Date()
    };
    this.events.set(id, event);
    return event;
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort((a, b) => 
      a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
    );
  }

  async getEventById(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;

    const updatedEvent: Event = {
      ...existingEvent,
      ...updates
    };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  async permanentlyDeleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
        
        // Check if it's a connection error
        if (error.code === '57P01' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || 
            error.message?.includes('connection') || error.message?.includes('Connection')) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // If it's not a connection error or we've exhausted retries, throw immediately
        throw error;
      }
    }
    
    throw lastError;
  }

  async getUser(id: string): Promise<User | undefined> {
    // Users are not implemented in database yet
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Users are not implemented in database yet
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Users are not implemented in database yet
    throw new Error("User creation not implemented");
  }

  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    // Form submissions are not implemented separately anymore - everything goes to leads
    throw new Error("Form submissions not implemented separately");
  }

  async getFormSubmissions(): Promise<FormSubmission[]> {
    return [];
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const [lead] = await db.insert(leads).values(insertLead as any).returning();
      return lead;
    });
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const [lead] = await db
        .update(leads)
        .set({
          ...updates,
          updatedAt: new Date()
        } as any)
        .where(eq(leads.id, id))
        .returning();
      return lead;
    });
  }

  async getLeads(): Promise<Lead[]> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const result = await db.select().from(leads).orderBy(leads.createdAt);
      return result.reverse(); // Most recent first
    });
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const [lead] = await db.select().from(leads).where(eq(leads.email, email)).orderBy(desc(leads.createdAt));
      return lead;
    });
  }

  async updateLeadNotes(id: string, noteContent: string): Promise<Lead | undefined> {
    return this.executeWithRetry(async () => {
      const existingLead = await this.getLeadById(id);
      if (!existingLead) return undefined;
      
      const existingNotes = existingLead.notes || [];
      const newNoteEntry = {
        timestamp: new Date().toISOString(),
        content: noteContent
      };
      const updatedNotes = [...existingNotes, newNoteEntry];
      
      return this.updateLead(id, { notes: updatedNotes });
    });
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const [lead] = await db.select().from(leads).where(eq(leads.id, id));
      return lead;
    });
  }

  async permanentlyDeleteLead(id: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const result = await db.delete(leads).where(eq(leads.id, id));
      return (result.rowCount ?? 0) > 0;
    });
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const [event] = await db.insert(events).values(insertEvent).returning();
      return event;
    });
  }

  async getEvents(): Promise<Event[]> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const result = await db.select().from(events).orderBy(events.date, events.startTime);
      return result;
    });
  }

  async getEventById(id: string): Promise<Event | undefined> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const [event] = await db.select().from(events).where(eq(events.id, id));
      return event;
    });
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const [event] = await db
        .update(events)
        .set(updates)
        .where(eq(events.id, id))
        .returning();
      return event;
    });
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      if (!db) {
        db = await import("./db.js").then(m => m.db);
      }
      const result = await db.delete(events).where(eq(events.id, id));
      return (result.rowCount ?? 0) > 0;
    });
  }
}

class FallbackStorage implements IStorage {
  private databaseStorage = new DatabaseStorage();
  private memoryStorage = new MemStorage();
  private isDatabaseAvailable = true;
  private lastDatabaseCheck = 0;
  private readonly checkInterval = 60000; // Check database availability every minute

  private async isDatabaseHealthy(): Promise<boolean> {
    const now = Date.now();
    
    // Only check database health periodically to avoid excessive checks
    if (now - this.lastDatabaseCheck < this.checkInterval && this.isDatabaseAvailable) {
      return this.isDatabaseAvailable;
    }
    
    try {
      // Simple health check - try to query the database
      await this.databaseStorage.getLeads();
      this.isDatabaseAvailable = true;
      this.lastDatabaseCheck = now;
      console.log('Database is healthy');
      return true;
    } catch (error) {
      console.warn('Database health check failed:', error.message);
      this.isDatabaseAvailable = false;
      this.lastDatabaseCheck = now;
      return false;
    }
  }

  private async executeWithFallback<T>(
    databaseOperation: () => Promise<T>,
    memoryOperation: () => Promise<T>
  ): Promise<T> {
    if (await this.isDatabaseHealthy()) {
      try {
        return await databaseOperation();
      } catch (error) {
        console.error('Database operation failed, falling back to memory storage:', error.message);
        this.isDatabaseAvailable = false;
        return await memoryOperation();
      }
    } else {
      console.log('Using memory storage (database unavailable)');
      return await memoryOperation();
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.getUser(id),
      () => this.memoryStorage.getUser(id)
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.getUserByUsername(username),
      () => this.memoryStorage.getUserByUsername(username)
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.executeWithFallback(
      () => this.databaseStorage.createUser(user),
      () => this.memoryStorage.createUser(user)
    );
  }

  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    return this.executeWithFallback(
      () => this.databaseStorage.createFormSubmission(submission),
      () => this.memoryStorage.createFormSubmission(submission)
    );
  }

  async getFormSubmissions(): Promise<FormSubmission[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getFormSubmissions(),
      () => this.memoryStorage.getFormSubmissions()
    );
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    return this.executeWithFallback(
      () => this.databaseStorage.createLead(lead),
      () => this.memoryStorage.createLead(lead)
    );
  }

  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.updateLead(id, lead),
      () => this.memoryStorage.updateLead(id, lead)
    );
  }

  async updateLeadNotes(id: string, noteContent: string): Promise<Lead | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.updateLeadNotes(id, noteContent),
      () => this.memoryStorage.updateLeadNotes(id, noteContent)
    );
  }

  async getLeads(): Promise<Lead[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getLeads(),
      () => this.memoryStorage.getLeads()
    );
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.getLeadByEmail(email),
      () => this.memoryStorage.getLeadByEmail(email)
    );
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    return this.executeWithFallback(
      () => this.databaseStorage.createEvent(event),
      () => this.memoryStorage.createEvent(event)
    );
  }

  async getEvents(): Promise<Event[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getEvents(),
      () => this.memoryStorage.getEvents()
    );
  }

  async getEventById(id: string): Promise<Event | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.getEventById(id),
      () => this.memoryStorage.getEventById(id)
    );
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.updateEvent(id, event),
      () => this.memoryStorage.updateEvent(id, event)
    );
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.executeWithFallback(
      () => this.databaseStorage.deleteEvent(id),
      () => this.memoryStorage.deleteEvent(id)
    );
  }

  async permanentlyDeleteLead(id: string): Promise<boolean> {
    return this.executeWithFallback(
      () => this.databaseStorage.permanentlyDeleteLead(id),
      () => this.memoryStorage.permanentlyDeleteLead(id)
    );
  }
}

export const storage = new FallbackStorage();
