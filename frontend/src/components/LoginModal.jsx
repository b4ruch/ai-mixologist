import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api/v1";

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };
      const response = await axios.post(`${BACKEND_URL}${endpoint}`, payload);
      onLoginSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glassmorphism-dark p-8 rounded-3xl max-w-sm w-full mx-4 border border-mixologist-gold/30 relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-mixologist-text-muted hover:text-white z-10">
          <X size={20} />
        </button>
        <h2 className="text-3xl font-serif gold-gradient-text mb-6 text-center mt-2">
          {isRegister ? 'Join Mixologist' : 'Welcome Back'}
        </h2>
        
        {error && <p className="text-red-400 text-sm mb-4 text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
          {isRegister && (
            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}}>
                <label className="block text-xs text-mixologist-text-muted mb-1 ml-1 uppercase tracking-wider font-bold">Username</label>
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mixologist-gold/50 transition-colors text-white" 
                />
            </motion.div>
          )}
          </AnimatePresence>
          <div>
            <label className="block text-xs text-mixologist-text-muted mb-1 ml-1 uppercase tracking-wider font-bold">Email</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mixologist-gold/50 transition-colors text-white" 
            />
          </div>
          <div>
            <label className="block text-xs text-mixologist-text-muted mb-1 ml-1 uppercase tracking-wider font-bold">Password</label>
            <input 
              type="password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-mixologist-gold/50 transition-colors text-white" 
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-mixologist-gold-light to-mixologist-gold-dark text-mixologist-dark font-bold hover:shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all flex justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (isRegister ? 'Create Account' : 'Login')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-mixologist-text-muted">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{' '}
          <button onClick={() => {setIsRegister(!isRegister); setError('');}} className="text-mixologist-gold hover:underline font-bold">
            {isRegister ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
