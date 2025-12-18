
import React, { useState, useRef, useEffect } from 'react';
import { ArtStyle, StyleOption, TextReplacement, EntityModification } from './types';
import { STYLE_OPTIONS } from './constants';
import { StyleCard } from './components/StyleCard';
import { transformImage, detectTextInImage, detectEntitiesInImage } from './services/geminiService';

const App: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>(STYLE_OPTIONS[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [textReplacements, setTextReplacements] = useState<TextReplacement[]>([]);
  const [entityModifications, setEntityModifications] = useState<EntityModification[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setOriginalImage(base64);
        setTransformedImage(null);
        setTextReplacements([]);
        setEntityModifications([]);
        setError(null);
        
        // Automatically analyze image (Text + Entities)
        setIsAnalyzing(true);
        try {
          const [texts, entities] = await Promise.all([
            detectTextInImage(base64),
            detectEntitiesInImage(base64)
          ]);
          
          setTextReplacements(texts.map(t => ({ original: t, replacement: t })));
          setEntityModifications(entities.map(e => ({ entity: e, instruction: "" })));
        } catch (err) {
          console.error("Analysis Error:", err);
          // Set some defaults if analysis fails
          setEntityModifications([
            { entity: "人物", instruction: "" },
            { entity: "背景", instruction: "" }
          ]);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTransform = async () => {
    if (!originalImage) {
      setError("请先上传一张图片");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await transformImage(
        originalImage, 
        selectedStyle, 
        customPrompt, 
        textReplacements,
        entityModifications
      );
      setTransformedImage(result);
    } catch (err: any) {
      setError(err.message || "转换失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextReplacementChange = (index: number, val: string) => {
    const newReplacements = [...textReplacements];
    newReplacements[index].replacement = val;
    setTextReplacements(newReplacements);
  };

  const handleEntityModChange = (index: number, val: string) => {
    const newMods = [...entityModifications];
    newMods[index].instruction = val;
    setEntityModifications(newMods);
  };

  const handleDownload = () => {
    if (!transformedImage) return;
    const link = document.createElement('a');
    link.href = transformedImage;
    link.download = `ArtShift-${selectedStyle.id}-${Date.now()}.png`;
    link.click();
  };

  const reset = () => {
    setOriginalImage(null);
    setTransformedImage(null);
    setTextReplacements([]);
    setEntityModifications([]);
    setCustomPrompt("");
    setError(null);
  };

  const CUSTOM_STYLE: StyleOption = {
    id: ArtStyle.CUSTOM,
    label: '自定义风格',
    icon: '✍️',
    description: '手动输入您想要的艺术描述',
    prompt: ''
  };

  return (
    <div className="futuristic-container flex flex-col">
      <div className="bottom-glow"></div>
      <div className="grid-perspective"></div>
      <div className="scanline"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <span className="text-2xl">🍄</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">设计风格迁移 <span className="text-blue-500 font-black">AI</span></h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400/60 font-semibold leading-none">Visionary Style Transformer</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={reset}
            className="text-sm px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all active:scale-95 hover:border-blue-500/30"
          >
            重置
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Editor */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 min-h-[450px] md:min-h-[550px] rounded-[2.5rem] bg-slate-900/40 backdrop-blur-md border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
            {!originalImage ? (
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-24 h-24 rounded-3xl bg-slate-800/80 flex items-center justify-center mb-8 text-4xl group-hover:scale-110 group-hover:bg-blue-600/20 transition-all duration-500 shadow-inner">
                  📸
                </div>
                <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">上传影像</h2>
                <p className="text-slate-400 mb-10 max-w-sm leading-relaxed">
                  将您的瞬间交由 AI 重新诠释。<br/>自动识别海报文字与人物背景，一键深度定制。
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.5)] active:scale-95 text-lg"
                >
                  即刻开启
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col md:flex-row gap-6 p-6">
                <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/5 bg-black/40 shadow-inner">
                  <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-xl px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 text-slate-300">
                    Source Input
                  </div>
                </div>

                { (transformedImage || isLoading) && (
                  <div className="flex-1 relative rounded-3xl overflow-hidden border border-blue-500/40 bg-blue-900/10 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.15)]">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-5">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse"></div>
                        </div>
                        <p className="text-sm font-bold tracking-widest uppercase animate-pulse text-blue-400">AI Rendering...</p>
                      </div>
                    ) : (
                      <>
                        <img src={transformedImage!} alt="Transformed" className="w-full h-full object-contain" />
                        <div className="absolute top-4 left-4 bg-blue-600 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 shadow-lg">
                          Result Output
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Style Selector & Advanced Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/5 h-full flex flex-col shadow-2xl overflow-hidden relative max-h-[90vh]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full"></div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              {/* SECTION 1: Style Selection */}
              <h3 className="text-sm font-bold mb-4 flex items-center gap-3 text-white uppercase tracking-widest opacity-80">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">01</span> 艺术图谱
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[...STYLE_OPTIONS, CUSTOM_STYLE].map((style) => (
                  <StyleCard 
                    key={style.id} 
                    style={style} 
                    isSelected={selectedStyle.id === style.id}
                    onSelect={setSelectedStyle}
                  />
                ))}
              </div>

              {selectedStyle.id === ArtStyle.CUSTOM && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                   <h3 className="text-sm font-bold mb-3 flex items-center gap-3 text-white uppercase tracking-widest opacity-80">
                    自定义描述
                  </h3>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="例如：'霓虹闪烁的未来城市，宫崎骏清新画风'..."
                    className="w-full h-24 bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              )}

              {originalImage && (
                <>
                  {/* SECTION 2: Text Recognition */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-3 text-white uppercase tracking-widest opacity-80">
                      <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">02</span> 文字修改
                    </h3>
                    
                    {isAnalyzing ? (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-xs text-slate-400">正在分析海报文字...</span>
                      </div>
                    ) : textReplacements.length > 0 ? (
                      <div className="space-y-3">
                        {textReplacements.map((tr, idx) => (
                          <div key={idx} className="flex flex-col gap-1 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all">
                            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">识别文字: "{tr.original}"</label>
                            <input 
                              type="text"
                              value={tr.replacement}
                              onChange={(e) => handleTextReplacementChange(idx, e.target.value)}
                              placeholder="输入新文字..."
                              className="bg-transparent border-none text-sm text-blue-300 focus:outline-none placeholder:text-slate-700"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                        <span className="text-xs text-slate-500">未检测到明显的排版文字</span>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: Entity Modification */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-3 text-white uppercase tracking-widest opacity-80">
                      <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">03</span> 人物与背景智能修改
                    </h3>
                    
                    {isAnalyzing ? (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-xs text-slate-400">识别主体中...</span>
                      </div>
                    ) : entityModifications.length > 0 ? (
                      <div className="space-y-3">
                        {entityModifications.map((em, idx) => (
                          <div key={idx} className="flex flex-col gap-1 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all">
                            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">识别到: {em.entity}</label>
                            <input 
                              type="text"
                              value={em.instruction}
                              onChange={(e) => handleEntityModChange(idx, e.target.value)}
                              placeholder={`想对 ${em.entity} 做什么修改？`}
                              className="bg-transparent border-none text-sm text-indigo-300 focus:outline-none placeholder:text-slate-700"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                        <span className="text-xs text-slate-500">无法识别具体主体</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 space-y-4 border-t border-white/5 mt-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  ⚠️ {error}
                </div>
              )}

              <button 
                onClick={handleTransform}
                disabled={isLoading || !originalImage}
                className={`w-full py-4 rounded-2xl font-black text-lg items-center justify-center gap-3 transition-all shadow-2xl flex ${
                  isLoading || !originalImage 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-600/40 hover:-translate-y-1 active:translate-y-0 text-white'
                }`}
              >
                {isLoading ? '创作中...' : '生成艺术设计'}
                {!isLoading && <span className="text-xl">✨</span>}
              </button>

              {transformedImage && !isLoading && (
                <button 
                  onClick={handleDownload}
                  className="w-full py-4 rounded-2xl font-bold text-base bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  导出成品图 📥
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 text-center relative z-10">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
          © 2024 设计风格迁移 AI · Multimedia Engine v3.5
        </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.4); }
      `}</style>
    </div>
  );
};

export default App;
