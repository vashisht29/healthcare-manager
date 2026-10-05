import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './db.js';

const INITIAL_APPOINTMENTS = [
  {
    id: 101,
    patientName: "Rajesh Kumar",
    patientContact: "+91 99887 76655",
    doctorName: "Dr. Aarav Sharma",
    specialty: "Cardiologist",
    slotTime: "2026-08-25 10:00 AM",
    problem: "Chest discomfort during morning walks.",
    status: "completed",
    createdAt: "2026-08-23 09:15 AM",
    completedAt: "2026-08-23 11:45 AM",
    calendarSynced: true,
    prescription: "Aspirin 75mg once daily after breakfast. Rest for 3 days.",
    aiPostSummary: "✨ AI Clinical Insights:\n• Clinical Goal: Recover from chest discomfort.\n• Medication Schedule: Take Aspirin (75mg) daily after breakfast.\n• Advice: Complete bed rest for 3 days; avoid dynamic exercise.\n• Reminder status: Notification jobs successfully configured in outbox."
  },
  {
    id: 102,
    patientName: "Rajesh Kumar",
    patientContact: "+91 99887 76655",
    doctorName: "Dr. Priya Patel",
    specialty: "Dermatologist",
    slotTime: "2026-08-26 02:00 PM",
    problem: "Skin rashes on lower arms.",
    status: "booked",
    createdAt: "2026-08-23 02:30 PM",
    calendarSynced: true
  }
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
    const collection = db.collection('appointments');

    // Seed if empty
    const count = await collection.countDocuments();
    if (count === 0) {
      await collection.insertMany(INITIAL_APPOINTMENTS);
    }

    // READ (GET /api/appointments)
    if (req.method === 'GET') {
      const appointments = await collection.find({}, { projection: { _id: 0 } }).sort({ id: -1 }).toArray();
      return res.status(200).json(appointments);
    }

    // CREATE (POST /api/appointments)
    if (req.method === 'POST') {
      const { patientName, patientContact, doctorName, specialty, slotTime, problem } = req.body || {};
      if (!patientName || !doctorName || !slotTime || !problem) {
        return res.status(400).json({ success: false, message: 'All booking fields are required.' });
      }

      const newAppt = {
        id: Date.now(),
        patientName,
        patientContact: patientContact || '+91 99887 76655',
        doctorName,
        specialty: specialty || 'General Physician',
        slotTime: `2026-08-25 ${slotTime}`,
        problem,
        status: 'booked',
        createdAt: new Date().toLocaleString(),
        calendarSynced: true
      };

      await collection.insertOne(newAppt);
      return res.status(201).json({ success: true, appointment: newAppt });
    }

    // UPDATE (PUT or PATCH /api/appointments)
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { id, status, prescription, aiPostSummary, completedAt } = req.body || {};
      if (!id) {
        return res.status(400).json({ success: false, message: 'Appointment ID is required.' });
      }

      const updateFields: any = {};
      if (status) updateFields.status = status;
      if (prescription !== undefined) updateFields.prescription = prescription;
      if (aiPostSummary !== undefined) updateFields.aiPostSummary = aiPostSummary;
      if (completedAt !== undefined) updateFields.completedAt = completedAt;
      if (status === 'cancelled') updateFields.calendarSynced = false;

      const result = await collection.updateOne({ id: Number(id) }, { $set: updateFields });
      return res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
    }

    // DELETE (DELETE /api/appointments?id=123)
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Appointment ID is required.' });
      }

      const result = await collection.deleteOne({ id: Number(id) });
      return res.status(200).json({ success: true, deletedCount: result.deletedCount });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (req.method === 'GET') {
      return res.status(200).json(INITIAL_APPOINTMENTS);
    }
    return res.status(500).json({ success: false, error: err.message });
  }
}
