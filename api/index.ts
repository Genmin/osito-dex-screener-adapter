// Vercel serverless function entry point
import app from '../src/server';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Export the Express app as a serverless function
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};