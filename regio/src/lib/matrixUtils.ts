"use client";

/**
 * Matrix SDK utilities — SSR-safe dynamic import + client lifecycle helpers.
 */

import { useMatrixStore } from "@/store/matrixStore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sdkModule: any = null;

async function getMatrixSdk() {
  if (sdkModule) return sdkModule;
  // Dynamic import prevents SSR crashes
  sdkModule = await import("matrix-js-sdk");
  return sdkModule;
}

/**
 * Initialize a Matrix SDK client with the given credentials.
 * Starts the sync loop and stores the client in Zustand.
 */
export async function initializeMatrixClient(
  userId: string,
  accessToken: string,
  homeserver: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const sdk = await getMatrixSdk();

  const client = sdk.createClient({
    baseUrl: homeserver,
    userId,
    accessToken,
    timelineSupport: true,
  });

  await client.startClient({ initialSyncLimit: 10 });

  // Wait for PREPARED state
  await new Promise<void>((resolve) => {
    const onSync = (state: string) => {
      if (state === "PREPARED" || state === "SYNCING") {
        client.removeListener(sdk.ClientEvent?.Sync ?? "sync", onSync);
        resolve();
      }
    };
    client.on(sdk.ClientEvent?.Sync ?? "sync", onSync);
    // Resolve after 5s as fallback to avoid blocking forever
    setTimeout(resolve, 5000);
  });

  useMatrixStore.getState().setMatrixClient(client);
  return client;
}

/**
 * Stop the Matrix SDK client and clear Zustand state.
 */
export async function disconnectMatrixClient(): Promise<void> {
  const { matrixClient, clearMatrix } = useMatrixStore.getState();
  if (matrixClient) {
    try {
      matrixClient.stopClient();
    } catch {
      // ignore
    }
  }
  clearMatrix();
}

/**
 * Send a text message to a Matrix room.
 */
export async function sendMatrixMessage(
  roomId: string,
  message: string
): Promise<void> {
  const { matrixClient } = useMatrixStore.getState();
  if (!matrixClient) throw new Error("Matrix client not initialized");
  await matrixClient.sendTextMessage(roomId, message);
}

/**
 * Get the list of joined rooms from the SDK client.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getJoinedRooms(): any[] {
  const { matrixClient } = useMatrixStore.getState();
  if (!matrixClient) return [];
  return matrixClient.getRooms().filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => r.getMyMembership() === "join"
  );
}
