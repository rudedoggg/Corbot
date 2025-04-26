/**
 * Supabase Memory Service
 * Provides persistent storage for agent conversations and data via Supabase
 */
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

class SupabaseMemoryService {
  constructor(config = {}) {
    this.agentId = config.agentId;
    this.encryptionKey = config.encryptionKey || process.env.MEMORY_ENCRYPTION_KEY;
    
    // Initialize Supabase client
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('Supabase credentials missing. Memory service will not work correctly.');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.connected = false;
  }

  /**
   * Connect to the memory store (verify tables exist)
   */
  async connect() {
    if (this.connected) return true;
    
    try {
      // Check if tables exist
      const { data: messages, error: msgError } = await this.supabase
        .from('agent_messages')
        .select('id')
        .limit(1);
        
      const { data: agentData, error: dataError } = await this.supabase
        .from('agent_data')
        .select('id')
        .limit(1);
      
      if (msgError && !msgError.message.includes('does not exist')) {
        console.error('Error connecting to Supabase (messages):', msgError);
      }
      
      if (dataError && !dataError.message.includes('does not exist')) {
        console.error('Error connecting to Supabase (data):', dataError);
      }
      
      if ((msgError && msgError.message.includes('does not exist')) || 
          (dataError && dataError.message.includes('does not exist'))) {
        console.warn('Required tables do not exist in Supabase. Please run the setup SQL.');
      } else {
        this.connected = true;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to connect to Supabase memory store:', error);
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
    
    const { data, error } = await this.supabase
      .from('agent_messages')
      .insert({
        agent_id: this.agentId,
        user_id: message.userId || 'unknown',
        role: message.role,
        content: content,
        encrypted: shouldEncrypt,
        timestamp: message.timestamp || new Date()
      })
      .select();
    
    if (error) {
      console.error('Error storing message:', error);
      throw error;
    }
    
    return data[0].id;
  }

  /**
   * Retrieve conversation history
   */
  async getConversationHistory(userId, limit = 20) {
    if (!this.connected) await this.connect();
    
    const { data, error } = await this.supabase
      .from('agent_messages')
      .select('*')
      .eq('agent_id', this.agentId)
      .eq('user_id', userId)
      .order('timestamp', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error retrieving conversation history:', error);
      throw error;
    }
    
    // Format and decrypt if needed
    return data.map(msg => {
      // Decrypt content if encrypted
      if (msg.encrypted && this.encryptionKey) {
        msg.content = this.decrypt(msg.content);
      }
      
      // Convert to camelCase for consistency with the API
      return {
        id: msg.id,
        agentId: msg.agent_id,
        userId: msg.user_id,
        role: msg.role,
        content: msg.content,
        encrypted: msg.encrypted,
        timestamp: msg.timestamp
      };
    });
  }

  /**
   * Clear conversation history for a specific user
   */
  async clearUserHistory(userId) {
    if (!this.connected) await this.connect();
    
    const { error, count } = await this.supabase
      .from('agent_messages')
      .delete()
      .eq('agent_id', this.agentId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error clearing user history:', error);
      throw error;
    }
    
    return {
      deleted: count || 0,
      success: true
    };
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
    } else if (typeof value === 'object') {
      storedValue = JSON.stringify(value);
    }
    
    // Check if the key already exists
    const { data: existingData } = await this.supabase
      .from('agent_data')
      .select('id')
      .eq('agent_id', this.agentId)
      .eq('key', key)
      .maybeSingle();
    
    let result;
    
    if (existingData) {
      // Update existing data
      result = await this.supabase
        .from('agent_data')
        .update({
          value: storedValue,
          encrypted: shouldEncrypt,
          updated_at: new Date()
        })
        .eq('id', existingData.id);
    } else {
      // Insert new data
      result = await this.supabase
        .from('agent_data')
        .insert({
          agent_id: this.agentId,
          key: key,
          value: storedValue,
          encrypted: shouldEncrypt
        });
    }
    
    if (result.error) {
      console.error('Error storing data:', result.error);
      throw result.error;
    }
    
    return true;
  }

  /**
   * Retrieve structured data
   */
  async getData(key) {
    if (!this.connected) await this.connect();
    
    const { data, error } = await this.supabase
      .from('agent_data')
      .select('*')
      .eq('agent_id', this.agentId)
      .eq('key', key)
      .maybeSingle();
    
    if (error) {
      console.error('Error retrieving data:', error);
      throw error;
    }
    
    if (!data) return null;
    
    let value = data.value;
    
    // Decrypt if encrypted
    if (data.encrypted && this.encryptionKey) {
      value = this.decrypt(value);
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Value wasn't JSON
      }
    } else {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Value wasn't JSON
      }
    }
    
    return value;
  }

  /**
   * Encrypt text using the encryption key
   */
  encrypt(text) {
    if (!this.encryptionKey) {
      throw new Error('No encryption key provided');
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Decrypt text using the encryption key
   */
  decrypt(encryptedText) {
    if (!this.encryptionKey) {
      throw new Error('No encryption key provided');
    }
    
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}

export default SupabaseMemoryService; 