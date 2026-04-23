"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const AVATARS = [
  { id: "avatar-1", name: "Alpha", color: "bg-blue-500" },
  { id: "avatar-2", name: "Beta", color: "bg-purple-500" },
  { id: "avatar-3", name: "Gamma", color: "bg-green-500" },
  { id: "avatar-4", name: "Delta", color: "bg-orange-500" },
  { id: "avatar-5", name: "Epsilon", color: "bg-pink-500" },
  { id: "avatar-6", name: "Zeta", color: "bg-cyan-500" },
  { id: "avatar-7", name: "Eta", color: "bg-indigo-500" },
  { id: "avatar-8", name: "Theta", color: "bg-rose-500" },
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
        <div className={cn(
          "h-full w-full rounded-3xl flex items-center justify-center border-4 border-white dark:border-zinc-950 shadow-xl transition-all group-hover:scale-105",
          selectedAvatar.color
        )}>
          <span className="text-4xl font-black text-white uppercase">{selectedAvatar.name[0]}</span>
        </div>
        <div className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute right-6 top-6 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-black dark:text-white">Select Avatar</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">Choose a predefined avatar that best represents you.</p>

              <div className="grid grid-cols-4 gap-4">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      onSelect(avatar.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "group relative aspect-square rounded-2xl flex items-center justify-center transition-all hover:scale-110",
                      avatar.color,
                      currentAvatar === avatar.id && "ring-4 ring-blue-600 ring-offset-4 dark:ring-offset-zinc-950"
                    )}
                  >
                    <span className="text-2xl font-black text-white uppercase">{avatar.name[0]}</span>
                    {currentAvatar === avatar.id && (
                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 border-2 border-white dark:border-zinc-950">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
