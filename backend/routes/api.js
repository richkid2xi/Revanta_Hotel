import express from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'revanta-secret-key-2026';

// --- AUTH MIDDLEWARE ---
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const hotel = await prisma.hotel.findUnique({
      where: { id: decoded.hotelId }
    });

    if (!hotel) return res.status(401).json({ error: 'Hotel not found' });
    
    // Subscription Check
    const now = new Date();
    const gracePeriodEnd = hotel.subscriptionEnd ? new Date(hotel.subscriptionEnd.getTime() + 72 * 60 * 60 * 1000) : null;

    if (hotel.subscriptionStatus === 'deactivated' || (gracePeriodEnd && now > gracePeriodEnd)) {
      if (hotel.subscriptionStatus !== 'deactivated') {
        // Auto-deactivate if past grace period
        await prisma.hotel.update({
          where: { id: hotel.id },
          data: { subscriptionStatus: 'deactivated', isActive: false }
        });
      }
      return res.status(403).json({ error: 'Subscription expired and grace period ended. Please renew to access your account.' });
    }

    req.hotelId = decoded.hotelId;
    req.hotel = hotel;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Register Hotel
router.post('/register-hotel', async (req, res) => {
  try {
    const { 
      hotelName, name, type, country, region, city, website, 
      ownerName, owner_name, ownerEmail, owner_email, ownerPhone, owner_phone, jobTitle, job_title, plan, password 
    } = req.body;

    const email = ownerEmail || owner_email;
    
    const existing = await prisma.hotel.findUnique({ where: { ownerEmail: email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const hotel = await prisma.hotel.create({
      data: {
        name: hotelName || name,
        type: type || 'hotel',
        country: country || 'Ghana',
        region: region || 'Greater Accra',
        city: city || 'Accra',
        website,
        ownerName: ownerName || owner_name,
        ownerEmail: email,
        password: hashedPassword,
        ownerPhone: ownerPhone || owner_phone,
        jobTitle: jobTitle || job_title,
        plan: plan || 'starter',
        subscriptionStatus: 'pending_payment',
        isActive: false
      }
    });

    await prisma.branch.create({
      data: {
        hotelId: hotel.id,
        name: 'Headquarters',
        location: `${city || 'Accra'}, ${region || 'Greater Accra'}`,
        isActive: true
      }
    });

    const amount = plan === 'premium' ? 500 : 250; 
    
    const paystackRes = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: email,
      amount: amount * 100,
      callback_url: `${process.env.FRONTEND_URL}/payment-success`,
      metadata: {
        hotel_id: hotel.id,
        plan: plan
      }
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    await prisma.paymentReference.create({
      data: {
        reference: paystackRes.data.data.reference,
        hotelId: hotel.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      success: true,
      authorization_url: paystackRes.data.data.authorization_url,
      reference: paystackRes.data.data.reference
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login (case-insensitive email)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const hotel = await prisma.hotel.findFirst({
      where: { ownerEmail: { equals: email, mode: 'insensitive' } },
      include: { branches: true }
    });

    if (!hotel || !hotel.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, hotel.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ hotelId: hotel.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      hotel: {
        id: hotel.id,
        name: hotel.name,
        email: hotel.ownerEmail,
        plan: hotel.plan,
        branches: hotel.branches,
        subscriptionStatus: hotel.subscriptionStatus,
        subscriptionEnd: hotel.subscriptionEnd
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { branchId } = req.query;
    const hotelId = req.hotelId;

    const where = { hotelId };
    if (branchId) where.branchId = branchId;

    const totalReviews = await prisma.review.count({ where });
    const unreadReviews = await prisma.review.count({ where: { ...where, status: 'unread' } });
    const readReviews = await prisma.review.count({ where: { ...where, status: 'read' } });
    const resolvedReviews = await prisma.review.count({ where: { ...where, status: 'resolved' } });
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const reviewsThisMonth = await prisma.review.findMany({ 
      where: {
        ...where,
        createdAt: { gte: startOfMonth }
      }, 
      select: { overallRating: true } 
    });

    const avgRating = reviewsThisMonth.length > 0 
      ? (reviewsThisMonth.reduce((acc, r) => acc + r.overallRating, 0) / reviewsThisMonth.length).toFixed(1)
      : 0;

    res.json({
      totalReviews,
      unreadReviews,
      readReviews,
      resolvedReviews,
      avgRating
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Reviews
router.get('/reviews', authenticate, async (req, res) => {
  try {
    const { branchId, status } = req.query;
    const hotelId = req.hotelId;

    const where = { hotelId };
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Review Status/Note
router.patch('/reviews/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, internalNote, internalNotes } = req.body;

    // Build only the fields that were provided
    const updateData = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'resolved') updateData.resolvedAt = new Date();
    }
    const note = internalNote ?? internalNotes;
    if (note !== undefined) updateData.internalNotes = note;

    // Prisma compound where: find by id AND verify ownership
    const existing = await prisma.review.findFirst({
      where: { id, hotelId: req.hotelId }
    });
    if (!existing) return res.status(404).json({ error: 'Review not found' });

    const review = await prisma.review.update({
      where: { id },
      data: updateData
    });

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscription Management (Get current subscription)
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.hotelId },
      select: {
        plan: true,
        subscriptionStatus: true,
        subscriptionEnd: true,
        isActive: true,
        createdAt: true
      }
    });
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize Subscription Payment
router.post('/subscription/renew', authenticate, async (req, res) => {
  try {
    const { plan } = req.body;
    const amount = plan === 'premium' ? 500 : 250;

    const paystackRes = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: req.hotel.ownerEmail,
      amount: amount * 100,
      callback_url: `${process.env.FRONTEND_URL}/payment-success`,
      metadata: {
        hotel_id: req.hotelId,
        plan: plan,
        type: 'subscription_renewal'
      }
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    res.json({ authorization_url: paystackRes.data.data.authorization_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Payment and Update Subscription
router.get('/verify-payment', async (req, res) => {
  try {
    const { reference } = req.query;

    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    if (paystackRes.data.data.status === 'success') {
      const { hotel_id, plan } = paystackRes.data.data.metadata;

      const hotel = await prisma.hotel.findUnique({ where: { id: hotel_id } });
      let currentEnd = hotel.subscriptionEnd && hotel.subscriptionEnd > new Date() 
        ? new Date(hotel.subscriptionEnd) 
        : new Date();
      
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + 1);

      await prisma.hotel.update({
        where: { id: hotel_id },
        data: {
          subscriptionStatus: 'active',
          subscriptionEnd: newEnd,
          isActive: true,
          plan: plan
        }
      });

      await prisma.paymentReference.update({
        where: { reference },
        data: { status: 'success' }
      });

      return res.json({ status: 'success' });
    }

    res.json({ status: 'pending' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Hotel by Branch Token (Public)
router.get('/get-hotel-by-token', async (req, res) => {
  try {
    const { token } = req.query;

    const branch = await prisma.branch.findUnique({
      where: { reviewToken: token },
      include: { 
        hotel: {
          include: {
            enabledServices: true
          }
        } 
      }
    });

    if (!branch) {
      return res.status(404).json({ error: 'Invalid review token' });
    }

    const enabledServicesRecords = branch.hotel.enabledServices.filter(s => s.isEnabled);
    const defaultServices = ['room', 'restaurant', 'conference', 'pool_gym', 'other'];
    const enabledServices = enabledServicesRecords.length > 0 
      ? enabledServicesRecords.map(s => s.serviceKey)
      : defaultServices;

    res.json({
      hotelName: branch.hotel.name,
      hotelId: branch.hotel.id,
      branchName: branch.name,
      branchId: branch.id,
      logoUrl: branch.hotel.logoUrl,
      enabledServices: enabledServices
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Review (Public)
router.post('/submit-review', async (req, res) => {
  try {
    const { 
      hotelId, branchId, overallRating, selectedServices, 
      generalScores, serviceScores, writtenComment, 
      guestName, guestEmail, guestPhone, isAnonymous 
    } = req.body;

    const reference = `REV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const review = await prisma.review.create({
      data: {
        hotelId,
        branchId,
        referenceNumber: reference,
        overallRating,
        selectedServices: selectedServices || [],
        generalScores: generalScores || {},
        serviceScores: serviceScores || {},
        writtenComment,
        guestName,
        guestEmail,
        guestPhone,
        isAnonymous: isAnonymous !== undefined ? isAnonymous : true
      }
    });

    await prisma.branch.update({
      where: { id: branchId },
      data: {
        totalReviews: { increment: 1 },
        totalScans: { increment: 1 }
      }
    });

    res.json({ 
      success: true, 
      reference: reference 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change Password (authenticated)
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const hotel = await prisma.hotel.findUnique({ where: { id: req.hotelId } });
    const isValid = await bcrypt.compare(currentPassword, hotel.password);
    if (!isValid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.hotel.update({
      where: { id: req.hotelId },
      data: { password: hashed }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Hotel Settings
router.patch('/hotel', authenticate, async (req, res) => {
  try {
    const { name, logo } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (logo !== undefined) updateData.logoUrl = logo;

    const hotel = await prisma.hotel.update({
      where: { id: req.hotelId },
      data: updateData
    });

    res.json({ success: true, hotel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password — Generate reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const hotel = await prisma.hotel.findFirst({
      where: { ownerEmail: { equals: email, mode: 'insensitive' } }
    });

    if (!hotel) return res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        paystackCustomerCode: `OTP:${otp}:${resetExpiry.toISOString()}`
      }
    });

    // TODO: Actually send the email here using an email provider (e.g. Resend, SendGrid)
    console.log(`Password reset OTP for ${email}: ${otp}`);

    res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const hotel = await prisma.hotel.findFirst({
      where: { ownerEmail: { equals: email, mode: 'insensitive' } }
    });

    if (!hotel || !hotel.paystackCustomerCode?.startsWith('OTP:')) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const [, storedOtp, expiryStr] = hotel.paystackCustomerCode.split(':');
    
    if (storedOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date(expiryStr) < new Date()) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // OTP is valid. Mark it as VERIFIED so they can reset password next
    await prisma.hotel.update({
      where: { id: hotel.id },
      data: { paystackCustomerCode: `VERIFIED:${email}` }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password — Apply new password using verified email
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const hotel = await prisma.hotel.findFirst({
      where: { 
        ownerEmail: { equals: email, mode: 'insensitive' },
        paystackCustomerCode: `VERIFIED:${email}`
      }
    });

    if (!hotel) return res.status(400).json({ error: 'Session expired. Please request a new OTP.' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.hotel.update({
      where: { id: hotel.id },
      data: { password: hashed, paystackCustomerCode: null }
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
