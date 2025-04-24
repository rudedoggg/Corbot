/**
 * Memory Service
 * Provides persistent storage for agent conversations and data
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

class MemoryService {
  constructor(config = {}) {
    this.agentId = config.agentId;
    this.encryptionKey = config.encryptionKey || process.env.MEMORY_ENCRYPTION_KEY;
    this.connectionString = config.connectionString || process.env.MONGODB_URI || 'mongodb://localhost:27017/corbot';
    this.connected = false;
    this.messageCollection = null;
    this.dataCollection = null;
  }

  /**
   * Connect to the memory store
   */
  async connect() {
    if (this.connected) return true;
    
    try {
      await mongoose.connect(this.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      // Define schema for messages if it doesn't already exist
      if (!mongoose.models.Message) {
        const MessageSchema = new mongoose.Schema({
          agentId: { type: String, required: true, index: true },
          userId: { type: String, required: true, index: true },
          role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
          content: { type: String, required: true },
          encrypted: { type: Boolean, default: false },
          timestamp: { type: Date, default: Date.now }
        });
        
        mongoose.model('Message', MessageSchema);
      }
      
      // Define schema for structured data if it doesn't already exist
      if (!mongoose.models.AgentData) {
        const AgentDataSchema = new mongoose.Schema({
          agentId: { type: String, required: true, index: true },
          key: { type: String, required: true },
          value: { type: mongoose.Schema.Types.Mixed, required: true },
          encrypted: { type: Boolean, default: false },
          timestamp: { type: Date, default: Date.now }
        });
        
        mongoose.model('AgentData', AgentDataSchema);
      }
      
      this.messageCollection = mongoose.model('Message');
      this.dataCollection = mongoose.model('AgentData');
      this.connected = true;
      
      return true;
    } catch (error) {
      console.error('Failed to connect to memory store:', error);
      throw error;
    }
  }

  /**
   * Store a message in memory
   */
  async storeMessage(message) {
    if (!this.connected) await this.connect();
    
    const shouldEncrypt = message.sensitive === true && this.encryptionKey;
    let content = message.content;
    
    // Encrypt sensitive content if encryption key is available
    if (shouldEncrypt) {
      content = this.encrypt(content);
    }
    
    const messageDoc = new this.messageCollection({
      agentId: this.agentId,
      userId: message.userId || 'unknown',
      role: message.role,
      content: content,
      encrypted: shouldEncrypt,
      timestamp: message.timestamp || new Date()
    });
    
    await messageDoc.save();
    return messageDoc._id;
  }

  /**
   * Retrieve conversation history
   */
  async getConversationHistory(userId, limit = 20) {
    if (!this.connected) await this.connect();
    
    const messages = await this.messageCollection.find({
      agentId: this.agentId,
      userId: userId
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
    
    // Sort messages in chronological order and decrypt if needed
    return messages
      .map(msg => {
        if (msg.encrypted && this.encryptionKey) {
          msg.content = this.decrypt(msg.content);
        }
        return msg;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Store structured data
   */
  async storeData(key, value, options = {}) {
    if (!this.connected) await this.connect();
    
    const shouldEncrypt = options.sensitive === true && this.encryptionKey;
    let storedValue = value;
    
    // Encrypt sensitive data if encryption key is available
    if (shouldEncrypt) {
      storedValue = this.encrypt(JSON.stringify(value));
    }
    
    // Upsert (update or insert)
    await this.dataCollection.updateOne(
      { agentId: this.agentId, key: key },
      { 
        $set: { 
          value: storedValue,
          encrypted: shouldEncrypt,
          timestamp: new Date()
        }
      },
      { upsert: true }
    );
    
    return true;
  }

  /**
   * Retrieve structured data
   */
  async getData(key) {
    if (!this.connected) await this.connect();
    
    const data = await this.dataCollection.findOne({
      agentId: this.agentId,
      key: key
    }).lean();
    
    if (!data) return null;
    
    // Decrypt if needed
    if (data.encrypted && this.encryptionKey) {
      try {
        return JSON.parse(this.decrypt(data.value));
      } catch (e) {
        console.error('Failed to decrypt/parse data:', e);
        return null;
      }
    }
    
    return data.value;
  }

  /**
   * Encrypt a string using the encryption key
   */
  encrypt(text) {
    if (!this.encryptionKey) return text;
    
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a string using the encryption key
   */
  decrypt(encryptedText) {
    if (!this.encryptionKey) return encryptedText;
    
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = MemoryService; 