import { create } from 'zustand'

export const useConnectionStore = create((set) => ({
  selectedConnection: null,
  setSelectedConnection: (connection) => set({ selectedConnection: connection }),
}))

