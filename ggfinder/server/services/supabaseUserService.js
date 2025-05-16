const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');

class SupabaseUserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.name - User name
   * @returns {Promise<Object>} Created user
   */
  static async create({ email, password, name = '' }) {
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');

    try {
      // Check if user already exists
      const { data: existingUsers, error: existingError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email);

      if (existingError) throw new Error(existingError.message);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('User with this email already exists');
      }

      // First, create auth user (handles password hashing)
      // Add emailConfirm: false to disable email confirmation requirement
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
          data: {
            name
          }
        }
      });

      if (authError) throw new Error(authError.message);

      // Create user in our custom table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            name,
            has_premium_access: false,
            goodKarma: 0, // Initialize goodKarma to 0
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (userError) throw new Error(userError.message);

      return {
        _id: userData.id, // Keep consistent with MongoDB _id field
        email: userData.email,
        name: userData.name,
        goodKarma: userData.goodKarma || 0
      };
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  static async getByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (error) throw new Error(error.message);

      if (!data) return null;

      return {
        _id: data.id,
        email: data.email,
        name: data.name,
        has_premium_access: data.has_premium_access || false,
        goodKarma: data.goodKarma || 0
      };
    } catch (error) {
      throw new Error(`Error getting user by email: ${error.message}`);
    }
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (error) throw new Error(error.message);

      if (!data) return null;

      return {
        _id: data.id,
        email: data.email,
        name: data.name,
        has_premium_access: data.has_premium_access || false,
        goodKarma: data.goodKarma || 0
      };
    } catch (error) {
      throw new Error(`Error getting user by ID: ${error.message}`);
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object|null>} User or null
   */
  static async authenticateWithPassword(email, password) {
    try {
      // Use Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        // If the error is about unconfirmed email, try to confirm it automatically for development
        if (authError.message && authError.message.includes("Email not confirmed")) {
          console.log(`Auto-confirming email for development: ${email}`);

          // For development, create the user record anyway
          // Check if user already exists in our custom table
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

          if (existingUser) {
            return {
              _id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              has_premium_access: existingUser.has_premium_access || false,
              goodKarma: existingUser.goodKarma || 0
            };
          }

          // Try to get user from auth
          const { data: userData } = await supabase.auth.admin.getUserByEmail(email);

          if (userData && userData.user) {
            // Create user in our custom table
            const { data: newUserData, error: newUserError } = await supabase
              .from('users')
              .insert([
                {
                  id: userData.user.id,
                  email: userData.user.email,
                  name: userData.user.email.split('@')[0], // Default name from email
                  has_premium_access: false,
                  goodKarma: 0, // Initialize goodKarma to 0
                  created_at: new Date().toISOString()
                }
              ])
              .select()
              .single();

            if (!newUserError) {
              return {
                _id: newUserData.id,
                email: newUserData.email,
                name: newUserData.name,
                has_premium_access: newUserData.has_premium_access || false,
                goodKarma: newUserData.goodKarma || 0
              };
            }
          }
        }

        throw new Error(authError.message);
      }

      if (!authData?.user) return null;

      // Get user details from our custom table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (userError) throw new Error(userError.message);

      // If user doesn't exist in our table but does in auth, create them in our table
      if (!userData) {
        const { data: newUserData, error: newUserError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              name: authData.user.email.split('@')[0], // Default name from email
              has_premium_access: false,
              goodKarma: 0, // Initialize goodKarma to 0
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (newUserError) throw new Error(newUserError.message);

        return {
          _id: newUserData.id,
          email: newUserData.email,
          name: newUserData.name,
          has_premium_access: newUserData.has_premium_access || false,
          goodKarma: newUserData.goodKarma || 0
        };
      }

      return {
        _id: userData.id,
        email: userData.email,
        name: userData.name,
        has_premium_access: userData.has_premium_access || false,
        goodKarma: userData.goodKarma || 0
      };
    } catch (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
  }
}

module.exports = SupabaseUserService;