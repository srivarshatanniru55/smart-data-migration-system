const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Path for local JSON database file fallback
const DB_FILE_PATH = path.join(__dirname, 'db.json');

// Memory storage in case of read/write issues
let localDb = {
  migrations: [],
  logs: [],
  users: [],
  settings: {
    id: 'global',
    headless: true,
    delay: 1000,
    autoSubmit: false,
    maxConcurrency: 2,
    defaultMappings: [
      { sourceField: 'title', targetSelector: '#product-title', defaultValue: '' },
      { sourceField: 'description', targetSelector: 'textarea[name="description"]', defaultValue: '' },
      { sourceField: 'specifications', targetSelector: 'textarea[name="specs"]', defaultValue: '' },
      { sourceField: 'date', targetSelector: 'input[name="date"]', defaultValue: '' },
      { sourceField: 'price', targetSelector: 'input[name="price"]', defaultValue: '0.00' }
    ]
  }
};

// Local JSON DB Helper functions
function loadLocalDb() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
      localDb = JSON.parse(raw);
      if (!localDb.users) {
        localDb.users = [];
      }
    } else {
      saveLocalDb();
    }
  } catch (err) {
    console.error('Error loading JSON DB, using in-memory instead:', err.message);
  }
}

function saveLocalDb() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(localDb, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to JSON DB:', err.message);
  }
}

// Initialize Local DB
loadLocalDb();

// ----------------------------------------------------
// MongoDB Schema Definitions (Used if MongoDB is connected)
// ----------------------------------------------------
let useMongoDB = false;

const MigrationSchema = new mongoose.Schema({
  sourceUrl: { type: String, required: true },
  destinationUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'extracting', 'extracted', 'migrating', 'completed', 'failed'], 
    default: 'pending' 
  },
  extractedData: {
    title: String,
    description: String,
    specifications: [String],
    dates: [String],
    metadata: mongoose.Schema.Types.Mixed,
    images: [String]
  },
  mappings: [{
    sourceField: String,
    targetSelector: String,
    defaultValue: String
  }],
  settings: {
    headless: Boolean,
    delay: Number,
    autoSubmit: Boolean,
    maxConcurrency: Number
  },
  logs: [String],
  screenshot: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ActivityLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['extraction', 'migration', 'system'], default: 'system' },
  level: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'global', unique: true },
  headless: { type: Boolean, default: true },
  delay: { type: Number, default: 1000 },
  autoSubmit: { type: Boolean, default: false },
  maxConcurrency: { type: Number, default: 2 },
  defaultMappings: [{
    sourceField: String,
    targetSelector: String,
    defaultValue: String
  }]
});

let MigrationModel, ActivityLogModel, SettingsModel;

// Try to connect to MongoDB
async function connectDB(uri) {
  try {
    if (!uri) {
      console.log('No MongoDB URI provided. Running on Local JSON Database mode.');
      return false;
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB connected successfully!');
    useMongoDB = true;
    
    // Register mongoose models
    MigrationModel = mongoose.model('Migration', MigrationSchema);
    ActivityLogModel = mongoose.model('ActivityLog', ActivityLogSchema);
    SettingsModel = mongoose.model('Settings', SettingsSchema);
    UserModel = mongoose.model('User', UserSchema);

    // Seed default settings if not exists
    const exists = await SettingsModel.findOne({ id: 'global' });
    if (!exists) {
      await SettingsModel.create(localDb.settings);
    }
    
    return true;
  } catch (err) {
    console.warn(`MongoDB Connection Failed (${err.message}). Falling back to Local JSON Database mode.`);
    useMongoDB = false;
    return false;
  }
}

// ----------------------------------------------------
// Database Agnostic API Methods (Unified Repository)
// ----------------------------------------------------

async function getMigrations() {
  if (useMongoDB) {
    return await MigrationModel.find().sort({ createdAt: -1 });
  } else {
    return [...localDb.migrations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

async function getMigrationById(id) {
  if (useMongoDB) {
    return await MigrationModel.findById(id);
  } else {
    return localDb.migrations.find(m => m._id === id) || null;
  }
}

async function saveMigration(migrationData) {
  if (useMongoDB) {
    if (migrationData._id) {
      migrationData.updatedAt = new Date();
      return await MigrationModel.findByIdAndUpdate(migrationData._id, migrationData, { new: true });
    } else {
      const newMigration = new MigrationModel(migrationData);
      return await newMigration.save();
    }
  } else {
    if (migrationData._id) {
      const idx = localDb.migrations.findIndex(m => m._id === migrationData._id);
      if (idx !== -1) {
        migrationData.updatedAt = new Date().toISOString();
        localDb.migrations[idx] = { ...localDb.migrations[idx], ...migrationData };
        saveLocalDb();
        return localDb.migrations[idx];
      }
      return null;
    } else {
      const newMig = {
        _id: 'mig_' + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        extractedData: { title: '', description: '', specifications: [], dates: [], metadata: {}, images: [] },
        mappings: [...localDb.settings.defaultMappings],
        logs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...migrationData
      };
      localDb.migrations.push(newMig);
      saveLocalDb();
      return newMig;
    }
  }
}

async function deleteMigration(id) {
  if (useMongoDB) {
    return await MigrationModel.findByIdAndDelete(id);
  } else {
    const idx = localDb.migrations.findIndex(m => m._id === id);
    if (idx !== -1) {
      const removed = localDb.migrations.splice(idx, 1)[0];
      saveLocalDb();
      return removed;
    }
    return null;
  }
}

async function getActivityLogs() {
  if (useMongoDB) {
    return await ActivityLogModel.find().sort({ timestamp: -1 }).limit(100);
  } else {
    return [...localDb.logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
  }
}

async function addActivityLog(type, level, message) {
  const logData = {
    type,
    level,
    message,
    timestamp: useMongoDB ? new Date() : new Date().toISOString()
  };
  
  if (useMongoDB) {
    try {
      const log = new ActivityLogModel(logData);
      await log.save();
    } catch (e) {
      console.error('Error writing activity log to Mongo:', e.message);
    }
  } else {
    logData._id = 'log_' + Math.random().toString(36).substr(2, 9);
    localDb.logs.push(logData);
    if (localDb.logs.length > 500) {
      localDb.logs.shift(); // keep under bounds
    }
    saveLocalDb();
  }
  return logData;
}

async function getSettings() {
  if (useMongoDB) {
    const s = await SettingsModel.findOne({ id: 'global' });
    return s || localDb.settings;
  } else {
    return localDb.settings;
  }
}

async function updateSettings(newSettings) {
  if (useMongoDB) {
    return await SettingsModel.findOneAndUpdate({ id: 'global' }, newSettings, { new: true, upsert: true });
  } else {
    localDb.settings = { ...localDb.settings, ...newSettings, id: 'global' };
    saveLocalDb();
    return localDb.settings;
  }
}

async function getUserByUsername(username) {
  if (useMongoDB) {
    return await UserModel.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
  } else {
    return localDb.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }
}

async function createUser(username, password) {
  if (useMongoDB) {
    const newUser = new UserModel({ username, password });
    return await newUser.save();
  } else {
    const newUser = {
      _id: 'user_' + Math.random().toString(36).substr(2, 9),
      username,
      password,
      createdAt: new Date().toISOString()
    };
    localDb.users.push(newUser);
    saveLocalDb();
    return newUser;
  }
}

module.exports = {
  connectDB,
  getMigrations,
  getMigrationById,
  saveMigration,
  deleteMigration,
  getActivityLogs,
  addActivityLog,
  getSettings,
  updateSettings,
  getUserByUsername,
  createUser,
  isMongoDB: () => useMongoDB
};
