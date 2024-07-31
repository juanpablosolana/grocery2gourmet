import { NextResponse } from "next/server";
import { VertexAI } from '@google-cloud/vertexai';

export const maxDuration = 60;

// Obtiene las credenciales de Google Cloud
const getGCPCredentials = () => {
  // Para Vercel, usa variables de entorno
  if (process.env.GCP_PRIVATE_KEY) {
    return {
      credentials: {
        client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY,
      },
      projectId: process.env.GCP_PROJECT_ID,
    };
  } else {
    // Para desarrollo local, intenta usar la cuenta por defecto de gcloud
    try {
      return {}; // Google Cloud SDK se encargará de la autenticación
    } catch (error) {
      console.error("No se pudieron obtener las credenciales de GCP:", error);
      throw error; // Propaga el error para detener la ejecución
    }
  }
};

// Inicializa Vertex AI con las credenciales y la ubicación
const vertex_ai = new VertexAI({
  ...getGCPCredentials(),
  location: process.env.VERTEXAI_LOCATION,
});

const model = process.env.VERTEXAI_MODEL;

// Instancia el modelo
const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    'maxOutputTokens': 8192,
    'temperature': 1,
    'topP': 0.95,
  },
  safetySettings: [
    {
      'category': 'HARM_CATEGORY_HATE_SPEECH',
      'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
      'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      'category': 'HARM_CATEGORY_HARASSMENT',
      'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],
});

const text1 = {
  text: `Okay, send me the list of ingredients and I\'ll categorize them as edible and inedible. For the edible ones, I\'ll also brainstorm some fun recipe ideas! Let\'s get cooking (or not, for the inedible bunch!).`
};

export async function POST(req, res) {
  try {
    const photo = await req.formData();
    const file = photo.get('file');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const image1 = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64
      }
    };
    const magic = {
      contents: [
        { role: 'user', parts: [image1, text1] }
      ],
    };

    const streamingResp = await generativeModel.generateContentStream(magic);
    const allResponse = await streamingResp.response;
    const response = allResponse.candidates;
    const dirtyData = response?.map((item) => JSON.stringify(item.content.parts[0].text));
    const data = dirtyData?.map((item) => item);

    const rawString = data[0];
    const responseObject = JSON.parse(rawString);

    return NextResponse.json({ response: responseObject });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, 500);
  }
}