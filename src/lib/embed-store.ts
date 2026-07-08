import { create } from "zustand";

type EmbedShare = {
  payload: { embeds: unknown[] } | null;
  setPayload: (p: { embeds: unknown[] }) => void;
};

export const useEmbedStore = create<EmbedShare>((set) => ({
  payload: null,
  setPayload: (payload) => set({ payload }),
}));
