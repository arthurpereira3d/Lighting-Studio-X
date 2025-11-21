
import React from 'react';
import { DownloadIcon, RevariateIcon, Spinner } from './icons';

interface GeneratedImageCardProps {
  imageData: string;
  onDownload: () => void;
  onRevariate: () => void;
  isRevariating: boolean;
}

const GeneratedImageCard: React.FC<GeneratedImageCardProps> = ({ imageData, onDownload, onRevariate, isRevariating }) => {
  return (
    <div className="relative group overflow-hidden rounded-lg shadow-lg bg-gray-800">
      <img src={imageData} alt="Generated variation" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-end p-4">
        <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex space-x-2">
          <button
            onClick={onDownload}
            className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center disabled:opacity-50"
          >
            <DownloadIcon />
            Download
          </button>
          <button
            onClick={onRevariate}
            disabled={isRevariating}
            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRevariating ? <Spinner /> : <><RevariateIcon /> Re-variação</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratedImageCard;
