import admin from "firebase-admin";
import { prisma } from "./prisma";

async function getFirebaseConfig() {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: { in: ["fcm_project_id", "fcm_client_email", "fcm_private_key"] },
    },
  });
  const configMap: Record<string, string> = {};
  for (const c of configs) configMap[c.key] = c.value;
  return configMap;
}

async function getFirebaseApp() {
  if (admin.apps.length > 0) return admin.apps[0]!;

  const config = await getFirebaseConfig();
  if (!config.fcm_project_id || !config.fcm_client_email || !config.fcm_private_key) {
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.fcm_project_id,
      clientEmail: config.fcm_client_email,
      privateKey: config.fcm_private_key.replace(/\\n/g, "\n"),
    }),
  });
}

export async function sendPushNotification(params: {
  userId: string;
  title: string;
  body: string;
  taskUrl?: string;
}): Promise<boolean> {
  try {
    const app = await getFirebaseApp();
    if (!app) {
      console.warn("Firebase not configured, skipping push notification");
      return false;
    }

    const tokens = await prisma.deviceToken.findMany({
      where: { userId: params.userId },
      select: { token: true },
    });

    if (tokens.length === 0) return false;

    const messaging = admin.messaging(app);

    for (const { token } of tokens) {
      try {
        await messaging.send({
          token,
          notification: {
            title: params.title,
            body: params.body,
          },
          webpush: {
            fcmOptions: {
              link: params.taskUrl || "/",
            },
          },
        });
      } catch (error: unknown) {
        // Remove invalid tokens
        const fcmError = error as { code?: string };
        if (
          fcmError?.code === "messaging/registration-token-not-registered" ||
          fcmError?.code === "messaging/invalid-registration-token"
        ) {
          await prisma.deviceToken.deleteMany({
            where: { token },
          });
        }
        console.error("FCM send failed for token:", error);
      }
    }

    return true;
  } catch (error) {
    console.error("Push notification failed:", error);
    return false;
  }
}
