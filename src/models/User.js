/**
 * User Model
 * Handles user profile data using Supabase
 */
const bcrypt = require('bcrypt');
const { supabase } = require('../services/supabaseClient');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.role = data.role || 'user';
    this.isActive = data.is_active;
    this.passkeys = data.passkeys || [];
    this.web3Wallets = data.web3_wallets || [];
    this.createdAt = data.created_at;
    this.lastLogin = data.last_login;
  }

  // Create a new user
  static async create(userData) {
    const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS) || 10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const { data, error } = await supabase
      .from('users')
      .insert({
        username: userData.username.toLowerCase(),
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: 'user',
        is_active: true,
        passkeys: [],
        web3_wallets: [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return new User(data);
  }

  // Find user by email
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', email.toLowerCase())
      .single();

    if (error) return null;
    return data ? new User(data) : null;
  }

  // Find user by username
  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('username', username.toLowerCase())
      .single();

    if (error) return null;
    return data ? new User(data) : null;
  }

  // Find user by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? new User(data) : null;
  }

  // Update user
  async update(updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', this.id)
      .select()
      .single();

    if (error) throw error;
    Object.assign(this, new User(data));
    return this;
  }

  // Compare password for login
  async comparePassword(candidatePassword) {
    const { data, error } = await supabase
      .from('users')
      .select('password')
      .eq('id', this.id)
      .single();

    if (error || !data) return false;
    return bcrypt.compare(candidatePassword, data.password);
  }

  // Add passkey
  async addPasskey(passkey) {
    const updatedPasskeys = [...this.passkeys, passkey];
    return this.update({ passkeys: updatedPasskeys });
  }

  // Add Web3 wallet
  async addWeb3Wallet(wallet) {
    const updatedWallets = [...this.web3Wallets, wallet];
    return this.update({ web3_wallets: updatedWallets });
  }

  // Update last login
  async updateLastLogin() {
    return this.update({ last_login: new Date().toISOString() });
  }
}

module.exports = User; 