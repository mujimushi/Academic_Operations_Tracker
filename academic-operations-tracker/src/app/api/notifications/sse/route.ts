export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sseManager } from "@/lib/sse";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      sseManager.addConnection(userId, controller);

      // Send initial connection comment
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Heartbeat every 30 seconds to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          sseManager.removeConnection(userId, controller);
        }
      }, 30_000);

      // Clean up when the client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        sseManager.removeConnection(userId, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
