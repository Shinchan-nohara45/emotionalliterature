import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb } from "lucide-react";
import { Button } from "../ui/button";

const messages = {
  Home: "Welcome! 🌟 Here you'll find a new emotion word every day. Explore its meaning and see how it's used.",
  Quiz: "Ready to test your knowledge? 🧠 This quiz will help reinforce what you've learned. Good luck!",
  Journal: "This is your private space to reflect. ✍️ Try our new voice entry feature for a hands-free way to express yourself.",
  Progress: "Look how far you've come! ✨ This is where you can track your streaks, level, and achievements. Keep it up!",
  Default: "I'm Emi, your guide to emotional literacy. I'll pop up with helpful tips as you explore the app!"
};

export default function AvatarGuide({ currentPageName }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState(messages.Default);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
      setMessage(messages[currentPageName] || messages.Default);
    }, 1000); // Show avatar message 1 second after page load
    
    return () => clearTimeout(timer);
  }, [currentPageName]);

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };
  
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative w-64 p-4 bg-white rounded-xl shadow-2xl border border-purple-200"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 w-6 h-6 text-gray-400 hover:bg-gray-100"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-900 mb-1">
                  Hi there! I'm Emi.
                </p>
                <p className="text-xs text-gray-700">
                  {message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Avatar character */}
      <motion.div
        className="absolute bottom-[-20px] right-[-10px] w-16 h-16 cursor-pointer"
        onClick={handleOpen}
        whileHover={{ scale: 1.1 }}
        animate={{ 
          y: [0, -5, 0], 
          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } 
        }}
      >
        <div className="relative w-full h-full">
          {/* Body */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg"
          />
          {/* Eyes */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-8/12 flex justify-between">
            <div className="w-3 h-3 bg-white rounded-full border-2 border-purple-800" />
            <div className="w-3 h-3 bg-white rounded-full border-2 border-purple-800" />
          </div>
          {/* Smile */}
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-t-0 border-x-0 border-white rounded-b-full" />
        </div>
      </motion.div>
    </div>
  );
}