type SSEConnection = {
  controller: ReadableStreamDefaultController;
  userId: string;
};

class SSEManager {
  private connections: Map<string, SSEConnection[]> = new Map();

  addConnection(userId: string, controller: ReadableStreamDefaultController) {
    const existing = this.connections.get(userId) || [];
    existing.push({ controller, userId });
    this.connections.set(userId, existing);
  }

  removeConnection(
    userId: string,
    controller: ReadableStreamDefaultController
  ) {
    const existing = this.connections.get(userId) || [];
    const filtered = existing.filter((c) => c.controller !== controller);
    if (filtered.length === 0) {
      this.connections.delete(userId);
    } else {
      this.connections.set(userId, filtered);
    }
  }

  send(userId: string, data: unknown) {
    const connections = this.connections.get(userId) || [];
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    for (const conn of connections) {
      try {
        conn.controller.enqueue(encoder.encode(message));
      } catch {
        this.removeConnection(userId, conn.controller);
      }
    }
  }
}

const globalForSSE = globalThis as unknown as {
  sseManager: SSEManager | undefined;
};

export const sseManager = globalForSSE.sseManager ?? new SSEManager();

if (process.env.NODE_ENV !== "production") globalForSSE.sseManager = sseManager;
