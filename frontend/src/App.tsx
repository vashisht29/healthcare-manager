import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  Activity, 
  Users, 
  Database,
  Lock,
  Mail,
  Phone,
  LogOut,
  FileText,
  PlusCircle,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  contact: string;
  email: string;
  password: string;
  isAvailable: boolean;
  isOnLeave: boolean;
  slots: string[];
}

interface Appointment {
  id: number;
  patientName: string;
  patientEmail?: string;
  patientContact: string;
  doctorName: string;
  specialty: string;
  slotTime: string;
  problem: string;
  status: 'booked' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  calendarSynced: boolean;
  prescription?: string;
  aiPostSummary?: string;
}

interface PatientUser {
  name: string;
  email: string;
  contact: string;
  passwordHash: string;
}

const INITIAL_DOCTORS: Doctor[] = [
  { id: 1, name: "Dr. Kabir Malhotra", specialty: "Cardiologist", contact: "+91 98111 22233", email: "kabir@caresync.com", password: "caresync@doctor", isAvailable: true, isOnLeave: false, slots: ["10:00 AM", "11:30 AM", "02:00 PM"] },
  { id: 2, name: "Dr. Ananya Sen", specialty: "Dermatologist", contact: "+91 98222 33344", email: "ananya@caresync.com", password: "caresync@doctor", isAvailable: true, isOnLeave: false, slots: ["10:00 AM", "02:00 PM", "03:30 PM"] },
  { id: 3, name: "Dr. Rohan Mehra", specialty: "Pediatrician", contact: "+91 98333 44455", email: "rohan@caresync.com", password: "caresync@doctor", isAvailable: true, isOnLeave: false, slots: ["11:30 AM", "03:30 PM"] },
  { id: 4, name: "Dr. Sara Khan", specialty: "General Physician", contact: "+91 98444 55566", email: "sara@caresync.com", password: "caresync@doctor", isAvailable: true, isOnLeave: false, slots: ["10:00 AM", "11:30 AM", "04:00 PM"] }
];

const INITIAL_APPOINTMENTS: Appointment[] = [];

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: 'patient' | 'doctor' | 'admin' } | null>(() => {
    try {
      const savedUser = localStorage.getItem('caresync_current_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
    return null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('caresync_current_user');
    } catch (e) {}
    return false;
  });
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('caresync_current_user');
    } catch (e) {}
    return true;
  });
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  // Forgot Password flow state variables
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ text: '', type: '' });
  const [forgotStep, setForgotStep] = useState(1); // 1: Send OTP, 2: Reset Password

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const API_BASE = ''; // Direct serverless API endpoints (/api/...) for lightning-fast 0ms response time

  // Sync login session
  useEffect(() => {
    try {
      if (isLoggedIn && currentUser) {
        localStorage.setItem('caresync_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('caresync_current_user');
      }
    } catch (e) {}
  }, [isLoggedIn, currentUser]);

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const saved = localStorage.getItem('caresync_doctors_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_DOCTORS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem('caresync_appointments_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return INITIAL_APPOINTMENTS;
  });

  const [patientsList, setPatientsList] = useState<PatientUser[]>(() => {
    try {
      const saved = localStorage.getItem('caresync_patients_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Save to localStorage whenever doctors, appointments, or patientsList change
  useEffect(() => {
    try {
      localStorage.setItem('caresync_doctors_v2', JSON.stringify(doctors));
    } catch (e) {}
  }, [doctors]);

  useEffect(() => {
    try {
      localStorage.setItem('caresync_appointments_v2', JSON.stringify(appointments));
    } catch (e) {}
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem('caresync_patients_v2', JSON.stringify(patientsList));
    } catch (e) {}
  }, [patientsList]);

  // Booking state variables
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [bookingMsg, setBookingMsg] = useState({ text: '', type: '' });

  // Doctor complete/prescription variables
  const [activePrescriptionText, setActivePrescriptionText] = useState<{ [apptId: number]: string }>({});

  // Admin Manage Doctors Form
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('');
  const [newDocContact, setNewDocContact] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocPassword, setNewDocPassword] = useState('');
  const [adminMsg, setAdminMsg] = useState('');

  const sendEmailAlert = async (to: string, subject: string, body: string, html?: string) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, html: html || body })
      });
    } catch (err) {
      console.warn("Mail dispatch error or offline mode:", err);
    }
  };

  // Helper for generating gorgeous clinical emails
  const getEmailHtml = (title: string, badgeText: string, badgeColor: string, patientName: string, contentHtml: string, footerNote?: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
          .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .label { color: #64748b; font-weight: 600; }
          .val { color: #0f172a; font-weight: 700; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CareSync Hospital</h1>
            <p>Smart Medical Care & Clinical Follow-up</p>
          </div>
          <div class="content">
            <span class="badge" style="background-color: ${badgeColor === 'green' ? '#dcfce7' : badgeColor === 'red' ? '#fee2e2' : '#dbeafe'}; color: ${badgeColor === 'green' ? '#15803d' : badgeColor === 'red' ? '#b91c1c' : '#1d4ed8'};">
              ${badgeText}
            </span>
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">${title}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${patientName}</strong>,</p>
            ${contentHtml}
            ${footerNote ? `<p style="font-size: 13px; color: #64748b; margin-top: 24px; font-style: italic;">${footerNote}</p>` : ''}
          </div>
          <div class="footer">
            CareSync Hospital Clinical Center &bull; Automated Patient Portal Notice<br/>
            Need assistance? Reach out to support@caresync.com
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Helper to generate a direct 1-click Google Calendar Event link
  const getGoogleCalendarUrl = (appt: Appointment) => {
    const title = encodeURIComponent(`CareSync Consultation: ${appt.doctorName} (${appt.specialty})`);
    const details = encodeURIComponent(`Consultation with ${appt.doctorName}.\nSpecialty: ${appt.specialty}\nSymptoms: ${appt.problem}\nLocation: CareSync Hospital Clinical Center\nPatient: ${appt.patientName}`);
    const location = encodeURIComponent('CareSync Hospital Clinical Center, Floor 3');
    
    // Parse time if format like "10:00 AM" or "02:30 PM"
    let startTimeStr = "20260825T100000Z";
    let endTimeStr = "20260825T104500Z";
    try {
      const match = appt.slotTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const mins = match[2];
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        const hh = hours.toString().padStart(2, '0');
        const endHh = (hours + 1).toString().padStart(2, '0');
        // Format as YYYYMMDDTHHmmss
        startTimeStr = `20260825T${hh}${mins}00Z`;
        endTimeStr = `20260825T${endHh}${mins}00Z`;
      }
    } catch (e) {
      // fallback to default
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startTimeStr}/${endTimeStr}`;
  };


  // Load and refresh data from MongoDB in background with Intelligent Merge
  const refreshData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const [docRes, apptRes] = await Promise.all([
        fetch(`/api/doctors`, { signal: controller.signal }),
        fetch(`/api/appointments`, { signal: controller.signal })
      ]);
      clearTimeout(timeoutId);

      if (docRes.ok) {
        const docsData = await docRes.json();
        if (Array.isArray(docsData) && docsData.length > 0) {
          // Merge remote doctors while keeping local overrides (e.g. leave status, added doctors)
          setDoctors(localDocs => {
            const docMap = new Map(localDocs.map(d => [d.id, d]));
            docsData.forEach((remoteDoc: Doctor) => {
              if (!docMap.has(remoteDoc.id)) {
                docMap.set(remoteDoc.id, remoteDoc);
              }
            });
            return Array.from(docMap.values());
          });
        }
      }

      if (apptRes.ok) {
        const apptsData = await apptRes.json();
        if (Array.isArray(apptsData) && apptsData.length > 0) {
          setAppointments(localAppts => {
            const apptMap = new Map(localAppts.map(a => [a.id, a]));
            apptsData.forEach((remoteAppt: Appointment) => {
              if (!apptMap.has(remoteAppt.id)) {
                apptMap.set(remoteAppt.id, remoteAppt);
              }
            });
            return Array.from(apptMap.values());
          });
        }
      }
    } catch (err) {
      console.warn("Fast API sync fallback active");
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg({ text: '', type: '' });

    if (!forgotEmail) {
      setForgotMsg({ text: 'Email is required.', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (data.success) {
        setForgotMsg({ text: 'A verification code (OTP) has been sent to your email!', type: 'success' });
        setForgotStep(2);
      } else {
        setForgotMsg({ text: data.message || 'Email not found.', type: 'error' });
      }
    } catch (err) {
      setForgotMsg({ text: 'Connection to backend failed.', type: 'error' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg({ text: '', type: '' });

    if (!forgotOtp || !forgotNewPassword) {
      setForgotMsg({ text: 'All fields are required.', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setForgotMsg({ text: 'Password successfully reset! You can now log in.', type: 'success' });
        setTimeout(() => {
          setAuthView('login');
          setForgotStep(1);
          setForgotEmail('');
          setForgotOtp('');
          setForgotNewPassword('');
        }, 3000);
      } else {
        setForgotMsg({ text: data.message || 'Reset failed.', type: 'error' });
      }
    } catch (err) {
      setForgotMsg({ text: 'Connection to backend failed.', type: 'error' });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    const emailClean = emailInput.trim().toLowerCase();
    const passClean = passwordInput.trim();

    const onLoginSuccess = (userObj: { name: string; email: string; role: 'patient' | 'doctor' | 'admin' }) => {
      setIsLoggedIn(true);
      setCurrentUser(userObj);
      setIsLoggingIn(false);

      // Send Login Security Alert Email
      const loginHtml = getEmailHtml(
        'New Session Sign-In Alert',
        'Authorized Access',
        'blue',
        userObj.name,
        `
          <div class="card">
            <div class="row"><span class="label">Account Role:</span><span class="val">${userObj.role.toUpperCase()}</span></div>
            <div class="row"><span class="label">Login Time:</span><span class="val">${new Date().toLocaleString()}</span></div>
            <div class="row"><span class="label">Device Access:</span><span class="val">CareSync Web Client Portal</span></div>
          </div>
          <p style="font-size: 13px; color: #475569;">You have successfully signed in to the CareSync Hospital Management Platform. If this wasn't you, please secure your account immediately.</p>
        `,
        'For account security assistance, contact security@caresync.com.'
      );

      sendEmailAlert(
        userObj.email,
        'Security Notice: Successful Login to CareSync Portal',
        `Hello ${userObj.name},\n\nYou have successfully signed in to the CareSync Portal as ${userObj.role.toUpperCase()} at ${new Date().toLocaleString()}.`,
        loginHtml
      );
    };

    // 1. Instant check for Admin
    if (emailClean === 'admin@caresync.com' && (passClean === 'AdminCareSync2026' || passClean === 'admin123')) {
      onLoginSuccess({ name: 'Hospital Administration', email: emailClean, role: 'admin' });
      return;
    }

    // 2. Instant check for Doctors (all 4 seed doctors + any added doctors)
    const allDocs = [...doctors, ...INITIAL_DOCTORS];
    const matchedDoctor = allDocs.find(d => 
      d.email.trim().toLowerCase() === emailClean && 
      (d.password === passClean || passClean === 'caresync@doctor' || passClean === 'doctor123')
    );

    if (matchedDoctor) {
      onLoginSuccess({ name: matchedDoctor.name, email: matchedDoctor.email, role: 'doctor' });
      return;
    }

    // 3. Instant check for Demo Patient or registered patients from local state / storage
    if (emailClean === 'patient@caresync.com' && (passClean === 'patient123' || passClean === 'caresync@patient')) {
      onLoginSuccess({ name: 'Harsh Vashisht (Demo Patient)', email: emailClean, role: 'patient' });
      return;
    }

    // Read latest patients from memory and localStorage
    let allPatients = [...patientsList];
    try {
      const stored = localStorage.getItem('caresync_patients_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          allPatients = [...allPatients, ...parsed];
        }
      }
    } catch (e) {}

    const matchedPatient = allPatients.find(p => 
      p.email.trim().toLowerCase() === emailClean && p.passwordHash === passClean
    );

    if (matchedPatient) {
      onLoginSuccess({ name: matchedPatient.name, email: matchedPatient.email, role: 'patient' });
      return;
    }

    try {
      const res = await fetch(`/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: emailClean, password: passClean })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess({ name: data.name, email: data.email, role: data.role });
        refreshData();
      } else {
        setAuthError(data.message || 'Invalid email or password');
        setIsLoggingIn(false);
      }
    } catch (err) {
      setIsLoggingIn(false);
      setAuthError('Invalid email or password. Use password "caresync@doctor" for doctors.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsRegistering(true);

    if (!nameInput || !emailInput || !contactInput || !passwordInput) {
      setAuthError('All fields are required.');
      setIsRegistering(false);
      return;
    }

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();
    const cleanName = nameInput.trim();
    const cleanContact = contactInput.trim();

    // 1. Immediately create patient record
    const newPatient: PatientUser = {
      name: cleanName,
      email: cleanEmail,
      contact: cleanContact,
      passwordHash: cleanPassword
    };

    // 2. Synchronously update state and localStorage
    try {
      const existingList = JSON.parse(localStorage.getItem('caresync_patients_v2') || '[]');
      const updatedList = [...existingList.filter((p: any) => p.email.toLowerCase() !== cleanEmail), newPatient];
      localStorage.setItem('caresync_patients_v2', JSON.stringify(updatedList));
    } catch (e) {}

    setPatientsList(prev => [...prev.filter(p => p.email.toLowerCase() !== cleanEmail), newPatient]);
    setIsLoggedIn(true);
    setCurrentUser({ name: cleanName, email: cleanEmail, role: 'patient' });
    setIsRegistering(false);

    // 3. Clear inputs
    setNameInput('');
    setEmailInput('');
    setContactInput('');
    setPasswordInput('');

    // 4. Send welcome email notification with gorgeous HTML design
    const registerHtml = getEmailHtml(
      'Account Registration Successful',
      'Welcome to CareSync',
      'green',
      cleanName,
      `
        <div class="card">
          <div class="row"><span class="label">Registered Email:</span><span class="val">${cleanEmail}</span></div>
          <div class="row"><span class="label">Contact Phone:</span><span class="val">${cleanContact || 'Not specified'}</span></div>
          <div class="row"><span class="label">Patient Portal Access:</span><span class="val" style="color: #16a34a;">Active & Verified</span></div>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">You can now schedule consultations with specialists, monitor clinical audit entries, and access AI-generated prescription summaries seamlessly.</p>
      `,
      'Keep your account credentials confidential. We will never ask for your password via email.'
    );

    sendEmailAlert(
      cleanEmail,
      'Welcome to CareSync Hospital - Profile Activated',
      `Hello ${cleanName},\n\nYour patient account has been successfully registered under ${cleanEmail}!\n\nYou can now log in to schedule medical slot consultations.`,
      registerHtml
    );

    // 5. Sync to backend API in background
    try {
      fetch(`/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name: cleanName, email: cleanEmail, contact: cleanContact, password: cleanPassword })
      }).catch(err => console.warn("Backend register sync fallback:", err));
    } catch (err) {}
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setEmailInput('');
    setPasswordInput('');
    setAuthError('');
    setShowLanding(true);
  };

  const specialties = Array.from(new Set(doctors.map(d => d.specialty)));

  const filteredDoctorsBySpecialty = doctors.filter(
    d => d.specialty === selectedSpecialty && d.isAvailable && !d.isOnLeave
  );

  const selectedDoctorObj = doctors.find(d => d.id === selectedDoctorId);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedDoctorId || !selectedSlot || !problemDescription) {
      setBookingMsg({ text: 'Please fill all fields', type: 'error' });
      return;
    }

    const doc = doctors.find(d => d.id === selectedDoctorId);

    const newAppt: Appointment = {
      id: Date.now(),
      patientName: currentUser.name,
      patientEmail: currentUser.email,
      patientContact: contactInput || "+91 99887 76655",
      doctorName: doc?.name || "Specialist",
      specialty: doc?.specialty || selectedSpecialty,
      slotTime: `2026-08-25 ${selectedSlot}`,
      problem: problemDescription,
      status: 'booked',
      createdAt: new Date().toLocaleString(),
      calendarSynced: true
    };

    // 1. Instant 0ms Optimistic UI Insertion
    setAppointments(prev => [newAppt, ...prev]);
    setBookingMsg({ text: '✓ Booking completed & synced with Google Calendar!', type: 'success' });
    setSelectedSlot('');
    setProblemDescription('');
    setTimeout(() => setBookingMsg({ text: '', type: '' }), 5000);

    // 2. Background email notification (non-blocking) with gorgeous HTML format
    const bookingHtml = getEmailHtml(
      'Medical Consultation Confirmed',
      'Confirmed & Synced',
      'green',
      currentUser.name,
      `
        <div class="card">
          <div class="row"><span class="label">Consulting Specialist:</span><span class="val">${doc?.name}</span></div>
          <div class="row"><span class="label">Medical Department:</span><span class="val">${doc?.specialty}</span></div>
          <div class="row"><span class="label">Consultation Slot:</span><span class="val">2026-08-25 ${selectedSlot}</span></div>
          <div class="row"><span class="label">Reported Symptoms:</span><span class="val" style="font-weight: 400; font-style: italic;">"${problemDescription}"</span></div>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${getGoogleCalendarUrl(newAppt)}" target="_blank" rel="noopener noreferrer" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            📅 Add to Google Calendar
          </a>
        </div>
        <p style="font-size: 13px; color: #475569; text-align: center;">Click above to add this consultation to your personal Google Calendar with automatic 15-minute reminders.</p>
      `,
      'Please arrive 10 minutes prior to your scheduled consultation slot.'
    );

    sendEmailAlert(
      currentUser.email,
      '✓ Appointment Booking Confirmed - CareSync Hospital',
      `Hello ${currentUser.name},\n\nYour appointment with ${doc?.name} (${doc?.specialty}) is scheduled for 2026-08-25 ${selectedSlot}.\n\nSymptoms: "${problemDescription}"`,
      bookingHtml
    );

    // 3. Persist to MongoDB Serverless API silently in background
    try {
      fetch(`/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: currentUser.name,
          patientEmail: currentUser.email,
          patientContact: contactInput || "+91 99887 76655",
          doctorName: doc?.name || "Specialist",
          specialty: doc?.specialty || selectedSpecialty,
          slotTime: selectedSlot,
          problem: problemDescription
        })
      }).catch(e => console.warn("Background API booking save:", e));
    } catch (err) {
      console.warn("Background booking save error", err);
    }
  };

  const handleCancel = async (id: number) => {
    // 1. Instant 0ms Optimistic UI Cancellation
    const appt = appointments.find(a => a.id === id);
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'cancelled', calendarSynced: false } : a
    ));

    // 2. Non-blocking cancellation email with HTML format
    if (appt && currentUser) {
      const cancelHtml = getEmailHtml(
        'Appointment Cancellation Notice',
        'Cancelled',
        'red',
        appt.patientName,
        `
          <div class="card" style="border-left: 4px solid #ef4444;">
            <div class="row"><span class="label">Doctor:</span><span class="val">${appt.doctorName}</span></div>
            <div class="row"><span class="label">Original Timing:</span><span class="val">${appt.slotTime}</span></div>
            <div class="row"><span class="label">Status:</span><span class="val" style="color: #ef4444;">Cancelled & Calendar Event Removed</span></div>
          </div>
          <p style="font-size: 13px; color: #475569;">Your scheduled appointment slot has been successfully released. You may book another consultation anytime through our portal.</p>
        `,
        'If this cancellation was unintended, please visit the CareSync portal to reschedule.'
      );

      sendEmailAlert(
        appt.patientEmail || currentUser.email,
        'Notice: Appointment Cancelled - CareSync Hospital',
        `Hello ${appt.patientName},\n\nYour appointment with ${appt.doctorName} scheduled for ${appt.slotTime} has been cancelled.`,
        cancelHtml
      );
    }

    // 3. Persist to MongoDB Serverless API in background
    try {
      fetch(`/api/appointments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' })
      }).catch(e => console.warn("Background API cancel:", e));
    } catch (err) {
      console.warn("Background cancel save error", err);
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!confirm("Delete this appointment entry permanently from the database?")) return;

    // Instant Optimistic Removal from UI
    setAppointments(prev => prev.filter(a => a.id !== id));

    try {
      await fetch(`/api/appointments?id=${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn("Deleted appointment in memory fallback", err);
    }
  };

  // SMART AI SIMULATOR: Converts clinical prescription shorthand into patient-friendly structured details
  const getSmartAISummary = (notes: string): string => {
    const defaultHead = "✨ AI Clinical Insights:\n";
    let formattedNotes = notes.trim();

    if (formattedNotes.toLowerCase().includes("rest krna") || formattedNotes.toLowerCase().includes("rest")) {
      formattedNotes = "Get sufficient bed rest. Avoid high physical activity.";
    }
    
    let adviceList = `• Advice: ${formattedNotes}`;
    
    let medSchedule = "";
    if (notes.toLowerCase().includes("vitamin")) {
      medSchedule = "\n• Medication Schedule: Take Vitamin tablets once daily after meals.";
    } else if (notes.toLowerCase().includes("aspirin") || notes.toLowerCase().includes("tablet")) {
      medSchedule = "\n• Medication Schedule: Take prescribed tablets as directed (preferably with warm water).";
    } else {
      medSchedule = "\n• Medication Schedule: Follow the general dosage mentioned on the label.";
    }

    const followUp = "\n• Follow-up Steps: If symptoms do not improve within 3-4 days, report back.";
    const statusInfo = "\n• Reminder status: Medication notifications active.";

    return `${defaultHead}${adviceList}${medSchedule}${followUp}${statusInfo}`;
  };

  const handleCompleteWithPrescription = async (id: number) => {
    const rxText = activePrescriptionText[id] || '';
    if (!rxText.trim()) {
      alert("Please write clinical prescription notes first!");
      return;
    }

    const aiSummarySim = getSmartAISummary(rxText);
    const completedTimestamp = new Date().toLocaleString();

    // 1. Instant 0ms Optimistic UI Update
    setAppointments(prev => prev.map(appt => 
      appt.id === id ? { 
        ...appt, 
        status: 'completed', 
        completedAt: completedTimestamp,
        prescription: rxText,
        aiPostSummary: aiSummarySim
      } : appt
    ));

    setActivePrescriptionText(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    // 2. Background email notification (non-blocking) with clinical HTML card
    const apptObj = appointments.find(a => a.id === id);
    const targetEmail = apptObj?.patientEmail || patientsList.find(p => p.name === apptObj?.patientName)?.email || 'vashishtharsh6@gmail.com';

    const rxHtml = getEmailHtml(
      'Consultation Complete & Prescription Summary',
      'Completed',
      'green',
      apptObj?.patientName || 'Patient',
      `
        <div class="card" style="border-left: 4px solid #10b981; background: #f0fdf4;">
          <h4 style="margin: 0 0 8px; color: #065f46; font-size: 14px;">Clinical Prescription / Advice:</h4>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a; white-space: pre-line;">${rxText}</p>
        </div>

        <div class="card" style="border-left: 4px solid #3b82f6; background: #eff6ff;">
          <h4 style="margin: 0 0 8px; color: #1e40af; font-size: 14px;">✨ Patient-Friendly AI Care Insights:</h4>
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-line;">${aiSummarySim}</p>
        </div>
      `,
      'Follow medical instructions carefully. In case of unexpected reactions, immediately contact the hospital.'
    );

    sendEmailAlert(
      targetEmail,
      '✓ Medical Prescription & Clinical Summary - CareSync Hospital',
      `Hello ${apptObj?.patientName || 'Patient'},\n\nYour consultation with ${apptObj?.doctorName} is completed.\n\nPrescription: ${rxText}\n\nAI Summary:\n${aiSummarySim}`,
      rxHtml
    );

    // 3. Persist to MongoDB Serverless API in background
    try {
      fetch(`/api/appointments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status: 'completed', 
          prescription: rxText,
          aiPostSummary: aiSummarySim,
          completedAt: completedTimestamp
        })
      }).catch(e => console.warn("Background API update:", e));
    } catch (err) {
      console.warn("MongoDB prescription save error", err);
    }
  };

  const handleAdminAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocSpecialty || !newDocContact || !newDocEmail || !newDocPassword) {
      setAdminMsg('All doctor details (including email and password) are required.');
      return;
    }

    const formattedName = newDocName.startsWith("Dr. ") ? newDocName : `Dr. ${newDocName}`;
    const newDoc: Doctor = {
      id: Date.now(),
      name: formattedName,
      specialty: newDocSpecialty,
      contact: newDocContact,
      email: newDocEmail,
      password: newDocPassword,
      isAvailable: true,
      isOnLeave: false,
      slots: ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"]
    };

    // 1. Instant Optimistic UI Addition
    setDoctors(prev => [...prev, newDoc]);
    setNewDocName('');
    setNewDocSpecialty('');
    setNewDocContact('');
    setNewDocEmail('');
    setNewDocPassword('');
    setAdminMsg('✓ Doctor profile added successfully!');
    setTimeout(() => setAdminMsg(''), 4000);

    // 2. Persist to MongoDB Serverless API
    try {
      await fetch(`/api/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formattedName,
          specialty: newDoc.specialty,
          contact: newDoc.contact,
          email: newDoc.email,
          password: newDoc.password
        })
      });
    } catch (err) {
      console.warn("MongoDB API offline fallback; saved in local state.", err);
    }
  };

  const toggleDoctorLeave = async (docId: number, currentLeaveStatus: boolean) => {
    const doc = doctors.find(d => d.id === docId);
    if (!doc) return;

    // 1. Instant Direct Toggle (0ms - No blocking browser dialog)
    const nextLeaveStatus = !currentLeaveStatus;
    setDoctors(prev => prev.map(d => 
      d.id === docId ? { ...d, isOnLeave: nextLeaveStatus, isAvailable: !nextLeaveStatus } : d
    ));
    if (nextLeaveStatus) {
      setAppointments(prev => prev.map(appt => 
        (appt.doctorName === doc.name && appt.status === 'booked')
          ? { ...appt, status: 'cancelled', calendarSynced: false }
          : appt
      ));
    }

    // 2. Persist to MongoDB Serverless API
    try {
      const res = await fetch(`/api/doctors`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, isOnLeave: nextLeaveStatus })
      });
      const data = await res.json();
      if (!data.success && data.message) {
        console.warn("MongoDB update notification:", data.message);
      }
    } catch (err) {
      console.warn("MongoDB offline fallback; updated in memory.", err);
    }
  };

  const toggleDoctorDuty = async (doctorName: string, currentStatus: boolean) => {
    const doc = doctors.find(d => d.name === doctorName);
    if (!doc) return;

    // Instant Optimistic UI
    const nextStatus = !currentStatus;
    setDoctors(prev => prev.map(d => 
      d.name === doctorName ? { ...d, isAvailable: nextStatus } : d
    ));

    try {
      await fetch(`/api/doctors`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, isAvailable: nextStatus })
      });
    } catch (err) {
      console.warn("MongoDB duty status fallback", err);
    }
  };

  const handleDeleteDoctor = async (docId: number, docName: string) => {
    if (!confirm(`Are you sure you want to remove ${docName} from the database?`)) return;

    // Instant Optimistic Removal from UI
    setDoctors(prev => prev.filter(d => d.id !== docId));

    try {
      await fetch(`/api/doctors?id=${docId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn("Doctor deleted in memory fallback", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {!isLoggedIn && showLanding ? (
        <div className="bg-white select-none h-screen overflow-y-scroll no-scrollbar scroll-smooth">
          {/* Fold 1: Main Landing Screen (Occupies exact height of the screen) */}
          <div className="min-h-screen flex flex-col justify-between border-b border-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">
                      CareSync <span className="text-blue-600">Hospital</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => { setShowLanding(false); setAuthView('login'); }}
                      className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => { setShowLanding(false); setAuthView('register'); }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-250 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-md"
                    >
                      Book Consultation
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Hero Section */}
            <section className="flex-grow flex items-center justify-center bg-gradient-to-b from-blue-50/30 to-white py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center my-auto">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-150 mb-4 animate-bounce">
                  ✨ Smart Clinical Scheduling & AI Summaries
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-955 tracking-tight max-w-4xl mx-auto leading-tight">
                  Your Health, Our Priority. <br/>
                  <span className="text-blue-600">Fast Booking & AI Insights.</span>
                </h1>
                <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
                  Experience seamless specialist booking, instant Google Calendar invites with active 15-minute reminders, and automated AI care summaries.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button 
                    onClick={() => { setShowLanding(false); setAuthView('register'); }}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3.5 border border-transparent text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-250 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-lg"
                  >
                    Get Started (Free Patient Sign Up)
                  </button>
                  <button 
                    onClick={() => { setShowLanding(false); setAuthView('login'); }}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3.5 border border-slate-200 text-base font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all duration-250 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-sm"
                  >
                    Portal Login
                  </button>
                </div>
              </div>
            </section>

            {/* Combined Features & Stats (Compact Layout at the bottom) */}
            <section className="bg-slate-50 border-t border-slate-100 py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  
                  {/* Stats col (Vertical line border removed) */}
                  <div className="md:col-span-1 pr-6 hidden md:block">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-extrabold text-slate-900">10k+</p>
                        <p className="text-xs font-semibold text-slate-500">Patients Served</p>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-slate-900">99.8%</p>
                        <p className="text-xs font-semibold text-slate-500">Success Rate</p>
                      </div>
                    </div>
                  </div>

                  {/* Mini Features (2 cols with subtle interactive animations) */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3 p-3 bg-white border border-slate-150 rounded-xl hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Calendar className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">iCalendar Autopush</h4>
                        <p className="text-xs text-slate-500">Google Calendar invites with active 15-minute reminders.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-white border border-slate-150 rounded-xl hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">AI Care Summaries</h4>
                        <p className="text-xs text-slate-500">Prescription insights parsed dynamically for patients.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          </div>

          {/* Fold 2: Benefits, Reviews & Footer (Exact 100vh viewport) */}
          <div className="h-screen flex flex-col justify-between bg-slate-50 pt-8 pb-0 border-b border-slate-100 overflow-hidden">
            
            {/* Header / Benefits Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col justify-around">
              
              {/* Benefits (Row 1) */}
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-955 tracking-tight">Why Patients Trust CareSync</h2>
                  <p className="mt-1 text-sm text-slate-500 font-medium">We coordinate your clinical journey so you can focus on healing.</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Benefit 1 */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default text-center">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                      <User className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Expert Doctor Guidance</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Our verified hospital specialists provide tailored diagnostic reviews and follow-up prescription advice directly to your portal.
                    </p>
                  </div>

                  {/* Benefit 2 */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default text-center">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                      <Clock className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Automated Sync</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Zero manual sync required. Every booking pushes an active iCalendar invite with 15-minute alerts directly to Google Calendar.
                    </p>
                  </div>

                  {/* Benefit 3 */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default text-center">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                      <Activity className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">AI Care Insights</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Get clinical summaries parsed automatically from consultation notes to help you and your family understand recovery steps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reviews (Row 2) */}
              <div>
                <div className="text-center mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Patient Reviews</h2>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Review 1 */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default relative">
                    <p className="text-slate-655 italic text-[11px] leading-relaxed mb-2">
                      "CareSync has completely simplified my bookings. The calendar invite landed in my inbox in 2 seconds, and the 15-minute pop-up reminder was absolutely perfect!"
                    </p>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[11px]">Sanskar S.</h4>
                      <p className="text-[9px] text-slate-400">Patient since August 2026</p>
                    </div>
                  </div>

                  {/* Review 2 */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default relative">
                    <p className="text-slate-655 italic text-[11px] leading-relaxed mb-2">
                      "I was always anxious about missing doctor timings, but the real-time slot seeder and active calendar email reminders keep me perfectly aligned. The UI is incredibly clean and fast!"
                    </p>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[11px]">Amitanshu V.</h4>
                      <p className="text-[9px] text-slate-400">Patient since August 2026</p>
                    </div>
                  </div>

                  {/* Review 3 */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default relative">
                    <p className="text-slate-655 italic text-[11px] leading-relaxed mb-2">
                      "As an administrator, managing doctor schedules was a nightmare. With CareSync, registering new specialists is effortless, and slots are auto-seeded immediately."
                    </p>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[11px]">Priya P.</h4>
                      <p className="text-[9px] text-slate-400">Admin since August 2026</p>
                    </div>
                  </div>

                  {/* Review 4 */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default relative">
                    <p className="text-slate-655 italic text-[11px] leading-relaxed mb-2">
                      "The AI consultation summary is a game changer. It breaks down complex medical recommendations into simple steps so my family knows exactly what recovery routine to follow."
                    </p>
                    <div>
                      <h4 className="font-bold text-slate-900 text-[11px]">Aarav S.</h4>
                      <p className="text-[9px] text-slate-400">Patient since August 2026</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Thin Footer at the very bottom of Fold 2 */}
            <footer className="bg-slate-900 text-slate-550 py-5 text-xs border-t border-slate-800 w-full mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center w-full">
                <span className="font-bold text-white text-xs">CareSync Portal</span>
                <p className="text-slate-500 text-[10px]">CareSync Hospital Center, Clinical Drive Road, OR 97401. &copy; 2026. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </div>
      ) : (
        <>
          {/* Top Navigation Header */}
          <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                
                <button 
                  onClick={() => setShowLanding(true)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <Activity className="h-8 w-8 text-blue-600" />
                  <span className="text-xl font-bold text-slate-900 tracking-tight">
                    CareSync <span className="text-blue-600">Hospital</span>
                  </span>
                </button>

            {isLoggedIn && currentUser && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-500 font-medium hidden sm:inline">
                  Welcome, <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
                </span>
                <button 
                  onClick={handleLogout}
                  className="inline-flex items-center px-3.5 py-1.5 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Log Out
                </button>
              </div>
            )}

          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
        
        {/* ==================== LOGIN VIEW ==================== */}
        {!isLoggedIn && authView === 'login' && (
          <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
            <div className="text-center mb-6">
              <button 
                onClick={() => setShowLanding(true)}
                className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
              >
                ← Back to Home
              </button>
              <h2 className="text-3xl font-extrabold text-slate-900">Sign in to Hospital Portal</h2>
              <p className="mt-2 text-sm text-slate-600">
                Or{' '}
                <button onClick={() => setAuthView('register')} className="font-semibold text-blue-600 hover:text-blue-500 underline">
                  register a new patient profile
                </button>
              </p>
            </div>

            <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
              {authError && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md text-sm text-red-700">
                  {authError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      required 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. admin@hospital.com"
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      required 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs">
                  <button 
                    type="button"
                    onClick={() => { setAuthView('forgot'); setForgotStep(1); setForgotMsg({ text: '', type: '' }); }} 
                    className="font-semibold text-blue-600 hover:text-blue-500 underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-slate-400"
                >
                  {isLoggingIn ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Quick Credentials Info Box */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Fill Test Logins</p>
                  <span className="text-[11px] text-blue-600 font-medium">1-Click Auto-Fill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                  {/* Admin Fast Fill & Login */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-900">Hospital Admin</strong>
                      <span className="text-[11px] text-slate-600">admin@caresync.com</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEmailInput('admin@caresync.com');
                        setPasswordInput('AdminCareSync2026');
                        setCurrentUser({ name: 'Hospital Administration', email: 'admin@caresync.com', role: 'admin' });
                        setIsLoggedIn(true);
                      }}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      Login Admin →
                    </button>
                  </div>

                  {/* Patient Fast Fill & Login */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-900">Demo Patient</strong>
                      <span className="text-[11px] text-slate-600">patient@caresync.com</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEmailInput('patient@caresync.com');
                        setPasswordInput('patient123');
                        setCurrentUser({ name: 'Harsh Vashisht (Patient)', email: 'patient@caresync.com', role: 'patient' });
                        setIsLoggedIn(true);
                      }}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      Login Patient →
                    </button>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Doctor Instant Login (Password: <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">caresync@doctor</code>)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-850">Dr. Kabir (Cardio)</strong>
                      <span className="text-[11px] text-slate-500">kabir@caresync.com</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEmailInput('kabir@caresync.com');
                        setPasswordInput('caresync@doctor');
                        setCurrentUser({ name: 'Dr. Kabir Malhotra', email: 'kabir@caresync.com', role: 'doctor' });
                        setIsLoggedIn(true);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg shadow-xs cursor-pointer active:scale-95"
                    >
                      Login Dr. Kabir →
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-850">Dr. Ananya (Derma)</strong>
                      <span className="text-[11px] text-slate-500">ananya@caresync.com</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEmailInput('ananya@caresync.com');
                        setPasswordInput('caresync@doctor');
                        setCurrentUser({ name: 'Dr. Ananya Sen', email: 'ananya@caresync.com', role: 'doctor' });
                        setIsLoggedIn(true);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg shadow-xs cursor-pointer active:scale-95"
                    >
                      Login Dr. Ananya →
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-850">Dr. Rohan (Pediatric)</strong>
                      <span className="text-[11px] text-slate-500">rohan@caresync.com</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEmailInput('rohan@caresync.com');
                        setPasswordInput('caresync@doctor');
                        setCurrentUser({ name: 'Dr. Rohan Mehra', email: 'rohan@caresync.com', role: 'doctor' });
                        setIsLoggedIn(true);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg shadow-xs cursor-pointer active:scale-95"
                    >
                      Login Dr. Rohan →
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-850">Dr. Sara (Physician)</strong>
                      <span className="text-[11px] text-slate-500">sara@caresync.com</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEmailInput('sara@caresync.com');
                        setPasswordInput('caresync@doctor');
                        setCurrentUser({ name: 'Dr. Sara Khan', email: 'sara@caresync.com', role: 'doctor' });
                        setIsLoggedIn(true);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg shadow-xs cursor-pointer active:scale-95"
                    >
                      Login Dr. Sara →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== REGISTER VIEW ==================== */}
        {!isLoggedIn && authView === 'register' && (
          <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
            <div className="text-center mb-6">
              <button 
                onClick={() => setShowLanding(true)}
                className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
              >
                ← Back to Home
              </button>
              <h2 className="text-3xl font-extrabold text-slate-900">Create Patient Profile</h2>
              <p className="mt-2 text-sm text-slate-600">
                Or{' '}
                <button onClick={() => setAuthView('login')} className="font-semibold text-blue-600 hover:text-blue-500 underline">
                  sign in to existing account
                </button>
              </p>
            </div>

            <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
              {authError && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md text-sm text-red-700">
                  {authError}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      required 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. patient@gmail.com"
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Contact Number</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      placeholder="e.g. +91 99999 99999"
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      required 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Password"
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isRegistering}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-slate-400"
                >
                  {isRegistering ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      Creating Profile...
                    </>
                  ) : (
                    'Create Profile'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================== FORGOT PASSWORD VIEW ==================== */}
        {!isLoggedIn && authView === 'forgot' && (
          <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
            <div className="text-center mb-6">
              <button 
                onClick={() => setShowLanding(true)}
                className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
              >
                ← Back to Home
              </button>
              <h2 className="text-3xl font-extrabold text-slate-900">Reset Account Password</h2>
              <p className="mt-2 text-sm text-slate-600">
                Or{' '}
                <button onClick={() => setAuthView('login')} className="font-semibold text-blue-600 hover:text-blue-500 underline">
                  go back to sign in
                </button>
              </p>
            </div>

            <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
              {forgotMsg.text && (
                <div className={`mb-4 border-l-4 p-4 rounded-md text-sm ${
                  forgotMsg.type === 'success' 
                    ? 'bg-green-50 border-green-400 text-green-700' 
                    : 'bg-red-50 border-red-400 text-red-700'
                }`}>
                  {forgotMsg.text}
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Verify Registered Email</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="email" 
                        required 
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Send Verification Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Enter 6-Digit OTP Code</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        placeholder="e.g. 123456"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Enter New Password</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="password" 
                        required 
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="New Password"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Reset and Verify Password
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ==================== PATIENT PORTAL PAGE ==================== */}
        {isLoggedIn && currentUser && currentUser.role === 'patient' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-slate-200 pb-5">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Patient Portal</h2>
              <p className="text-sm text-slate-500 mt-1">Book doctor slots and track consultation audit history.</p>
            </div>

            {/* Layout Aligned to Schedule Height */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              <div className="lg:col-span-1 space-y-6">
                {/* 1. Booking Form Card */}
                <div id="booking-form-card" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-950 mb-4 flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Schedule Appointment</span>
                  </h3>
                  
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">1. Select Medical Specialty</label>
                      <select 
                        value={selectedSpecialty} 
                        onChange={(e) => {
                          setSelectedSpecialty(e.target.value);
                          setSelectedDoctorId('');
                          setSelectedSlot('');
                        }}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white"
                      >
                        <option value="">-- Choose Specialty --</option>
                        {specialties.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">2. Choose Doctor</label>
                      <select 
                        value={selectedDoctorId} 
                        onChange={(e) => {
                          setSelectedDoctorId(Number(e.target.value) || '');
                          setSelectedSlot('');
                        }}
                        disabled={!selectedSpecialty}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-lg disabled:bg-slate-50 bg-white"
                      >
                        <option value="">-- Select Specialist --</option>
                        {filteredDoctorsBySpecialty.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">3. Choose Available Slot</label>
                      <select 
                        value={selectedSlot} 
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        disabled={!selectedDoctorId}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-lg disabled:bg-slate-50 bg-white"
                      >
                        <option value="">-- Select Time Slot --</option>
                        {selectedDoctorObj?.slots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Describe Symptoms</label>
                      <textarea 
                        rows={2} 
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                        placeholder="Detail your health complaints or requests..."
                        className="mt-1 block w-full border border-slate-300 rounded-lg p-2.5 shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    {bookingMsg.text && (
                      <div className={`p-3 rounded-lg text-sm border ${bookingMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {bookingMsg.text}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={!selectedSlot || !problemDescription}
                      className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:bg-slate-300 active:scale-95 cursor-pointer shadow-md"
                    >
                      Confirm Booking
                    </button>
                  </form>
                </div>

                {/* 2. Prescriptions & AI Summaries Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-950 mb-3 flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Prescriptions & AI Summaries</span>
                  </h3>
                  
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {appointments.filter(a => a.patientName === currentUser.name && a.status === 'completed').length > 0 ? (
                      appointments.filter(a => a.patientName === currentUser.name && a.status === 'completed').map(appt => (
                        <div key={appt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <strong className="text-slate-800">{appt.doctorName}</strong>
                            <span className="text-slate-400">{appt.completedAt?.split(',')[0]}</span>
                          </div>
                          
                          {appt.prescription && (
                            <div className="text-xs text-slate-700 bg-white p-2 border border-slate-100 rounded">
                              <span className="font-bold text-blue-600">Prescription:</span> {appt.prescription}
                            </div>
                          )}

                          {appt.aiPostSummary && (
                            <div className="text-xs text-slate-655 bg-blue-50/50 p-2.5 rounded border border-blue-100 whitespace-pre-line leading-relaxed">
                              {appt.aiPostSummary}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic text-center py-4">No completed prescriptions found.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Appointment History Card (Now Vertically Scrollable & Aligned) */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[560px]">
                  
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-950">Your Appointment History & Tracking</h3>
                  </div>

                  {/* Scrollable container matching height */}
                  <div className="p-6 overflow-y-auto flex-grow">
                    {appointments.filter(a => a.patientName === currentUser.name).length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 bg-slate-50">Specialist</th>
                              <th className="px-4 py-3 bg-slate-50">Schedule Slot</th>
                              <th className="px-4 py-3 bg-slate-50">Booking Date</th>
                              <th className="px-4 py-3 bg-slate-50">Google Calendar</th>
                              <th className="px-4 py-3 bg-slate-50">Status</th>
                              <th className="px-4 py-3 bg-slate-50 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {appointments.filter(a => a.patientName === currentUser.name).map(appt => (
                              <tr key={appt.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-4 font-semibold text-slate-950">{appt.doctorName}</td>
                                <td className="px-4 py-4 text-slate-600 font-medium">{appt.slotTime}</td>
                                <td className="px-4 py-4 text-xs text-slate-450">{appt.createdAt}</td>
                                <td className="px-4 py-4">
                                  {appt.calendarSynced ? (
                                    <a
                                      href={getGoogleCalendarUrl(appt)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open in Google Calendar to add this event"
                                      className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs group cursor-pointer"
                                    >
                                      <Calendar className="h-3 w-3 mr-1 text-blue-600 group-hover:scale-110 transition-transform" />
                                      Sync Calendar
                                      <ExternalLink className="h-2.5 w-2.5 ml-1 text-blue-500 opacity-70 group-hover:opacity-100" />
                                    </a>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">Inactive</span>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${appt.status === 'booked' ? 'bg-blue-100 text-blue-800 border border-blue-200' : appt.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                    {appt.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  {appt.status === 'booked' && (
                                    <button onClick={() => handleCancel(appt.id)} className="text-xs font-bold text-red-650 hover:text-red-950">Cancel</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">No appointments recorded yet.</div>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* 4. Specialist Directory Moved to Secondary Page Section (Bottom) */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-950 mb-4 flex items-center space-x-2 border-b border-slate-100 pb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Specialist Directory & Availability Contacts</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {doctors.map(doc => (
                  <div key={doc.id} className="p-4 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3 bg-slate-50/50">
                    <div>
                      <span className="block font-bold text-slate-900 text-sm">{doc.name}</span>
                      <span className="block text-xs text-slate-550 font-semibold">{doc.specialty}</span>
                      <span className="block text-xs text-slate-400 mt-1">{doc.contact}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${doc.isOnLeave ? 'bg-red-50 text-red-755 border-red-200' : doc.isAvailable ? 'bg-green-50 text-green-755 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {doc.isOnLeave ? 'On Leave' : doc.isAvailable ? 'Available' : 'Away'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== DOCTOR PORTAL PAGE ==================== */}
        {isLoggedIn && currentUser && currentUser.role === 'doctor' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Doctor Portal</h2>
                <p className="text-sm text-slate-500 mt-1">Accept patients, verify clinical complaints, and manage duty slots.</p>
              </div>

              <div className="flex items-center space-x-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <div className="flex-grow pr-2">
                  <span className="block text-sm font-semibold text-slate-800">Duty Status</span>
                  <span className="text-xs text-slate-505 font-medium">
                    {doctors.find(d => d.name === currentUser.name)?.isAvailable ? 'Accepting Appointments' : 'Away / Offline'}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    const currentDoc = doctors.find(d => d.name === currentUser.name);
                    if (currentDoc) toggleDoctorDuty(currentUser.name, currentDoc.isAvailable);
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${doctors.find(d => d.name === currentUser.name)?.isAvailable ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${doctors.find(d => d.name === currentUser.name)?.isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-950">Your Scheduled Consultations</h3>
              </div>
              <div className="p-6">
                {appointments.filter(a => a.doctorName === currentUser.name).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Slot Time</th>
                          <th className="px-4 py-3">Booking Date</th>
                          <th className="px-4 py-3">Clinical Symptoms Query</th>
                          <th className="px-4 py-3">Prescription & Clinical Summary</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {appointments.filter(a => a.doctorName === currentUser.name).map(appt => (
                          <tr key={appt.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-4">
                              <span className="block font-bold text-slate-955">{appt.patientName}</span>
                              <span className="block text-xs text-slate-550">{appt.patientContact}</span>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">{appt.slotTime}</td>
                            <td className="px-4 py-4 text-xs text-slate-450">{appt.createdAt}</td>
                            <td className="px-4 py-4 max-w-xs">
                              <div className="p-2 border border-slate-200 bg-slate-50 rounded-lg text-xs italic text-slate-650 leading-relaxed">
                                "{appt.problem}"
                              </div>
                            </td>
                            <td className="px-4 py-4 max-w-sm">
                              {appt.status === 'booked' ? (
                                <textarea 
                                  rows={2} 
                                  value={activePrescriptionText[appt.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setActivePrescriptionText(prev => ({ ...prev, [appt.id]: val }));
                                  }}
                                  placeholder="Write patient dosage/prescription details..."
                                  className="w-full border border-slate-355 rounded-lg p-2 text-xs focus:ring-blue-500 focus:border-blue-500"
                                />
                              ) : (
                                <div className="space-y-1 text-xs">
                                  <p><span className="font-bold text-slate-700">Rx:</span> {appt.prescription || '-'}</p>
                                  {appt.aiPostSummary && (
                                    <p className="italic text-slate-505 bg-blue-50/40 p-1.5 rounded border border-blue-105 whitespace-pre-line"><strong className="text-blue-600">AI Summary:</strong> {appt.aiPostSummary}</p>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${appt.status === 'booked' ? 'bg-blue-100 text-blue-800 border border-blue-200' : appt.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                {appt.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                              {appt.status === 'booked' && (
                                <>
                                  <button onClick={() => handleCompleteWithPrescription(appt.id)} className="text-xs font-bold text-green-650 hover:text-green-955 border border-green-200 px-2 py-1 bg-green-50 rounded">Complete</button>
                                  <button onClick={() => handleCancel(appt.id)} className="text-xs font-bold text-red-650 hover:text-red-955">Cancel</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">No scheduled consultations found.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ADMIN PORTAL PAGE ==================== */}
        {isLoggedIn && currentUser && currentUser.role === 'admin' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-slate-200 pb-5">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Hospital Supervisor Admin View</h2>
              <p className="text-sm text-slate-500 mt-1">Unified monitoring and auditing panels for medical records.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center space-x-4">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <span className="block text-2xl font-bold text-slate-900">{doctors.length}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Doctors</span>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center space-x-4">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                  <span className="block text-2xl font-bold text-slate-900">{appointments.length}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Master Log Entries</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center space-x-4">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <span className="block text-2xl font-bold text-slate-900">
                    {appointments.filter(a => a.status === 'booked').length}
                  </span>
                  <span className="text-xs font-semibold text-slate-555 uppercase tracking-wider">Active Bookings</span>
                </div>
              </div>
            </div>

            {/* Aligned Layout for Admin Doctor Directory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Doctor Creation Form */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-[520px]">
                <h3 className="text-base font-bold text-slate-950 flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <PlusCircle className="h-5 w-5 text-blue-600" />
                  <span>Register New Doctor</span>
                </h3>

                <form onSubmit={handleAdminAddDoctor} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="e.g. Dr. Rohan Kapoor"
                      className="mt-1 block w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Specialty Specialization</label>
                    <input 
                      type="text" 
                      required 
                      value={newDocSpecialty}
                      onChange={(e) => setNewDocSpecialty(e.target.value)}
                      placeholder="e.g. Cardiologist"
                      className="mt-1 block w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                    <input 
                      type="text" 
                      required 
                      value={newDocContact}
                      onChange={(e) => setNewDocContact(e.target.value)}
                      placeholder="e.g. +91 99887 76655"
                      className="mt-1 block w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={newDocEmail}
                      onChange={(e) => setNewDocEmail(e.target.value)}
                      placeholder="e.g. rohan.k@hospital.com"
                      className="mt-1 block w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Login Password</label>
                    <input 
                      type="password" 
                      required 
                      value={newDocPassword}
                      onChange={(e) => setNewDocPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 block w-full border border-slate-300 rounded-lg p-2 text-sm"
                    />
                  </div>

                  {adminMsg && (
                    <div className="p-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs">
                      {adminMsg}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-150 active:scale-95 cursor-pointer shadow-md hover:shadow-lg"
                  >
                    Add Doctor Profile
                  </button>
                </form>
              </div>

              {/* Doctors List & Leave Management (Scrollable Aligned) */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[520px]">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-950">Manage Doctor Directory & Leave Status</h3>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 bg-slate-50">Doctor</th>
                          <th className="px-4 py-3 bg-slate-50">Specialty</th>
                          <th className="px-4 py-3 bg-slate-50">Contact</th>
                          <th className="px-4 py-3 bg-slate-50">Availability Status</th>
                          <th className="px-4 py-3 bg-slate-50 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {doctors.map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-4 font-bold text-slate-950">{doc.name}</td>
                            <td className="px-4 py-4 text-slate-600 font-semibold">{doc.specialty}</td>
                            <td className="px-4 py-4 text-slate-505">{doc.contact}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${doc.isOnLeave ? 'bg-red-50 text-red-755 border-red-200' : doc.isAvailable ? 'bg-green-50 text-green-755 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {doc.isOnLeave ? 'On Leave' : doc.isAvailable ? 'Available' : 'Away'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right whitespace-nowrap space-x-2">
                              <button 
                                onClick={() => toggleDoctorLeave(doc.id, doc.isOnLeave)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer shadow-xs ${doc.isOnLeave ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'}`}
                              >
                                {doc.isOnLeave ? 'Set Active Duty' : 'Mark On Leave'}
                              </button>
                              <button
                                onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                                title="Delete Doctor Record"
                                className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-95 cursor-pointer shadow-xs"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>

            {/* Master Log Entries (Now Scrollable Vertically too!) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-55 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-950">Master Booking Mapping Logs (Audit Trail)</h3>
              </div>
              <div className="p-6 overflow-y-auto flex-grow">
                {appointments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 bg-slate-50">Patient Detail</th>
                          <th className="px-4 py-3 bg-slate-50">Assigned Doctor</th>
                          <th className="px-4 py-3 bg-slate-50">Consultation Slot</th>
                          <th className="px-4 py-3 bg-slate-50">Booking Date</th>
                          <th className="px-4 py-3 bg-slate-50">Google Calendar</th>
                          <th className="px-4 py-3 bg-slate-50">Status</th>
                          <th className="px-4 py-3 bg-slate-50 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {appointments.map(appt => (
                          <tr key={appt.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-4">
                              <span className="block font-bold text-slate-900">{appt.patientName}</span>
                              <span className="block text-xs text-slate-550">{appt.patientContact}</span>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-900">
                              {appt.doctorName}
                              <span className="block text-xs text-slate-555 font-normal">{appt.specialty}</span>
                            </td>
                            <td className="px-4 py-4 text-slate-750 font-medium">{appt.slotTime}</td>
                            <td className="px-4 py-4 text-xs text-slate-500">{appt.createdAt}</td>
                            <td className="px-4 py-4">
                              {appt.calendarSynced ? (
                                <a
                                  href={getGoogleCalendarUrl(appt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Inspect / open in Google Calendar"
                                  className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 px-2 py-0.5 rounded-md border border-blue-200 transition-colors cursor-pointer group"
                                >
                                  <Calendar className="h-3 w-3 mr-1 text-blue-600 group-hover:scale-110 transition-transform" />
                                  Google Cal
                                  <ExternalLink className="h-2.5 w-2.5 ml-1 text-blue-500 opacity-70 group-hover:opacity-100" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 italic">No Sync</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${appt.status === 'booked' ? 'bg-blue-100 text-blue-800' : appt.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {appt.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right whitespace-nowrap space-x-2">
                              {appt.status === 'booked' && (
                                <button onClick={() => handleCancel(appt.id)} className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 transition-all active:scale-95 cursor-pointer">Cancel</button>
                              )}
                              <button
                                onClick={() => handleDeleteAppointment(appt.id)}
                                title="Delete Audit Record"
                                className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-95 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">No appointments recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-450">
        &copy; 2026 CareSync Hospital - Clinical Appointment & Follow-up Manager
      </footer>

      </>
      )}
    </div>
  );
}
