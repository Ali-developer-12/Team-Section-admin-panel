require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000; // ✅ CHANGE: 5000 to 3000

// Environment variables
const {
  JSONBIN_BIN_ID,
  JSONBIN_MASTER_KEY,
  IMGBB_API_KEY,
  ADMIN_PASSWORD,
  FRONTEND_URL
} = process.env;

// Middleware
app.use(cors({
  origin: FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Helper: Upload image to ImgBB
async function uploadImageToImgBB(imageBase64) {
  try {
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    const formData = new URLSearchParams();
    formData.append('image', base64Data);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    return null;
  } catch (error) {
    console.error('ImgBB upload error:', error);
    return null;
  }
}

// Helper: Check admin password
function checkAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

// ROUTES

// 1. Get all team members (PUBLIC)
app.get('/api/team-members', async (req, res) => {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
    });
    
    if (!response.ok) throw new Error('Failed to fetch from JSONBin');
    
    const data = await response.json();
    res.json({
      success: true,
      team_members: data.record.team_members || [],
      total: data.record.total_members || 0,
      last_updated: data.record.last_updated
    });
  } catch (error) {
    console.error('GET Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch team members' });
  }
});

// 2. Add new team member (PROTECTED)
app.post('/api/add-member', async (req, res) => {
  try {
    const { name, role, portfolio, imageBase64, imageUrl, password } = req.body;
    
    if (!name || !role || !portfolio) {
      return res.status(400).json({ success: false, error: 'Name, role and portfolio are required' });
    }
    
    if (!checkAdminPassword(password)) {
      return res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
    
    // Upload image if provided
    let finalImageUrl = imageUrl || 'https://via.placeholder.com/300x300/667eea/ffffff?text=Team+Member';
    if (imageBase64) {
      const uploadedUrl = await uploadImageToImgBB(imageBase64);
      if (uploadedUrl) finalImageUrl = uploadedUrl;
    }
    
    // Get current team members
    const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
    });
    
    const currentData = await getResponse.json();
    const currentMembers = currentData.record.team_members || [];
    
    // Check for duplicate portfolio URL
    const isDuplicate = currentMembers.some(member => 
      member.portfolio && member.portfolio.toLowerCase() === portfolio.toLowerCase()
    );
    
    if (isDuplicate) {
      return res.status(400).json({ success: false, error: 'This portfolio URL already exists' });
    }
    
    // Create new member
    const newMember = {
      id: Date.now(),
      name: name.trim(),
      role: role.trim(),
      portfolio: portfolio.trim(),
      image: finalImageUrl,
      added_at: new Date().toISOString()
    };
    
    // Add to existing members
    const updatedMembers = [...currentMembers, newMember];
    
    // Update JSONBin
    const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_MASTER_KEY
      },
      body: JSON.stringify({
        team_members: updatedMembers,
        total_members: updatedMembers.length,
        last_updated: new Date().toISOString()
      })
    });
    
    if (!updateResponse.ok) throw new Error('Failed to update JSONBin');
    
    res.json({ success: true, message: 'Team member added successfully', member: newMember });
    
  } catch (error) {
    console.error('POST Error:', error);
    res.status(500).json({ success: false, error: 'Failed to add team member' });
  }
});

// 3. Delete team member (PROTECTED)
app.delete('/api/delete-member/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!checkAdminPassword(password)) {
      return res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
    
    // Get current team members
    const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
    });
    
    const currentData = await getResponse.json();
    const currentMembers = currentData.record.team_members || [];
    
    // Remove member
    const updatedMembers = currentMembers.filter(member => member.id != id);
    
    // Update JSONBin
    const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_MASTER_KEY
      },
      body: JSON.stringify({
        team_members: updatedMembers,
        total_members: updatedMembers.length,
        last_updated: new Date().toISOString()
      })
    });
    
    if (!updateResponse.ok) throw new Error('Failed to update JSONBin');
    
    res.json({ success: true, message: 'Team member deleted successfully' });
    
  } catch (error) {
    console.error('DELETE Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete team member' });
  }
});

// 4. Verify password
app.post('/api/verify-password', (req, res) => {
  const { password } = req.body;
  res.json({ success: checkAdminPassword(password) });
});

// 5. Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Team Portfolio API is running',
    timestamp: new Date().toISOString(),
    backend: 'Node.js/Express',
    jsonbin: JSONBIN_BIN_ID ? 'Configured' : 'Not configured'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => { // ✅ CHANGE: Added '0.0.0.0'
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL || 'Not set'}`);
  console.log(`📊 JSONBin Status: ${JSONBIN_BIN_ID ? 'Connected' : 'Not connected'}`);
});