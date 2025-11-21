
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  title: string;
  imagePreview: string | null;
  aspectRatio?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, title, imagePreview, aspectRatio }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      onImageUpload(files[0]);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [onImageUpload]);

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative w-full border-2 border-dashed rounded-lg transition-colors duration-200
          ${isDragging ? 'border-indigo-500 bg-gray-800' : 'border-gray-600 hover:border-gray-500'}
          ${aspectRatio ? '' : 'h-64 sm:h-80'}`}
        style={{ aspectRatio }}
      >
        <label htmlFor={`file-upload-${title.replace(/\s/g, '')}`} className="absolute inset-0 cursor-pointer">
          {imagePreview ? (
            <img src={imagePreview} alt={title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <UploadIcon />
              <p className="mt-2 text-sm text-center">Arraste e solte ou clique para carregar</p>
            </div>
          )}
        </label>
        <input
          id={`file-upload-${title.replace(/\s/g, '')}`}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
