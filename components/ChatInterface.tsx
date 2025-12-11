import React, { useState, useRef, useEffect } from 'react';
import { chatWithSensei, generateSpeech } from '../services/geminiService';
import { Send, Zap, Brain, User, Bot, Globe, Book, Volume2, Loader2, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    groundingMetadata?: any; // To store search results
}

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: "Hey! StudenFlow-chan here! 🎓\n\nI can search the web, write code, or explain theory. What do you need?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Modes
    const [mode, setMode] = useState<'smart' | 'lite' | 'search'>('smart');
    
    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, []);

    const stopAudio = () => {
        if (sourceRef.current) {
            sourceRef.current.stop();
            sourceRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsPlaying(false);
    };

    const playAudio = async (text: string) => {
        stopAudio();
        setIsPlaying(true);
        try {
            const base64Audio = await generateSpeech(text);
            
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
            
            source.onended = () => setIsPlaying(false);
            sourceRef.current = source;
            source.start();

        } catch (error) {
            console.error("TTS Error", error);
            setIsPlaying(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Transform internal history
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const useLite = mode === 'lite';
            const useSearch = mode === 'search';

            const result = await chatWithSensei(input, history, useLite, useSearch);
            
            // Extract text
            const text = result.response.text();
            
            // Extract grounding metadata if available
            const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;

            const modelMsg: ChatMessage = { 
                role: 'model', 
                text: text,
                groundingMetadata: groundingMetadata
            };
            
            setMessages(prev => [...prev, modelMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Sensei tripped over a cable! The connection failed. 😵‍💫" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto h-[75vh] flex flex-col bg-[#13141f]/90 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden mt-6 animate-fade-in-up">
            
            {/* Premium Header */}
            <div className="bg-[#1a1b2e]/80 p-5 flex flex-col md:flex-row justify-between items-center border-b border-white/5 gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-anime-cyan to-anime-purple p-2 rounded-xl">
                        <Bot className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-white font-anime text-lg leading-tight">Sensei Chat</h2>
                        <p className="text-xs text-gray-400 font-medium">Powered by Gemini 3.0 Pro & 2.5 Flash</p>
                    </div>
                </div>
                
                {/* Mode Toggles */}
                <div className="flex bg-black/40 rounded-full p-1.5 border border-white/5">
                    <button 
                        onClick={() => setMode('smart')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${mode === 'smart' ? 'bg-anime-pink text-white shadow-lg shadow-anime-pink/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Brain size={14} /> Brain
                    </button>
                    <button 
                        onClick={() => setMode('lite')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${mode === 'lite' ? 'bg-anime-cyan text-[#0f111a] shadow-lg shadow-anime-cyan/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Zap size={14} /> Flash
                    </button>
                    <button 
                        onClick={() => setMode('search')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${mode === 'search' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Globe size={14} /> Search
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            
                            {/* Message Bubble */}
                            <div className={`relative px-5 py-4 rounded-2xl shadow-sm border ${
                                msg.role === 'user' 
                                ? 'bg-gradient-to-br from-anime-purple to-indigo-600 text-white rounded-tr-sm border-transparent' 
                                : 'bg-[#1f2335] text-gray-100 rounded-tl-sm border-white/5'
                            }`}>
                                <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>

                            {/* Footer (Citations & Actions) */}
                            {msg.role === 'model' && (
                                <div className="mt-2 flex flex-wrap gap-2 items-center">
                                    <button 
                                        onClick={() => isPlaying ? stopAudio() : playAudio(msg.text)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-anime-cyan hover:text-anime-pink transition-colors bg-white/5 px-2 py-1 rounded-lg hover:bg-white/10"
                                    >
                                        {isPlaying ? <StopCircle size={12} /> : <Volume2 size={12} />}
                                        {isPlaying ? "Stop" : "Read Aloud"}
                                    </button>

                                    {/* Render Search Citations */}
                                    {msg.groundingMetadata?.groundingChunks?.map((chunk: any, i: number) => {
                                        if (chunk.web?.uri) {
                                            return (
                                                <a 
                                                    key={i} 
                                                    href={chunk.web.uri} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1.5 text-xs text-gray-400 bg-black/30 hover:bg-black/50 hover:text-white px-2 py-1 rounded-lg transition-colors border border-white/5 truncate max-w-[150px]"
                                                >
                                                    <Book size={10} />
                                                    {chunk.web.title || "Source"}
                                                </a>
                                            )
                                        }
                                        return null;
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1f2335] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-3">
                            <Loader2 size={18} className="text-anime-pink animate-spin" />
                            <span className="text-xs text-gray-400 font-mono animate-pulse">Sensei is thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-5 bg-[#13141f] border-t border-white/5">
                <div className="relative flex items-center gap-3 bg-[#1a1b2e] border border-white/10 rounded-2xl px-2 py-2 shadow-inner focus-within:border-anime-purple/50 focus-within:ring-1 focus-within:ring-anime-purple/50 transition-all">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={
                            mode === 'search' ? "Ask about latest tech news..." :
                            mode === 'lite' ? "Ask a quick question..." : 
                            "Ask complex theory or upload code..."
                        }
                        className="flex-1 bg-transparent text-white px-3 py-2 focus:outline-none placeholder-gray-500 font-medium"
                        disabled={loading}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="bg-gradient-to-r from-anime-cyan to-anime-pink p-3 rounded-xl text-white shadow-lg hover:shadow-anime-pink/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                        {mode === 'smart' ? 'Gemini 3.0 Pro' : mode === 'lite' ? 'Gemini 2.5 Flash Lite' : 'Gemini 2.5 Flash + Search'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;