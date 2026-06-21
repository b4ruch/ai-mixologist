import React from 'react';
import { motion } from 'framer-motion';

export default function AgeGate({ onVerify }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glassmorphism-dark p-10 rounded-3xl max-w-md w-full mx-4 text-center border border-mixologist-gold/30"
      >
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-mixologist-gold/10 rounded-full flex items-center justify-center mb-6 border border-mixologist-gold/20">
             <span className="text-2xl">🥂</span>
          </div>
          <h1 className="text-4xl font-serif gold-gradient-text mb-3 tracking-wide">AI Mixologist</h1>
          <p className="text-mixologist-text-muted text-lg">Are you of legal drinking age?</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button 
            onClick={onVerify}
            className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-mixologist-gold-light to-mixologist-gold-dark text-mixologist-dark font-bold hover:shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all duration-300"
          >
            Yes, I am
          </button>
          <button 
            onClick={() => window.location.href = 'https://www.google.com'}
            className="flex-1 px-6 py-3 rounded-full border border-mixologist-gold/30 text-mixologist-text hover:bg-white/5 hover:border-mixologist-gold/60 transition-all duration-300"
          >
            No, I am not
          </button>
        </div>
        
        <p className="text-mixologist-text-muted/40 text-xs mt-8">
            Please drink responsibly. You must be 21 or older to enter.
        </p>
      </motion.div>
    </div>
  );
}
