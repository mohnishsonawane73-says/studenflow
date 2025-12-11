import React, { useEffect, useRef, useState } from 'react';
import { aiClient } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';

const LiveVoice: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [statusText, setStatusText] = useState("Ready to call Sensei");
    const [audioLevel, setAudioLevel] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sessionRef = useRef<any>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);

    const stopSession = () => {
        if (sessionRef.current) {
            // There is no explicit close() on the session object in the current SDK version based on docs,
            // but we can stop sending data and close contexts.
            // Actually, best practice is to close the connection if possible or just stop the stream.
            // We will rely on cleaning up the AudioContexts to stop the flow.
        }
        
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (inputContextRef.current) {
            inputContextRef.current.close();
            inputContextRef.current = null;
        }
        if (outputContextRef.current) {
            outputContextRef.current.close();
            outputContextRef.current = null;
        }
        
        setIsActive(false);
        setStatusText("Call Ended");
        setAudioLevel(0);
    };

    const startSession = async () => {
        setStatusText("Connecting to Cyber Academy...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Setup Audio Contexts
            const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            inputContextRef.current = inputContext;
            outputContextRef.current = outputContext;

            const inputNode = inputContext.createMediaStreamSource(stream);
            const processor = inputContext.createScriptProcessor(4096, 1, 1);
            
            sourceRef.current = inputNode;
            processorRef.current = processor;

            // Connect to Gemini Live
            const sessionPromise = aiClient.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                    systemInstruction: "You are StudenFlow-chan, a helpful and energetic anime-style computer science tutor. Talk briefly and enthusiastically.",
                },
                callbacks: {
                    onopen: () => {
                        setStatusText("Connected! Speak now.");
                        setIsActive(true);
                        
                        // Setup Input Processing
                        inputNode.connect(processor);
                        processor.connect(inputContext.destination);
                        
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Calculate volume for visualizer
                            let sum = 0;
                            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                            setAudioLevel(Math.sqrt(sum / inputData.length) * 5); // Amplify for visual

                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            try {
                                const audioBuffer = await decodeAudioData(
                                    decode(base64Audio),
                                    outputContext,
                                    24000,
                                    1
                                );
                                
                                const source = outputContext.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputContext.destination);
                                
                                const currentTime = outputContext.currentTime;
                                if (nextStartTimeRef.current < currentTime) {
                                    nextStartTimeRef.current = currentTime;
                                }
                                
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                            } catch (e) {
                                console.error("Audio decode error", e);
                            }
                        }
                    },
                    onclose: () => {
                        setStatusText("Connection Closed");
                        setIsActive(false);
                    },
                    onerror: (err) => {
                        console.error(err);
                        setStatusText("Connection Error");
                        setIsActive(false);
                    }
                }
            });

            sessionRef.current = sessionPromise;

        } catch (err) {
            console.error(err);
            setStatusText("Failed to access microphone or connect.");
            setIsActive(false);
        }
    };

    // Helper functions
    function createBlob(data: Float32Array) {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        const uint8 = new Uint8Array(int16.buffer);
        let binary = '';
        for(let i=0; i<uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        const base64 = btoa(binary);

        return {
            data: base64,
            mimeType: 'audio/pcm;rate=16000',
        };
    }

    function decode(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    }

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-8 animate-fade-in-up">
            <div className="relative mb-8">
                {/* Pulsing Visualizer */}
                <div 
                    className={`w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-300
                    ${isActive ? 'border-anime-pink shadow-[0_0_50px_rgba(255,121,198,0.5)]' : 'border-gray-700 bg-gray-900'}
                    `}
                    style={{ 
                        transform: isActive ? `scale(${1 + Math.min(audioLevel * 0.5, 0.3)})` : 'scale(1)' 
                    }}
                >
                    {isActive ? (
                        <Radio className="w-20 h-20 text-anime-cyan animate-pulse" />
                    ) : (
                        <MicOff className="w-16 h-16 text-gray-500" />
                    )}
                </div>
                
                {/* Orbiting particles */}
                {isActive && (
                    <>
                        <div className="absolute top-0 left-0 w-full h-full animate-spin-slow pointer-events-none">
                            <div className="w-3 h-3 bg-anime-cyan rounded-full absolute top-2 left-1/2 shadow-[0_0_10px_#7aa2f7]"></div>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-full animate-spin-reverse pointer-events-none">
                            <div className="w-3 h-3 bg-anime-pink rounded-full absolute bottom-4 left-1/2 shadow-[0_0_10px_#ff79c6]"></div>
                        </div>
                    </>
                )}
            </div>

            <h2 className="text-2xl font-anime text-white mb-2">{statusText}</h2>
            <p className="text-gray-400 mb-8 text-center max-w-md">
                Talk to Sensei directly using Gemini Live Audio! Ask quick concepts or debugging tips.
            </p>

            <button
                onClick={isActive ? stopSession : startSession}
                className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 active:scale-95
                ${isActive 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-gradient-to-r from-anime-cyan to-anime-pink text-anime-dark shadow-lg shadow-anime-pink/30'
                }`}
            >
                {isActive ? (
                    <>
                        <MicOff size={24} /> End Call
                    </>
                ) : (
                    <>
                        <Mic size={24} /> Start Voice Chat
                    </>
                )}
            </button>
        </div>
    );
};

export default LiveVoice;