import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

const supabaseUrl = 'https://zukouymdwikwgldqhvoz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1a291eW1kd2lrd2dsZHFodm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTIwMDcsImV4cCI6MjA2NjA4ODAwN30.qMk4CrRJiN1IZUoEyk83LskilWXCdi3nrjVBQQaROLo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔐 Auth middleware - Headers:', req.headers);
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔑 Token received:', token.substring(0, 20) + '...');
    console.log('🔑 Token length:', token.length);
    
    // Verify the JWT token with Supabase
    console.log('🔍 Verifying token with Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.log('❌ Token verification failed:', error);
      console.log('❌ Error details:', JSON.stringify(error, null, 2));
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (!user) {
      console.log('❌ No user found in token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('✅ User authenticated:', user.id);
    console.log('✅ User email:', user.email);
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
}; 