<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Create your Free Account</h1>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="fullname">Full Name</label>
          <input 
            type="text" 
            id="fullname" 
            v-model="fullname" 
            placeholder="Enter your Fulll Name here"
            class="auth-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="Enter your Email here"
            class="auth-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="Enter your Password here"
            class="auth-input"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary auth-submit">Create Account</button>
      </form>

      <div class="auth-links">
        <p>Already have a account? <router-link to="/login" class="link-highlight">Log in</router-link></p>
      </div>

      <div class="auth-divider">
        <span>- OR -</span>
      </div>

      <button class="btn btn-google">
        <svg class="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        Sign up with Google
      </button>
    </div>
  </div>
</template>

<script>
import authService from '../services/authService';

export default {
  name: 'RegisterView',
  data() {
    return {
      fullname: '',
      email: '',
      password: ''
    };
  },
  methods: {
    async handleRegister() {
      try {
        const response = await authService.register({
          name: this.fullname,
          email: this.email,
          password: this.password
        });

        if (response.success) {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_info', JSON.stringify(response.user));
          alert('Registration successful!');
          this.$router.push('/');
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert(error.message || 'Registration failed');
      }
    }
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--bg-color);
}

.auth-card {
  background: white;
  width: 100%;
  max-width: 500px;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: var(--shadow-md);
  text-align: center;
}

.auth-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 2.5rem;
  color: #000;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  text-align: left;
}

.form-group label {
  display: block;
  font-size: 1rem;
  color: #718096;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.auth-input {
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  background-color: #E2E8F0;
  font-size: 1rem;
  color: var(--text-primary);
  transition: all 0.2s;
}

.auth-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-color);
  background-color: white;
}

.auth-submit {
  width: 100%;
  padding: 1rem;
  border-radius: 10px;
  margin-top: 1rem;
  background-color: #1a73e8; /* Google Blue-ish */
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 6px rgba(26, 115, 232, 0.2);
}

.auth-submit:hover {
  background-color: #1557b0;
  transform: translateY(-1px);
}

.auth-links {
  margin-top: 1.5rem;
  font-size: 0.95rem;
  color: #718096;
}

.link-highlight {
  color: #1a73e8;
  font-weight: 600;
  text-decoration: none;
}

.auth-divider {
  margin: 2rem 0;
  color: #A0AEC0;
  font-weight: 500;
}

.btn-google {
  width: 100%;
  padding: 0.8rem;
  border-radius: 30px; /* Pill shape */
  border: 1px solid #E2E8F0;
  background: white;
  color: #4A5568;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  transition: all 0.2s;
}

.btn-google:hover {
  background-color: #F7FAFC;
  box-shadow: var(--shadow-sm);
}
</style>
