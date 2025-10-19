/**
 * Comprehensive Environment Variable Validation System
 * 
 * Validates all required and optional environment variables for proper fork isolation
 * and application configuration. Provides clear setup guidance for new forks.
 */

import { z } from "zod";
import { log } from "./vite";

export interface EnvironmentConfig {
  // Required for fork isolation
  forkId: string;
  databaseUrl: string;
  emailTo: string;
  
  // Optional configuration
  forkDescription?: string;
  nodeEnv: string;
  port: number;
  
  // Client credentials (optional, but recommended)
  clientEmail?: string;
  clientPassword?: string;
  clientName?: string;
  adminPassword?: string;
  
  // Development overrides (security-gated)
  overrideAllowSharedDb?: boolean;
  confirmSharedDbRisk?: boolean;
}

export class EnvironmentValidationError extends Error {
  constructor(message: string, public code: string, public variable: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

const environmentSchema = z.object({
  // Fork isolation variables (required)
  FORK_ID: z.string()
    .min(1, "FORK_ID must not be empty")
    .max(50, "FORK_ID must be 50 characters or less")
    .regex(/^[a-zA-Z0-9-_]+$/, "FORK_ID can only contain letters, numbers, hyphens, and underscores"),
  
  DATABASE_URL: z.string()
    .url("DATABASE_URL must be a valid URL")
    .regex(/^postgres/, "DATABASE_URL must be a PostgreSQL connection string"),
    
  EMAIL_TO: z.string()
    .email("EMAIL_TO must be a valid email address")
    .min(1, "EMAIL_TO is required for lead notifications"),
  
  // Optional variables
  FORK_DESCRIPTION: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/, "PORT must be a number").default("5000"),
  
  // Client credential variables (optional but recommended)
  CLIENT_EMAIL: z.string().email("CLIENT_EMAIL must be a valid email address").optional(),
  CLIENT_PASSWORD: z.string().min(8, "CLIENT_PASSWORD should be at least 8 characters").optional(),
  CLIENT_NAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD should be at least 8 characters").optional(),
  
  // Security override variables (development only)
  OVERRIDE_ALLOW_SHARED_DB: z.enum(["true", "false"]).optional(),
  CONFIRM_SHARED_DB_RISK: z.string().optional(),
});

export function validateEnvironment(): EnvironmentConfig {
  const rawEnv = {
    FORK_ID: process.env.FORK_ID,
    DATABASE_URL: process.env.DATABASE_URL,
    EMAIL_TO: process.env.EMAIL_TO,
    FORK_DESCRIPTION: process.env.FORK_DESCRIPTION,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    CLIENT_EMAIL: process.env.CLIENT_EMAIL,
    CLIENT_PASSWORD: process.env.CLIENT_PASSWORD,
    CLIENT_NAME: process.env.CLIENT_NAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    OVERRIDE_ALLOW_SHARED_DB: process.env.OVERRIDE_ALLOW_SHARED_DB,
    CONFIRM_SHARED_DB_RISK: process.env.CONFIRM_SHARED_DB_RISK,
  };

  try {
    const validatedEnv = environmentSchema.parse(rawEnv);
    
    // Additional validation for security overrides
    if (validatedEnv.OVERRIDE_ALLOW_SHARED_DB === "true") {
      if (validatedEnv.NODE_ENV !== "development") {
        throw new EnvironmentValidationError(
          "OVERRIDE_ALLOW_SHARED_DB can only be used in development environment",
          "PRODUCTION_OVERRIDE_FORBIDDEN",
          "OVERRIDE_ALLOW_SHARED_DB"
        );
      }
      
      if (validatedEnv.CONFIRM_SHARED_DB_RISK !== "I_UNDERSTAND_DATA_ISOLATION_RISK") {
        throw new EnvironmentValidationError(
          "CONFIRM_SHARED_DB_RISK must be set to 'I_UNDERSTAND_DATA_ISOLATION_RISK' when using OVERRIDE_ALLOW_SHARED_DB",
          "MISSING_RISK_CONFIRMATION",
          "CONFIRM_SHARED_DB_RISK"
        );
      }
    }
    
    return {
      forkId: validatedEnv.FORK_ID,
      databaseUrl: validatedEnv.DATABASE_URL,
      emailTo: validatedEnv.EMAIL_TO,
      forkDescription: validatedEnv.FORK_DESCRIPTION,
      nodeEnv: validatedEnv.NODE_ENV,
      port: parseInt(validatedEnv.PORT),
      clientEmail: validatedEnv.CLIENT_EMAIL,
      clientPassword: validatedEnv.CLIENT_PASSWORD,
      clientName: validatedEnv.CLIENT_NAME,
      adminPassword: validatedEnv.ADMIN_PASSWORD,
      overrideAllowSharedDb: validatedEnv.OVERRIDE_ALLOW_SHARED_DB === "true",
      confirmSharedDbRisk: validatedEnv.CONFIRM_SHARED_DB_RISK === "I_UNDERSTAND_DATA_ISOLATION_RISK",
    };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert Zod validation errors to more user-friendly messages
      const firstError = error.errors[0];
      const variable = firstError.path[0] as string;
      
      throw new EnvironmentValidationError(
        `Invalid ${variable}: ${firstError.message}`,
        getErrorCode(variable, firstError.message),
        variable
      );
    }
    
    throw error;
  }
}

function getErrorCode(variable: string, message: string): string {
  const codeMap: Record<string, string> = {
    'FORK_ID': 'INVALID_FORK_ID',
    'DATABASE_URL': 'INVALID_DATABASE_URL', 
    'EMAIL_TO': 'INVALID_EMAIL_TO',
    'PORT': 'INVALID_PORT',
  };
  
  if (message.includes('Required')) {
    return `MISSING_${variable}`;
  }
  
  return codeMap[variable] || 'INVALID_ENVIRONMENT';
}

export function getEnvironmentSetupInstructions(error: EnvironmentValidationError): string[] {
  const instructions: string[] = [];
  
  switch (error.code) {
    case 'MISSING_FORK_ID':
    case 'INVALID_FORK_ID':
      instructions.push("🏷️  FORK_ID Setup:");
      instructions.push("   1. Choose a unique identifier for your fork (e.g., 'my-realestate-app')");
      instructions.push("   2. Set: export FORK_ID='my-realestate-app'");
      instructions.push("   3. Use only letters, numbers, hyphens, and underscores");
      instructions.push("   4. Keep it under 50 characters");
      break;
      
    case 'MISSING_DATABASE_URL':
    case 'INVALID_DATABASE_URL':
      instructions.push("🗄️  DATABASE_URL Setup:");
      instructions.push("   1. Create a new PostgreSQL database for your fork");
      instructions.push("   2. Get the connection string (starts with 'postgres://' or 'postgresql://')");
      instructions.push("   3. Set: export DATABASE_URL='postgresql://...'");
      instructions.push("   4. Each fork MUST have its own unique database");
      break;
      
    case 'MISSING_EMAIL_TO':
    case 'INVALID_EMAIL_TO':
      instructions.push("📧 EMAIL_TO Setup:");
      instructions.push("   1. Choose the email address for lead notifications");
      instructions.push("   2. Set: export EMAIL_TO='your-email@domain.com'");
      instructions.push("   3. This email will receive all lead notifications");
      instructions.push("   4. Each fork should use a different email address");
      break;
      
    case 'INVALID_PORT':
      instructions.push("🔌 PORT Setup:");
      instructions.push("   1. PORT must be a number (default: 5000)");
      instructions.push("   2. Set: export PORT=5000");
      break;
      
    default:
      instructions.push("⚙️  Environment Setup:");
      instructions.push("   1. Check all required environment variables");
      instructions.push("   2. Ensure proper format and values");
      instructions.push("   3. Restart the application after setting variables");
  }
  
  return instructions;
}

export function printEnvironmentStatus(config: EnvironmentConfig): void {
  log("📋 Environment Configuration:");
  log(`   Fork ID: ${config.forkId}`);
  log(`   Database: ${config.databaseUrl.replace(/\/\/.*@/, '//***:***@')} (credentials hidden)`);
  log(`   Email notifications: ${config.emailTo}`);
  log(`   Environment: ${config.nodeEnv}`);
  log(`   Port: ${config.port}`);
  
  if (config.forkDescription) {
    log(`   Description: ${config.forkDescription}`);
  }
  
  // Client credential status
  if (config.clientEmail && config.clientPassword) {
    log(`   Client login: ${config.clientEmail} (configured ✓)`);
    if (config.clientName) {
      log(`   Client name: ${config.clientName}`);
    }
  } else {
    log("   Client login: NOT CONFIGURED (⚠️  client won't be able to log in)");
    log("   → Set CLIENT_EMAIL and CLIENT_PASSWORD to enable client access");
  }
  
  if (config.overrideAllowSharedDb) {
    log("   ⚠️  DEVELOPMENT: Shared database override enabled");
  }
}