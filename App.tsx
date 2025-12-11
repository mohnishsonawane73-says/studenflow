import React, { useState } from 'react';
import { QuestionState, SolutionData, AppStatus } from './types';
import { solveQuestion } from './services/geminiService';
import InputSection from './components/InputSection';
import SolutionDisplay from './components/SolutionDisplay';
import Mascot from './components/Mascot';
import LiveVoice from './components/LiveVoice';
import ChatInterface from './components/ChatInterface';
import { Terminal, MessageSquare, Mic, PenTool, LayoutGrid } from 'lucide-react';

type Tab = 'solver' | 'chat' | 'voice';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('solver');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [questionState, setQuestionState] = useState<QuestionState>({
    text: '',
    image: null,
    imagePreview: null
  });
  const [solutionData, setSolutionData] = useState<SolutionData | null>(null);

  const handleSubmit = async () => {
    if (!questionState.text && !questionState.image) return;

    setStatus(AppStatus.LOADING);
    setSolutionData(null);

    try {
      const data = await solveQuestion(questionState.text, questionState.image);
      setSolutionData(data);
      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-body bg-[#0f111a] text-gray-200 selection:bg-anime-pink selection:text-white relative overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-anime-purple/10 blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-anime-cyan/10 blur-[120px]"></div>
         <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-anime-pink/5 blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="bg-[#13141f]/80 backdrop-blur-lg border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('solver')}>
            <div className="bg-gradient-to-br from-anime-pink to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-300">
              <Terminal className="text-white w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-anime font-bold text-white tracking-tight">
                StudenFlow
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI Study Companion</p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 bg-black/20 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
             {[
               { id: 'solver', icon: PenTool, label: 'Solver' },
               { id: 'chat', icon: MessageSquare, label: 'Chat' },
               { id: 'voice', icon: Mic, label: 'Live' }
             ].map((tab) => (
               <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                    ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-lg border border-white/10' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
               >
                  <tab.icon size={16} className={activeTab === tab.id ? 'text-anime-cyan' : ''} />
                  {tab.label}
               </button>
             ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center relative z-10">
        
        {activeTab === 'solver' && (
            <div className="w-full max-w-5xl">
                {/* Intro / Mascot Area */}
                <section className="text-center mb-10">
                    <Mascot status={status} />
                    {status === AppStatus.IDLE && (
                        <div className="mt-6 space-y-2">
                             <h2 className="text-4xl md:text-6xl font-anime font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-sm">
                                Ace Your Code.
                            </h2>
                            <p className="text-gray-400 text-lg">Upload screenshots or paste errors. Sensei fixes it instantly.</p>
                        </div>
                    )}
                </section>

                {/* Input */}
                <InputSection 
                    state={questionState}
                    setState={setQuestionState}
                    onSubmit={handleSubmit}
                    status={status}
                />

                {/* Results */}
                {solutionData && status === AppStatus.SUCCESS && (
                    <SolutionDisplay 
                        data={solutionData} 
                        originalQuestion={questionState.text || "Image Question"}
                    />
                )}
            </div>
        )}

        {activeTab === 'chat' && (
            <div className="w-full flex flex-col items-center">
                <div className="mb-4 text-center">
                    <h2 className="text-3xl font-anime font-bold text-white">Sensei Chat</h2>
                    <p className="text-gray-400 text-sm mt-1">Ask questions, search the web, or debug logic.</p>
                </div>
                <ChatInterface />
            </div>
        )}

        {activeTab === 'voice' && (
            <div className="w-full mt-4">
                 <div className="mb-8 text-center">
                    <h2 className="text-3xl font-anime font-bold text-white">Live Session</h2>
                    <p className="text-gray-400 text-sm mt-1">Real-time voice conversation with low latency.</p>
                </div>
                <LiveVoice />
            </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#13141f] border-t border-white/5 mt-auto py-8">
        <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center gap-6 mb-4 opacity-50">
                <LayoutGrid size={20} />
                <Terminal size={20} />
                <Mic size={20} />
            </div>
            <p className="text-gray-500 text-sm font-medium">Powered by Google Gemini 3.0 Pro & 2.5 Flash</p>
            <p className="text-gray-600 text-xs mt-2">© 2025 StudenFlow AI. Built for the Cyber Academy.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;