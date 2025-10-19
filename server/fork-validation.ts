import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { tenantMetadata } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Fork Isolation Validation System
 * 
 * Prevents database sharing between forks by validating that each fork
 * has its own unique DATABASE_URL and fork identifier.
 * 
 * This system ensures complete data isolation for the fork-based
 * real estate lead generation app architecture.
 */

export interface ForkValidationConfig {
  forkId: string;
  databaseUrl: string;
  emailTo?: string;
  description?: string;
  allowSharedDatabase?: boolean; // Emergency bypass (default: false)
}

export class ForkValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ForkValidationError';
  }
}

export async function validateForkIsolation(config: ForkValidationConfig): Promise<void> {
  const { forkId, databaseUrl, emailTo, description, allowSharedDatabase = false } = config;

  // Hardened emergency bypass - only works in development with additional confirmation
  if (allowSharedDatabase && 
      process.env.NODE_ENV === 'development' && 
      process.env.OVERRIDE_ALLOW_SHARED_DB === 'true' &&
      process.env.CONFIRM_SHARED_DB_RISK === 'I_UNDERSTAND_DATA_ISOLATION_RISK') {
    console.warn('⚠️  BYPASS: Fork validation disabled for development with confirmed risk acceptance');
    return;
  }

  let dbConnection: any = null;
  
  try {
    // Connect to the database using neon serverless driver
    const sql = neon(databaseUrl);
    const db = drizzle(sql);
    dbConnection = sql;

    // Bootstrap: Create tenant_metadata table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS tenant_metadata (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        fork_id TEXT NOT NULL UNIQUE,
        database_url TEXT NOT NULL,
        email_to TEXT,
        description TEXT,
        is_active TEXT DEFAULT 'true',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_validated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Check if this fork ID already exists
    const existingTenant = await db
      .select()
      .from(tenantMetadata)
      .where(eq(tenantMetadata.forkId, forkId))
      .limit(1);

    if (existingTenant.length > 0) {
      const tenant = existingTenant[0];
      
      // Validate that the DATABASE_URL matches the existing record
      if (tenant.databaseUrl !== databaseUrl) {
        throw new ForkValidationError(
          `Fork ID "${forkId}" is already registered with a different DATABASE_URL. ` +
          `This indicates a database sharing violation. Each fork must have its own isolated database.`,
          'DATABASE_URL_MISMATCH'
        );
      }

      // Validate EMAIL_TO isolation - prevent drift and ensure consistent notifications
      if (emailTo && tenant.emailTo && tenant.emailTo !== emailTo) {
        console.warn(`⚠️  EMAIL_TO drift detected for fork "${forkId}"`);
        console.warn(`   Stored: ${tenant.emailTo}`);
        console.warn(`   Current: ${emailTo}`);
        console.warn(`   Updating to current value to maintain email isolation`);
        
        // Update the stored email to match current environment
        await db
          .update(tenantMetadata)
          .set({ 
            emailTo: emailTo,
            lastValidatedAt: new Date() 
          })
          .where(eq(tenantMetadata.forkId, forkId));
          
      } else if (emailTo && !tenant.emailTo) {
        // First time setting EMAIL_TO for this fork
        console.log(`📧 Setting EMAIL_TO for fork "${forkId}": ${emailTo}`);
        
        await db
          .update(tenantMetadata)
          .set({ 
            emailTo: emailTo,
            lastValidatedAt: new Date() 
          })
          .where(eq(tenantMetadata.forkId, forkId));
          
      } else {
        // Update last validated timestamp only
        await db
          .update(tenantMetadata)
          .set({ lastValidatedAt: new Date() })
          .where(eq(tenantMetadata.forkId, forkId));
      }

      console.log(`✅ Fork validation successful for: ${forkId}`);
      
    } else {
      // Check if this DATABASE_URL is being used by another fork
      const conflictingTenant = await db
        .select()
        .from(tenantMetadata)
        .where(eq(tenantMetadata.databaseUrl, databaseUrl))
        .limit(1);

      if (conflictingTenant.length > 0) {
        throw new ForkValidationError(
          `DATABASE_URL is already in use by fork "${conflictingTenant[0].forkId}". ` +
          `Each fork must have its own unique DATABASE_URL to ensure data isolation.`,
          'DATABASE_URL_IN_USE'
        );
      }

      // Validate EMAIL_TO is set for new fork registration
      if (!emailTo) {
        console.warn(`⚠️  No EMAIL_TO configured for new fork "${forkId}"`);
        console.warn(`   This fork will not receive lead notifications until EMAIL_TO is set`);
      } else {
        console.log(`📧 Registering EMAIL_TO for new fork "${forkId}": ${emailTo}`);
      }

      // Register this new fork
      await db.insert(tenantMetadata).values({
        forkId,
        databaseUrl,
        emailTo: emailTo || null,
        description: description || `Fork: ${forkId}`,
        isActive: "true"
      });

      console.log(`🆕 New fork registered successfully: ${forkId}`);
    }
    
  } catch (error) {
    if (error instanceof ForkValidationError) {
      throw error;
    }
    
    // Map Postgres unique constraint errors to specific codes
    if (error instanceof Error && error.message.includes('23505')) {
      if (error.message.includes('fork_id')) {
        throw new ForkValidationError(
          `Fork ID "${forkId}" is already registered. Each fork must have a unique identifier.`,
          'FORK_ID_ALREADY_EXISTS'
        );
      }
      if (error.message.includes('database_url')) {
        throw new ForkValidationError(
          `This DATABASE_URL is already in use by another fork. Each fork must have its own unique database.`,
          'DATABASE_URL_ALREADY_REGISTERED'
        );
      }
    }
    
    // Database connection or other technical error
    throw new ForkValidationError(
      `Failed to validate fork isolation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'VALIDATION_FAILED'
    );
  } finally {
    // Resource cleanup: neon() connections are automatically pooled and closed
    // No explicit cleanup needed for neon serverless connections
    if (dbConnection) {
      // Neon serverless connections don't need explicit cleanup
      // They are automatically managed by the connection pool
    }
  }
}

export function getForkConfig(): ForkValidationConfig {
  const forkId = process.env.FORK_ID;
  const databaseUrl = process.env.DATABASE_URL;
  const emailTo = process.env.EMAIL_TO;
  const description = process.env.FORK_DESCRIPTION;
  const allowSharedDatabase = process.env.OVERRIDE_ALLOW_SHARED_DB === 'true';

  if (!forkId) {
    throw new ForkValidationError(
      'FORK_ID environment variable is required. Please set a unique identifier for this fork (e.g., "my-realestate-app").',
      'MISSING_FORK_ID'
    );
  }

  if (!databaseUrl) {
    throw new ForkValidationError(
      'DATABASE_URL environment variable is required. Please provision a database for this fork.',
      'MISSING_DATABASE_URL'
    );
  }

  return {
    forkId,
    databaseUrl,
    emailTo,
    description,
    allowSharedDatabase
  };
}