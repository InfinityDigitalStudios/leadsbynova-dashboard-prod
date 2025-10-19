import { type User, type InsertUser, type CreateUser, type FormSubmission, type InsertFormSubmission, type Lead, type InsertLead, type Event, type InsertEvent, type Note, type InsertNote, type Agent, type InsertAgent, type AppConfiguration, type InsertAppConfig, type ConsentRecord, type InsertConsentRecord, users, leads, events, notes, agents, appConfiguration, consentRecords } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Predefined configuration keys for easy setup - matches frontend constant
const PREDEFINED_CONFIGS = [
  {
    category: "branding" as const,
    configKey: "company_name",
    description: "Main company name displayed across the app",
    configType: "text" as const,
    configValue: process.env.CLIENT_NAME || "LeadsByNova"
  },
  {
    category: "branding" as const, 
    configKey: "main_agent_headshot_url",
    description: "Primary agent headshot URL for submission form and chat pages",
    configType: "url" as const,
    configValue: "/placeholder-headshot.png"
  },
  {
    category: "branding" as const,
    configKey: "chat_header_title", 
    description: "Title shown in chat header (e.g. 'Chat with Real Estate Expert')",
    configType: "text" as const,
    configValue: "Chat with Real Estate Expert"
  },
  {
    category: "branding" as const,
    configKey: "company_logo",
    description: "Main company logo displayed on forms and headers",
    configType: "image" as const,
    configValue: "/placeholder-logo.png"
  },
  {
    category: "branding" as const,
    configKey: "header_logo",
    description: "Logo displayed in the application header/navigation",
    configType: "image" as const,
    configValue: "/placeholder-logo.png"
  },
  {
    category: "branding" as const,
    configKey: "footer_logo",
    description: "Logo displayed in the application footer",
    configType: "image" as const,
    configValue: "/placeholder-logo.png"
  },
  {
    category: "metadata" as const,
    configKey: "app_title",
    description: "Browser tab title (e.g. 'Lead Dashboard - Your Company')",
    configType: "text" as const,
    configValue: process.env.CLIENT_NAME || "LeadsByNova"
  },
  {
    category: "metadata" as const,
    configKey: "app_name",
    description: "Application name shown in manifests and PWA",
    configType: "text" as const,
    configValue: process.env.CLIENT_NAME || "LeadsByNova"
  },
  {
    category: "contact" as const,
    configKey: "primary_phone",
    description: "Primary phone number for email templates and contact info",
    configType: "text" as const,
    configValue: "(000) 000-0000"
  },
  {
    category: "contact" as const,
    configKey: "business_address",
    description: "Business address for email signatures (optional)",
    configType: "text" as const,
    configValue: ""
  },
  {
    category: "forms" as const,
    configKey: "submission_form_header",
    description: "Main header text on submission form",
    configType: "text" as const,
    configValue: "Get Your Free Real Estate Guide"
  },
  {
    category: "forms" as const,
    configKey: "submission_form_description",
    description: "Description text under form header",
    configType: "text" as const,
    configValue: "Unlock a guided experience that shows you exactly how LeadsByNova™ captures, qualifies, and delivers leads — automatically."
  },
  {
    category: "forms" as const,
    configKey: "phone_placeholder",
    description: "Placeholder text for phone input fields",
    configType: "text" as const,
    configValue: "(000) 000-0000"
  },
  {
    category: "urls" as const,
    configKey: "relocation_guide_url",
    description: "URL where users are redirected after requesting Relocation Guide",
    configType: "url" as const, 
    configValue: "/"
  },
  {
    category: "urls" as const,
    configKey: "first_time_buyer_guide_url",
    description: "URL where users are redirected after requesting First Time Home Buyer Guide", 
    configType: "url" as const,
    configValue: "/"
  },
  {
    category: "urls" as const,
    configKey: "sellers_guide_url",
    description: "URL where users are redirected after requesting Sellers Guide",
    configType: "url" as const,
    configValue: "/"
  },
  {
    category: "urls" as const,
    configKey: "chat_redirect_url",
    description: "URL to redirect users after chat completion",
    configType: "url" as const,
    configValue: "/"
  },
  {
    category: "urls" as const,
    configKey: "fallback_redirect_url",
    description: "Fallback URL for various redirects",
    configType: "url" as const,
    configValue: "/"
  },
  {
    category: "emails" as const,
    configKey: "primary_agent_email",
    description: "Main agent email for lead notifications",
    configType: "email" as const,
    configValue: "configure-your-email@example.com"
  },
  {
    category: "emails" as const,
    configKey: "sender_email",
    description: "Email address used to send emails to leads",
    configType: "email" as const,
    configValue: "configure-your-email@example.com"
  },
  {
    category: "emails" as const,
    configKey: "agent_signature_name",
    description: "Agent name for email signatures",
    configType: "text" as const,
    configValue: "Your Real Estate Agent"
  },
  {
    category: "emails" as const,
    configKey: "agent_signature_title",
    description: "Agent title/position for email signatures",
    configType: "text" as const,
    configValue: "Licensed Real Estate Agent"
  },
  {
    category: "emails" as const,
    configKey: "email_closing_message",
    description: "Closing message in welcome emails",
    configType: "text" as const,
    configValue: "Your Real Estate Expert"
  },
  {
    category: "styling" as const,
    configKey: "primary_color",
    description: "Primary brand color (hex code)",
    configType: "color" as const,
    configValue: "#1E3A8A"
  },
  {
    category: "styling" as const,
    configKey: "secondary_color", 
    description: "Secondary brand color (hex code)",
    configType: "color" as const,
    configValue: "#3B82F6"
  },
  {
    category: "styling" as const,
    configKey: "font_family",
    description: "Primary font family for headings",
    configType: "font" as const,
    configValue: "Inter, sans-serif"
  },
  {
    category: "legal" as const,
    configKey: "sms_optin_text",
    description: "Full text for SMS consent disclosure",
    configType: "text" as const,
    configValue: "SMS Opt-in (Program: LeadsByNova™ Platform Updates & Promotions): By providing your phone number and submitting this form, you agree to receive marketing and informational text messages from LeadsByNova™ regarding product updates, feature releases, and promotional offers at the number provided. Consent is not a condition of purchase. Message frequency may vary. Message & data rates may apply. Reply STOP to opt out or HELP for help."
  },
  {
    category: "legal" as const,
    configKey: "sms_privacy_url",
    description: "Link to Privacy Policy for SMS opt-in",
    configType: "url" as const,
    configValue: ""
  },
  {
    category: "legal" as const,
    configKey: "sms_terms_url",
    description: "Link to Terms & Conditions for SMS opt-in",
    configType: "url" as const,
    configValue: ""
  },
  {
    category: "legal" as const,
    configKey: "email_optin_text",
    description: "Full text for email consent disclosure",
    configType: "text" as const,
    configValue: "Email Opt-in (Program: LeadsByNova™ Platform Updates & Promotions): By submitting this form, you agree to receive marketing emails from LeadsByNova™, including product announcements, feature updates, special offers, and educational content designed to help you grow your business. You can unsubscribe at any time."
  },
  {
    category: "legal" as const,
    configKey: "email_privacy_url",
    description: "Link to Privacy Policy for email opt-in",
    configType: "url" as const,
    configValue: ""
  },
  {
    category: "legal" as const,
    configKey: "email_terms_url",
    description: "Link to Terms & Conditions for email opt-in",
    configType: "url" as const,
    configValue: ""
  }
];

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User authentication methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserFromData(user: CreateUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deactivateUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  initializeDefaultUsers(): Promise<void>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  getFormSubmissions(): Promise<FormSubmission[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  updateLeadNotes(id: string, noteContent: string): Promise<Lead | undefined>;
  getLeads(): Promise<Lead[]>;
  getLeadByEmail(email: string): Promise<Lead | undefined>;
  permanentlyDeleteLead(id: string): Promise<boolean>;
  createEvent(event: InsertEvent, userId: string, leadId?: string): Promise<Event>;
  getEvents(userId: string): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>; // Get all events across all users (for booking availability)
  getEventsByUserId(userId: string): Promise<Event[]>; // For admin viewing agent events
  getEventById(id: string, userId: string): Promise<Event | undefined>;
  updateEvent(id: string, event: Partial<InsertEvent>, userId: string): Promise<Event | undefined>;
  deleteEvent(id: string, userId: string): Promise<boolean>;
  // Notes methods
  createNote(note: InsertNote, userId: string): Promise<Note>;
  getNotes(userId: string): Promise<Note[]>;
  getNoteById(id: string, userId: string): Promise<Note | undefined>;
  updateNote(id: string, note: Partial<InsertNote>, userId: string): Promise<Note | undefined>;
  deleteNote(id: string, userId: string): Promise<boolean>;
  // Configuration methods
  createAgent(agent: InsertAgent): Promise<Agent>;
  getAgents(): Promise<Agent[]>;
  getAgentById(id: string): Promise<Agent | undefined>;
  updateAgent(id: string, agent: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;
  createAppConfig(config: InsertAppConfig): Promise<AppConfiguration>;
  getAppConfigs(): Promise<AppConfiguration[]>;
  getAppConfigByKey(key: string): Promise<AppConfiguration | undefined>;
  updateAppConfig(key: string, config: Partial<InsertAppConfig>): Promise<AppConfiguration | undefined>;
  deleteAppConfig(key: string): Promise<boolean>;
  // Consent record methods
  createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord>;
  getConsentRecords(): Promise<ConsentRecord[]>;
  searchConsentRecords(searchTerm: string): Promise<ConsentRecord[]>;
  deleteAllConsentRecords(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private formSubmissions: Map<string, FormSubmission>;
  private leads: Map<string, Lead>;
  private events: Map<string, Event>;
  private notes: Map<string, Note>;
  private agents: Map<string, Agent>;
  private appConfigs: Map<string, AppConfiguration>;

  constructor() {
    this.users = new Map();
    this.formSubmissions = new Map();
    this.leads = new Map();
    this.events = new Map();
    this.notes = new Map();
    this.agents = new Map();
    this.appConfigs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async createUserFromData(userData: CreateUser): Promise<User> {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    return this.createUser({
      email: userData.email,
      hashedPassword,
      role: userData.role,
      agentName: userData.agentName || null,
      isActive: userData.isActive || "true"
    });
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deactivateUser(id: string): Promise<boolean> {
    const user = await this.updateUser(id, { isActive: "false" });
    return !!user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async initializeDefaultUsers(): Promise<void> {
    // Check if users already exist
    const existingUsers = await this.getAllUsers();
    if (existingUsers.length > 0) {
      console.log(`👥 Found ${existingUsers.length} existing users, skipping user initialization`);
      return;
    }

    console.log("👥 Initializing client user accounts...");
    
    // Get client credentials from environment variables
    const clientEmail = process.env.CLIENT_EMAIL;
    const clientPassword = process.env.CLIENT_PASSWORD;
    const clientName = process.env.CLIENT_NAME;

    // Create SuperAdmin (LeadsByNova platform access - YOU, not the client)
    await this.createUserFromData({
      email: "admin@leadsbynova.com",
      password: process.env.ADMIN_PASSWORD || "password",
      role: "superadmin",
      agentName: null,
      isActive: "true"
    });
    console.log("✅ SuperAdmin account created for LeadsByNova platform management");

    // Create Client Owner Account (required)
    if (!clientEmail || !clientPassword) {
      console.warn("⚠️  WARNING: CLIENT_EMAIL and CLIENT_PASSWORD not set!");
      console.warn("   Client will not be able to log in until you configure these variables");
      console.warn("   Set CLIENT_EMAIL and CLIENT_PASSWORD in your environment to create the client account");
      return;
    }

    await this.createUserFromData({
      email: clientEmail,
      password: clientPassword, 
      role: "owner",
      agentName: null,
      isActive: "true"
    });

    console.log("✅ Client owner account created");
    console.log(`📧 Client login: ${clientEmail}`);
    console.log(`   Name: ${clientName || 'Not specified'}`);
    
    // Create corresponding agent record for Agent Management
    const agentName = clientName || clientEmail.split('@')[0];
    await this.createAgent({
      name: agentName,
      email: clientEmail,
      phone: null,
      headshotUrl: null,
      isActive: "true",
      displayOrder: "0"
    });
    console.log(`✅ Agent record created for ${agentName}`);
    console.log("   → Client will appear in Agent Management and can change password there");
    
    console.log("");
    console.log("🔐 IMPORTANT: Provide these credentials to your client:");
    console.log(`   Email: ${clientEmail}`);
    console.log(`   Password: ${clientPassword}`);
    console.log("");
    console.log("💡 Recommend the client changes their password after first login");
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
      leadStatus: insertLead.leadStatus || "pending",
      sentToDashboard: insertLead.sentToDashboard || "false",
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

  async createEvent(insertEvent: InsertEvent, userId: string, leadId?: string): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      id,
      userId,
      leadId: leadId || null,
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

  async getEvents(userId: string): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => 
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      );
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values())
      .sort((a, b) => 
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      );
  }

  async getEventsByUserId(userId: string): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => 
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      );
  }

  async getEventById(id: string, userId: string): Promise<Event | undefined> {
    const event = this.events.get(id);
    // Only return event if it belongs to the user
    return event && event.userId === userId ? event : undefined;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>, userId: string): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent || existingEvent.userId !== userId) return undefined;

    const updatedEvent: Event = {
      ...existingEvent,
      ...updates
    };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string, userId: string): Promise<boolean> {
    const event = this.events.get(id);
    if (!event || event.userId !== userId) return false;
    return this.events.delete(id);
  }

  async createNote(insertNote: InsertNote, userId: string): Promise<Note> {
    const id = randomUUID();
    const note: Note = {
      id,
      userId,
      headline: insertNote.headline,
      content: insertNote.content,
      createdAt: new Date()
    };
    this.notes.set(id, note);
    return note;
  }

  async getNotes(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getNoteById(id: string, userId: string): Promise<Note | undefined> {
    const note = this.notes.get(id);
    return note && note.userId === userId ? note : undefined;
  }

  async updateNote(id: string, updates: Partial<InsertNote>, userId: string): Promise<Note | undefined> {
    const existingNote = this.notes.get(id);
    if (!existingNote || existingNote.userId !== userId) return undefined;

    const updatedNote: Note = {
      ...existingNote,
      ...updates
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    const note = this.notes.get(id);
    if (!note || note.userId !== userId) return false;
    return this.notes.delete(id);
  }

  async permanentlyDeleteLead(id: string): Promise<boolean> {
    // Delete associated events first (cascade delete)
    const eventsToDelete = Array.from(this.events.values())
      .filter(event => event.leadId === id);
    eventsToDelete.forEach(event => this.events.delete(event.id));
    
    // Delete the lead
    return this.leads.delete(id);
  }

  // Agent configuration methods
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    const agent: Agent = {
      id,
      name: insertAgent.name,
      email: insertAgent.email,
      headshotUrl: insertAgent.headshotUrl || null,
      isActive: insertAgent.isActive || "true",
      displayOrder: insertAgent.displayOrder || "0",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agents.set(id, agent);
    return agent;
  }

  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values()).sort((a, b) => 
      parseInt(a.displayOrder || "0") - parseInt(b.displayOrder || "0")
    );
  }

  async getAgentById(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
    const existingAgent = this.agents.get(id);
    if (!existingAgent) return undefined;
    
    const updatedAgent: Agent = {
      ...existingAgent,
      ...updates,
      updatedAt: new Date()
    };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<boolean> {
    // Get the agent to find the associated user email
    const agent = this.agents.get(id);
    if (!agent) return false;
    
    // Delete the agent record
    const agentDeleted = this.agents.delete(id);
    
    // Delete the associated user account if email exists
    if (agent.email) {
      // Find and delete the user by email
      const userEntries = Array.from(this.users.entries());
      for (const [userId, user] of userEntries) {
        if (user.email === agent.email) {
          this.users.delete(userId);
          break;
        }
      }
    }
    
    return agentDeleted;
  }

  // App configuration methods
  async createAppConfig(insertConfig: InsertAppConfig): Promise<AppConfiguration> {
    const id = randomUUID();
    const config: AppConfiguration = {
      id,
      configKey: insertConfig.configKey,
      configValue: insertConfig.configValue,
      configType: insertConfig.configType,
      description: insertConfig.description || null,
      category: insertConfig.category,
      updatedAt: new Date()
    };
    this.appConfigs.set(insertConfig.configKey, config);
    return config;
  }

  async getAppConfigs(): Promise<AppConfiguration[]> {
    return Array.from(this.appConfigs.values()).sort((a, b) => 
      a.category.localeCompare(b.category) || a.configKey.localeCompare(b.configKey)
    );
  }

  async getAppConfigByKey(key: string): Promise<AppConfiguration | undefined> {
    return this.appConfigs.get(key);
  }

  async updateAppConfig(key: string, updates: Partial<InsertAppConfig>): Promise<AppConfiguration | undefined> {
    const existingConfig = this.appConfigs.get(key);
    if (!existingConfig) return undefined;
    
    const updatedConfig: AppConfiguration = {
      ...existingConfig,
      ...updates,
      updatedAt: new Date()
    };
    this.appConfigs.set(key, updatedConfig);
    return updatedConfig;
  }

  async deleteAppConfig(key: string): Promise<boolean> {
    return this.appConfigs.delete(key);
  }

  // Consent record methods
  private consentRecords: Map<string, ConsentRecord> = new Map();

  async createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord> {
    const id = randomUUID();
    const now = new Date();
    const consentRecord: ConsentRecord = {
      ...record,
      id,
      ipAddress: record.ipAddress || null,
      userAgent: record.userAgent || null,
      createdAt: now
    };
    this.consentRecords.set(id, consentRecord);
    return consentRecord;
  }

  async getConsentRecords(): Promise<ConsentRecord[]> {
    return Array.from(this.consentRecords.values()).sort((a, b) => 
      b.formTimestamp.getTime() - a.formTimestamp.getTime()
    );
  }

  async searchConsentRecords(searchTerm: string): Promise<ConsentRecord[]> {
    const lowerSearch = searchTerm.toLowerCase();
    return Array.from(this.consentRecords.values())
      .filter(record => 
        record.fullName.toLowerCase().includes(lowerSearch) ||
        record.email.toLowerCase().includes(lowerSearch) ||
        record.phone.includes(searchTerm)
      )
      .sort((a, b) => b.formTimestamp.getTime() - a.formTimestamp.getTime());
  }

  async deleteAllConsentRecords(): Promise<void> {
    this.consentRecords.clear();
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
    return this.executeWithRetry(async () => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return this.executeWithRetry(async () => {
      const [user] = await db.insert(users).values(insertUser as any).returning();
      return user;
    });
  }

  async createUserFromData(userData: CreateUser): Promise<User> {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    return this.createUser({
      email: userData.email,
      hashedPassword,
      role: userData.role,
      agentName: userData.agentName || null,
      isActive: userData.isActive || "true"
    });
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const [user] = await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date()
        } as any)
        .where(eq(users.id, id))
        .returning();
      return user;
    });
  }

  async deactivateUser(id: string): Promise<boolean> {
    const user = await this.updateUser(id, { isActive: "false" });
    return !!user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(users).orderBy(users.createdAt);
      return result;
    });
  }

  async initializeDefaultUsers(): Promise<void> {
    // Check if users already exist
    const existingUsers = await this.getAllUsers();
    if (existingUsers.length > 0) {
      console.log(`👥 Found ${existingUsers.length} existing users, skipping user initialization`);
      return;
    }

    console.log("👥 Initializing client user accounts...");
    
    try {
      // Get client credentials from environment variables
      const clientEmail = process.env.CLIENT_EMAIL;
      const clientPassword = process.env.CLIENT_PASSWORD;
      const clientName = process.env.CLIENT_NAME;

      // Create SuperAdmin (LeadsByNova platform access - YOU, not the client)
      await this.createUserFromData({
        email: "admin@leadsbynova.com",
        password: process.env.ADMIN_PASSWORD || "change-me-immediately",
        role: "superadmin",
        agentName: null,
        isActive: "true"
      });
      console.log("✅ SuperAdmin account created for LeadsByNova platform management");

      // Create Client Owner Account (required)
      if (!clientEmail || !clientPassword) {
        console.warn("⚠️  WARNING: CLIENT_EMAIL and CLIENT_PASSWORD not set!");
        console.warn("   Client will not be able to log in until you configure these variables");
        console.warn("   Set CLIENT_EMAIL and CLIENT_PASSWORD in your environment to create the client account");
        return;
      }

      await this.createUserFromData({
        email: clientEmail,
        password: clientPassword, 
        role: "owner",
        agentName: null,
        isActive: "true"
      });

      console.log("✅ Client owner account created");
      console.log(`📧 Client login: ${clientEmail}`);
      console.log(`   Name: ${clientName || 'Not specified'}`);
      
      // Create corresponding agent record for Agent Management
      const agentName = clientName || clientEmail.split('@')[0];
      await this.createAgent({
        name: agentName,
        email: clientEmail,
        phone: null,
        headshotUrl: null,
        isActive: "true",
        displayOrder: "0"
      });
      console.log(`✅ Agent record created for ${agentName}`);
      console.log("   → Client will appear in Agent Management and can change password there");
      
      console.log("");
      console.log("🔐 IMPORTANT: Provide these credentials to your client:");
      console.log(`   Email: ${clientEmail}`);
      console.log(`   Password: ${clientPassword}`);
      console.log("");
      console.log("💡 Recommend the client changes their password after first login");
    } catch (error) {
      console.error("❌ Error creating client user accounts:", error);
    }
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
      const [lead] = await db.insert(leads).values(insertLead as any).returning();
      return lead;
    });
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    return this.executeWithRetry(async () => {
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
      const result = await db.select().from(leads).orderBy(leads.createdAt);
      return result.reverse(); // Most recent first
    });
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    return this.executeWithRetry(async () => {
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
      const [lead] = await db.select().from(leads).where(eq(leads.id, id));
      return lead;
    });
  }

  async permanentlyDeleteLead(id: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      // Delete associated events first (cascade delete)
      await db.delete(events).where(eq(events.leadId, id));
      
      // Delete the lead
      const result = await db.delete(leads).where(eq(leads.id, id));
      return (result.rowCount ?? 0) > 0;
    });
  }

  async createEvent(insertEvent: InsertEvent, userId: string, leadId?: string): Promise<Event> {
    return this.executeWithRetry(async () => {
      const eventWithUser = { ...insertEvent, userId, leadId: leadId || null };
      const [event] = await db.insert(events).values(eventWithUser).returning();
      return event;
    });
  }

  async getEvents(userId: string): Promise<Event[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(events)
        .where(eq(events.userId, userId))
        .orderBy(events.date, events.startTime);
      return result;
    });
  }

  async getAllEvents(): Promise<Event[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(events)
        .orderBy(events.date, events.startTime);
      return result;
    });
  }

  async getEventsByUserId(userId: string): Promise<Event[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(events)
        .where(eq(events.userId, userId))
        .orderBy(events.date, events.startTime);
      return result;
    });
  }

  async getEventById(id: string, userId: string): Promise<Event | undefined> {
    return this.executeWithRetry(async () => {
      const [event] = await db.select().from(events)
        .where(and(eq(events.id, id), eq(events.userId, userId)));
      return event;
    });
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>, userId: string): Promise<Event | undefined> {
    return this.executeWithRetry(async () => {
      const [event] = await db
        .update(events)
        .set(updates)
        .where(and(eq(events.id, id), eq(events.userId, userId)))
        .returning();
      return event;
    });
  }

  async deleteEvent(id: string, userId: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const result = await db.delete(events)
        .where(and(eq(events.id, id), eq(events.userId, userId)));
      return (result.rowCount ?? 0) > 0;
    });
  }

  async createNote(insertNote: InsertNote, userId: string): Promise<Note> {
    return this.executeWithRetry(async () => {
      const [note] = await db.insert(notes).values({
        ...insertNote,
        userId
      } as any).returning();
      return note;
    });
  }

  async getNotes(userId: string): Promise<Note[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.createdAt));
      return result;
    });
  }

  async getNoteById(id: string, userId: string): Promise<Note | undefined> {
    return this.executeWithRetry(async () => {
      const [note] = await db.select().from(notes)
        .where(and(eq(notes.id, id), eq(notes.userId, userId)));
      return note;
    });
  }

  async updateNote(id: string, updates: Partial<InsertNote>, userId: string): Promise<Note | undefined> {
    return this.executeWithRetry(async () => {
      const [note] = await db
        .update(notes)
        .set(updates as any)
        .where(and(eq(notes.id, id), eq(notes.userId, userId)))
        .returning();
      return note;
    });
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const result = await db.delete(notes)
        .where(and(eq(notes.id, id), eq(notes.userId, userId)));
      return (result.rowCount ?? 0) > 0;
    });
  }

  // Agent configuration methods
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    return this.executeWithRetry(async () => {
      const [agent] = await db.insert(agents).values(insertAgent as any).returning();
      return agent;
    });
  }

  async getAgents(): Promise<Agent[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(agents).orderBy(agents.displayOrder, agents.name);
      return result;
    });
  }

  async getAgentById(id: string): Promise<Agent | undefined> {
    return this.executeWithRetry(async () => {
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      return agent;
    });
  }

  async updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
    return this.executeWithRetry(async () => {
      const [agent] = await db
        .update(agents)
        .set({
          ...updates,
          updatedAt: new Date()
        } as any)
        .where(eq(agents.id, id))
        .returning();
      return agent;
    });
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      // First, get the agent to find the associated user email
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      if (!agent) return false;
      
      // Delete the agent record
      const agentResult = await db.delete(agents).where(eq(agents.id, id));
      
      // Delete the associated user account if email exists
      if (agent.email) {
        await db.delete(users).where(eq(users.email, agent.email));
      }
      
      return (agentResult.rowCount ?? 0) > 0;
    });
  }

  // App configuration methods
  async createAppConfig(insertConfig: InsertAppConfig): Promise<AppConfiguration> {
    return this.executeWithRetry(async () => {
      const [config] = await db.insert(appConfiguration).values(insertConfig as any).returning();
      return config;
    });
  }

  async getAppConfigs(): Promise<AppConfiguration[]> {
    return this.executeWithRetry(async () => {
      const result = await db.select().from(appConfiguration).orderBy(appConfiguration.category, appConfiguration.configKey);
      return result;
    });
  }

  async getAppConfigByKey(key: string): Promise<AppConfiguration | undefined> {
    return this.executeWithRetry(async () => {
      const [config] = await db.select().from(appConfiguration).where(eq(appConfiguration.configKey, key));
      return config;
    });
  }

  async updateAppConfig(key: string, updates: Partial<InsertAppConfig>): Promise<AppConfiguration | undefined> {
    return this.executeWithRetry(async () => {
      const [config] = await db
        .update(appConfiguration)
        .set({
          ...updates,
          updatedAt: new Date()
        } as any)
        .where(eq(appConfiguration.configKey, key))
        .returning();
      return config;
    });
  }

  async deleteAppConfig(key: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const result = await db.delete(appConfiguration).where(eq(appConfiguration.configKey, key));
      return (result.rowCount ?? 0) > 0;
    });
  }

  // Consent record methods
  async createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord> {
    return this.executeWithRetry(async () => {
      const [consentRecord] = await db.insert(consentRecords).values(record as any).returning();
      return consentRecord;
    });
  }

  async getConsentRecords(): Promise<ConsentRecord[]> {
    return this.executeWithRetry(async () => {
      return await db.select().from(consentRecords).orderBy(desc(consentRecords.formTimestamp));
    });
  }

  async searchConsentRecords(searchTerm: string): Promise<ConsentRecord[]> {
    return this.executeWithRetry(async () => {
      const { ilike, or } = await import('drizzle-orm');
      return await db
        .select()
        .from(consentRecords)
        .where(
          or(
            ilike(consentRecords.fullName, `%${searchTerm}%`),
            ilike(consentRecords.email, `%${searchTerm}%`),
            ilike(consentRecords.phone, `%${searchTerm}%`)
          )
        )
        .orderBy(desc(consentRecords.formTimestamp));
    });
  }

  async deleteAllConsentRecords(): Promise<void> {
    return this.executeWithRetry(async () => {
      await db.delete(consentRecords);
    });
  }
}

class FallbackStorage implements IStorage {
  private databaseStorage = new DatabaseStorage();
  private memoryStorage = new MemStorage();
  private isDatabaseAvailable = true;
  private lastDatabaseCheck = 0;
  private readonly checkInterval = 60000; // Check database availability every minute
  private initializationPromise: Promise<void> | null = null;

  // Initialize default configurations and agents on first run
  async initializeDefaults(): Promise<void> {
    // Prevent multiple initializations from running simultaneously
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    if (!(await this.isDatabaseHealthy())) {
      console.log("Database not available, skipping configuration initialization");
      return;
    }

    try {
      // Initialize predefined configurations if none exist
      const existingConfigs = await this.databaseStorage.getAppConfigs();
      
      if (existingConfigs.length === 0) {
        console.log("Initializing default configurations...");
        
        for (const config of PREDEFINED_CONFIGS) {
          try {
            await this.databaseStorage.createAppConfig(config);
            console.log(`✅ Created config: ${config.configKey}`);
          } catch (error: any) {
            // If config already exists (unique constraint), just continue
            if (error.code === '23505' || error.message?.includes('unique')) {
              console.log(`⚠️ Config ${config.configKey} already exists, skipping`);
            } else {
              console.error(`❌ Failed to create config ${config.configKey}:`, error.message);
            }
          }
        }
        
        console.log("✅ Default configurations initialized successfully");
      } else {
        console.log(`📋 Found ${existingConfigs.length} existing configurations, skipping initialization`);
      }

      // Initialize default users (which now also creates agent records)
      await this.databaseStorage.initializeDefaultUsers();

    } catch (error) {
      console.error("❌ Failed to initialize defaults:", error);
      throw error;
    }
  }

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

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.getUserByEmail(email),
      () => this.memoryStorage.getUserByEmail(email)
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.executeWithFallback(
      () => this.databaseStorage.createUser(user),
      () => this.memoryStorage.createUser(user)
    );
  }

  async createUserFromData(user: CreateUser): Promise<User> {
    return this.executeWithFallback(
      () => this.databaseStorage.createUserFromData(user),
      () => this.memoryStorage.createUserFromData(user)
    );
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.updateUser(id, updates),
      () => this.memoryStorage.updateUser(id, updates)
    );
  }

  async deactivateUser(id: string): Promise<boolean> {
    return this.executeWithFallback(
      () => this.databaseStorage.deactivateUser(id),
      () => this.memoryStorage.deactivateUser(id)
    );
  }

  async getAllUsers(): Promise<User[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getAllUsers(),
      () => this.memoryStorage.getAllUsers()
    );
  }

  async initializeDefaultUsers(): Promise<void> {
    return this.executeWithFallback(
      () => this.databaseStorage.initializeDefaultUsers(),
      () => this.memoryStorage.initializeDefaultUsers()
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

  async createEvent(event: InsertEvent, userId: string, leadId?: string): Promise<Event> {
    return this.executeWithFallback(
      () => this.databaseStorage.createEvent(event, userId, leadId),
      () => this.memoryStorage.createEvent(event, userId, leadId)
    );
  }

  async getEvents(userId: string): Promise<Event[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getEvents(userId),
      () => this.memoryStorage.getEvents(userId)
    );
  }

  async getAllEvents(): Promise<Event[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getAllEvents(),
      () => this.memoryStorage.getAllEvents()
    );
  }

  async getEventsByUserId(userId: string): Promise<Event[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getEventsByUserId(userId),
      () => this.memoryStorage.getEventsByUserId(userId)
    );
  }

  async getEventById(id: string, userId: string): Promise<Event | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.getEventById(id, userId),
      () => this.memoryStorage.getEventById(id, userId)
    );
  }

  async updateEvent(id: string, event: Partial<InsertEvent>, userId: string): Promise<Event | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.updateEvent(id, event, userId),
      () => this.memoryStorage.updateEvent(id, event, userId)
    );
  }

  async deleteEvent(id: string, userId: string): Promise<boolean> {
    return this.executeWithFallback(
      () => this.databaseStorage.deleteEvent(id, userId),
      () => this.memoryStorage.deleteEvent(id, userId)
    );
  }

  async permanentlyDeleteLead(id: string): Promise<boolean> {
    return this.executeWithFallback(
      () => this.databaseStorage.permanentlyDeleteLead(id),
      () => this.memoryStorage.permanentlyDeleteLead(id)
    );
  }

  async createNote(note: InsertNote, userId: string): Promise<Note> {
    return this.executeWithFallback(
      () => this.databaseStorage.createNote(note, userId),
      () => this.memoryStorage.createNote(note, userId)
    );
  }

  async getNotes(userId: string): Promise<Note[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getNotes(userId),
      () => this.memoryStorage.getNotes(userId)
    );
  }

  async getNoteById(id: string, userId: string): Promise<Note | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.getNoteById(id, userId),
      () => this.memoryStorage.getNoteById(id, userId)
    );
  }

  async updateNote(id: string, note: Partial<InsertNote>, userId: string): Promise<Note | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.updateNote(id, note, userId),
      () => this.memoryStorage.updateNote(id, note, userId)
    );
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    return this.executeWithFallback(
      () => this.databaseStorage.deleteNote(id, userId),
      () => this.memoryStorage.deleteNote(id, userId)
    );
  }

  // Configuration fallback methods
  async createAgent(agent: InsertAgent): Promise<Agent> {
    return this.executeWithFallback(
      () => this.databaseStorage.createAgent(agent),
      () => this.memoryStorage.createAgent(agent)
    );
  }

  async getAgents(): Promise<Agent[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getAgents(),
      () => this.memoryStorage.getAgents()
    );
  }

  async getAgentById(id: string): Promise<Agent | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.getAgentById(id),
      () => this.memoryStorage.getAgentById(id)
    );
  }

  async updateAgent(id: string, agent: Partial<InsertAgent>): Promise<Agent | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.updateAgent(id, agent),
      () => this.memoryStorage.updateAgent(id, agent)
    );
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.executeWithFallback(
      () => this.databaseStorage.deleteAgent(id),
      () => this.memoryStorage.deleteAgent(id)
    );
  }

  async createAppConfig(config: InsertAppConfig): Promise<AppConfiguration> {
    return this.executeWithFallback(
      () => this.databaseStorage.createAppConfig(config),
      () => this.memoryStorage.createAppConfig(config)
    );
  }

  async getAppConfigs(): Promise<AppConfiguration[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getAppConfigs(),
      () => this.memoryStorage.getAppConfigs()
    );
  }

  async getAppConfigByKey(key: string): Promise<AppConfiguration | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.getAppConfigByKey(key),
      () => this.memoryStorage.getAppConfigByKey(key)
    );
  }

  async updateAppConfig(key: string, config: Partial<InsertAppConfig>): Promise<AppConfiguration | undefined> {
    return this.executeWithFallback(
      () => this.databaseStorage.updateAppConfig(key, config),
      () => this.memoryStorage.updateAppConfig(key, config)
    );
  }

  async deleteAppConfig(key: string): Promise<boolean> {
    return this.executeWithFallback(
      () => this.databaseStorage.deleteAppConfig(key),
      () => this.memoryStorage.deleteAppConfig(key)
    );
  }

  // Consent record methods
  async createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord> {
    return this.executeWithFallback(
      () => this.databaseStorage.createConsentRecord(record),
      () => this.memoryStorage.createConsentRecord(record)
    );
  }

  async getConsentRecords(): Promise<ConsentRecord[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.getConsentRecords(),
      () => this.memoryStorage.getConsentRecords()
    );
  }

  async searchConsentRecords(searchTerm: string): Promise<ConsentRecord[]> {
    return this.executeWithFallback(
      () => this.databaseStorage.searchConsentRecords(searchTerm),
      () => this.memoryStorage.searchConsentRecords(searchTerm)
    );
  }

  async deleteAllConsentRecords(): Promise<void> {
    return this.executeWithFallback(
      () => this.databaseStorage.deleteAllConsentRecords(),
      () => this.memoryStorage.deleteAllConsentRecords()
    );
  }
}

export const storage = new FallbackStorage();
