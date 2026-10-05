import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, email, password, name, contact } = req.body || {};

  try {
    const { db } = await connectToDatabase();
    const users = db.collection('users');

    if (action === 'register') {
      if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
      }

      const existing = await users.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'User already registered with this email.' });
      }

      const newUser = {
        name,
        email,
        contact: contact || '',
        password, // In a full app, hash with bcrypt
        role: 'patient',
        createdAt: new Date().toISOString()
      };

      await users.insertOne(newUser);
      return res.status(201).json({ success: true, name: newUser.name, email: newUser.email, role: 'patient' });
    }

    if (action === 'login') {
      // Check hardcoded admin first
      if (email === 'admin@caresync.com' && password === 'AdminCareSync2026') {
        return res.status(200).json({ success: true, name: 'Hospital Administration', email, role: 'admin' });
      }

      // Check doctor in doctors collection
      const doctors = db.collection('doctors');
      const doc = await doctors.findOne({ email, password });
      if (doc) {
        return res.status(200).json({ success: true, name: doc.name, email: doc.email, role: 'doctor' });
      }

      // Check patient user
      const user = await users.findOne({ email, password });
      if (user) {
        return res.status(200).json({ success: true, name: user.name, email: user.email, role: user.role || 'patient' });
      }

      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action specified.' });
  } catch (err: any) {
    // Graceful offline fallback
    if (email === 'admin@caresync.com' && password === 'AdminCareSync2026') {
      return res.status(200).json({ success: true, name: 'Hospital Administration', email, role: 'admin' });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
}
