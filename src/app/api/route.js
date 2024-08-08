import { NextResponse } from "next/server";
import { VertexAI } from '@google-cloud/vertexai';
export const maxDuration = 60;

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({ project: process.env.VERTEXAI_PROJECT, location: process.env.VERTEXAI_LOCATION });
const model = process.env.VERTEXAI_MODEL;

// Instantiate the models
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


const text1 = { text: `Okay, send me the list of ingredients and I\'ll categorize them as edible and inedible. For the edible ones, I\'ll also brainstorm some fun recipe ideas! Let\'s get cooking (or not, for the inedible bunch!).` };


export async function POST(req, res) {

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

  // Devuelve un objeto JSON con la propiedad "response"
  return NextResponse.json({ response: responseObject });

}