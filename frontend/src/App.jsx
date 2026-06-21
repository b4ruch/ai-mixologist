import React, { useState, useRef, useEffect } from 'react';
import AgeGate from './components/AgeGate';
import LoginModal from './components/LoginModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ImagePlus, Send, History, Menu, X, Wine, Loader2, FileImage, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api/v1";

// Removed mock recipes history in favor of dynamic state


function AppContent() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [history, setHistory] = useState([]);

  // Fetch history when user logs in
  useEffect(() => {
     if (activeUser) {
         fetchHistory();
     } else {
         setHistory([]);
         setActiveRecipe(null); // Clear selected recipe when logging out
     }
  }, [activeUser]);

  const fetchHistory = async () => {
      try {
          const res = await axios.get(`${BACKEND_URL}/recipes/history/${activeUser.id}`);
          setHistory(res.data.history);
      } catch (err) {
          console.error("Failed to fetch history");
      }
  };

  const deleteRecipe = async (e, recipeId) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to delete this recipe from your history?")) return;
      try {
          await axios.delete(`${BACKEND_URL}/recipes/${recipeId}`);
          if (activeRecipe && activeRecipe.id === recipeId) {
             setActiveRecipe(null);
          }
          fetchHistory();
      } catch(err) {
          console.error("Failed to delete recipe");
      }
  };


  const [prompt, setPrompt] = useState("");
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  useEffect(() => {
    let interval;
    if (loading) {
        // sophisticated & humorous messages
        const initialMessages = [
            "Consulting the ancient mixology scrolls...",
            "Polishing the crystal glassware...",
            "Muddling the virtual ingredients perfectly...",
            "Debating whether shaken or stirred...",
            "Measuring out the exact proportions...",
            "Infusing your request with algorithmic botanicals...",
            "Lighting up the smoked wood chips...",
            "Harvesting fresh algorithmic citrus...",
            "Working my magic to craft your perfect recipe...",
            "Decanting a century of cocktail history...",
            "Chipping the artisanal block ice...",
            "Garnishing with a twist of AI brilliance...",
            "Pouring the final drops of perfection...",
            "Checking the classic ratios..."
        ];

        // Shuffle messages so it's a dynamic experience every time
        const messages = initialMessages.sort(() => Math.random() - 0.5);

        let i = 0;
        setLoadingMessage(messages[0]);
        interval = setInterval(() => {
            i = (i + 1) % messages.length;
            setLoadingMessage(messages[i]);
        }, 3500); // Increased interval to let the user enjoy the text!
    }
    return () => clearInterval(interval);
  }, [loading]);

  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const [authError, setAuthError] = useState("");
  const fileInputRef = useRef(null);

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageFile) return;
    
    setLoading(true);
    setError("");
    setActiveRecipe(null);
    const submittedPrompt = prompt.trim();
    
    try {
        let response;
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('prompt', submittedPrompt);
            response = await axios.post(`${BACKEND_URL}/recipes/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            response = await axios.post(`${BACKEND_URL}/recipes/generate`, { prompt: submittedPrompt });
        }
          const currentImageUrl = response.data.image_url || (imageFile ? URL.createObjectURL(imageFile) : null);
          const newRecipe = {
              title: response.data.title || "Custom AI Drink",
              prompt: submittedPrompt,
              content: response.data.recipe,
              isImage: !!imageFile,
              imageUrl: currentImageUrl,
              isValidSpirit: response.data.is_valid !== false
          };
          setActiveRecipe(newRecipe);

          // Save to database if logged in
          if (activeUser) {
              try {
                  const saveRes = await axios.post(`${BACKEND_URL}/recipes/save`, {
                      user_id: activeUser.id,
                      title: response.data.title || "Custom AI Drink",
                      prompt: submittedPrompt,
                      content: response.data.recipe,
                      image_url: currentImageUrl
                  });
                  setActiveRecipe(prev => ({...prev, id: saveRes.data.id}));
                  fetchHistory();
              } catch (err) {
                  console.error("Failed to save recipe", err);
              }
          }





        setImageFile(null);
        setPrompt("");
    } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to generate recipe.");
    } finally {
        setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleGenerate();
  }
  const handleGenerateImage = async () => {
      if (!activeRecipe) return;
      setGeneratingImage(true);
      try {
          const response = await axios.post(`${BACKEND_URL}/recipes/generate-image`, { 
              prompt: activeRecipe.prompt, 
              recipe: activeRecipe.content 
          });
          setActiveRecipe(prev => ({...prev, imageUrl: response.data.image_url}));
          // Save the generated image if registered
          if (activeRecipe.id && activeUser) {
              await axios.put(`${BACKEND_URL}/recipes/${activeRecipe.id}/image`, { image_url: response.data.image_url });
              fetchHistory();
          }
      } catch (err) {
          setError(err.response?.data?.detail || err.message || "Failed to generate image.");
      } finally {
          setGeneratingImage(false);
      }
  };
  const loadSavedRecipe = (recipe) => {
    setActiveRecipe(recipe);
     setError("");
     if(window.innerWidth < 768) setSidebarOpen(false);
  }

  if (!ageVerified) {
    return <AgeGate onVerify={() => setAgeVerified(true)} />;
  }

  return (
    <div className="flex h-screen bg-mixologist-dark overflow-hidden font-sans">
      
      {showLogin && (
        <LoginModal 
           onClose={() => setShowLogin(false)} 
           onLoginSuccess={(userData) => { setActiveUser(userData); setActiveRecipe(null); setPrompt(""); setShowLogin(false); }} 
        />
      )}

      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-4 left-4 z-50 p-2 glassmorphism rounded-lg text-mixologist-gold"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* History Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="absolute md:relative z-40 w-72 h-full glassmorphism-dark border-r border-white/5 flex flex-col pt-16 md:pt-0"
          >
            <div className="p-6 pb-2 border-b border-white/5">
              <h2 className="text-2xl font-serif gold-gradient-text tracking-wider flex items-center gap-2" onClick={() => setActiveRecipe(null)}>
                <Wine className="text-mixologist-gold cursor-pointer" size={24} /> 
                <span className="cursor-pointer">The AI Mixologist</span>
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
              <div className="flex items-center gap-2 text-mixologist-text-muted mb-4 px-2">
                <History size={16} />
                <span className="text-sm tracking-widest uppercase font-semibold">Saved Recipes</span>
              </div>
              
              {!activeUser ? (
                 <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 mt-6">
                    <Lock className="mx-auto mb-3 text-mixologist-gold opacity-50" size={32} />
                    <p className="text-sm text-mixologist-text-muted mb-4 leading-relaxed">Guest mode active. Register or login to view and save your custom cocktail history!</p>
                    <button 
                      onClick={() => setShowLogin(true)}
                      className="px-4 py-2 w-full text-sm rounded-lg bg-gradient-to-r from-mixologist-gold-light to-mixologist-gold-dark text-mixologist-dark font-bold hover:shadow-[0_0_10px_rgba(250,204,21,0.3)] transition-all"
                    >
                      Login / Register
                    </button>
                 </div>
              ) : (
                 <div className="space-y-2">
                  {history.map((item) => (
                    <button 
                      key={item.id} 
                      onClick={() => loadSavedRecipe(item)}
                      className="w-full text-left p-3 flex justify-between items-center rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group block"
                    >
                      <div className="flex-1 overflow-hidden"><p className="text-mixologist-text truncate pr-2 group-hover:text-mixologist-gold transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-mixologist-text-muted mt-1 truncate">{item.prompt}</p></div><button onClick={(e) => deleteRecipe(e, item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 p-1"><X size={16}/></button>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5">
                <button 
                  onClick={() => activeUser ? setActiveUser(null) : setShowLogin(true)}
                  className="w-full py-3 px-4 rounded-xl bg-white/5 text-mixologist-text hover:bg-white/10 hover:text-red-400 transition-colors border border-white/10 flex items-center justify-center gap-2 font-semibold"
                >
                    {activeUser ? "Logout" : "Login"}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat / Generation Content */}
      <div className="flex-1 flex flex-col relative w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mixologist-card/40 via-mixologist-dark to-mixologist-dark overflow-hidden">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
            
            {!activeRecipe && !loading && !error && (
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="max-w-2xl px-4 text-center w-full"
              >
                  <div className="mx-auto w-24 h-24 mb-8 relative">
                      <div className="absolute inset-0 bg-mixologist-gold/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="w-full h-full glassmorphism rounded-full flex items-center justify-center border border-mixologist-gold/30 relative z-10">
                          <Wine size={40} className="text-mixologist-gold" />
                      </div>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-serif mb-6 gold-gradient-text leading-tight">
                      {activeUser ? `Welcome back, ${activeUser.name}!` : "What are you in the mood for?"}
                  </h1>
                  <p className="text-mixologist-text-muted/80 text-lg mb-12">
                    Upload a photo of a drink you want to recreate, or describe your ideal flavor profile to the AI Mixologist.
                  </p>
              </motion.div>
            )}

                        {loading && (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="max-w-4xl mx-auto flex flex-col items-center justify-center p-12 text-mixologist-gold h-64"
               >
                 <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-8"
                 >
                    <Wine className="w-16 h-16 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                 </motion.div>
                 
                 <AnimatePresence mode="wait">
                     <motion.p 
                        key={loadingMessage}
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                        transition={{ duration: 0.5 }}
                        className="font-serif text-2xl tracking-wide gold-gradient-text text-center italic"
                     >
                        {loadingMessage}
                     </motion.p>
                 </AnimatePresence>

                 {/* Adding a sleek progress bar representation */}
                 <div className="w-64 h-1 bg-white/10 rounded-full mt-8 overflow-hidden relative">
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-mixologist-gold to-transparent"
                    />
                 </div>
               </motion.div>
            )}
            
            {error && (
               <div className="max-w-4xl mx-auto bg-red-900/20 text-red-400 p-6 rounded-xl border border-red-900/50 whitespace-pre-wrap my-auto text-center">
                 <h3 className="font-bold mb-2">Error Occurred</h3>
                 {error}
               </div>
            )}
            
            {activeRecipe && !loading && !error && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="w-full max-w-4xl mx-auto glassmorphism-dark p-8 rounded-3xl border border-mixologist-gold/20 shadow-2xl flex flex-col md:flex-row gap-8 max-h-[70vh]"
               >
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                     <div className="mb-6 pb-6 border-b border-white/10">
                        <h4 className="text-mixologist-text-muted text-xs uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                            {activeRecipe.isImage ? <FileImage size={14}/> : <Send size={14}/>} Your Request
                        </h4>
                        <p className="text-mixologist-text font-serif italic border-l-2 border-mixologist-gold/50 pl-4 py-1">
                            {activeRecipe.prompt || "Image Analysis Request"}
                        </p>
                     </div>
                     <h3 className="gold-gradient-text font-serif text-3xl mb-6">{activeRecipe.title || "Your Custom Recipe"}</h3>
                     <div className="prose prose-invert prose-yellow max-w-none text-mixologist-text font-serif">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeRecipe.content}</ReactMarkdown>
                     </div>
                 </div>

                 {/* Image side */}
                 <div className="w-full md:w-1/3 shrink-0 flex flex-col items-center justify-start border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-6 overflow-y-auto">
                    {activeRecipe.imageUrl ? (
                        <div className="rounded-xl overflow-hidden shadow-lg border border-white/10 w-full aspect-square relative group">
                            <img src={activeRecipe.imageUrl} alt="Drink Preview" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-full">
                           <div className="rounded-xl border border-dashed border-white/20 w-full aspect-square flex flex-col items-center justify-center text-mixologist-text-muted mb-4 bg-white/5 p-4 text-center">
                                <ImagePlus size={32} className="mb-2 opacity-50" />
                                <p className="text-sm font-semibold">No Image Provided</p>
                           </div>
                           <button 
                                onClick={handleGenerateImage}
                                disabled={generatingImage || activeRecipe.isValidSpirit === false}
                                className="w-full py-3 px-4 rounded-xl bg-mixologist-gold/20 text-mixologist-gold hover:bg-mixologist-gold/30 transition-colors border border-mixologist-gold/50 flex items-center justify-center gap-2 font-bold disabled:opacity-50"
                           >
                                {generatingImage ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
                                {generatingImage ? "Generating..." : (activeRecipe.isValidSpirit === false ? "Invalid Spirit" : "Generate AI Image")}
                           </button>
                        </div>
                    )}
                 </div>
               </motion.div>
            )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-mixologist-dark via-mixologist-dark to-transparent shrink-0">
          
          <AnimatePresence>
            {imageFile && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-4xl mx-auto mb-2 flex items-center gap-2"
              >
                <div className="bg-mixologist-gold/20 text-mixologist-text px-4 py-2 rounded-full border border-mixologist-gold/40 flex items-center gap-2 text-sm shadow-xl">
                  <FileImage size={16} className="text-mixologist-gold" />
                  <span className="truncate max-w-[200px]">{imageFile.name}</span>
                  <button onClick={() => setImageFile(null)} className="ml-2 text-mixologist-text-muted hover:text-white"><X size={14} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-4xl mx-auto relative glassmorphism-dark rounded-3xl p-2 flex items-center border border-mixologist-gold/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all focus-within:border-mixologist-gold/50 focus-within:shadow-[0_0_30px_rgba(250,204,21,0.1)]">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => {
                 if (e.target.files && e.target.files[0]) { setImageFile(e.target.files[0]); }
                 e.target.value = null; // reset
              }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-mixologist-text-muted hover:text-mixologist-gold transition-colors relative group"
            >
              <ImagePlus size={24} />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upload Image</span>
            </button>
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Give me a smoky cocktail recipe with mezcal and pineapple..." 
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-mixologist-text placeholder:text-mixologist-text-muted/40 font-serif text-lg"
            />
            <button 
              onClick={handleGenerate}
              disabled={loading || (!prompt.trim() && !imageFile)}
              className="p-3 ml-2 rounded-2xl bg-gradient-to-br from-mixologist-gold-light to-mixologist-gold-dark text-mixologist-dark hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all disabled:opacity-50 disabled:hover:shadow-none"
            >
              <Send size={20} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
