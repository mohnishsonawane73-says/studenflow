import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon, Send } from 'lucide-react';
import { QuestionState, AppStatus } from '../types';

interface InputSectionProps {
  state: QuestionState;
  setState: React.Dispatch<React.SetStateAction<QuestionState>>;
  onSubmit: () => void;
  status: AppStatus;
}

const InputSection: React.FC<InputSectionProps> = ({ state, setState, onSubmit, status }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, image: file, imagePreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setState(prev => ({ ...prev, image: null, imagePreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isLoading = status === AppStatus.LOADING;

  return (
    <div className="w-full max-w-3xl mx-auto bg-anime-card/50 backdrop-blur-sm p-6 rounded-2xl border border-anime-cyan/30 shadow-lg mt-6">
      <div className="space-y-4">
        
        {/* Text Area */}
        <div className="relative group">
            <textarea
            value={state.text}
            onChange={(e) => setState(prev => ({ ...prev, text: e.target.value }))}
            placeholder="Paste your CS question here or type a topic..."
            className="w-full h-32 bg-anime-dark/80 text-white p-4 rounded-xl border-2 border-anime-cyan/50 focus:border-anime-pink focus:outline-none transition-colors resize-none placeholder-gray-500 font-body"
            disabled={isLoading}
            />
            <div className="absolute top-0 right-0 p-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-anime-cyan bg-anime-dark px-2 py-1 rounded">Markdown supported</span>
            </div>
        </div>

        {/* Image Preview & Upload */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
                {state.imagePreview ? (
                    <div className="relative inline-block border-2 border-anime-purple rounded-lg overflow-hidden group">
                        <img src={state.imagePreview} alt="Preview" className="h-24 w-auto object-cover" />
                        <button 
                            onClick={clearImage}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 text-anime-cyan hover:text-anime-pink transition-colors border border-dashed border-anime-cyan/50 px-4 py-2 rounded-lg hover:bg-anime-dark/50 w-full sm:w-auto justify-center"
                        disabled={isLoading}
                    >
                        <ImageIcon size={18} />
                        <span>Upload Screenshot/Image</span>
                    </button>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            {/* Submit Button */}
            <button 
                onClick={onSubmit}
                disabled={isLoading || (!state.text && !state.image)}
                className={`
                    flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-anime font-bold text-lg text-anime-dark shadow-lg transform transition-all
                    ${isLoading || (!state.text && !state.image)
                        ? 'bg-gray-600 cursor-not-allowed grayscale' 
                        : 'bg-gradient-to-r from-anime-cyan to-anime-pink hover:scale-105 active:scale-95 hover:shadow-anime-pink/50'
                    }
                `}
            >
                {isLoading ? (
                    <>Processing...</>
                ) : (
                    <>Solve It! <Send size={20} /></>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;