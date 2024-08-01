import { NextResponse } from 'next/server';
import { getVercelOidcToken } from '@vercel/functions/oidc';
import { ExternalAccountClient } from 'google-auth-library';
import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCP_PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER;
const GCP_SERVICE_ACCOUNT_EMAIL = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
const GCP_WORKLOAD_IDENTITY_POOL_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
const GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;

// Initialize the External Account Client
const authClient = ExternalAccountClient.fromJSON({
  type: 'external_account',
  audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GCP_WORKLOAD_IDENTITY_POOL_ID}/providers/${GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`,
  subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
  token_url: 'https://sts.googleapis.com/v1/token',
  service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
  subject_token_supplier: {
    // Use the Vercel OIDC token as the subject token
    getSubjectToken: getVercelOidcToken,
  },
});

const vertex = createVertex({
  project: GCP_PROJECT_ID,
  location: 'us-central1',
  googleAuthOptions: {
    authClient,
    projectId: GCP_PROJECT_ID,
  },
});

export const maxDuration = 60;
const modelName = 'gemini-pro-vision'; // Reemplaza con el nombre de tu modelo Vision

export async function POST(req) {
  try {
    const photo = await req.formData();
    const file = photo.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    const image1 = {
      inlineData: {
        mimeType: 'image/jpeg', // Ajusta el tipo MIME si es necesario
        data: base64,
      },
    };

    const text1 = {
      text: `Okay, send me the list of ingredients and I'll categorize them as edible and inedible. For the edible ones, I'll also brainstorm some fun recipe ideas! Let's get cooking (or not, for the inedible bunch!).`
    };

    const result = await generateText({
      model: vertex(modelName),
      prompt: {
        content: [
          { role: 'user', parts: [image1, text1] },
        ],
      },
    });

    // Procesar la respuesta como antes
    const responseObject = JSON.parse(result.text);

    return NextResponse.json({ response: responseObject });
  } catch (error) {
    console.error('Error en la solicitud:', error);
    return NextResponse.json({ error: 'Error al procesar la imagen' }, { status: 500 });
  }
}