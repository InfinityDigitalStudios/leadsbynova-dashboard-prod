import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  
  // LeadsByNova chat data
  chatTimestamp: timestamp("chat_timestamp"),
  userType: text("user_type"),
  mainGoal: text("main_goal"),
  leadManagement: text("lead_management"),
  timeline: text("timeline"),
  communicationPreference: text("communication_preference"),
  bookedCall: text("booked_call"),
  daySelected: text("day_selected"),
  timeSelected: text("time_selected"),
  
  // Demo booking call type (for /guide page bookings)
  callType: text("call_type"), // "Zoom" or "Phone"
  
  // Legacy real estate fields (kept for backwards compatibility, not used in LeadsByNova fork)
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
  leadStatus: text("lead_status"),
  sentToDashboard: text("sent_to_dashboard"),
  completedChat: text("completed_chat").default("false"), // 'true' or 'false'
  salesFunnelStatus: text("sales_funnel_status"),
  
  // Agent notes
  notes: jsonb("notes").$type<Array<{ timestamp: string; content: string }>>(),
  
  // Assignment
  assignedTo: text("assigned_to"), // Will store agent name: "Sarah Johnson" or "Mitchell Young"
  
  // Archive status
  archived: text("archived").default("false"), // 'true' or 'false'
  
  // Soft delete
  deletedAt: timestamp("deleted_at"), // null = not deleted, timestamp = when deleted
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  startTime: text("start_time").notNull(), // Format: HH:MM
  endTime: text("end_time").notNull(), // Format: HH:MM
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  time: text("time").notNull(), // Format: "9AM EST", "10AM EST", etc.
  timePeriod: text("time_period").notNull(), // "Morning", "Mid-Day", or "Afternoon"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  createdAt: true,
}).extend({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  guideType: z.enum(["Relocation Guide", "First Time Home Buyer Guide", "Sellers Guide"], {
    required_error: "Please select a guide type"
  })
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

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
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
  createdAt: true,
}).extend({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format").optional(),
}).partial();

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Valid email is required"),
  fullName: z.string().min(1, "Full name is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().min(1, "Time is required"),
  timePeriod: z.enum(["Morning", "Mid-Day", "Afternoon"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Pipeline types for dashboard
export interface PipelineStage {
  stageOrder: string[];
  stages: Record<string, Lead[]>;
  totalLeads: number;
}

export interface PipelineResponse {
  pipelines: {
    leads: PipelineStage;
    buyer: PipelineStage;
    seller: PipelineStage;
  };
  unknownLeads: Lead[];
  metadata: {
    totalLeads: number;
    userRole: string;
    timestamp: string;
  };
}
