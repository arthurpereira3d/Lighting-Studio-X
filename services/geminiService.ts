
import { GoogleGenAI, Modality } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove "data:mime/type;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

const generateSingleImage = async (
  ai: GoogleGenAI,
  prompt: string,
  baseImage: File | string,
  referenceImage: File | string
): Promise<string> => {
    const baseImageB64 = typeof baseImage === 'string' ? baseImage.split(',')[1] : await fileToBase64(baseImage);
    const referenceImageB64 = typeof referenceImage === 'string' ? referenceImage.split(',')[1] : await fileToBase64(referenceImage);
    
    const baseMimeType = typeof baseImage === 'string' ? baseImage.match(/data:(.*);/)?.[1] || 'image/jpeg' : baseImage.type;
    const refMimeType = typeof referenceImage === 'string' ? referenceImage.match(/data:(.*);/)?.[1] || 'image/jpeg' : referenceImage.type;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { data: baseImageB64, mimeType: baseMimeType } },
        { inlineData: { data: referenceImageB64, mimeType: refMimeType } },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated from API.");
};

const getGenerationPrompt = () => `
  OBJETIVO: Gerar uma variação visual da 'Imagem Base' (a primeira imagem) aplicando a iluminação e a atmosfera (mood) da 'Imagem de Referência' (a segunda imagem). O resultado deve ser uma mescla dos itens analisados na Imagem Base e na Imagem Referência.

  ANÁLISE DA IMAGEM BASE:
  - Geometria e composição arquitetônica.
  - Acabamentos de superfície e materiais (texturas, reflexos).
  - Proporção da tela (aspect ratio) e enquadramento da câmera.

  ANÁLISE DA IMAGEM DE REFERÊNCIA:
  - Iluminação geral e atmosfera (mood).
  - Cores, temperatura da cor, e iluminação global (GI).
  - Direção, cor e suavidade das sombras.
  - Contraste, intensidade de brancos e pretos.
  - Tonalidade da vegetação.
  - Nível de névoa (fog).
  - Cores e composição do céu.
  - Intensidade e cor dos reflexos.

  REGRAS RÍGIDAS (NÃO VIOLAR):
  1. PRESERVAR RIGOROSAMENTE a geometria, modelagem, elementos físicos, enquadramento e ângulo da câmera da 'Imagem Base'. NENHUMA alteração estrutural é permitida.
  2. MANTER O ASPECT RATIO (proporção da tela) da 'Imagem Base' de forma exata.
  3. O foco exclusivo da alteração é a ILUMINAÇÃO e a ATMOSFERA. Distorça os materiais da 'Imagem Base' apenas se for estritamente necessário para manter a coerência da nova iluminação (ex: cena diurna para noturna).
  4. IGNORAR COMPLETAMENTE quando a Imagem Referência tiver vegetações no primeiro plano. Itens de enquadramento no primeiro plano devem seguir fiéis a Imagem Base.
  5. O resultado final deve ter fotorrealismo de alta qualidade, adequado para apresentação profissional em ArchViz.
`;

const getRevariationPrompt = () => `
  OBJETIVO: Com base na 'Imagem Base' (a primeira imagem, que é uma variação já gerada) e na 'Imagem de Referência' original (a segunda imagem), gere uma nova alternativa parecida com a 'Imagem Base', mas com pequenas e sutis variações nas cores e na intensidade da luz. Mantenha a atmosfera geral da 'Imagem de Referência'.

  REGRAS RÍGIDAS (NÃO VIOLAR):
  1. PRESERVAR RIGOROSAMENTE a geometria, modelagem, elementos físicos, enquadramento e ângulo da câmera da 'Imagem Base'.
  2. MANTER O ASPECT RATIO (proporção da tela) da 'Imagem Base' de forma exata.
  3. IGNORAR COMPLETAMENTE quando a Imagem Referência tiver vegetações no primeiro plano. Itens de enquadramento no primeiro plano devem seguir fiéis a Imagem Base.
  4. O resultado final deve ter fotorrealismo de alta qualidade.
`;


export const generateVariations = async (
    baseImage: File,
    referenceImage: File
): Promise<string[]> => {
    if (!import.meta.env.VITE_API_KEY) {
        throw new Error("API key not found. Please set the API_KEY environment variable.");
    }
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const prompt = getGenerationPrompt();
    
    const promises = Array(4).fill(0).map(() => 
        generateSingleImage(ai, prompt, baseImage, referenceImage)
    );
    
    return Promise.all(promises);
};

export const revariateImage = async (
    baseVariationImage: string,
    originalReferenceImage: File
): Promise<string[]> => {
    if (!import.meta.env.VITE_API_KEY) {
        throw new Error("API key not found. Please set the API_KEY environment variable.");
    }
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const prompt = getRevariationPrompt();
    
    const promises = Array(4).fill(0).map(() => 
        generateSingleImage(ai, prompt, baseVariationImage, originalReferenceImage)
    );
    
    return Promise.all(promises);
};
