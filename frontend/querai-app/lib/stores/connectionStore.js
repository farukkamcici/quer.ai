"use client";

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useConnectionStore = create(
  persist(
    (set) => ({
      selectedConnection: null,
      setSelectedConnection: (connection) => set({ selectedConnection: connection || null }),
      clearSelectedConnection: () => set({ selectedConnection: null }),
    }),
    {
      name: 'connection-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedConnection: state.selectedConnection }),
    }
  )
)
