import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";
import { insertFormSubmissionSchema, insertEventSchema, updateEventSchema, insertNoteSchema, insertAgentSchema, insertAppConfigSchema, updateAppConfigSchema, createManualLeadSchema } from "@shared/schema";
import { z } from 'zod';
import { emailService } from "./email-service";

// Helper function to generate SHA-256 hash
function generateSHA256Hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // JWT configuration
  const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-production';
  const JWT_EXPIRY = '7d'; // 7 days

  // Helper function to generate JWT token
  function generateToken(userId: string, email: string, role: string, tokenVersion: string = "0"): string {
    return jwt.sign(
      { userId, email, role, tokenVersion },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
  }

  // Authentication middleware
  function authenticateToken(req: any, res: any, next: any) {
    const token = req.cookies?.authToken;
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied - no token provided' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Async check for token version (session invalidation)
      storage.getUser(decoded.userId).then(user => {
        if (!user || user.isActive !== "true") {
          return res.status(401).json({ error: 'User not found or deactivated' });
        }

        const tokenVersion = decoded.tokenVersion || "0";
        const currentTokenVersion = user.tokenVersion || "0";
        
        if (tokenVersion !== currentTokenVersion) {
          console.log(`🔒 Token version mismatch for user ${user.email}: token=${tokenVersion}, current=${currentTokenVersion}`);
          return res.status(401).json({ error: 'Token invalidated - please log in again' });
        }

        req.user = decoded;
        next();
      }).catch(error => {
        console.error('Database error during token validation:', error);
        return res.status(500).json({ error: 'Authentication validation failed' });
      });
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  }

  // RBAC middleware for role-based access control
  function rbacMiddleware(allowedRoles: string[]) {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied - insufficient permissions' });
      }

      next();
    };
  }

  // Dynamic manifest.json endpoint for PWA
  app.get('/manifest.json', (req, res) => {
    const clientName = process.env.CLIENT_NAME || 'LeadsByNova';
    
    const manifest = {
      name: clientName,
      short_name: clientName,
      description: `Professional lead management dashboard for ${clientName}`,
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#2563eb",
      orientation: "any",
      scope: "/",
      categories: ["business", "productivity"],
      lang: "en-US",
      icons: []
    };

    res.setHeader('Content-Type', 'application/json');
    res.json(manifest);
  });

  // API endpoint to get CLIENT_NAME (bypasses config system)
  app.get('/api/client-name', (req, res) => {
    const clientName = process.env.CLIENT_NAME || 'LeadsByNova';
    res.json({ clientName });
  });

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user is active
      if (user.isActive !== "true") {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = generateToken(user.id, user.email, user.role, user.tokenVersion || "0");

      // Set HTTP-only cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return user info (without password)
      const { hashedPassword, ...userInfo } = user;
      res.json({ 
        message: 'Login successful',
        user: userInfo
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ message: 'Logout successful' });
  });

  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await storage.getUser(req.user.userId);
      if (!user || user.isActive !== "true") {
        return res.status(401).json({ error: 'User not found or deactivated' });
      }

      const { hashedPassword, ...userInfo } = user;
      res.json({ user: userInfo });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Password validation schema for backend
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(10, 'New password must be at least 10 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/, 
        'Password must contain: uppercase, lowercase, number, and special character (@$!%*?&)'),
  });

  app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Validate request body with schema
      const validation = changePasswordSchema.safeParse(req.body);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        return res.status(400).json({ 
          error: firstError.message,
          field: firstError.path[0]
        });
      }

      const { currentPassword, newPassword } = validation.data;

      // Get current user
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Check if new password is same as current
      const isSamePassword = await bcrypt.compare(newPassword, user.hashedPassword);
      if (isSamePassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and increment token version for security
      const tokenVersion = String((parseInt(user.tokenVersion || "0")) + 1);
      const updatedUser = await storage.updateUser(req.user.userId, {
        hashedPassword: hashedNewPassword,
        tokenVersion: tokenVersion,
      });

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update password' });
      }

      console.log(`🔐 User ${user.email} successfully changed their password (invalidated existing sessions)`);

      // Clear the current auth cookie to force re-login with new session
      res.clearCookie('authToken');

      res.json({ 
        message: 'Password changed successfully. Please log in again for security.',
        success: true,
        requireReauth: true
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Forgot password - request reset token
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // For security, always return success even if user doesn't exist
      // This prevents email enumeration attacks
      if (!user) {
        return res.json({ 
          success: true, 
          message: 'If an account exists with this email, a password reset link has been sent.' 
        });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save token to database
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry
      });

      // Send reset email
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      console.log(`🔐 Password reset requested for: ${user.email}`);

      res.json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      // Validate password strength
      const passwordSchema = z.string()
        .min(10, 'Password must be at least 10 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/, 
          'Password must contain: uppercase, lowercase, number, and special character (@$!%*?&)');

      const passwordValidation = passwordSchema.safeParse(newPassword);
      if (!passwordValidation.success) {
        return res.status(400).json({ error: passwordValidation.error.errors[0].message });
      }

      // Find user by reset token
      const users = await storage.getAllUsers();
      const user = users.find(u => u.passwordResetToken === token);

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Check if token has expired
      if (!user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password, clear reset token, and increment token version to invalidate sessions
      const tokenVersion = String((parseInt(user.tokenVersion || "0")) + 1);
      await storage.updateUser(user.id, {
        hashedPassword: hashedPassword,
        passwordResetToken: null,
        resetTokenExpiry: null,
        tokenVersion: tokenVersion
      });

      console.log(`🔐 Password reset successful for: ${user.email}`);

      res.json({ 
        success: true, 
        message: 'Password has been reset successfully. Please log in with your new password.' 
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Verify reset token (for frontend to check if token is valid)
  app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;

      const users = await storage.getAllUsers();
      const user = users.find(u => u.passwordResetToken === token);

      if (!user || !user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ valid: false, error: 'Invalid or expired reset token' });
      }

      res.json({ valid: true });

    } catch (error) {
      console.error('Verify reset token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Agent management routes
  app.get('/api/agents', authenticateToken, rbacMiddleware(['superadmin', 'owner', 'admin']), async (req, res) => {
    try {
      const agents = await storage.getAgents();
      const agentsCount = agents.length;
      
      console.log(`🔒 RBAC: User ${req.user?.email} (${req.user?.role}) accessing ${agentsCount} agents`);
      
      res.json(agents);
    } catch (error) {
      console.error('Failed to get agents:', error);
      res.status(500).json({ error: 'Failed to get agents' });
    }
  });

  app.post('/api/agents', authenticateToken, rbacMiddleware(['superadmin', 'owner']), async (req, res) => {
    try {
      console.log(`🔒 RBAC: User ${req.user?.email} (${req.user?.role}) creating new agent`);
      
      // Validate request body with required fields
      const requestBody = {
        name: req.body.name || 'New Agent',
        isActive: req.body.isActive || 'true',
        displayOrder: req.body.displayOrder || '0',
        ...req.body
      };
      
      // Validate agent data first
      const validatedAgentData = insertAgentSchema.parse(requestBody);
      
      // If email is provided, password is required for user account creation
      const password = req.body.password;
      if (validatedAgentData.email && (!password || password.length < 10)) {
        return res.status(400).json({ 
          error: 'Strong password required for agent login account (minimum 10 characters)'
        });
      }
      
      // If password is provided, email is required
      if (password && !validatedAgentData.email) {
        return res.status(400).json({ 
          error: 'Email is required when creating a login account' 
        });
      }
      
      // Check if agent email already exists
      if (validatedAgentData.email) {
        const existingUser = await storage.getUserByEmail(validatedAgentData.email);
        if (existingUser) {
          return res.status(400).json({ 
            error: 'A user account with this email already exists' 
          });
        }
      }
      
      // Create the agent record
      const agent = await storage.createAgent(validatedAgentData);
      
      // If agent has email, also create a user account for login
      if (validatedAgentData.email) {
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const userData = {
          email: validatedAgentData.email,
          hashedPassword,
          role: 'agent' as const,
          agentName: validatedAgentData.name,
          isActive: validatedAgentData.isActive || 'true',
          tokenVersion: '0'
        };
        
        await storage.createUser(userData);
        console.log(`✅ Created login account for agent: ${validatedAgentData.email}`);
      }
      
      res.status(201).json(agent);
    } catch (error: any) {
      console.error('Failed to create agent:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid agent data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create agent' });
      }
    }
  });

  app.put('/api/agents/:id', authenticateToken, rbacMiddleware(['superadmin', 'owner']), async (req, res) => {
    try {
      const agentId = req.params.id;
      console.log(`🔒 RBAC: User ${req.user?.email} (${req.user?.role}) updating agent ${agentId}`);
      
      // Validate request body - exclude id from validation and make all fields optional
      const updateData = insertAgentSchema.partial().parse(req.body);
      
      const updatedAgent = await storage.updateAgent(agentId, updateData);
      
      if (!updatedAgent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      res.json(updatedAgent);
      
    } catch (error: any) {
      console.error('Failed to update agent:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid agent data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update agent' });
      }
    }
  });

  // Email scheduling system for smart timing logic
  const emailSchedules = new Map<string, {
    timeoutId: NodeJS.Timeout;
    leadId: string;
    scheduled: Date;
    emailSent: boolean;
  }>();

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

  // SSE endpoint for real-time updates (protected)
  app.get('/api/lead-stream', authenticateToken, (req, res) => {
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
    
    req.on('error', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for image uploads
  const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp and random string
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `headshot-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage: imageStorage,
    limits: {
      fileSize: 500 * 1024, // 500KB limit
      files: 1
    },
    fileFilter: (req, file, cb) => {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
      }
    }
  });

  // Legacy upload endpoint - redirect to secure endpoint
  app.post('/api/upload/image', authenticateToken, upload.single('image'), (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can upload files
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot upload files' });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      // Generate the full URL for the uploaded image
      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('Host');
      const imageUrl = `${protocol}://${host}/uploads/images/${req.file.filename}`;
      
      console.log('📸 Image uploaded successfully:', req.file.filename);
      
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        url: imageUrl, // Client expects 'url' field
        imageUrl: imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      });
    }
  });

  // Serve uploaded images statically (secure method)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '1d', // Cache for 1 day
    fallthrough: false // Return 404 for missing files instead of calling next()
  }));

  // Submit form data
  app.post("/api/form-submission", async (req, res) => {
    try {
      const validatedData = insertFormSubmissionSchema.parse(req.body);
      
      // Store as lead with pending status (not visible in dashboard yet)
      const lead = await storage.createLead({
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        guideType: validatedData.guideType,
        formTimestamp: new Date(),
        leadStatus: "pending",
        sentToDashboard: "false",
        completedChat: "false"
      });
      
      // Create consent record for compliance tracking
      const ipAddress = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || null;
      const userAgent = req.headers['user-agent'] || null;
      
      // Enhanced SMS/Email opt-in disclosure for TCPA compliance
      const disclosureVersion = "leadsbynova_disclosure_v2.0";
      
      // Use consent text from frontend (captures exact text shown to user)
      // Fallback to default if not provided (legacy support)
      const consentText = (validatedData as any).consentText || `SMS Opt-in (Program: LeadsByNova™ Platform Updates & Promotions): By providing your phone number and submitting this form, you agree to receive marketing and informational text messages from LeadsByNova™ regarding product updates, feature releases, and promotional offers at the number provided. Consent is not a condition of purchase. Message frequency may vary. Message & data rates may apply. Reply STOP to opt out or HELP for help. See our Privacy Policy and Terms.

Email Opt-in (Program: LeadsByNova™ Platform Updates & Promotions): By submitting this form, you agree to receive marketing emails from LeadsByNova™, including product announcements, feature updates, special offers, and educational content designed to help you grow your business. You can unsubscribe at any time. See our Privacy Policy and Terms.`;
      
      // Use frontend-provided hash if available, otherwise generate on backend
      let disclosureHashShort: string;
      if (validatedData.disclosureHash) {
        // Frontend already computed the hash - use first 12 chars
        disclosureHashShort = validatedData.disclosureHash.substring(0, 12);
      } else {
        // Fallback: generate hash on backend
        const disclosureHash = generateSHA256Hash(consentText.trim());
        disclosureHashShort = disclosureHash.substring(0, 12);
      }
      
      // Use frontend-provided source URL if available, otherwise construct from request
      const sourceUrl = validatedData.sourceUrl || (() => {
        const protocol = req.secure ? 'https' : 'http';
        const host = req.get('Host');
        return `${protocol}://${host}/submission-form`;
      })();
      
      await storage.createConsentRecord({
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        guideType: validatedData.guideType,
        formTimestamp: new Date(),
        consentText: consentText,
        disclosureVersion: disclosureVersion,
        disclosureHash: disclosureHashShort,
        sourceUrl: sourceUrl,
        channelsConsented: "Email, SMS",
        senderName: "LeadsByNova™ (on behalf of [Agent/Brokerage])",
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined
      });
      
      console.log(`✅ Consent record created for ${validatedData.email} from IP: ${ipAddress}`);
      
      // Don't broadcast to dashboard yet - lead is pending chat interaction
      
      // Data is now handled by dashboard instead of Google Sheets
      
      // Agent notification will be sent only when chat concludes (complete/decline/abandon)
      console.log("Form submitted - agent notification will be sent when chat concludes");
      
      // Smart email scheduling - check for chat completion before sending
      const emailTimeoutId = setTimeout(async () => {
        try {
          // Check if lead completed chat with call scheduling within 2 minutes
          const updatedLead = await storage.getLeadByEmail(validatedData.email);
          let scheduledCall = undefined;
          
          console.log(`Smart timing check for ${validatedData.email}:`, {
            leadFound: !!updatedLead,
            completedChat: updatedLead?.completedChat,
            daySelected: updatedLead?.daySelected
          });
          
          // If chat was already completed, the lead-complete endpoint handled everything - skip this timer
          if (updatedLead && updatedLead.completedChat === "true") {
            console.log("⏭️ Chat already completed - skipping 2-minute timer actions (already handled by lead-complete)");
            return;
          }
          
          // Chat NOT completed - send notifications and add to dashboard with whatever data exists
          console.log("⏰ 2-minute timer fired - chat not completed, sending notifications with available data");
          
          // Send welcome email to customer with basic guide
          await emailService.sendWelcomeEmail({
            name: validatedData.fullName,
            email: validatedData.email,
            guide_type: validatedData.guideType,
            scheduledCall: undefined
          });
          
          console.log(`✅ Welcome email sent to ${validatedData.email} (no call scheduled)`);
          
          // Prepare consolidated data for agent notification
          const consolidatedData = {
            formTimestamp: updatedLead?.formTimestamp?.toISOString() || new Date().toISOString(),
            name: validatedData.fullName,
            email: validatedData.email,
            phone: validatedData.phone,
            guide_type: validatedData.guideType,
            
            // Include any LeadsByNova chat data that was collected (convert null to undefined)
            chatTimestamp: updatedLead?.chatTimestamp?.toISOString(),
            userType: updatedLead?.userType || undefined,
            mainGoal: updatedLead?.mainGoal || undefined,
            leadManagement: updatedLead?.leadManagement || undefined,
            timeline: updatedLead?.timeline || undefined,
            communicationPreference: updatedLead?.communicationPreference || undefined,
            bookedCall: updatedLead?.bookedCall || undefined,
            daySelected: updatedLead?.daySelected || undefined,
            
            completedChat: false
          };
          
          // Send agent notification with available data
          await emailService.sendConsolidatedNotification(consolidatedData);
          console.log("✅ Agent notification sent with partial/form-only data");
          
          // Update lead to make it visible in dashboard
          if (updatedLead) {
            await storage.updateLead(updatedLead.id, {
              sentToDashboard: "true",
              completedChat: "false" // Explicitly mark as incomplete
            });
            
            // Broadcast to dashboard
            const finalLead = await storage.getLeadByEmail(validatedData.email);
            if (finalLead) {
              console.log("📡 Broadcasting incomplete lead to dashboard:", finalLead.id);
              broadcastToClients('lead_updated', finalLead);
            }
          }
          
          // Mark email as sent
          const schedule = emailSchedules.get(validatedData.email);
          if (schedule) {
            schedule.emailSent = true;
          }
          
          console.log("✅ 2-minute timer complete - lead added to dashboard and notifications sent");
        } catch (error) {
          console.error("Failed to process 2-minute timer actions:", error);
        }
      }, 120000); // 2 minutes delay
      
      // Track this email schedule
      emailSchedules.set(validatedData.email, {
        timeoutId: emailTimeoutId,
        leadId: lead.id,
        scheduled: new Date(Date.now() + 120000), // 2 minutes from now
        emailSent: false
      });
      
      console.log("Smart welcome email scheduled to be sent in 2 minutes");
      
      res.json({ 
        success: true, 
        message: "Form submitted successfully",
        id: lead.id 
      });
    } catch (error) {
      console.error("Form submission error:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Form submission failed" 
      });
    }
  });

  // Get all submissions (for admin purposes) - RBAC PROTECTED
  app.get("/api/form-submissions", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can view all form submissions
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot view all form submissions' });
      }
      
      const submissions = await storage.getFormSubmissions();
      console.log(`🔒 RBAC: User ${req.user.email} (${role}) accessing ${submissions.length} form submissions`);
      res.json(submissions);
    } catch (error) {
      console.error("Failed to get submissions:", error);
      res.status(500).json({ message: "Failed to retrieve submissions" });
    }
  });

  // Get consent records - RBAC PROTECTED (superadmin and owner only)
  app.get("/api/consent-records", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can view consent records
      if (role !== "superadmin" && role !== "owner") {
        return res.status(403).json({ error: 'Access denied - only superadmins and owners can view consent records' });
      }
      
      const searchTerm = req.query.search as string;
      let consentRecords;
      
      if (searchTerm && searchTerm.trim()) {
        consentRecords = await storage.searchConsentRecords(searchTerm.trim());
        console.log(`🔒 RBAC: User ${req.user.email} (${role}) searching ${consentRecords.length} consent records with term: "${searchTerm}"`);
      } else {
        consentRecords = await storage.getConsentRecords();
        console.log(`🔒 RBAC: User ${req.user.email} (${role}) accessing ${consentRecords.length} consent records`);
      }
      
      res.json(consentRecords);
    } catch (error) {
      console.error("Failed to get consent records:", error);
      res.status(500).json({ message: "Failed to retrieve consent records" });
    }
  });

  // Delete all consent records - RBAC PROTECTED (superadmin and owner only)
  app.delete("/api/consent-records/all", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can delete consent records
      if (role !== "superadmin" && role !== "owner") {
        return res.status(403).json({ error: 'Access denied - only superadmins and owners can delete consent records' });
      }
      
      await storage.deleteAllConsentRecords();
      console.log(`🗑️ RBAC: User ${req.user.email} (${role}) deleted all consent records`);
      
      res.json({ success: true, message: "All consent records deleted successfully" });
    } catch (error) {
      console.error("Failed to delete consent records:", error);
      res.status(500).json({ message: "Failed to delete consent records" });
    }
  });

  // Chat progress endpoint - save chat progress in real-time as answers are given
  app.post("/api/chat-progress", async (req, res) => {
    try {
      const { email, chatData } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      console.log(`💬 Saving chat progress for ${email}:`, JSON.stringify(chatData, null, 2));
      
      // Find existing lead by email
      const existingLead = await storage.getLeadByEmail(email);
      if (!existingLead) {
        console.error("❌ Lead not found for email:", email);
        return res.status(404).json({ 
          success: false, 
          message: "Lead not found" 
        });
      }
      
      // Update lead with chat progress (don't mark as completed yet) - support both buyer and seller fields
      const updateData = {
        chatTimestamp: new Date(),
        
        // Buyer fields
        prequalified: chatData.prequalified || null,
        preQualificationRange: chatData.preQualificationRange || null,
        moveTimeline: chatData.moveTimeline || null,
        budgetRange: chatData.budgetRange || null,
        
        // Seller fields
        timeline: chatData.timeline || null,
        needToBuy: chatData.needToBuy || null,
        occupancyStatus: chatData.occupancyStatus || null,
        priceRange: chatData.priceRange || null,
        recentUpgrades: chatData.recentUpgrades || null,
        
        // Shared fields
        haveAgent: chatData.haveAgent || null,
        propertyType: chatData.propertyType || null,
        bookedCall: chatData.bookedCall || null,
        daySelected: chatData.daySelected || null,
        
        // Don't mark as completed chat yet - only when final notification is sent
        completedChat: "false"
      };
      
      await storage.updateLead(existingLead.id, updateData);
      console.log(`✅ Chat progress saved successfully for ${email}`);
      
      res.json({ 
        success: true, 
        message: "Chat progress saved successfully" 
      });
    } catch (error) {
      console.error("Chat progress error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to save chat progress" 
      });
    }
  });

  // Get all leads (for dashboard) - with role-based access control
  app.get("/api/leads", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const allLeads = await storage.getLeads();
      console.log('📊 First lead data:', JSON.stringify(allLeads[0], null, 2));
      // Filter to only show leads that are ready for dashboard (have completed form submission flow)
      let readyLeads = allLeads.filter(lead => lead.sentToDashboard === "true");
      
      // Apply role-based filtering
      const { role, email } = req.user;
      
      if (role === "agent") {
        // Agents only see leads assigned to them by agentName
        // First, get the agent's name from the user record
        const currentUser = await storage.getUserByEmail(email);
        if (currentUser && currentUser.agentName) {
          readyLeads = readyLeads.filter(lead => lead.assignedTo === currentUser.agentName);
        } else {
          // If agent has no agentName, show no leads
          readyLeads = [];
        }
      } else if (role === "owner") {
        // Owners see all agency leads (no additional filtering needed)
        // Future: Could filter by agency/fork if multi-tenant
      } else if (role === "superadmin") {
        // Superadmins see everything across all forks (no filtering)
      }
      
      // Debug logging to check role-based filtering
      console.log(`🔒 RBAC: User ${email} (${role}) sees ${readyLeads.length} leads`);
      
      res.json(readyLeads);
    } catch (error) {
      console.error("Failed to get leads:", error);
      res.status(500).json({ message: "Failed to retrieve leads" });
    }
  });

  // Get leads organized by pipeline (Buyer/Seller) and stage - with role-based access control
  app.get("/api/leads/pipeline", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const allLeads = await storage.getLeads();
      // Filter to only show leads that are ready for dashboard (have completed form submission flow)
      // Exclude archived leads to maintain parity with /api/leads
      let readyLeads = allLeads.filter(lead => 
        lead.sentToDashboard === "true" && 
        !lead.deletedAt && 
        lead.archived !== "true"
      );
      
      // Apply role-based filtering (same logic as /api/leads)
      const { role, email } = req.user;
      
      if (role === "agent") {
        // Agents only see leads assigned to them by agentName
        const currentUser = await storage.getUserByEmail(email);
        if (currentUser && currentUser.agentName) {
          readyLeads = readyLeads.filter(lead => lead.assignedTo === currentUser.agentName);
        } else {
          // If agent has no agentName, show no leads
          readyLeads = [];
        }
      } else if (role === "owner") {
        // Owners see all agency leads (no additional filtering needed)
      } else if (role === "superadmin") {
        // Superadmins see everything across all forks (no filtering)
      }

      // LeadsByNova uses unified pipeline - ALL leads go into one pipeline regardless of guideType
      // (guideType now contains values like "I'm a Business Owner", "I'm a Sales Agent", etc.)

      // Define pipeline stages - Unified for LeadsByNova (all leads)
      const leadsStages = ["New", "Contacted", "Zoom Booked", "Demo Prep", "2nd Zoom Scheduled", "Under Contract", "Testing", "Finalized and Delivered", "Nurture", "Lost"];

      // Comprehensive status normalization for LeadsByNova stages
      const normalizeStatus = (status: string): string => {
        if (!status) return "New";
        const normalized = status.trim().toLowerCase();
        
        // LeadsByNova unified status mappings
        const statusMap: Record<string, string> = {
          'new': 'New',
          'contacted': 'Contacted',
          'zoom booked': 'Zoom Booked',
          'zoombooked': 'Zoom Booked',
          'zoom_booked': 'Zoom Booked',
          'demo prep': 'Demo Prep',
          'demoprep': 'Demo Prep',
          'demo_prep': 'Demo Prep',
          '2nd zoom scheduled': '2nd Zoom Scheduled',
          '2ndzoomscheduled': '2nd Zoom Scheduled',
          '2nd_zoom_scheduled': '2nd Zoom Scheduled',
          'second zoom scheduled': '2nd Zoom Scheduled',
          'under contract': 'Under Contract',
          'undercontract': 'Under Contract',
          'under_contract': 'Under Contract',
          'testing': 'Testing',
          'finalized and delivered': 'Finalized and Delivered',
          'finalizedanddelivered': 'Finalized and Delivered',
          'finalized_and_delivered': 'Finalized and Delivered',
          'finalized': 'Finalized and Delivered',
          'delivered': 'Finalized and Delivered',
          'nurture': 'Nurture',
          'lost': 'Lost',
          
          // Legacy real estate mappings for backwards compatibility
          'appointment set': 'Contacted',
          'showing scheduled': 'Zoom Booked',
          'offer made': 'Under Contract',
          'closed': 'Finalized and Delivered',
          'home evaluation / cma requested': 'Contacted',
          'active seller client': 'Demo Prep',
          'on the market': 'Testing',
          'closed/sold': 'Finalized and Delivered'
        };
        
        // Return canonical status or fallback to "New" with logging
        const canonicalStatus = statusMap[normalized];
        if (canonicalStatus) {
          return canonicalStatus;
        }
        
        // Log unmapped status for data hygiene
        console.log(`🔍 PIPELINE: Unmapped status "${status}" for pipeline, defaulting to New`);
        return "New";
      };

      // Organize leads by stage within unified pipeline
      const organizeBypipeline = (leads: any[], stages: string[]) => {
        const pipeline: Record<string, any[]> = {};
        
        // Initialize all stages with empty arrays
        stages.forEach(stage => {
          pipeline[stage] = [];
        });

        // Add leads to their respective stages with status normalization
        leads.forEach(lead => {
          const normalizedStatus = normalizeStatus(lead.salesFunnelStatus || "New");
          
          // Canonical status should now always be valid, but double-check stage exists
          if (stages.includes(normalizedStatus)) {
            pipeline[normalizedStatus].push(lead);
          } else {
            // This should rarely happen with comprehensive normalization, but fail-safe to "New"
            console.log(`🚨 PIPELINE: Canonical status "${normalizedStatus}" not in stages for lead ${lead.id}, forcing to New`);
            pipeline["New"].push(lead);
          }
        });

        return pipeline;
      };

      // Create unified pipeline response for LeadsByNova (all leads in one pipeline)
      const allPipelineLeads = readyLeads; // All leads go into unified pipeline
      
      const response = {
        leads: {
          stageOrder: leadsStages,
          stages: organizeBypipeline(allPipelineLeads, leadsStages),
          totalLeads: allPipelineLeads.length
        },
        metadata: {
          totalLeads: readyLeads.length,
          userRole: role,
          timestamp: new Date().toISOString()
        }
      };

      // Enhanced logging with pipeline metrics
      const leadsPipeline = response.leads.stages;
      
      const leadsCounts = Object.entries(leadsPipeline).map(([stage, leads]) => `${stage}: ${leads.length}`).join(', ');
      
      console.log(`🔒 PIPELINE: User ${email} (${role}) pipeline summary:`);
      console.log(`  📊 All Leads (${allPipelineLeads.length} total): ${leadsCounts}`);
      
      res.json(response);
    } catch (error) {
      console.error("Failed to get pipeline leads:", error);
      res.status(500).json({ message: "Failed to retrieve pipeline leads" });
    }
  });

  // Create a new lead manually (for dashboard Add Lead functionality)
  app.post("/api/leads", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Role-based access control for lead creation
      const { role, email } = req.user;
      if (role === "agent") {
        // Agents can only create leads assigned to themselves
        const currentUser = await storage.getUserByEmail(email);
        if (!currentUser || !currentUser.agentName) {
          return res.status(403).json({ error: 'Agent must have valid agentName to create leads' });
        }
      }
      // Owners and superadmins can create leads for anyone

      const leadData = req.body;
      
      // Validate required fields
      if (!leadData.fullName || !leadData.email || !leadData.phone || !leadData.guideType) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: fullName, email, phone, guideType" 
        });
      }

      // Prepare lead data for creation
      const insertLeadData = {
        fullName: leadData.fullName,
        email: leadData.email,
        phone: leadData.phone,
        guideType: leadData.guideType,
        formTimestamp: new Date(leadData.formTimestamp),
        chatTimestamp: leadData.chatTimestamp ? new Date(leadData.chatTimestamp) : null,
        prequalified: leadData.prequalified || null,
        preQualificationRange: leadData.preQualificationRange || null,
        moveTimeline: leadData.moveTimeline || null,
        haveAgent: leadData.haveAgent || null,
        budgetRange: leadData.budgetRange || null,
        propertyType: leadData.propertyType || null,
        bookedCall: leadData.bookedCall || null,
        daySelected: leadData.daySelected || null,
        completedChat: leadData.completedChat || "false",
        notes: leadData.notes || null,
        assignedTo: role === "agent" ? (await storage.getUserByEmail(email))?.agentName || null : leadData.assignedTo || null,
        archived: leadData.archived || "false",
        deletedAt: leadData.deletedAt || null
      };

      const createdLead = await storage.createLead(insertLeadData);
      
      // Broadcast new lead to connected SSE clients
      broadcastToClients('lead_created', createdLead);
      
      res.json({ 
        success: true, 
        message: "Lead created successfully",
        lead: createdLead 
      });
    } catch (error) {
      console.error("Failed to create lead:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create lead" 
      });
    }
  });

  // Create manual lead with optional call booking
  app.post("/api/leads/manual", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role, email: userEmail } = req.user;
      
      // Validate request body
      const validatedData = createManualLeadSchema.parse(req.body);
      
      // Create lead with Manual Entry guideType
      const leadData: any = {
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        guideType: "Manual Entry",
        formTimestamp: new Date(),
        chatTimestamp: null,
        sentToDashboard: "true", // Immediately visible
        status: "New", // Default pipeline status
        completedChat: "false",
        archived: "false",
        deletedAt: null,
        // Assign to agent if agent is creating, otherwise leave unassigned
        assignedTo: role === "agent" ? (await storage.getUserByEmail(userEmail))?.agentName || null : null
      };

      const createdLead = await storage.createLead(leadData);
      console.log(`📝 Manual lead created: ${createdLead.fullName} (${createdLead.email}) by ${userEmail}`);

      let event = null;
      
      // Helper function to convert AM/PM time to 24-hour format
      const convertToMilitary = (timeStr: string): string => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      };
      
      // Create calendar event if call is booked
      if (validatedData.bookCall && validatedData.callDate && validatedData.callTime) {
        // Convert AM/PM time to 24-hour format
        const startTime24 = convertToMilitary(validatedData.callTime);
        const [hours, minutes] = startTime24.split(':').map(Number);
        
        // Calculate end time (2 hours after start - matches regular demo call duration)
        let endHours = hours + 2;
        let endMinutes = minutes;
        
        // Handle hour overflow (past midnight)
        if (endHours >= 24) {
          endHours -= 24;
        }
        
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

        const eventData = {
          title: `Demo Call - ${validatedData.fullName}`,
          description: `Manual booking - Phone: ${validatedData.phone}`,
          date: validatedData.callDate,
          startTime: startTime24,
          endTime: endTime,
          leadId: createdLead.id
        };

        // Get user ID for event creation
        const currentUser = await storage.getUserByEmail(userEmail);
        if (currentUser) {
          event = await storage.createEvent(eventData, currentUser.id, createdLead.id);
          console.log(`📅 Calendar event created for manual lead: ${validatedData.callDate} at ${validatedData.callTime}`);
          
          // Update lead with bookedCall flag so call details display on the card
          await storage.updateLead(createdLead.id, {
            bookedCall: "true"
          });
        }
      }

      // Send confirmation email to lead if call was booked
      if (event && validatedData.bookCall) {
        try {
          await emailService.sendBookingConfirmation({
            name: validatedData.fullName,
            email: validatedData.email,
            date: validatedData.callDate!,
            time: validatedData.callTime!
          });
          console.log(`✉️ Call confirmation email sent to: ${validatedData.email}`);
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't fail the request if email fails
        }
      }

      // Broadcast new lead to connected SSE clients
      broadcastToClients('lead_created', createdLead);

      res.json({
        success: true,
        message: "Manual lead created successfully",
        lead: createdLead,
        event: event
      });
    } catch (error: any) {
      console.error("Failed to create manual lead:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to create manual lead"
      });
    }
  });

  // Update lead notes
  app.put("/api/leads/:id/notes", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const { notes } = req.body;
      const { role, email } = req.user;

      // Check if user can access this lead
      const existingLead = await storage.getLeads();
      const lead = existingLead.find(l => l.id === id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Role-based access control
      if (role === "agent") {
        const currentUser = await storage.getUserByEmail(email);
        if (!currentUser || !currentUser.agentName || lead.assignedTo !== currentUser.agentName) {
          return res.status(403).json({ error: 'Access denied - lead not assigned to you' });
        }
      }
      // Owners and superadmins can update any lead
      
      await storage.updateLeadNotes(id, notes);
      res.json({ success: true, message: "Notes updated successfully" });
    } catch (error) {
      console.error("Failed to update notes:", error);
      res.status(500).json({ message: "Failed to update notes" });
    }
  });

  // Real-time chat progress endpoint - saves data as each answer is given
  app.post("/api/chat-progress", async (req, res) => {
    try {
      const { email, chatData } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      // Find existing lead by email
      const existingLead = await storage.getLeadByEmail(email);
      if (!existingLead) {
        return res.status(404).json({ 
          success: false, 
          message: "Lead not found" 
        });
      }

      // Update lead with current chat progress - only update fields that have values (buyer and seller fields)
      const updateData: any = {};
      if (chatData.chatTimestamp) updateData.chatTimestamp = new Date(chatData.chatTimestamp);
      
      // Buyer fields
      if (chatData.prequalified) updateData.prequalified = chatData.prequalified;
      if (chatData.preQualificationRange) updateData.preQualificationRange = chatData.preQualificationRange;
      if (chatData.moveTimeline) updateData.moveTimeline = chatData.moveTimeline;
      if (chatData.budgetRange) updateData.budgetRange = chatData.budgetRange;
      
      // Seller fields
      if (chatData.timeline) updateData.timeline = chatData.timeline;
      if (chatData.needToBuy) updateData.needToBuy = chatData.needToBuy;
      if (chatData.occupancyStatus) updateData.occupancyStatus = chatData.occupancyStatus;
      if (chatData.priceRange) updateData.priceRange = chatData.priceRange;
      if (chatData.recentUpgrades) updateData.recentUpgrades = chatData.recentUpgrades;
      
      // Shared fields
      if (chatData.haveAgent) updateData.haveAgent = chatData.haveAgent;
      if (chatData.propertyType) updateData.propertyType = chatData.propertyType;
      if (chatData.bookedCall) updateData.bookedCall = chatData.bookedCall;
      if (chatData.daySelected) updateData.daySelected = chatData.daySelected;

      await storage.updateLead(existingLead.id, updateData);
      
      res.json({ 
        success: true, 
        message: "Chat progress saved successfully" 
      });
    } catch (error) {
      console.error("Chat progress save error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to save chat progress" 
      });
    }
  });

  // Lead completion endpoint (sends consolidated notification to agent)
  app.post("/api/lead-complete", async (req, res) => {
    try {
      const { email, chatData } = req.body;
      
      // Require email to find existing lead
      if (!email) {
        console.error("❌ No email provided in lead-complete request");
        return res.status(400).json({ 
          success: false, 
          message: "Email is required to complete lead" 
        });
      }
      
      // Fetch existing lead first to merge form data
      const existingLead = await storage.getLeadByEmail(email);
      if (!existingLead) {
        console.error("❌ Lead not found for email:", email);
        return res.status(404).json({ 
          success: false, 
          message: "Lead not found" 
        });
      }
      
      // Prepare consolidated data by merging stored form data with chat data
      const consolidatedData = {
        // Form data from storage (with field name corrections)
        formTimestamp: existingLead.formTimestamp?.toISOString() || new Date().toISOString(),
        name: existingLead.fullName, // fullName -> name
        email: existingLead.email,
        phone: existingLead.phone,
        guide_type: existingLead.guideType, // guideType -> guide_type
        
        // Chat data from request
        chatTimestamp: new Date().toISOString(),
        
        // LeadsByNova chat fields
        userType: chatData.userType,
        mainGoal: chatData.mainGoal,
        leadManagement: chatData.leadManagement,
        timeline: chatData.timeline,
        communicationPreference: chatData.communicationPreference,
        bookedCall: chatData.bookedCall,
        daySelected: chatData.daySelected,
        
        // Status
        completedChat: true
      };
      
      // Update lead with chat data (LeadsByNova fields)
      const updateData = {
        chatTimestamp: new Date(),
        
        // LeadsByNova chat fields
        userType: chatData.userType,
        mainGoal: chatData.mainGoal,
        leadManagement: chatData.leadManagement,
        timeline: chatData.timeline,
        communicationPreference: chatData.communicationPreference,
        bookedCall: chatData.bookedCall,
        daySelected: chatData.daySelected,
        timeSelected: chatData.timeSelected,
        
        completedChat: "true",
        sentToDashboard: "true" // Make lead visible in dashboard when chat concludes
      };
      
      console.log("📊 Updating lead with data:", JSON.stringify(updateData, null, 2));
      await storage.updateLead(existingLead.id, updateData);
      
      // Broadcast updated lead to dashboard clients
      const updatedLead = await storage.getLeadByEmail(email);
      if (updatedLead) {
        console.log("📡 Broadcasting updated lead to dashboard:", updatedLead.id);
        broadcastToClients('lead_updated', updatedLead);
      }

      // Send notification to agent
      console.log("🔍 Sending consolidatedData to agent:", JSON.stringify(consolidatedData, null, 2));
      await emailService.sendConsolidatedNotification(consolidatedData);
      
      // Handle guide email to lead - send immediately when chat completes (declined, abandoned, or booked)
      const emailSchedule = emailSchedules.get(consolidatedData.email);
      
      if (emailSchedule && !emailSchedule.emailSent) {
        // Initial email hasn't been sent yet - cancel scheduled email and send immediately
        clearTimeout(emailSchedule.timeoutId);
        
        if (consolidatedData.daySelected) {
          // Chat completed with call booking - send with call details
          console.log("✅ Call scheduled before 2-minute window - sending immediately with call details");
          try {
            await emailService.sendWelcomeEmail({
              name: consolidatedData.name,
              email: consolidatedData.email,
              guide_type: consolidatedData.guide_type,
              scheduledCall: consolidatedData.daySelected
            });
            emailSchedule.emailSent = true;
            console.log("🎯 Welcome email with call confirmation sent immediately");
          } catch (error) {
            console.error("Failed to send immediate welcome email with call details:", error);
          }
        } else {
          // Chat completed without call (declined Q1/Q7 or abandoned) - send guide immediately
          console.log("📧 Chat completed without booking - sending guide email immediately");
          try {
            await emailService.sendWelcomeEmail({
              name: consolidatedData.name,
              email: consolidatedData.email,
              guide_type: consolidatedData.guide_type
            });
            emailSchedule.emailSent = true;
            console.log("✅ Guide email sent immediately for declined/abandoned chat");
          } catch (error) {
            console.error("Failed to send immediate guide email:", error);
          }
        }
      } else if (emailSchedule && emailSchedule.emailSent && consolidatedData.daySelected) {
        // Initial email was already sent - send separate call confirmation email only if call was booked
        try {
          await emailService.sendWelcomeEmail({
            name: consolidatedData.name,
            email: consolidatedData.email,
            guide_type: consolidatedData.guide_type,
            scheduledCall: consolidatedData.daySelected,
            isUpdated: true
          });
          console.log("📞 Separate call confirmation email sent successfully");
        } catch (error) {
          console.error("Failed to send call confirmation email:", error);
        }
      } else if (!emailSchedule && consolidatedData.daySelected) {
        // No schedule exists (edge case) - send immediate welcome with call details
        try {
          await emailService.sendWelcomeEmail({
            name: consolidatedData.name,
            email: consolidatedData.email,
            guide_type: consolidatedData.guide_type,
            scheduledCall: consolidatedData.daySelected,
            isUpdated: true
          });
          console.log("🎯 Immediate welcome email sent with call details (no schedule found)");
        } catch (error) {
          console.error("Failed to send immediate welcome email:", error);
        }
      }
      
      res.json({ 
        success: true, 
        message: "Lead notification sent successfully" 
      });
    } catch (error) {
      console.error("Lead completion error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to send lead notification" 
      });
    }
  });

  // Form-only notification endpoint (for leads who don't complete chat)
  app.post("/api/form-only-notification", async (req, res) => {
    try {
      const formData = req.body;
      
      const consolidatedData = {
        formTimestamp: formData.timestamp,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        guide_type: formData.guide_type,
        completedChat: false
      };
      
      // Update lead to make it visible in dashboard
      const existingLead = await storage.getLeadByEmail(consolidatedData.email);
      if (existingLead) {
        await storage.updateLead(existingLead.id, {
          completedChat: "false",
          sentToDashboard: "true" // Make lead visible in dashboard when chat is declined/abandoned
        });
        
        // Broadcast updated lead to dashboard clients
        const updatedLead = await storage.getLeadByEmail(consolidatedData.email);
        if (updatedLead) {
          broadcastToClients('lead_updated', updatedLead);
        }
      }
      
      // Send notification to agent
      await emailService.sendConsolidatedNotification(consolidatedData);
      
      res.json({ 
        success: true, 
        message: "Form notification sent successfully" 
      });
    } catch (error) {
      console.error("Form notification error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to send form notification" 
      });
    }
  });

  // Chat update endpoint for buyer chats (from /chat)
  app.post("/api/chat/update-lead", async (req, res) => {
    try {
      const leadData = req.body;
      
      // Get existing lead by email or create new one
      let lead = await storage.getLeadByEmail(leadData.email);
      
      if (lead) {
        // Update existing lead with LeadsByNova chat data
        const updatedLead = await storage.updateLead(lead.id, {
          chatTimestamp: new Date(),
          userType: leadData.userType,
          mainGoal: leadData.mainGoal,
          leadManagement: leadData.leadManagement,
          timeline: leadData.timeline,
          communicationPreference: leadData.communicationPreference,
          bookedCall: leadData.bookedCall,
          daySelected: leadData.daySelected,
          timeSelected: leadData.timeSelected,
          completedChat: "true",
          leadStatus: "completed", // Update status 
          sentToDashboard: "true" // Make visible in dashboard
        });
        
        // Broadcast lead update to dashboard
        broadcastToClients('lead_updated', updatedLead);
        
        // Handle smart email timing for call scheduling
        if (leadData.daySelected) {
          const emailSchedule = emailSchedules.get(leadData.email);
          
          if (emailSchedule && !emailSchedule.emailSent) {
            // Initial email hasn't been sent yet - it will include call details automatically
            console.log("Call scheduled before initial email - will be included in guide email");
          } else {
            // Initial email was already sent - send separate call confirmation email
            try {
              await emailService.sendWelcomeEmail({
                name: leadData.name,
                email: leadData.email,
                guide_type: lead.guideType,
                scheduledCall: leadData.daySelected,
                isUpdated: true // Flag to indicate this is a call confirmation
              });
              console.log("Separate call confirmation email sent successfully");
            } catch (error) {
              console.error("Failed to send call confirmation email:", error);
            }
          }
        }
        
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
          userType: leadData.userType,
          mainGoal: leadData.mainGoal,
          leadManagement: leadData.leadManagement,
          timeline: leadData.timeline,
          communicationPreference: leadData.communicationPreference,
          bookedCall: leadData.bookedCall,
          daySelected: leadData.daySelected,
          timeSelected: leadData.timeSelected,
          completedChat: "true",
          leadStatus: "completed",
          sentToDashboard: "true",
          archived: "false"
        });
        
        // Broadcast new lead to dashboard
        broadcastToClients('lead_created', newLead);
        
        res.json({ success: true, leadId: newLead.id });
      }
    } catch (error) {
      console.error("Chat lead update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Chat update endpoint for seller chats (from /chat2)
  app.post("/api/chat2/update-lead", async (req, res) => {
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
          propertyType: leadData.propertyType,
          bookedCall: leadData.bookedCall,
          daySelected: leadData.daySelected,
          completedChat: "true",
          leadStatus: "completed",
          sentToDashboard: "true", // Make visible in dashboard
          // Store additional seller info in notes
          notes: [
            ...(lead.notes || []),
            {
              timestamp: new Date().toISOString(),
              content: `Seller Chat Data: Need to buy: ${leadData.needToBuy || 'N/A'}, Occupancy: ${leadData.occupancyStatus || 'N/A'}, Price range: ${leadData.priceRange || 'N/A'}, Recent upgrades: ${leadData.recentUpgrades || 'N/A'}`
            }
          ]
        });
        
        // Broadcast lead update to dashboard
        broadcastToClients('lead_updated', updatedLead);
        
        // Handle smart email timing for seller call scheduling
        if (leadData.daySelected) {
          const emailSchedule = emailSchedules.get(leadData.email);
          
          if (emailSchedule && !emailSchedule.emailSent) {
            // Initial email hasn't been sent yet - it will include call details automatically
            console.log("Seller call scheduled before initial email - will be included in guide email");
          } else {
            // Initial email was already sent - send separate call confirmation email
            try {
              await emailService.sendWelcomeEmail({
                name: leadData.name,
                email: leadData.email,
                guide_type: lead.guideType,
                scheduledCall: leadData.daySelected,
                isUpdated: true // Flag to indicate this is a call confirmation
              });
              console.log("Separate seller call confirmation email sent successfully");
            } catch (error) {
              console.error("Failed to send seller call confirmation email:", error);
            }
          }
        }
        
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
          leadStatus: "completed",
          sentToDashboard: "true",
          archived: "false",
          // Store additional seller info in notes
          notes: [
            {
              timestamp: new Date().toISOString(),
              content: `Seller Chat Data: Need to buy: ${leadData.needToBuy || 'N/A'}, Occupancy: ${leadData.occupancyStatus || 'N/A'}, Price range: ${leadData.priceRange || 'N/A'}, Recent upgrades: ${leadData.recentUpgrades || 'N/A'}`
            }
          ]
        });
        
        // Broadcast new lead to dashboard
        broadcastToClients('lead_created', newLead);
        
        res.json({ success: true, leadId: newLead.id });
      }
    } catch (error) {
      console.error("Seller chat lead update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Assign lead to agent
  app.put("/api/leads/:id/assign", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const { assignedTo } = req.body;
      const { role, email } = req.user;

      // Only owners and superadmins can assign leads
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot assign leads' });
      }
      
      // Handle unassignment (empty string means unassign)
      const finalAssignedTo = assignedTo === "" ? null : assignedTo;
      
      if (finalAssignedTo !== null && typeof finalAssignedTo !== 'string') {
        return res.status(400).json({ message: "Assignment target must be a string or empty for unassignment" });
      }
      
      // Validate assignee if not unassigning
      if (finalAssignedTo !== null) {
        const allAgents = await storage.getAgents();
        const validAssignees = allAgents.map((agent: any) => agent.name);
        if (!validAssignees.includes(finalAssignedTo)) {
          return res.status(400).json({ message: "Invalid assignee - must be one of: " + validAssignees.join(", ") });
        }
      }
      
      // When assigning a lead, also restore it from trash if needed
      const updateData: any = { assignedTo: finalAssignedTo };
      if (finalAssignedTo !== null) {
        // If assigning to someone, restore from trash
        updateData.deletedAt = null;
      }
      
      const updatedLead = await storage.updateLead(id, updateData);
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json({ success: true, lead: updatedLead });
    } catch (error) {
      console.error("Failed to assign lead:", error);
      res.status(500).json({ message: "Failed to assign lead" });
    }
  });

  // Archive/unarchive lead
  app.put("/api/leads/:id/archive", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const { role, email } = req.user;

      // Check if user can access this lead
      const existingLeads = await storage.getLeads();
      const lead = existingLeads.find(l => l.id === id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Role-based access control
      if (role === "agent") {
        const currentUser = await storage.getUserByEmail(email);
        if (!currentUser || !currentUser.agentName || lead.assignedTo !== currentUser.agentName) {
          return res.status(403).json({ error: 'Access denied - lead not assigned to you' });
        }
      }
      // Owners and superadmins can archive any lead
      const { archived, assignedTo } = req.body;
      
      if (archived === undefined || (archived !== "true" && archived !== "false")) {
        return res.status(400).json({ message: "Archive status (true/false) is required" });
      }
      
      const updates: any = { archived };
      if (assignedTo !== undefined) {
        updates.assignedTo = assignedTo;
      }
      
      const updatedLead = await storage.updateLead(id, updates);
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json({ success: true, lead: updatedLead });
    } catch (error) {
      console.error("Failed to archive lead:", error);
      res.status(500).json({ message: "Failed to archive lead" });
    }
  });

  // General lead update route (for sales funnel status and other general updates)
  app.put("/api/leads/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const updates = req.body;
      const { role, email } = req.user;

      // Check if user can access this lead
      const existingLeads = await storage.getLeads();
      const lead = existingLeads.find(l => l.id === id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Role-based access control
      if (role === "agent") {
        const currentUser = await storage.getUserByEmail(email);
        if (!currentUser || !currentUser.agentName || lead.assignedTo !== currentUser.agentName) {
          return res.status(403).json({ error: 'Access denied - lead not assigned to you' });
        }
      }
      // Owners and superadmins can update any lead

      const updatedLead = await storage.updateLead(id, updates);
      if (!updatedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      res.json({ success: true, lead: updatedLead });
    } catch (error) {
      console.error("Failed to update lead:", error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // Soft delete lead (move to trash)
  app.put("/api/leads/:id/delete", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const { role, email } = req.user;

      // Only owners and superadmins can delete leads (soft delete)
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot delete leads' });
      }
      
      // Delete associated calendar events when moving lead to trash
      const allEvents = await storage.getAllEvents();
      const leadEvents = allEvents.filter(event => event.leadId === id);
      for (const event of leadEvents) {
        await storage.deleteEvent(event.id, event.userId);
        console.log(`🗑️ Deleted calendar event ${event.id} for lead ${id}`);
      }
      
      const updatedLead = await storage.updateLead(id, { 
        deletedAt: new Date() 
      });
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json({ success: true, lead: updatedLead });
    } catch (error) {
      console.error("Failed to delete lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // ChatGPT Help Assistant API endpoint
  app.post("/api/chat/help", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { message, context } = req.body;
      const { role, email } = req.user;

      // Basic validation
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      if (message.trim().length === 0 || message.length > 2000) {
        return res.status(400).json({ error: 'Message must be between 1 and 2000 characters' });
      }

      // Import OpenAI here to avoid loading it at startup
      const OpenAI = (await import('openai')).default;
      
      const openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY2 
      });

      // Build system prompt with comprehensive knowledge base
      const systemPrompt = `You are Nova, the intelligent assistant for the LeadsByNova™ real estate lead generation dashboard. You have comprehensive knowledge about this system and can help users navigate and use all features effectively.

USER CONTEXT:
- Role: ${role}
- Current Page: ${context?.currentPage || 'Dashboard'}

=== COMPREHENSIVE KNOWLEDGE BASE ===

🏠 SYSTEM OVERVIEW:
LeadsByNova™ is a multi-tenant real estate lead generation and management system designed for real estate professionals. It features role-based access, lead tracking through sales funnels, calendar management, and comprehensive note-taking capabilities.

📊 DASHBOARD STRUCTURE:
The dashboard uses a tabbed interface with role-based navigation:
- Daily Planner: Time-blocked schedule view with calendar events and lead appointments
- Calendar: Full calendar view for scheduling and event management  
- Pre-qualified: Leads ready for immediate follow-up
- Active Leads: Currently engaged prospects in the sales process
- Agents: (Admin/Owner only) Agent management and assignment
- Archived: Completed or inactive leads for reference
- Trash: Deleted leads (recoverable)

🎯 DAILY PLANNER FEATURES:
- Time-blocked schedule from 6 AM to 10 PM
- Calendar events display with times and descriptions
- Lead appointments show with contact information
- Notes section (40% width) for daily planning and task management
- Smart positioning: Events and leads automatically position in appropriate time slots
- Mobile responsive design with hamburger menu navigation

📝 NOTES SYSTEM:
- Personal note-taking with rich text support
- Manual save required: Users must click "Save Notes" button to save changes
- Role-based isolation (users only see their own notes)
- Searchable and organized by creation date
- Integration with daily planning workflow

📈 SALES FUNNEL MANAGEMENT:
Lead Status Options:
- "New": Fresh leads requiring initial contact
- "Contacted": First contact made, awaiting response
- "Qualified": Prospect shows genuine interest and meets criteria
- "Appointment Set": Meeting scheduled with prospect
- "Under Contract": Active purchase/sale agreement in progress
- "Closed": Successfully completed transaction
- "Lost": Prospect no longer interested or viable

Status Management:
- Dropdown selection for quick status updates
- Automatic timestamp tracking for status changes
- Role-based filtering (agents see only assigned leads)
- Bulk operations for efficient management

👥 ROLE-BASED ACCESS CONTROL:
Agent Role:
- Limited to assigned leads only
- Cannot see other agents' leads or data
- Streamlined navigation (Daily Planner, Calendar, Pre-qualified, Active Leads, Archived, Trash)
- Cannot access agent management features

Admin/Owner Role:
- Full system access and visibility
- All lead management capabilities
- Agent creation, assignment, and management
- System configuration and settings
- Complete navigation with administrative features

📅 CALENDAR INTEGRATION AND EVENT CREATION:

CRITICAL: EXACT STEPS TO ADD CALENDAR EVENTS:

**Method 1 - From Calendar Tab:**
1. Click on the "Calendar" tab in the main navigation
2. Look for the blue "+Add Event" button in the calendar header (located next to Today, Previous Month, Next Month buttons)
3. Click the "+Add Event" button
4. A modal titled "Add New Event" will open
5. Fill in the required fields:
   - Event Title: Enter a descriptive title (REQUIRED)
   - Description: Optional details about the event
   - Date: Select the date using the date picker
   - Start Time: Choose start time using the time picker
   - End Time: Choose end time (automatically sets to 1 hour after start time)
6. Click the blue "Create Event" button to save
7. Click "Cancel" to discard changes

**Method 2 - From Daily Schedule Section:**
1. Navigate to the "Daily Planner" tab
2. In the Daily Schedule area, look for the "+Add Event" button (visible on larger screens, icon-only on mobile)
3. Click the "+Add Event" button
4. Same modal and process as Method 1

**Method 3 - From Day Selection:**
1. In Calendar view, click on any date
2. A day popup will appear
3. Click the "+Add Event" button in the popup
4. Same modal and process as Method 1

**IMPORTANT EVENT MODAL DETAILS:**
- Modal title: "Add New Event"
- Event Title field: Required text input
- Description field: Optional textarea (3 rows)
- Date field: Date picker input
- Start Time field: Time picker (24-hour format)
- End Time field: Time picker (auto-adjusts to 1 hour after start time)
- Two buttons: Blue "Create Event" and Green "Cancel"
- Events automatically appear in both Calendar view and Daily Planner after creation

🗂️ LEAD MANAGEMENT WORKFLOWS:
1. Lead Import/Creation:
   - Manual lead entry through forms
   - Automatic assignment to agents
   - Initial status set to "New"

2. Lead Processing:
   - Status progression through sales funnel
   - Contact information management (name, email, phone)
   - Notes and communication tracking
   - Appointment scheduling integration

3. Lead Organization:
   - Archive completed leads for reference
   - Trash unwanted leads with recovery option
   - Filter and search capabilities
   - Bulk operations for efficiency

🛠️ COMMON TASKS & HOW-TOs:

**ADDING CALENDAR EVENTS (DETAILED STEPS):**
1. Navigate to the "Calendar" tab
2. Locate and click the blue "+Add Event" button (in calendar header area)
3. In the "Add New Event" modal that opens:
   - Enter a title in the "Event Title" field (required)
   - Add optional details in the "Description" field
   - Select the date using the date picker
   - Choose start time using the time picker
   - Set end time (or use the auto-suggested time)
4. Click the blue "Create Event" button to save
5. Your event will immediately appear in both the Calendar view and Daily Planner

**Managing Notes:**
1. Access Notes section in Daily Planner (desktop) or Notes tab (mobile)
2. Click "Add Note" or edit existing notes
3. Auto-save preserves changes automatically
4. Notes are private to your user account

**Updating Lead Status:**
1. Find lead in appropriate tab (Pre-qualified, Active Leads, etc.)
2. Click status dropdown next to lead name
3. Select new status from sales funnel options
4. Status updates automatically with timestamp

**Assigning Leads (Admin/Owner only):**
1. Access lead from any leads tab
2. Use assignment dropdown to select agent
3. Lead moves to agent's dashboard automatically
4. Agent receives notification of new assignment

**Archiving Leads:**
1. Locate completed or inactive lead
2. Use bulk selection or individual action
3. Move to Archive tab for future reference
4. Archived leads remain searchable

🔍 TROUBLESHOOTING:
- If leads don't appear: Check role permissions and assignments
- Calendar events not showing: Verify date/time format and refresh
- Notes not saving: Check internet connection and try again
- Status changes not updating: Refresh page and retry operation

💡 BEST PRACTICES:
- Update lead status promptly to maintain accurate pipeline
- Use notes for important client details and follow-up reminders
- Schedule follow-up appointments immediately after contact
- Archive completed deals to keep active pipeline clean
- Regularly review Daily Planner for upcoming tasks

🚨 IMPORTANT REMINDERS:
- Data is isolated by user role for privacy and security
- All changes are automatically saved and timestamped
- System maintains audit trail for lead status changes
- Mobile interface optimized for field work and quick updates

COMMUNICATION STYLE:
- Always respond in a friendly, conversational tone like a helpful colleague
- Use simple, everyday language that anyone can understand
- NO asterisks (*), bullet points, or technical formatting in responses
- Keep answers concise but complete
- Reference exact button names and locations, but present them naturally in conversation
- Use "you" and speak directly to the user
- Make instructions feel like friendly guidance, not technical documentation

EXAMPLE GOOD RESPONSE STYLE:
"To add an event to your calendar, just go to the Calendar tab and look for the blue 'Add Event' button at the top. Click that and you'll see a form where you can enter your event title, pick a date and time, and add any details you want. Hit 'Create Event' when you're done and it'll show up in both your calendar and daily planner!"

AVOID:
- **bold text**, *asterisks*, ###headers, bullet points
- Technical jargon or formal documentation language
- Long numbered lists
- Complex formatting

Keep it simple, friendly, and conversational while being accurate about the interface.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
      });

      const reply = response.choices[0].message.content;
      res.json({ success: true, reply });

    } catch (error) {
      console.error("Chat help error:", error);
      res.status(500).json({ 
        error: "Failed to get help response" 
      });
    }
  });

  // Permanently delete lead - CRITICAL: Only owners/superadmins
  app.delete("/api/leads/:id/permanent", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const { role } = req.user;
      
      // Only owners and superadmins can permanently delete leads
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot permanently delete leads' });
      }
      
      const deleted = await storage.permanentlyDeleteLead(id);
      if (!deleted) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to permanently delete lead:", error);
      res.status(500).json({ message: "Failed to permanently delete lead" });
    }
  });

  // Permanently delete all trashed leads - CRITICAL: Only owners/superadmins
  app.delete("/api/leads/trash/all", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can delete all trashed leads
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot delete all trashed leads' });
      }
      
      // Get all trashed leads (where deletedAt is not null)
      const allLeads = await storage.getLeads();
      const trashedLeads = allLeads.filter(lead => lead.deletedAt !== null);
      
      // Delete each trashed lead permanently
      let deletedCount = 0;
      for (const lead of trashedLeads) {
        const deleted = await storage.permanentlyDeleteLead(lead.id);
        if (deleted) deletedCount++;
      }
      
      console.log(`🗑️ Permanently deleted ${deletedCount} trashed leads by ${req.user.email}`);
      
      res.json({ 
        success: true, 
        message: `${deletedCount} trashed leads deleted permanently`,
        count: deletedCount 
      });
    } catch (error) {
      console.error("Failed to delete all trashed leads:", error);
      res.status(500).json({ message: "Failed to delete all trashed leads" });
    }
  });

  // Get all events for current user (with optional agent filtering for owners/superadmins)
  app.get("/api/events", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const events = await storage.getEvents(req.user.userId);
      res.json(events);
    } catch (error) {
      console.error("Failed to get events:", error);
      res.status(500).json({ message: "Failed to retrieve events" });
    }
  });

  // Create new event
  app.post("/api/events", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData, req.user.userId);
      
      res.json({ 
        success: true, 
        message: "Event created successfully",
        event 
      });
    } catch (error) {
      console.error("Event creation error:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Event creation failed" 
      });
    }
  });

  // Get specific event
  app.get("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const event = await storage.getEventById(id, req.user.userId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Failed to get event:", error);
      res.status(500).json({ message: "Failed to retrieve event" });
    }
  });

  // Update event
  app.put("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const updates = updateEventSchema.parse(req.body);
      
      const updatedEvent = await storage.updateEvent(id, updates, req.user.userId);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ 
        success: true, 
        message: "Event updated successfully",
        event: updatedEvent 
      });
    } catch (error) {
      console.error("Event update error:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Event update failed" 
      });
    }
  });

  // Delete event
  app.delete("/api/events/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const deleted = await storage.deleteEvent(id, req.user.userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ 
        success: true, 
        message: "Event deleted successfully" 
      });
    } catch (error) {
      console.error("Failed to delete event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // ============================================================================
  // BOOKING ROUTES (Public demo booking)
  // ============================================================================

  // Get available booking slots for a specific date
  app.get("/api/booking/availability", async (req, res) => {
    try {
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required' });
      }

      // Convert ISO date to YYYY-MM-DD format for comparison
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = dateObj.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Get all events for this date (check all users since demo bookings are system-wide)
      const allEvents = await storage.getAllEvents();
      const eventsOnDate = allEvents.filter(event => event.date === formattedDate);

      // Define our 2-hour booking slots
      const timeSlots = ["10:00", "12:00", "14:00", "16:00"];
      const bookedSlots: string[] = [];

      // For each time slot, check if ANY event conflicts with that 2-hour window
      timeSlots.forEach(slotStart => {
        const [slotStartHour, slotStartMin] = slotStart.split(':').map(Number);
        const slotEndHour = slotStartHour + 2; // 2-hour blocks
        const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotStartMin.toString().padStart(2, '0')}`;

        // Check if any event overlaps with this slot
        const hasConflict = eventsOnDate.some(event => {
          const eventStart = event.startTime;
          const eventEnd = event.endTime;

          // An event conflicts if:
          // Event starts before slot ends AND event ends after slot starts
          // This covers all overlap scenarios
          return eventStart < slotEnd && eventEnd > slotStart;
        });

        if (hasConflict) {
          bookedSlots.push(slotStart);
        }
      });

      res.json({ bookedSlots });
    } catch (error) {
      console.error("Availability check error:", error);
      res.status(500).json({ error: "Failed to check availability" });
    }
  });

  // Create demo booking (no authentication required for public booking)
  app.post("/api/booking/demo", async (req, res) => {
    try {
      const { date, startTime, endTime, title, description, contactName, contactEmail, contactPhone } = req.body;

      if (!date || !startTime || !endTime || !title || !contactName || !contactEmail || !contactPhone) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Use a system user ID for demo bookings (or the owner's ID)
      const users = await storage.getAllUsers();
      const ownerUser = users.find(u => u.role === 'owner');
      
      if (!ownerUser) {
        return res.status(500).json({ error: 'No owner user found for booking' });
      }

      // Check if slot is still available
      const allEvents = await storage.getAllEvents();
      const conflictingEvent = allEvents.find(
        event => event.date === date && event.startTime === startTime
      );

      if (conflictingEvent) {
        return res.status(409).json({ error: 'Time slot is no longer available' });
      }

      // Create or update lead with contact information
      let lead = await storage.getLeadByEmail(contactEmail);
      if (!lead) {
        // Create new lead
        lead = await storage.createLead({
          fullName: contactName,
          email: contactEmail,
          phone: contactPhone,
          guideType: "Demo Booking",
          formTimestamp: new Date(),
          sentToDashboard: "true",
          completedChat: "false",
          archived: "false",
          bookedCall: "true",
        });
      } else {
        // Update existing lead with demo booking info
        const updatedLead = await storage.updateLead(lead.id, {
          fullName: contactName, // Update name in case it changed
          phone: contactPhone, // Update phone in case it changed
          guideType: "Demo Booking", // Update to show demo booking
          sentToDashboard: "true", // Ensure it's visible in dashboard
          bookedCall: "true", // Mark that a call is booked
        });
        if (updatedLead) {
          lead = updatedLead;
        }
      }

      // Create event for calendar with contact name in title, linked to lead
      const eventTitle = `Demo Call - ${contactName}`;
      const event = await storage.createEvent({
        title: eventTitle,
        description: description || '',
        date,
        startTime,
        endTime
      }, ownerUser.id, lead.id);

      // Wait 3 seconds to let chat completion endpoint finish updating lead data
      // This prevents race conditions where booking endpoint checks lead state before chat updates it
      console.log('⏳ Waiting 3 seconds for chat to complete lead updates...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Re-fetch lead to get latest state (chat might have updated daySelected in parallel)
      const latestLead = await storage.getLeadByEmail(contactEmail);
      
      // Only send booking confirmation to lead if this is from /guide page (not chat)
      // Chat has its own welcome email system with the 2-minute timer
      if (!latestLead || !latestLead.daySelected || latestLead.daySelected.trim() === '') {
        await emailService.sendBookingConfirmation({
          name: contactName,
          email: contactEmail,
          date: date,
          time: startTime
        });
      } else {
        console.log('⏭️ Skipping booking confirmation email to lead - chat welcome email system will handle it');
      }
      
      // Only send agent notification if daySelected is empty (booking from /guide page)
      // If daySelected has a value, chat already sent a "CALL BOOKED" email with the appointment
      if (latestLead && latestLead.daySelected && latestLead.daySelected.trim() !== '') {
        console.log('⏭️ Skipping duplicate DEMO BOOKED email - chat already sent CALL BOOKED email with appointment details');
      } else {
        await emailService.sendBookingAgentNotification({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          date: date,
          time: startTime
        });
      }

      res.json({ 
        success: true, 
        message: "Demo booking created successfully",
        event 
      });
    } catch (error) {
      console.error("Demo booking error:", error);
      res.status(500).json({ 
        error: "Failed to create booking",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================================================
  // NOTES MANAGEMENT ROUTES
  // ============================================================================

  // Get all notes for current user
  app.get("/api/notes", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const notes = await storage.getNotes(req.user.userId);
      res.json(notes);
    } catch (error) {
      console.error("Failed to get notes:", error);
      res.status(500).json({ message: "Failed to retrieve notes" });
    }
  });

  // Create new note
  app.post("/api/notes", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedData, req.user.userId);
      
      res.json({ 
        success: true, 
        message: "Note created successfully",
        note 
      });
    } catch (error) {
      console.error("Note creation error:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Note creation failed" 
      });
    }
  });

  // Get specific note
  app.get("/api/notes/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const note = await storage.getNoteById(id, req.user.userId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Failed to get note:", error);
      res.status(500).json({ message: "Failed to retrieve note" });
    }
  });

  // Update note
  app.put("/api/notes/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const updates = insertNoteSchema.partial().parse(req.body);
      
      const updatedNote = await storage.updateNote(id, updates, req.user.userId);
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json({ 
        success: true, 
        message: "Note updated successfully",
        note: updatedNote 
      });
    } catch (error) {
      console.error("Note update error:", error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Note update failed" 
      });
    }
  });

  // Delete note
  app.delete("/api/notes/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const deleted = await storage.deleteNote(id, req.user.userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json({ 
        success: true, 
        message: "Note deleted successfully" 
      });
    } catch (error) {
      console.error("Failed to delete note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // ============================================================================
  // CONFIGURATION MANAGEMENT ROUTES
  // ============================================================================
  
  // Agent management routes
  app.get("/api/agents", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role, email } = req.user;
      
      // All authenticated users can view agents (for assignment dropdowns, etc.)
      const agents = await storage.getAgents();
      console.log(`🔒 RBAC: User ${email} (${role}) accessing ${agents.length} agents`);
      
      res.json(agents);
    } catch (error) {
      console.error("Failed to get agents:", error);
      res.status(500).json({ message: "Failed to retrieve agents" });
    }
  });

  app.post("/api/agents", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can create agents
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot create other agents' });
      }
      
      const validatedData = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(validatedData);
      res.status(201).json({
        success: true,
        message: "Agent created successfully",
        agent
      });
    } catch (error) {
      console.error("Agent creation error:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Agent creation failed"
      });
    }
  });

  app.get("/api/agents/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await storage.getAgentById(id);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error("Failed to get agent:", error);
      res.status(500).json({ message: "Failed to retrieve agent" });
    }
  });

  app.put("/api/agents/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can update agents
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot update other agents' });
      }
      
      const { id } = req.params;
      const updates = insertAgentSchema.partial().parse(req.body);
      
      const updatedAgent = await storage.updateAgent(id, updates);
      if (!updatedAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json({
        success: true,
        message: "Agent updated successfully",
        agent: updatedAgent
      });
    } catch (error) {
      console.error("Agent update error:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Agent update failed"
      });
    }
  });

  app.delete("/api/agents/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can delete agents
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot delete other agents' });
      }
      
      const { id } = req.params;
      const deleted = await storage.deleteAgent(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json({
        success: true,
        message: "Agent deleted successfully"
      });
    } catch (error) {
      console.error("Failed to delete agent:", error);
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // Change agent password
  app.put("/api/agents/:id/password", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can change agent passwords
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot change other agent passwords' });
      }
      
      const { id } = req.params;
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      
      // Get the agent first to find their email
      const agents = await storage.getAgents();
      const agent = agents.find(a => a.id === id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // For agent password changes, we need to update the user record, not agent record
      const user = await storage.getUserByEmail(agent.email || '');
      if (!user) {
        return res.status(404).json({ message: "User not found for this agent" });
      }

      const updatedUser = await storage.updateUser(user.id, { hashedPassword });
      
      res.json({
        success: true,
        message: "Password updated successfully"
      });
    } catch (error) {
      console.error("Failed to change agent password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Upload endpoint (alias for /api/upload/image for consistency)
  app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can upload files
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot upload files' });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      // Generate the full URL for the uploaded image
      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('Host');
      const imageUrl = `${protocol}://${host}/uploads/images/${req.file.filename}`;
      
      console.log('📸 Image uploaded successfully:', req.file.filename);
      
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        url: imageUrl, // Client expects 'url' field
        imageUrl: imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      });
    }
  });

  // App configuration routes
  app.get("/api/app-config", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role, email } = req.user;
      
      // All authenticated users can view app config for frontend customization
      const configs = await storage.getAppConfigs();
      console.log(`🔒 RBAC: User ${email} (${role}) accessing ${configs.length} configs`);
      
      res.json(configs);
    } catch (error) {
      console.error("Failed to get app configs:", error);
      res.status(500).json({ message: "Failed to retrieve app configurations" });
    }
  });

  app.post("/api/app-config", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can create app configurations
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot modify app configuration' });
      }
      
      const validatedData = insertAppConfigSchema.parse(req.body);
      const config = await storage.createAppConfig(validatedData);
      res.status(201).json({
        success: true,
        message: "Configuration created successfully",
        config
      });
    } catch (error) {
      console.error("Configuration creation error:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Configuration creation failed"
      });
    }
  });

  app.get("/api/app-config/:key", authenticateToken, async (req, res) => {
    try {
      const { key } = req.params;
      const config = await storage.getAppConfigByKey(key);
      
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Failed to get configuration:", error);
      res.status(500).json({ message: "Failed to retrieve configuration" });
    }
  });

  app.put("/api/app-config/:key", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can modify app configurations
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot modify app configuration' });
      }
      
      const { key } = req.params;
      const updates = updateAppConfigSchema.parse(req.body);
      
      const updatedConfig = await storage.updateAppConfig(key, updates);
      if (!updatedConfig) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json({
        success: true,
        message: "Configuration updated successfully",
        config: updatedConfig
      });
    } catch (error) {
      console.error("Configuration update error:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Configuration update failed"
      });
    }
  });

  // Upsert endpoint for configuration page - insert or update
  app.post("/api/app-config/update", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can modify app configurations
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot modify app configuration' });
      }
      
      const { configKey, configValue } = req.body;
      
      if (!configKey || configValue === undefined) {
        return res.status(400).json({ error: 'configKey and configValue are required' });
      }

      // Check if configuration exists
      const existingConfig = await storage.getAppConfigByKey(configKey);
      
      if (existingConfig) {
        // Update existing configuration
        const updatedConfig = await storage.updateAppConfig(configKey, { configValue });
        res.json({
          success: true,
          message: "Configuration updated successfully",
          config: updatedConfig
        });
      } else {
        // Create new configuration with default metadata
        const newConfig = await storage.createAppConfig({
          configKey,
          configValue,
          configType: 'text', // Default type
          description: `Configuration for ${configKey}`,
          category: 'custom'
        });
        res.status(201).json({
          success: true,
          message: "Configuration created successfully",
          config: newConfig
        });
      }
    } catch (error) {
      console.error("Configuration upsert error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Configuration update failed"
      });
    }
  });

  app.delete("/api/app-config/:key", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { role } = req.user;
      
      // Only owners and superadmins can delete app configurations
      if (role === "agent") {
        return res.status(403).json({ error: 'Access denied - agents cannot delete app configuration' });
      }
      
      const { key } = req.params;
      const deleted = await storage.deleteAppConfig(key);
      
      if (!deleted) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json({
        success: true,
        message: "Configuration deleted successfully"
      });
    } catch (error) {
      console.error("Failed to delete configuration:", error);
      res.status(500).json({ message: "Failed to delete configuration" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
