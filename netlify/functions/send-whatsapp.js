const admin = require("firebase-admin");

let firebaseApp;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const privateKey = String(
    process.env.FIREBASE_PRIVATE_KEY || ""
  ).replace(/\\n/g, "\n");

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });

  return firebaseApp;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":
      process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
    "Access-Control-Allow-Methods":
      "POST, OPTIONS",
    "Content-Type": "application/json"
  };
}

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Method tidak diizinkan."
      })
    };
  }

  try {
    // Verify the Firebase user who is logged in on index.html.
    getFirebaseApp();

    const authHeader =
      event.headers.authorization ||
      event.headers.Authorization ||
      "";

    if (!authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Firebase ID token diperlukan."
        })
      };
    }

    const idToken =
      authHeader.slice("Bearer ".length).trim();

    const decodedToken =
      await admin.auth().verifyIdToken(idToken);

    if (!decodedToken.uid) {
      throw new Error("UID Firebase tidak ditemukan.");
    }

    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Pesan kosong."
        })
      };
    }

    if (message.length > 4096) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Pesan terlalu panjang."
        })
      };
    }

    const {
      WHATSAPP_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_TO,
      WHATSAPP_GRAPH_VERSION
    } = process.env;

    if (
      !WHATSAPP_ACCESS_TOKEN ||
      !WHATSAPP_PHONE_NUMBER_ID ||
      !WHATSAPP_TO ||
      !WHATSAPP_GRAPH_VERSION
    ) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error:
            "Environment WhatsApp belum lengkap di Netlify."
        })
      };
    }

    const endpoint =
      `https://graph.facebook.com/` +
      `${WHATSAPP_GRAPH_VERSION}/` +
      `${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const waResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization":
          `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: WHATSAPP_TO,
        type: "text",
        text: {
          preview_url: false,
          body: message
        }
      })
    });

    const waData = await waResponse.json();

    if (!waResponse.ok) {
      console.error("WhatsApp API error:", waData);

      return {
        statusCode: waResponse.status,
        headers,
        body: JSON.stringify({
          success: false,
          error:
            waData?.error?.message ||
            "WhatsApp API menolak pesan."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        messageId:
          waData?.messages?.[0]?.id || null
      })
    };

  } catch (error) {
    console.error("Serverless function error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error:
          "Serverless backend gagal memproses pesan."
      })
    };
  }
};
