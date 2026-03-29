import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MatrixState {
  matrixUserId: string | null;
  matrixAccessToken: string | null;
  matrixHomeserver: string | null;
  // matrixClient is NOT persisted — reconstructed on init
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matrixClient: any | null;

  setMatrixCredentials: (
    userId: string,
    accessToken: string,
    homeserver: string
  ) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMatrixClient: (client: any) => void;
  clearMatrix: () => void;
}

export const useMatrixStore = create<MatrixState>()(
  persist(
    (set) => ({
      matrixUserId: null,
      matrixAccessToken: null,
      matrixHomeserver: null,
      matrixClient: null,

      setMatrixCredentials: (userId, accessToken, homeserver) =>
        set({ matrixUserId: userId, matrixAccessToken: accessToken, matrixHomeserver: homeserver }),

      setMatrixClient: (client) => set({ matrixClient: client }),

      clearMatrix: () =>
        set({
          matrixUserId: null,
          matrixAccessToken: null,
          matrixHomeserver: null,
          matrixClient: null,
        }),
    }),
    {
      name: "matrix-storage",
      // Only persist credentials, not the SDK client instance
      partialize: (state) => ({
        matrixUserId: state.matrixUserId,
        matrixAccessToken: state.matrixAccessToken,
        matrixHomeserver: state.matrixHomeserver,
      }),
    }
  )
);
