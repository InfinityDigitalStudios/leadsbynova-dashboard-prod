import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  role: text("role").notNull(), // 'superadmin', 'owner', 'agent'
  agentName: text("agent_name"), // Links to agent for role-based access (null for superadmin/owner)
  isActive: text("is_active").default("true"), // 'true' or 'false'
  tokenVersion: text("token_version").default("0"), // For session invalidation on password change
  passwordResetToken: text("password_reset_token"), // Token for password reset
  resetTokenExpiry: timestamp("reset_token_expiry"), // Expiry time for reset token
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const formSubmissions = pgTable("form_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  guideType: text("guide_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  content: text("content").notNull(),
  isBot: text("is_bot").notNull(), // 'true' or 'false' as text
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Form data
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  guideType: text("guide_type").notNull(),
  formTimestamp: timestamp("form_timestamp").notNull(),
  
  // Chat data
  chatTimestamp: timestamp("chat_timestamp"),
  
  // LeadsByNova chat fields
  userType: text("user_type"), // Real Estate Agent, Small Business Owner, Marketing Professional, etc.
  mainGoal: text("main_goal"), // Generate more leads, Save time with AI tools, Learn about the platform
  leadManagement: text("lead_management"), // Google Sheets, CRM, No system, Assistant handles it
  timeline: text("timeline"), // Immediately, Within the next month, Within 3 months, Just gathering information
  communicationPreference: text("communication_preference"), // Email, Text Message, Phone Call, Any is fine
  bookedCall: text("booked_call"), // Yes with Zoom details or No
  daySelected: text("day_selected"), // Zoom appointment date
  timeSelected: text("time_selected"), // Zoom appointment time
  
  // Legacy fields (kept for backward compatibility but unused)
  prequalified: text("prequalified"),
  preQualificationRange: text("pre_qualification_range"),
  moveTimeline: text("move_timeline"),
  budgetRange: text("budget_range"),
  needToBuy: text("need_to_buy"),
  occupancyStatus: text("occupancy_status"),
  priceRange: text("price_range"),
  recentUpgrades: text("recent_upgrades"),
  haveAgent: text("have_agent"),
  propertyType: text("property_type"),
  
  // Status
  leadStatus: text("lead_status").default("pending"), // 'pending', 'in_chat', 'completed', 'opt_out', 'abandoned'
  sentToDashboard: text("sent_to_dashboard").default("false"), // 'true' or 'false'
  completedChat: text("completed_chat").default("false"), // 'true' or 'false'
  
  // Agent notes
  notes: jsonb("notes").$type<Array<{ timestamp: string; content: string }>>(),
  
  // Assignment
  assignedTo: text("assigned_to"), // Will store agent name: "Sarah Johnson" or "Mitchell Young"
  
  // Sales funnel status - supports both buyer and seller pipeline stages
  salesFunnelStatus: text("sales_funnel_status").default("New"), // Buyer: 'New', 'Contacted', 'Appointment Set', 'Showing Scheduled', 'Offer Made', 'Under Contract', 'Closed', 'Nurture', 'Lost' | Seller: 'New', 'Contacted', 'Home Evaluation / CMA Requested', 'Appointment Set', 'Active Seller Client', 'On the Market', 'Under Contract', 'Closed/Sold', 'Nurture', 'Lost'
  
  // Archive status
  archived: text("archived").default("false"), // 'true' or 'false'
  
  // Soft delete
  deletedAt: timestamp("deleted_at"), // null = not deleted, timestamp = when deleted
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Links to users.id
  leadId: varchar("lead_id"), // Optional: Links to leads.id when event is from a booking
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  startTime: text("start_time").notNull(), // Format: HH:MM
  endTime: text("end_time").notNull(), // Format: HH:MM
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Links to users.id
  headline: text("headline").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Configuration tables for dynamic app customization
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  headshotUrl: text("headshot_url"),
  isActive: text("is_active").default("true"), // 'true' or 'false'
  displayOrder: text("display_order").default("0"), // For sorting agents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appConfiguration = pgTable("app_configuration", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: text("config_key").notNull().unique(),
  configValue: text("config_value").notNull(),
  configType: text("config_type").notNull(), // 'text', 'url', 'email', 'color', 'font', 'image'
  description: text("description"), // Human-readable description of what this controls
  category: text("category").notNull(), // 'branding', 'urls', 'emails', 'styling', 'metadata', 'contact', 'forms'
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fork isolation and tenant management
export const tenantMetadata = pgTable("tenant_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  forkId: text("fork_id").notNull().unique(), // Unique identifier for this fork
  databaseUrl: text("database_url").notNull(), // The DATABASE_URL this fork is using
  emailTo: text("email_to"), // The EMAIL_TO address for this fork
  description: text("description"), // Human-readable description of this fork
  isActive: text("is_active").default("true"), // 'true' or 'false'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastValidatedAt: timestamp("last_validated_at").defaultNow().notNull(),
});

// Consent records table - immutable opt-in proof that survives lead deletion
export const consentRecords = pgTable("consent_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  guideType: text("guide_type").notNull(),
  ipAddress: text("ip_address"), // IP address of the user when they submitted
  userAgent: text("user_agent"), // Browser/device information
  consentText: text("consent_text").notNull(), // Exact consent language shown on the form
  disclosureVersion: text("disclosure_version").notNull(), // Version identifier (e.g., "sms_disclosure_v1.0")
  disclosureHash: text("disclosure_hash").notNull(), // SHA-256 hash of disclosure text (first 12 chars for display)
  sourceUrl: text("source_url").notNull(), // URL where the form was submitted
  channelsConsented: text("channels_consented").notNull(), // Channels user consented to (e.g., "Email, SMS")
  senderName: text("sender_name").notNull(), // Who is sending (e.g., "LeadsByNova (on behalf of [Agent/Brokerage])")
  formTimestamp: timestamp("form_timestamp").notNull(), // When the form was submitted
  createdAt: timestamp("created_at").defaultNow().notNull(), // When this record was created
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  hashedPassword: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["superadmin", "owner", "agent"]),
  agentName: z.string().optional(),
  isActive: z.enum(["true", "false"]).default("true"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = insertUserSchema.omit({
  hashedPassword: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  createdAt: true,
}).extend({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  guideType: z.enum(["I'm a Business Owner", "I'm a Sales Agent", "I'm a Marketing Professional", "I'm Just Exploring"], {
    required_error: "Please select an account type"
  }),
  sourceUrl: z.string().optional(), // Captured from window.location.href on frontend
  disclosureHash: z.string().optional(), // SHA-256 hash computed on frontend
  consentText: z.string().optional(), // Exact consent text shown to user on frontend
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  sessionId: z.string().min(1, "Session ID is required"),
  content: z.string().min(1, "Message content is required"),
  isBot: z.enum(["true", "false"])
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Manual lead creation schema
export const createManualLeadSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  // Optional call booking fields
  bookCall: z.boolean().optional(),
  callDate: z.string().optional(), // YYYY-MM-DD format
  callTime: z.string().optional(), // HH:MM format
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  userId: true, // Will be added by backend from authenticated user
  leadId: true, // Optional: Will be added by backend when event is from a booking
  createdAt: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
}).refine((data) => {
  // Validate that start time is before end time
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startTimeMinutes = startHour * 60 + startMin;
  const endTimeMinutes = endHour * 60 + endMin;
  return startTimeMinutes < endTimeMinutes;
}, {
  message: "End time must be after start time",
  path: ["endTime"], // This will show the error on the endTime field
});

export const updateEventSchema = createInsertSchema(events).omit({
  id: true,
  userId: true, // Can't change event ownership
  createdAt: true,
}).extend({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format").optional(),
}).partial();

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  userId: true, // Will be added by backend from authenticated user
  createdAt: true,
}).extend({
  headline: z.string().min(1, "Headline is required"),
  content: z.string().min(1, "Content is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type CreateManualLead = z.infer<typeof createManualLeadSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(2, "Agent name must be at least 2 characters"),
  email: z.preprocess(
    (val) => val === "" ? undefined : val,
    z.string().email("Please enter a valid email address").optional()
  ),
  phone: z.preprocess(
    (val) => val === "" ? undefined : val,
    z.string().optional()
  ),
  headshotUrl: z.preprocess(
    (val) => val === "" ? undefined : val,
    z.string().refine(url => {
      // Allow relative URLs starting with /
      if (url.startsWith('/')) {
        return true;
      }
      // For absolute URLs, validate as normal URL with http/https
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      } catch {
        return false;
      }
    }, { message: "Must be a valid URL or path" }).optional()
  ),
  isActive: z.enum(["true", "false"]).default("true"),
  displayOrder: z.string().default("0"),
});

export const insertAppConfigSchema = createInsertSchema(appConfiguration).omit({
  id: true,
  updatedAt: true,
}).extend({
  configKey: z.string().min(1, "Config key is required"),
  configValue: z.string(),
  configType: z.enum(["text", "url", "email", "color", "font", "image"]),
  description: z.string().optional(),
  category: z.enum(["branding", "urls", "emails", "styling", "metadata", "contact", "forms", "legal"]),
}).refine((data) => {
  // Image type validation - allow empty strings and relative/absolute URLs
  if (data.configType === 'image') {
    // Allow empty string, relative paths starting with /, or absolute URLs
    return data.configValue === "" || 
           data.configValue.startsWith('/') || 
           data.configValue.startsWith('http://') || 
           data.configValue.startsWith('https://');
  }
  
  // URL type validation - require valid http/https URLs
  if (data.configType === 'url') {
    if (data.configValue.length < 1) return false;
    try {
      const parsedUrl = new URL(data.configValue);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  // For all other types, require non-empty value
  return data.configValue.length >= 1;
}, {
  message: "Config value is required",
  path: ["configValue"],
});

export const updateAppConfigSchema = createInsertSchema(appConfiguration).omit({
  id: true,
  updatedAt: true,
}).extend({
  configKey: z.string().min(1, "Config key is required").optional(),
  configValue: z.string().min(1, "Config value is required").optional(),
  configType: z.enum(["text", "url", "email", "color", "font", "image"]).optional(),
  description: z.string().optional(),
  category: z.enum(["branding", "urls", "emails", "styling", "metadata", "contact", "forms", "legal"]).optional(),
}).partial();

export const insertTenantMetadataSchema = createInsertSchema(tenantMetadata).omit({
  id: true,
  createdAt: true,
  lastValidatedAt: true,
}).extend({
  forkId: z.string().min(1, "Fork ID is required"),
  databaseUrl: z.string().url("Must be a valid database URL"),
  emailTo: z.string().email("Must be a valid email address").optional(),
  description: z.string().optional(),
  isActive: z.enum(["true", "false"]).default("true"),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type AppConfiguration = typeof appConfiguration.$inferSelect;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type UpdateAppConfig = z.infer<typeof updateAppConfigSchema>;
export type TenantMetadata = typeof tenantMetadata.$inferSelect;
export type InsertTenantMetadata = z.infer<typeof insertTenantMetadataSchema>;

export const insertConsentRecordSchema = createInsertSchema(consentRecords).omit({
  id: true,
  createdAt: true,
}).extend({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  guideType: z.enum(["I'm a Business Owner", "I'm a Sales Agent", "I'm a Marketing Professional", "I'm Just Exploring"]),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  consentText: z.string().min(1, "Consent text is required"),
  disclosureVersion: z.string().min(1, "Disclosure version is required"),
  disclosureHash: z.string().min(1, "Disclosure hash is required"),
  sourceUrl: z.string().url("Please provide a valid source URL"),
  channelsConsented: z.string().min(1, "Channels consented is required"),
  senderName: z.string().min(1, "Sender name is required"),
  formTimestamp: z.date(),
});

export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;

// Pipeline View types for new dashboard feature
export type SelectLead = typeof leads.$inferSelect;

export type PipelineStage = {
  stageOrder: string[];
  stages: Record<string, SelectLead[]>;
  totalLeads: number;
};

export type PipelineResponse = {
  leads: PipelineStage;
  metadata: {
    totalLeads: number;
    userRole: string;
    timestamp: string;
  };
};
