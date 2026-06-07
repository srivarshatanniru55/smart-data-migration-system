const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, addActivityLog } = require('./models');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create necessary static assets directories on boot
const uploadsDir = path.join(__dirname, 'uploads');
const tempUploadsDir = path.join(__dirname, 'uploads', 'temp');
const publicDir = path.join(__dirname, 'public');

[uploadsDir, tempUploadsDir, publicDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve local media uploads and test public forms
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(publicDir));

// Wire up SaaS REST API routes
app.use('/api', apiRoutes);

// Base healthcheck route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Apexium Data Migration System',
    timestamp: new Date()
  });
});

// Seed static public testing HTML form
const testFormHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apexium - Automated Form Target Sandbox</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #F1F5F9;
      color: #1E293B;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 650px;
      background: white;
      margin: 0 auto;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      border-top: 5px solid #008080;
    }
    .header {
      margin-bottom: 25px;
      text-align: center;
    }
    .header h2 {
      margin: 0;
      color: #04203E;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0 0;
      font-size: 14px;
      color: #64748B;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 14px;
      color: #334155;
    }
    input[type="text"], input[type="date"], input[type="number"], textarea, select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus, textarea:focus {
      outline: none;
      border-color: #008080;
      box-shadow: 0 0 0 3px rgba(0, 128, 128, 0.1);
    }
    textarea {
      resize: vertical;
      min-height: 100px;
    }
    .btn {
      background: #008080;
      color: white;
      border: none;
      padding: 12px 20px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #006666;
    }
    .success-card {
      display: none;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #065F46;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="header">
      <h2>Apexium Forms Sandbox Target</h2>
      <p>This is a local playground for testing dynamic field mappings and RPA auto form-filling.</p>
    </div>
    
    <form id="sandbox-form" onsubmit="event.preventDefault(); handleFormSubmit();">
      <div id="instruction-placeholder"></div>
      
      <div class="form-group">
        <label for="product-title">Item Title / Heading</label>
        <input type="text" id="product-title" placeholder="Product name or entry header..." required>
      </div>

      <div class="form-group">
        <label for="price">Pricing Value ($ USD)</label>
        <input type="text" id="price" placeholder="e.g. 29.99">
      </div>

      <div class="form-group">
        <label for="date">Creation / Launch Date</label>
        <input type="date" id="date">
      </div>

      <div class="form-group">
        <label for="desc-area">Detailed Description</label>
        <textarea id="desc-area" name="description" placeholder="Provide description contents..."></textarea>
      </div>

      <div class="form-group">
        <label for="specs-area">Technical Specifications</label>
        <textarea id="specs-area" name="specs" placeholder="Format: Specification key-value..."></textarea>
      </div>

      <div class="form-group">
        <label for="file-upload">Upload Thumbnail Image</label>
        <input type="file" id="file-upload">
      </div>

      <button type="submit" class="btn">Submit Sandbox Form</button>
    </form>

    <div class="success-card" id="success-message">
      <h3>✓ Transaction Completed!</h3>
      <p>Data was successfully auto-filled, image assets mapped, and records submitted inside the Sandbox environment.</p>
    </div>
  </div>

  <script>
    function handleFormSubmit() {
      showSuccess();
    }

    function showSuccess() {
      document.getElementById('sandbox-form').style.display = 'none';
      document.getElementById('success-message').style.display = 'block';
    }
  </script>
</body>
</html>
`;
fs.writeFileSync(path.join(publicDir, 'test-form.html'), testFormHtml, 'utf8');

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Boot Server
async function startServer() {
  // Connect database (Mongoose Mongo DB or Local File Failback)
  const isMongoConnected = await connectDB(process.env.MONGODB_URI);
  
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Apexium SaaS Backend Listening on Port: ${PORT} ` );
    console.log(` DB Mode: ${isMongoConnected ? 'MongoDB Server' : 'Local JSON Fallback'}`);
    console.log(` Local Sandbox Test Form: http://localhost:${PORT}/test-form.html`);
    console.log("==================================================");
    
    addActivityLog('system', 'info', `Apexium server boot complete. DB Mode: ${isMongoConnected ? 'MongoDB connected' : 'Local file system fallback connected'}.`);
  });
}

startServer();
