/**
 * Encryption utilities
 */
import crypto from 'crypto';
import { AppError } from './errors.js';

export class Encryption {
  constructor(key) {
    if (!key || typeof key !== 'string' || key.length < 32) {
      throw new AppError(
        'Invalid encryption key. Must be at least 32 characters.',
        'INVALID_ENCRYPTION_KEY',
        400
      );
    }
    this.key = Buffer.from(key);
  }

  /**
   * Encrypt text
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error) {
      throw new AppError(`Encryption failed: ${error.message}`, 'ENCRYPTION_FAILED', 500);
    }
  }

  /**
   * Decrypt text
   */
  decrypt(encryptedText) {
    try {
      const [ivHex, encryptedHex] = encryptedText.split(':');
      if (!ivHex || !encryptedHex) {
        throw new Error('Invalid encrypted text format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const encryptedData = Buffer.from(encryptedHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
      
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (error) {
      throw new AppError(`Decryption failed: ${error.message}`, 'DECRYPTION_FAILED', 500);
    }
  }

  /**
   * Encrypt an object
   */
  encryptObject(obj) {
    try {
      const text = JSON.stringify(obj);
      return this.encrypt(text);
    } catch (error) {
      throw new AppError(`Object encryption failed: ${error.message}`, 'ENCRYPTION_FAILED', 500);
    }
  }

  /**
   * Decrypt to an object
   */
  decryptObject(encryptedText) {
    try {
      const text = this.decrypt(encryptedText);
      return JSON.parse(text);
    } catch (error) {
      throw new AppError(`Object decryption failed: ${error.message}`, 'DECRYPTION_FAILED', 500);
    }
  }
} 