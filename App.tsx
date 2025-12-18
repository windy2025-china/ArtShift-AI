
import React, { useState, useRef, useEffect } from 'react';
import { ArtStyle, StyleOption, TextReplacement, EntityModification, HistoryItem, AspectRatio } from './types';
import { STYLE_OPTIONS, ASPECT_RATIOS } from './constants';
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
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  
  const [textReplacements, setTextReplacements] = useState<TextReplacement[]>([]);
  const [entityModifications, setEntityModifications] = useState<EntityModification[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化加载历史记录和教程
  useEffect(() => {
    const savedHistory = localStorage.getItem('art_shift_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const tutorialDone = localStorage.getItem('tutorial_done');
    if (!tutorialDone) setShowTutorial(true);
  }, []);

  const saveToHistory = (transformed: string) => {
    if (!originalImage) return;
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      originalUrl: originalImage,
      transformedUrl: transformed,
      styleLabel: selectedStyle.label,
      timestamp: Date.now()
    };
    const updatedHistory = [newItem, ...history].slice(0, 10); // 只保留最近10条
    setHistory(updatedHistory);
    localStorage.setItem('art_shift_history', JSON.stringify(updatedHistory));
  };

  const getFriendlyErrorMessage = (err: any): string => {
    const message = err?.message || String(err);
    if (message.includes('SAFETY')) return "内容识别受限：由于安全策略，无法处理。请尝试简化要求。";
    if (message.includes('RESOURCE_EXHAUSTED')) return "请求过于频繁，请稍后再试。";
    return "转换失败，请检查网络或更换图片重试。";
  };

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
        
        setIsAnalyzing(true);
        try {
          const [texts, entities] = await Promise.all([
            detectTextInImage(base64),
            detectEntitiesInImage(base64)
          ]);
          setTextReplacements(texts.map(t => ({ original: t, replacement: t })));
          setEntityModifications(entities.map(e => ({ entity: e, instruction: "" })));
        } catch (err) {
          setEntityModifications([{ entity: "人物", instruction: "" }, { entity: "背景", instruction: "" }]);
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
      // 在此处可以增加根据 aspectRatio 进行 Canvas 裁剪的逻辑
      // 为简化演示，这里直接传递原图，但在提示词中加入尺寸说明
      const sizeHint = aspectRatio !== 'original' ? ` 请将构图调整为 ${aspectRatio} 比例。` : '';
      const result = await transformImage(
        originalImage, 
        selectedStyle, 
        customPrompt + sizeHint, 
        textReplacements,
        entityModifications,
        aspectRatio !== 'original' ? aspectRatio : undefined
      );
      setTransformedImage(result);
      saveToHistory(result);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Fix: Added handleDownload function to resolve 'Cannot find name handleDownload' error
  const handleDownload = () => {
    if (!transformedImage) return;
    const link = document.createElement('a');
    link.href = transformedImage;
    link.download = `art-shift-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorial_done', 'true');
  };

  const tutorialSteps = [
    { title: "👋 欢迎使用", content: "AI 艺术转换器可以将您的照片一键转变为多种艺术风格。", target: "header" },
    { title: "📸 第一步：上传", content: "点击中间的虚线区域上传您的照片。系统会自动分析图片中的文字和主体。", target: "uploader" },
    { title: "🎨 第二步：选择风格", content: "在右侧面板选择您喜欢的艺术风格，如赛博朋克或文艺复兴。", target: "styles" },
    { title: "✨ 第三步：深度定制", content: "您可以修改识别出的文字，或对特定人物/背景下达指令。", target: "custom" },
    { title: "🚀 完成", content: "点击下方的“生成艺术设计”按钮，稍等片刻即可获得杰作！", target: "action" }
  ];

  return (
    <div className="futuristic-container flex flex-col min-h-screen">
      <div className="bottom-glow"></div>
      <div className="grid-perspective"></div>
      <div className="scanline"></div>

      {/* 教程弹窗 */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-blue-500/30 rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">{tutorialSteps[tutorialStep].title}</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">{tutorialSteps[tutorialStep].content}</p>
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {tutorialSteps.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === tutorialStep ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                ))}
              </div>
              <button 
                onClick={() => tutorialStep < tutorialSteps.length - 1 ? setTutorialStep(s => s + 1) : finishTutorial()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all"
              >
                {tutorialStep === tutorialSteps.length - 1 ? "开启创作" : "下一步"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 页眉 */}
      <header className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <span className="text-2xl">🍄</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">AI 艺术设计空间</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowTutorial(true)} className="text-xs text-slate-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-full">帮助教程</button>
          <button onClick={() => { localStorage.removeItem('art_shift_history'); setHistory([]); }} className="text-xs text-slate-400 hover:text-white transition-colors">清除历史</button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 min-h-[450px] rounded-[2.5rem] bg-slate-900/40 backdrop-blur-md border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            {!originalImage ? (
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-20 h-20 rounded-3xl bg-slate-800/80 flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-all">📸</div>
                <h2 className="text-2xl font-bold mb-2 text-white">点击上传图片</h2>
                <p className="text-slate-400 mb-8 max-w-xs text-sm">支持 JPG, PNG 格式，AI 将自动分析画面</p>
                <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg active:scale-95">选择文件</button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col p-6">
                <div className="flex flex-wrap gap-2 mb-4 bg-black/30 p-2 rounded-2xl border border-white/5">
                  {ASPECT_RATIOS.map(ratio => (
                    <button 
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${aspectRatio === ratio.value ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                  <div className="flex-1 relative rounded-3xl overflow-hidden bg-black/40 border border-white/5">
                    <img src={originalImage} alt="原图" className="w-full h-full object-contain" />
                  </div>
                  {(transformedImage || isLoading) && (
                    <div className="flex-1 relative rounded-3xl overflow-hidden border border-blue-500/40 bg-blue-900/10 flex items-center justify-center">
                      {isLoading ? (
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-xs text-blue-400 font-bold tracking-widest uppercase">AI 绘制中...</p>
                        </div>
                      ) : (
                        <img src={transformedImage!} alt="结果" className="w-full h-full object-contain animate-in fade-in duration-1000" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 历史记录栏 */}
          {history.length > 0 && (
            <div className="bg-slate-900/40 backdrop-blur-md rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-sm font-bold text-white/60 mb-4 uppercase tracking-widest">最近创作历史</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {history.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => { setTransformedImage(item.transformedUrl); setOriginalImage(item.originalUrl); }}
                    className="flex-shrink-0 group relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500 transition-all"
                  >
                    <img src={item.transformedUrl} alt="历史" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] text-white font-bold">{item.styleLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：控制面板 */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/5 h-full flex flex-col shadow-2xl relative overflow-hidden">
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-3 text-white opacity-80 uppercase tracking-widest">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">01</span> 风格画廊
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {STYLE_OPTIONS.map((style) => (
                  <StyleCard key={style.id} style={style} isSelected={selectedStyle.id === style.id} onSelect={setSelectedStyle} />
                ))}
              </div>

              {originalImage && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-3 text-white opacity-80 uppercase tracking-widest">
                      <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">02</span> 文字智能替换
                    </h3>
                    {isAnalyzing ? (
                      <div className="h-20 flex items-center justify-center bg-white/5 rounded-2xl animate-pulse"><span className="text-xs text-slate-500">文字识别中...</span></div>
                    ) : textReplacements.length > 0 ? (
                      <div className="space-y-2">
                        {textReplacements.map((tr, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                            <label className="text-[10px] text-slate-500 mb-1 block">原词: "{tr.original}"</label>
                            <input value={tr.replacement} onChange={(e) => {
                              const newR = [...textReplacements]; newR[idx].replacement = e.target.value; setTextReplacements(newR);
                            }} className="bg-transparent text-sm text-blue-300 w-full focus:outline-none" />
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-slate-500 text-center py-4 bg-white/5 rounded-2xl">未识别到排版文字</p>}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-3 text-white opacity-80 uppercase tracking-widest">
                      <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">03</span> 主体个性化修改
                    </h3>
                    {isAnalyzing ? (
                      <div className="h-20 flex items-center justify-center bg-white/5 rounded-2xl animate-pulse"><span className="text-xs text-slate-500">分析主体中...</span></div>
                    ) : entityModifications.map((em, idx) => (
                      <div key={idx} className="mb-2 p-3 rounded-2xl bg-white/5 border border-white/5">
                        <label className="text-[10px] text-slate-500 mb-1 block">对象: {em.entity}</label>
                        <input value={em.instruction} onChange={(e) => {
                          const newE = [...entityModifications]; newE[idx].instruction = e.target.value; setEntityModifications(newE);
                        }} placeholder="例如：换成红色、增加光效..." className="bg-transparent text-sm text-indigo-300 w-full focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 mt-4 border-t border-white/5">
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">{error}</div>}
              <button 
                onClick={handleTransform}
                disabled={isLoading || !originalImage}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                  isLoading || !originalImage ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:-translate-y-1'
                }`}
              >
                {isLoading ? '生成中...' : '开始艺术魔法 ✨'}
              </button>
              {transformedImage && !isLoading && (
                <button onClick={handleDownload} className="w-full mt-3 py-3 rounded-2xl font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all text-sm">
                  下载高清作品 📥
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">AI 艺术设计空间 · 版权所有 © 2024</p>
      </footer>
    </div>
  );
};

export default App;
