
import React, { useState, useEffect, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedImageCard from './components/GeneratedImageCard';
import { Spinner } from './components/icons';
import { generateVariations, revariateImage } from './services/geminiService';
import { GeneratedImage } from './types';

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null);
  const [baseImageAspectRatio, setBaseImageAspectRatio] = useState<string | undefined>(undefined);
  
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revariatingIndex, setRevariatingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [prefix, setPrefix] = useState<string>('archviz');
  const [downloadCounter, setDownloadCounter] = useState<number>(1);

  useEffect(() => {
    if (baseImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setBaseImageAspectRatio(`${img.width} / ${img.height}`);
        };
        img.src = e.target?.result as string;
        setBaseImagePreview(img.src);
      };
      reader.readAsDataURL(baseImage);
    } else {
        setBaseImagePreview(null);
        setBaseImageAspectRatio(undefined);
    }
  }, [baseImage]);
  
  useEffect(() => {
    if (referenceImage) {
        const reader = new FileReader();
        reader.onload = (e) => setReferenceImagePreview(e.target?.result as string);
        reader.readAsDataURL(referenceImage);
    } else {
        setReferenceImagePreview(null);
    }
  }, [referenceImage]);

  useEffect(() => {
    setDownloadCounter(1);
  }, [prefix]);

  const handleGenerate = async () => {
    if (!baseImage || !referenceImage) {
      setError('Por favor, carregue a imagem base e a imagem de referência.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    try {
      const results = await generateVariations(baseImage, referenceImage);
      setGeneratedImages(results.map(src => ({ id: crypto.randomUUID(), src })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevariate = async (index: number) => {
    if (!referenceImage) {
      setError('A imagem de referência original é necessária para a re-variação.');
      return;
    }
    setRevariatingIndex(index);
    setError(null);
    try {
      const baseVariationImage = generatedImages[index].src;
      const results = await revariateImage(baseVariationImage, referenceImage);
      setGeneratedImages(results.map(src => ({ id: crypto.randomUUID(), src })));
    } catch (err) {
       setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido durante a re-variação.');
       console.error(err);
    } finally {
        setRevariatingIndex(null);
    }
  };


  const handleDownload = (imageDataUrl: string) => {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `${prefix}_mood_${String(downloadCounter).padStart(3, '0')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadCounter(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Lighting Studio X
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Simulação Profissional de Iluminação para Visualização Arquitetônica
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <ImageUploader 
              title="Imagem Base (Arquitetura)" 
              onImageUpload={setBaseImage}
              imagePreview={baseImagePreview}
              aspectRatio={baseImageAspectRatio}
            />
            <ImageUploader 
              title="Imagem Referência (Iluminação)" 
              onImageUpload={setReferenceImage}
              imagePreview={referenceImagePreview}
            />
          </div>

          <div className="text-center mb-12">
            <button
              onClick={handleGenerate}
              disabled={!baseImage || !referenceImage || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-12 rounded-full transition-all duration-300 transform hover:scale-105 text-lg shadow-lg shadow-indigo-500/30"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Spinner />
                  <span className="ml-3">Gerando...</span>
                </div>
              ) : 'Gerar Variações'}
            </button>
          </div>

          {error && <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-8">{error}</div>}

          { (isLoading || generatedImages.length > 0) && (
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                 <h2 className="text-2xl font-semibold text-gray-300 mb-4 sm:mb-0">Variações Geradas</h2>
                 <div className="flex items-center space-x-2">
                    <label htmlFor="prefix" className="text-gray-400 text-sm">Prefixo do Arquivo:</label>
                    <input 
                      type="text" 
                      id="prefix"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2"
                    />
                 </div>
              </div>
             
              {isLoading && generatedImages.length === 0 ? (
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6`} style={{aspectRatio: baseImageAspectRatio}}>
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg animate-pulse" style={{aspectRatio: baseImageAspectRatio}}></div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {generatedImages.map((image, index) => (
                    <GeneratedImageCard
                        key={image.id}
                        imageData={image.src}
                        onDownload={() => handleDownload(image.src)}
                        onRevariate={() => handleRevariate(index)}
                        isRevariating={revariatingIndex === index}
                    />
                    ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
