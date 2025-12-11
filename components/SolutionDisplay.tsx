import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { SolutionData } from '../types';
import { Download, BookOpen, Star, Terminal, Copy, Check, Share2, Volume2, StopCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { generatePDF } from '../services/pdfService';
import { generateSpeech } from '../services/geminiService';

interface SolutionDisplayProps {
  data: SolutionData;
  originalQuestion: string;
}

const CodeBlock = ({ children, className }: any) => {
  const [copied, setCopied] = React.useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'code';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d0d0d] font-mono text-sm group">
      {/* Terminal Header */}
      <div className="bg-[#1e1e1e] px-4 py-2.5 flex items-center justify-between border-b border-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="flex items-center gap-3">
           {language && <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{language}</span>}
           <button 
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-transparent hover:border-white/10"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-green-400" />
                  <span className="text-green-400">COPIED</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>COPY</span>
                </>
              )}
           </button>
        </div>
      </div>
      
      {/* Code Content */}
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <code className={`block ${className} text-gray-200 leading-relaxed`}>
          {children}
        </code>
      </div>
    </div>
  );
};

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ data, originalQuestion }) => {
  const [shared, setShared] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const handleDownload = () => {
    generatePDF(originalQuestion, data.solution);
  };

  const handleShare = () => {
    const textToShare = data.rawMarkdown || `${data.solution}\n\n${data.explanation}`;
    navigator.clipboard.writeText(textToShare);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const stopAudio = () => {
    if (sourceRef.current) sourceRef.current.stop();
    if (audioContextRef.current) audioContextRef.current.close();
    sourceRef.current = null;
    audioContextRef.current = null;
    setIsSpeaking(false);
  };

  const playExplanation = async () => {
    if (isSpeaking) {
        stopAudio();
        return;
    }
    
    setIsSpeaking(true);
    try {
        const base64Audio = await generateSpeech(data.explanation);
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(false);
        
        sourceRef.current = source;
        source.start();
    } catch (e) {
        console.error("Audio Playback Error", e);
        setIsSpeaking(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 mt-12 pb-24 animate-fade-in-up">
      
      {/* Formal Solution Card */}
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
        <div className="bg-gray-50/80 p-5 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
            <h2 className="flex items-center gap-3 font-bold text-xl text-gray-800 tracking-tight">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <BookOpen size={20} />
                </div>
                Academic Solution
            </h2>
            <div className="flex gap-3">
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all text-sm font-bold"
                >
                    {shared ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                    {shared ? "Copied" : "Share"}
                </button>
                <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all text-sm font-bold transform hover:-translate-y-0.5"
                >
                    <Download size={16} />
                    Download PDF
                </button>
            </div>
        </div>
        
        {/* Content */}
        <div className="p-8 prose prose-slate max-w-none">
            <ReactMarkdown 
              components={{
                code({node, inline, className, children, ...props}: any) {
                  if (!inline && (className?.includes('language') || String(children).includes('\n'))) {
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  }
                  return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-sm border border-gray-200" {...props}>{children}</code>;
                }
              }}
            >
              {data.solution}
            </ReactMarkdown>
        </div>

        {/* Feedback Footer */}
        <div className="bg-gray-50/50 p-4 border-t border-gray-200 flex justify-end items-center gap-4">
            <span className="text-sm text-gray-500 font-medium">Was this solution helpful?</span>
            <div className="flex gap-2">
                <button 
                    onClick={() => setFeedback('up')}
                    className={`p-2 rounded-lg transition-colors ${feedback === 'up' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    aria-label="Thumbs up"
                >
                    <ThumbsUp size={18} />
                </button>
                <button 
                    onClick={() => setFeedback('down')}
                    className={`p-2 rounded-lg transition-colors ${feedback === 'down' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    aria-label="Thumbs down"
                >
                    <ThumbsDown size={18} />
                </button>
            </div>
        </div>
      </div>

      {/* Anime Explanation Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-anime-pink via-purple-600 to-anime-cyan rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-[#1a1b2e] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="bg-gradient-to-r from-[#24283b] to-[#1a1b2e] p-5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400 blur-sm opacity-50 animate-pulse"></div>
                        <Star className="relative text-yellow-400 fill-current w-6 h-6 animate-spin-slow" />
                    </div>
                    <h2 className="font-anime text-2xl text-white font-bold tracking-wider uppercase italic">
                        Sensei's Corner!
                    </h2>
                </div>
                <button 
                    onClick={playExplanation}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border
                    ${isSpeaking 
                        ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' 
                        : 'bg-anime-cyan/20 text-anime-cyan border-anime-cyan/50 hover:bg-anime-cyan/30'
                    }`}
                >
                    {isSpeaking ? <StopCircle size={16} /> : <Volume2 size={16} />}
                    {isSpeaking ? "Stop Audio" : "Listen"}
                </button>
            </div>
            <div className="p-8 text-gray-300 text-lg leading-relaxed font-body">
                 <ReactMarkdown 
                    components={{
                        strong: ({node, ...props}) => <span className="text-anime-pink font-bold" {...props} />,
                        em: ({node, ...props}) => <span className="text-anime-cyan italic" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-white text-xl font-bold mt-6 mb-3 flex items-center gap-2 before:content-['✨']" {...props} />,
                         code({node, inline, className, children, ...props}: any) {
                             if (!inline) return <CodeBlock className={className}>{children}</CodeBlock>;
                             return <code className="bg-[#24283b] px-1.5 py-0.5 rounded text-anime-accent font-mono text-sm border border-white/5" {...props}>{children}</code>;
                         }
                    }}
                 >
                    {data.explanation}
                 </ReactMarkdown>
            </div>
        </div>
      </div>

    </div>
  );
};

export default SolutionDisplay;