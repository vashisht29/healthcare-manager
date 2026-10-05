import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './db.js';

const INITIAL_DOCTORS = [
  { id: 1, name: "Dr. Kabir Malhotra", specialty: "Cardiologist", contact: "+91 98111 22233", email: "kabir@caresync.com", password: "caresync@doctor", isAvailable: true, isOnLeave: false, slots: ["10:00 AM", "11:30 AM", "02:00 PM"] },
  { id: 2, name: "Dr. Ananya Sen", specialty: "Dermatologist", contact: "+91 98222 33344", email: "ananya@caresync.com", password: "caresync@doctor", isAvailable: true, isOnLeave: false, slots: ["10:00 AM", "02:00 PM", "03:30 PM"] },
  { id: 3, name: "Dr. Rohan Mehra", specialty: "Pediatrician", contact: "+91 98333 44455", email: "rohan@caresync.com", password: "caresync@doctor", isAvailable: true, isOnLeave: false, slots: ["11:30 AM", "03:30 PM"] },
  { id: 4, name: "Dr. Sara Khan", specialty: "General Physician", contact: "+91 98444 55566", email: "sara@caresync.com", password: "caresync@doctor", isAvailable: true, isOnLeave: false, slots: ["10:00 AM", "11:30 AM", "04:00 PM"] }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('doctors');

    // Seed if empty
    const count = await collection.countDocuments();
    if (count === 0) {
      await collection.insertMany(INITIAL_DOCTORS);
    }

    // READ (GET all)
    if (req.method === 'GET') {
      const doctors = await collection.find({}, { projection: { _id: 0 } }).toArray();
      return res.status(200).json(doctors);
    }

    // CREATE (POST /api/doctors)
    if (req.method === 'POST') {
      const body = req.body || {};
      const { name, specialty, contact, email, password } = body;
      if (!name || !specialty || !contact || !email) {
        return res.status(400).json({ success: false, message: 'Missing required doctor fields.' });
      }

      const formattedName = name.startsWith('Dr. ') ? name : `Dr. ${name}`;
      const newDoctor = {
        id: Date.now(),
        name: formattedName,
        specialty,
        contact,
        email,
        password: password || 'doctor123',
        isAvailable: true,
        isOnLeave: false,
        slots: ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"]
      };

      await collection.insertOne(newDoctor);
      return res.status(201).json({ success: true, doctor: newDoctor, message: 'Doctor registered successfully in MongoDB!' });
    }

    // UPDATE (PATCH or PUT - e.g. toggle leave or duty)
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const { id, isOnLeave, isAvailable } = req.body || {};
      if (!id) {
        return res.status(400).json({ success: false, message: 'Doctor ID is required.' });
      }

      const updateFields: any = {};
      if (typeof isOnLeave === 'boolean') {
        updateFields.isOnLeave = isOnLeave;
        updateFields.isAvailable = !isOnLeave;
      }
      if (typeof isAvailable === 'boolean') {
        updateFields.isAvailable = isAvailable;
      }

      const result = await collection.updateOne({ id: Number(id) }, { $set: updateFields });
      return res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
    }

    // DELETE (DELETE /api/doctors?id=123)
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Doctor ID is required.' });
      }

      const result = await collection.deleteOne({ id: Number(id) });
      return res.status(200).json({ success: true, deletedCount: result.deletedCount });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    // Graceful offline fallback if MongoDB service is not started
    if (req.method === 'GET') {
      return res.status(200).json(INITIAL_DOCTORS);
    }
    return res.status(500).json({ success: false, error: err.message });
  }
}
