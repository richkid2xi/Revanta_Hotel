import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING TESTS ---');

  // 1. Simulate SQL Injection Attempt on Login
  console.log('Testing SQL Injection on Login...');
  try {
    const sqliAttempt = await axios.post(`${API_URL}/login`, {
      email: "test@test.com' OR '1'='1",
      password: "password123"
    });
    console.log('SQLi Result: Unexpected success (Vulnerable?)');
  } catch (error) {
    console.log('SQLi Result: Blocked! (Safe) - Status:', error.response?.status);
  }

  // 2. Simulate XSS Attempt on Review Submission
  console.log('Testing XSS on Review Submission...');
  try {
    const branch = await prisma.branch.findFirst();
    if (branch) {
      const xssReview = await axios.post(`${API_URL}/submit-review`, {
        hotelId: branch.hotelId,
        branchId: branch.id,
        overallRating: 5,
        writtenComment: "<script>alert('XSS')</script> Great hotel!",
        guestName: "<img src=x onerror=alert('xss')>",
        guestEmail: "test@xss.com"
      });
      console.log('XSS Submission Result: Accepted. Note: React escapes this on the frontend, but we should ensure no raw HTML rendering.');
    } else {
      console.log('No branch found to test XSS submission.');
    }
  } catch (error) {
    console.log('XSS Submission Result: Error:', error.message);
  }

  // 3. Test Account Workflows
  console.log('Testing Account Workflows...');
  const testEmail = `test_${Date.now()}@example.com`;
  
  // A. Create pending account
  let hotelId;
  try {
    const createRes = await axios.post(`${API_URL}/register-hotel`, {
      hotelName: "Test Hotel",
      ownerEmail: testEmail,
      password: "password123",
      plan: "starter",
      city: "Accra",
      region: "Greater Accra"
    });
    console.log('Created pending account. Paystack Auth URL:', createRes.data.authorization_url);
    
    const dbHotel = await prisma.hotel.findUnique({ where: { ownerEmail: testEmail } });
    hotelId = dbHotel.id;
    console.log('Hotel status in DB:', dbHotel.subscriptionStatus);
  } catch (error) {
    console.error('Failed to create account:', error.message);
  }

  // B. Cancel payment (i.e. try to login while pending)
  try {
    await axios.post(`${API_URL}/login`, { email: testEmail, password: "password123" });
    console.log('Login Result: Success (Vulnerable! Pending should be blocked)');
  } catch (error) {
    console.log('Login Result: Blocked for pending account (Safe) - Status:', error.response?.status, error.response?.data?.error);
  }

  // C. Simulate successful payment
  if (hotelId) {
    await prisma.hotel.update({
      where: { id: hotelId },
      data: { subscriptionStatus: 'active', isActive: true, subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });
    console.log('Simulated successful payment.');
    
    try {
      const loginRes = await axios.post(`${API_URL}/login`, { email: testEmail, password: "password123" });
      console.log('Login Result after payment: Success (Safe)');
    } catch (error) {
      console.log('Login Result after payment: Failed!', error.message);
    }
  }

  // D. Grace period deactivation simulation
  if (hotelId) {
    await prisma.hotel.update({
      where: { id: hotelId },
      data: { subscriptionEnd: new Date(Date.now() - 75 * 60 * 60 * 1000) } // 75 hours ago (past 72h grace)
    });
    console.log('Simulated expired subscription past grace period.');
    
    try {
      const loginRes = await axios.post(`${API_URL}/login`, { email: testEmail, password: "password123" });
      const token = loginRes.data.token;
      
      // Try to hit an authenticated endpoint
      await axios.get(`${API_URL}/stats`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Access Stats Result: Success (Vulnerable! Should be blocked)');
    } catch (error) {
      console.log('Access Stats Result: Blocked past grace period (Safe) - Status:', error.response?.status, error.response?.data?.error);
    }
  }

  // Cleanup
  if (hotelId) {
    await prisma.hotel.delete({ where: { id: hotelId } });
    console.log('Cleaned up test account.');
  }

  console.log('--- TESTS COMPLETE ---');
}

runTests();
