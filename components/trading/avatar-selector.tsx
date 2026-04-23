"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const AVATARS = [
  { id: "avatar-1", name: "Modern Trader", path: "/avatars/avatar-1.png" },
  { id: "avatar-2", name: "Cyber Trader", path: "/avatars/avatar-2.png" },
  { id: "avatar-3", name: "Golden Bull", path: "/avatars/avatar-3.png" },
  { id: "avatar-4", name: "Obsidian Bear", path: "/avatars/avatar-4.png" },
];

export function AvatarSelector({ 
  currentAvatar, 
  onSelect 
}: { 
  currentAvatar: string, 
  onSelect: (id: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedAvatar = AVATARS.find(a => a.id === currentAvatar) || AVATARS[0];

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(true)}
        className="relative mx-auto h-32 w-32 mb-6 group cursor-pointer"
      >
        <div className="h-full w-full rounded-[40px] bg-zinc-100 dark:bg-zinc-900 border-4 border-white dark:border-zinc-950 shadow-xl transition-all group-hover:scale-105 overflow-hidden">
          <img src={selectedAvatar.path} alt={selectedAvatar.name} className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 rounded-[40px] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="h-8 w-8 text-white" />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-[40px] bg-white p-8 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute right-6 top-6 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-black dark:text-white">Select Avatar</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">Choose a predefined premium avatar.</p>

              <div className="grid grid-cols-2 gap-4">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      onSelect(avatar.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "group relative aspect-square rounded-3xl overflow-hidden border-4 transition-all hover:scale-105",
                      currentAvatar === avatar.id ? "border-blue-600 shadow-lg shadow-blue-600/20" : "border-transparent"
                    )}
                  >
                    <img src={avatar.path} alt={avatar.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    <div className="absolute bottom-3 left-3 right-3 text-left">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{avatar.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
