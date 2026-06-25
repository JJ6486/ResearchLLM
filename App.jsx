import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Send, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Bot, 
  User, 
  Loader2, 
  X,
  File,
  ZoomIn,
  ZoomOut,
  Network,
  MonitorPlay,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
  ChevronLast,
  ChevronFirst,
  Map,
  BookOpen,
  CheckSquare,
  Rocket // Added Rocket icon for the new feature
} from 'lucide-react';

// Custom PDF Viewer to bypass browser iframe restrictions
const PdfViewer = ({ base64Data }) => {
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.5);

  useEffect(() => {
    if (!window.pdfjsLib || !base64Data) return;
    
    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      window.pdfjsLib.getDocument({ data: bytes }).promise
        .then(pdf => {
          setPdfDoc(pdf);
          setError(null);
        })
        .catch(err => {
          console.error("PDF load error:", err);
          setError("Failed to load PDF.");
        });
    } catch (err) {
      console.error("Base64 decode error:", err);
      setError("Invalid document data.");
    }
  }, [base64Data]);

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    
    let isCancelled = false;

    const renderPages = async () => {
      containerRef.current.innerHTML = ''; // Clear previous renders
      for(let num = 1; num <= pdfDoc.numPages; num++) {
        if (isCancelled) break;
        
        try {
          const page = await pdfDoc.getPage(num);
          const canvas = document.createElement('canvas');
          canvas.className = "shadow-md bg-[#FFF0DC] mb-4 max-w-full h-auto rounded-sm border border-[#F0BB78]";
          
          const context = canvas.getContext('2d');
          const viewport = page.getViewport({ scale: scale }); // Use dynamic scale
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (!isCancelled && containerRef.current) {
            containerRef.current.appendChild(canvas);
            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            await page.render(renderContext).promise;
          }
        } catch (err) {
          console.error(`Error rendering page ${num}:`, err);
        }
      }
    };

    renderPages();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, scale]); // Dynamic scale update

  if (error) {
    return <div className="flex-1 w-full bg-[#FFF0DC] flex items-center justify-center text-rose-500 p-4">{error}</div>;
  }

  return (
    <div className="relative flex-1 w-full bg-[#FFF0DC] overflow-hidden flex flex-col">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center bg-[#FFF0DC] rounded-lg shadow-md border border-[#F0BB78] p-1">
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1.5 hover:bg-[#F0BB78]/30 rounded-md text-[#543A14]"><ZoomOut size={18} /></button>
        <span className="text-xs font-medium px-2 w-12 text-center text-[#131010]">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(4, s + 0.25))} className="p-1.5 hover:bg-[#F0BB78]/30 rounded-md text-[#543A14]"><ZoomIn size={18} /></button>
      </div>
      
      <div ref={containerRef} className="flex-1 w-full overflow-auto flex flex-col items-center p-4">
         {!pdfDoc && (
           <div className="text-[#543A14] mt-10 animate-pulse flex items-center gap-2 font-medium">
             <Loader2 size={16} className="animate-spin" /> Rendering PDF...
           </div>
         )}
      </div>
    </div>
  );
};

// Pan & Zoom Wrapper for Interactive Mindmap
const PanZoomWrapper = ({ children }) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    const scaleAmount = -e.deltaY * 0.001;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(0.15, prev.scale + scaleAmount), 3)
    }));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      className="w-full h-full overflow-hidden bg-[#FFF0DC] cursor-grab active:cursor-grabbing relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-[#FFF0DC]/80 backdrop-blur px-3 py-1.5 rounded-md text-xs font-medium text-[#543A14] shadow-sm border border-[#F0BB78] flex items-center gap-1.5 animate-pulse">
          <MousePointer2 size={14}/> Scroll to zoom, drag to pan
        </div>
      </div>
      <div 
        className="origin-center w-full h-full flex items-center justify-center"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        {children}
      </div>
    </div>
  );
};

// Recursive Mindmap Node - Beautiful interactive design with descriptions
const MindmapNode = ({ node }) => (
  <li>
    <div className="inline-block border border-[#F0BB78] bg-[#FFF0DC] p-3 rounded-xl text-left shadow-md min-w-[180px] max-w-[280px] relative z-10 hover:shadow-lg transition-all text-[#131010] hover:scale-105 duration-200">
      <div className="font-bold text-sm text-[#131010] border-b border-[#F0BB78]/50 pb-1.5 mb-1.5 tracking-tight">
        {node.name}
      </div>
      {node.description && (
        <p className="text-[11px] text-[#543A14] leading-relaxed font-normal">
          {node.description}
        </p>
      )}
    </div>
    {node.children && node.children.length > 0 && (
      <ul>
        {node.children.map((child, i) => <MindmapNode key={i} node={child} />)}
      </ul>
    )}
  </li>
);

// Presentation Slider Viewer
const PresentationViewer = ({ presentation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  if (!presentation || presentation.length === 0) return null;
  
  const slide = presentation[currentSlide];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#131010] p-8 overflow-hidden relative">
      <div className="w-full max-w-4xl aspect-[16/9] bg-[#FFF0DC] rounded-xl shadow-2xl p-10 flex flex-col relative overflow-hidden">
         <h2 className="text-3xl font-bold text-[#131010] mb-8 border-b-2 border-[#F0BB78] pb-4 shrink-0">{slide.title}</h2>
         <ul className="list-disc pl-8 space-y-4 text-xl text-[#543A14] flex-1 overflow-y-auto font-sans leading-relaxed">
           {slide.content?.map((point, i) => <li key={i}>{point}</li>)}
         </ul>
         <div className="absolute bottom-4 left-0 w-full text-center text-sm text-[#543A14]">
            Research LLM • Slide {currentSlide + 1} of {presentation.length}
         </div>
      </div>
      <div className="flex items-center gap-6 mt-6">
         <button disabled={currentSlide === 0} onClick={() => setCurrentSlide(s => s - 1)} className="p-3 bg-[#F0BB78]/20 text-[#F0BB78] rounded-full hover:bg-[#F0BB78]/40 disabled:opacity-30 transition-colors"><ChevronLeft size={24}/></button>
         <span className="text-[#FFF0DC] font-medium">{currentSlide + 1} / {presentation.length}</span>
         <button disabled={currentSlide === presentation.length - 1} onClick={() => setCurrentSlide(s => s + 1)} className="p-3 bg-[#F0BB78]/20 text-[#F0BB78] rounded-full hover:bg-[#F0BB78]/40 disabled:opacity-30 transition-colors"><ChevronRight size={24}/></button>
      </div>
    </div>
  );
};

// Research Learning Roadmap Viewer
const RoadmapViewer = ({ roadmap }) => {
  if (!roadmap || roadmap.length === 0) return null;
  const [completedWeeks, setCompletedWeeks] = useState({});

  const toggleWeek = (weekIndex) => {
    setCompletedWeeks(prev => ({
      ...prev,
      [weekIndex]: !prev[weekIndex]
    }));
  };

  return (
    <div className="w-full h-full bg-[#FFF0DC] overflow-y-auto p-6 flex flex-col select-none">
      <div className="mb-6 flex items-center justify-between border-b border-[#F0BB78]/50 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#131010] flex items-center gap-2">
            <Map className="text-[#543A14]" /> Learning & Research Roadmap
          </h2>
          <p className="text-xs text-[#543A14] mt-1">A step-by-step sequential guideline structured to help students understand this paper completely.</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F0BB78]/20 text-[#543A14]">
          {Object.values(completedWeeks).filter(Boolean).length} / {roadmap.length} Weeks Complete
        </div>
      </div>

      <div className="space-y-8 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F0BB78]">
        {roadmap.map((step, idx) => {
          const isDone = completedWeeks[idx];
          return (
            <div key={idx} className="relative transition-all duration-300">
              {/* Timeline dot */}
              <button 
                onClick={() => toggleWeek(idx)}
                className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#F0BB78] transition-all duration-300 focus:outline-none ${
                  isDone ? 'bg-[#F0BB78] text-[#131010]' : 'bg-[#FFF0DC] text-[#543A14]/40 hover:text-[#543A14]'
                }`}
              >
                <CheckSquare size={12} className={isDone ? 'opacity-100' : 'opacity-0'} />
              </button>

              <div className={`border border-[#F0BB78]/50 rounded-xl p-5 bg-[#FFF0DC] shadow-sm transition-all ${isDone ? 'opacity-60 saturate-50' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0BB78]/30 pb-3 mb-4">
                  <div>
                    <span className="text-xs font-bold text-[#543A14] uppercase tracking-wider">{step.week}</span>
                    <h3 className="text-base font-bold text-[#131010] mt-0.5">{step.theme}</h3>
                  </div>
                  <button 
                    onClick={() => toggleWeek(idx)}
                    className="self-start sm:self-center text-xs px-3 py-1 rounded-md border border-[#F0BB78] hover:bg-[#F0BB78]/10 text-[#543A14]"
                  >
                    {isDone ? 'Mark Incomplete' : 'Complete'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  {/* Weekly Objectives */}
                  <div>
                    <h4 className="font-semibold text-[#131010] mb-2 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-[#543A14]" /> Learning Objectives & Tasks
                    </h4>
                    <ul className="space-y-2 text-[#543A14]">
                      {step.tasks?.map((task, tid) => (
                        <li key={tid} className="flex items-start gap-2">
                          <span className="text-[#F0BB78] font-bold mt-0.5">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Deliverables / Milestones */}
                  <div>
                    <h4 className="font-semibold text-[#131010] mb-2 flex items-center gap-1.5">
                      <CheckSquare size={14} className="text-[#543A14]" /> Expected Deliverables
                    </h4>
                    <ul className="space-y-2 text-[#543A14]">
                      {step.deliverables?.map((del, did) => (
                        <li key={did} className="flex items-start gap-2 bg-[#F0BB78]/10 p-2 rounded-md border border-[#F0BB78]/20">
                          <span className="text-[#543A14] font-bold mt-0.5">✓</span>
                          <span>{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Startup Generator Viewer
const StartupViewer = ({ startup }) => {
  if (!startup) return null;

  return (
    <div className="w-full h-full bg-[#FFF0DC] overflow-y-auto p-6 flex flex-col select-none">
      <div className="mb-6 flex items-center justify-between border-b border-[#F0BB78]/50 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#131010] flex items-center gap-2">
            <Rocket className="text-[#543A14]" /> Paper-to-Startup
          </h2>
          <p className="text-xs text-[#543A14] mt-1">Key startup concepts generated from the research paper.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Value Proposition */}
        <div className="border border-[#F0BB78]/50 rounded-xl p-5 bg-[#FFF0DC] shadow-sm">
           <h3 className="text-sm font-bold text-[#131010] mb-3 border-b border-[#F0BB78]/30 pb-2 uppercase tracking-wide flex items-center gap-2">
               Problem & Solution
           </h3>
           <div className="space-y-4">
               <div>
                   <h4 className="text-xs font-semibold text-[#543A14] mb-1">Problem Statement</h4>
                   <p className="text-sm text-[#131010]">{startup.problem_statement}</p>
               </div>
               <div>
                   <h4 className="text-xs font-semibold text-[#543A14] mb-1">Solution (Product Idea)</h4>
                   <p className="text-sm text-[#131010]">{startup.product_idea}</p>
               </div>
               <div>
                   <h4 className="text-xs font-semibold text-[#543A14] mb-1">Value Proposition</h4>
                   <p className="text-sm text-[#131010]">{startup.value_proposition}</p>
               </div>
           </div>
        </div>

        {/* Market & Strategy */}
        <div className="border border-[#F0BB78]/50 rounded-xl p-5 bg-[#FFF0DC] shadow-sm">
           <h3 className="text-sm font-bold text-[#131010] mb-3 border-b border-[#F0BB78]/30 pb-2 uppercase tracking-wide flex items-center gap-2">
               Market & Business
           </h3>
           <div className="space-y-4">
               <div>
                   <h4 className="text-xs font-semibold text-[#543A14] mb-1">Target Users / Market</h4>
                   <p className="text-sm text-[#131010]">{startup.target_users}</p>
               </div>
               <div>
                   <h4 className="text-xs font-semibold text-[#543A14] mb-1">Potential Competitors / Alternatives</h4>
                   <p className="text-sm text-[#131010]">{startup.competitors}</p>
               </div>
               <div>
                   <h4 className="text-xs font-semibold text-[#543A14] mb-1">Potential Revenue Streams</h4>
                   <ul className="space-y-1">
                      {startup.revenue_streams?.map((stream, idx) => (
                          <li key={idx} className="text-sm text-[#131010] flex items-start gap-2">
                             <span className="text-[#F0BB78] font-bold mt-0.5">•</span>
                             {stream}
                          </li>
                      ))}
                   </ul>
               </div>
           </div>
        </div>

        {/* Development & Next Steps */}
        <div className="border border-[#F0BB78]/50 rounded-xl p-5 bg-[#FFF0DC] shadow-sm md:col-span-2">
           <h3 className="text-sm font-bold text-[#131010] mb-3 border-b border-[#F0BB78]/30 pb-2 uppercase tracking-wide flex items-center gap-2">
               Development
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                   <h4 className="text-xs font-semibold text-[#543A14] mb-1">MVP Features</h4>
                   <ul className="space-y-1">
                      {startup.mvp_features?.map((feature, idx) => (
                          <li key={idx} className="text-sm text-[#131010] flex items-start gap-2">
                             <span className="text-[#F0BB78] font-bold mt-0.5">•</span>
                             {feature}
                          </li>
                      ))}
                   </ul>
               </div>
               <div>
                   <h4 className="text-xs font-semibold text-[#543A14] mb-1">Key Technologies / Resources Needed</h4>
                   <ul className="space-y-1">
                      {startup.technologies?.map((tech, idx) => (
                          <li key={idx} className="text-sm text-[#131010] flex items-start gap-2">
                             <span className="text-[#F0BB78] font-bold mt-0.5">•</span>
                             {tech}
                          </li>
                      ))}
                   </ul>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Reusable tab button to support icon-only base + text on hover feature
const TabButton = ({ tabId, activeTab, setActiveTab, icon: Icon, label }) => {
  const isActive = activeTab === tabId;
  return (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`group flex items-center h-10 px-3 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap border ${
        isActive 
          ? 'bg-[#F0BB78] text-[#131010] border-[#F0BB78] shadow-sm' 
          : 'text-[#543A14] hover:bg-[#F0BB78]/20 border-transparent'
      }`}
    >
      <Icon size={18} className="shrink-0" />
      <span 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isActive 
            ? 'max-w-[150px] ml-2.5 opacity-100' 
            : 'max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-2.5'
        }`}
      >
        {label}
      </span>
    </button>
  );
};

export default function App() {
  // Application State
  const [apiKey, setApiKey] = useState('');
  const [keyStatus, setKeyStatus] = useState('idle'); // idle, testing, valid, invalid
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [activeTab, setActiveTab] = useState('document'); // document, mindmap, presentation, roadmap, startup
  const [isGeneratingFeature, setIsGeneratingFeature] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true); // Added welcome message state
  
  // Chat State
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: 'Hello! I am Research LLM. Upload some research papers and provide your Gemini API key to start asking questions.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isPdfjsLoaded, setIsPdfjsLoaded] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Load PDF.js dynamically to bypass iframe restrictions
  useEffect(() => {
    if (window.pdfjsLib) {
      setIsPdfjsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setIsPdfjsLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Load API Key from LocalStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('research_llm_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      testApiKey(savedKey);
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle API Key Testing & Saving
  const testApiKey = async (keyToTest) => {
    if (!keyToTest) return;
    setKeyStatus('testing');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${keyToTest}`);
      if (response.ok) {
        setKeyStatus('valid');
        localStorage.setItem('research_llm_api_key', keyToTest);
      } else {
        setKeyStatus('invalid');
      }
    } catch (error) {
      setKeyStatus('invalid');
    }
  };

  // Handle File Uploads
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const newDocs = [];

    for (const file of files) {
      if (!['application/pdf', 'text/plain', 'text/markdown'].includes(file.type)) {
        alert(`Unsupported file type: ${file.name}. Please upload PDF, TXT, or MD files.`);
        continue;
      }

      try {
        const objectUrl = URL.createObjectURL(file);
        
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
        });

        let textContent = null;
        if (file.type !== 'application/pdf') {
          textContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsText(file);
          });
        }

        const newDoc = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: file.type,
          size: file.size,
          objectUrl,
          base64Data,
          textContent,
          mindmap: null,
          presentation: null,
          roadmap: null,
          startup: null // added startup field
        };

        newDocs.push(newDoc);
      } catch (err) {
        console.error("Error processing file:", file.name, err);
      }
    }

    if (newDocs.length > 0) {
      setDocuments(prev => [...prev, ...newDocs]);
      if (!selectedDocId) {
        setSelectedDocId(newDocs[0].id);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a document
  const removeDocument = (idToRemove) => {
    setDocuments(prev => {
      const filtered = prev.filter(doc => doc.id !== idToRemove);
      if (selectedDocId === idToRemove) {
        setSelectedDocId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Generate Features (Mindmap / Presentation / Roadmap)
  const handleGenerateFeature = async (type) => {
    if (keyStatus !== 'valid') {
      showToast("Please connect a valid Gemini API Key first.");
      return;
    }
    const selectedDocument = documents.find(d => d.id === selectedDocId);
    if (!selectedDocument) return;

    setIsGeneratingFeature(true);
    try {
      let prompt = "";
      if (type === 'mindmap') {
        prompt = "Extract the core concepts of this document into a structured hierarchical knowledge graph. Return ONLY a valid JSON object with this exact structure: { \"name\": \"Central Topic\", \"description\": \"Minimalist explanation of central topic\", \"children\": [ { \"name\": \"Subtopic 1\", \"description\": \"Minimalist explanation of subtopic 1\", \"children\": [] } ] }";
      } else if (type === 'presentation') {
        prompt = "Create a presentation summarizing this document. Return ONLY a valid JSON array of objects with this exact structure: [ { \"title\": \"Slide 1 Title\", \"content\": [\"Bullet point 1\", \"Bullet point 2\"] } ]";
      } else if (type === 'roadmap') {
        prompt = "Create a structured, logical, weekly learning roadmap (4-week guideline) from this research paper designed for students. Return ONLY a valid JSON array of objects with this exact structure: [ { \"week\": \"Week 1\", \"theme\": \"Theme or Focus of this week\", \"tasks\": [\"Task or objective 1\", \"Task or objective 2\"], \"deliverables\": [\"Expected learning outcome or milestone\"] } ]";
      } else if (type === 'startup') {
        prompt = "Analyze this research paper and extract potential concepts to build a tech startup. Return ONLY a valid JSON object with this exact structure: { \"problem_statement\": \"A 1-2 sentence description of the problem solved by this research.\", \"product_idea\": \"A 1-2 sentence idea for a commercial product/service based on this paper.\", \"value_proposition\": \"The unique value this brings to the market.\", \"target_users\": \"Who would buy or use this product.\", \"competitors\": \"Potential competitors or current alternative solutions.\", \"revenue_streams\": [\"Idea 1\", \"Idea 2\"], \"mvp_features\": [\"Feature 1\", \"Feature 2\"], \"technologies\": [\"Tech 1\", \"Resource 1\"] }";
      }

      const payload = {
        contents: [{
          role: 'user',
          parts: [
            selectedDocument.type === 'application/pdf' 
              ? { inlineData: { mimeType: 'application/pdf', data: selectedDocument.base64Data } }
              : { inlineData: { mimeType: 'text/plain', data: selectedDocument.base64Data } },
            { text: prompt }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Generation failed due to an API error.");
      
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const result = JSON.parse(jsonText);

      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDocId 
          ? { ...doc, [type]: result } 
          : doc
      ));
    } catch (err) {
      console.error(err);
      showToast(`Generation Error: ${err.message || "Failed to process structural response format."}`);
    } finally {
      setIsGeneratingFeature(false);
    }
  };

  // Send Message to Gemini API
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (keyStatus !== 'valid') {
      showToast("Please enter and validate a valid Gemini API Key first.");
      return;
    }
    if (documents.length === 0) {
      showToast("Please upload at least one document to analyze.");
      return;
    }

    const userText = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to UI
    const updatedHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);

    try {
      // 1. Build System Instruction
      const systemInstruction = {
        parts: [{ 
          text: "You are Research LLM, an expert academic and research assistant. Your primary task is to answer the user's questions based strictly on the uploaded documents. If the answer is not contained within the documents, clearly state that, but you may provide general knowledge as a secondary supplement if helpful. Be concise, accurate, and analytical." 
        }]
      };

      // 2. Build Chat History (Format for Gemini API)
      const formattedHistory = updatedHistory.slice(0, -1).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // 3. Build Current Turn with Documents
      const currentUserParts = [];
      
      documents.forEach(doc => {
        if (doc.type === 'application/pdf') {
          currentUserParts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: doc.base64Data
            }
          });
        } else {
          currentUserParts.push({
            inlineData: {
              mimeType: 'text/plain',
              data: doc.base64Data
            }
          });
        }
      });
      
      currentUserParts.push({ text: userText });

      // 4. Construct Final Payload
      const payload = {
        systemInstruction,
        contents: [
          ...formattedHistory,
          { role: 'user', parts: currentUserParts }
        ]
      };

      // 5. Make API Call
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to generate response.");
      }

      const modelText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
      
      setChatHistory(prev => [...prev, { role: 'model', text: modelText }]);

    } catch (error) {
      console.error("Chat Error:", error);
      setChatHistory(prev => [...prev, { role: 'model', text: `❌ Error: ${error.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Basic Markdown Formatter for Chat Bubbles
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i} className="block min-h-[1em]">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-semibold text-[#131010]">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </span>
      );
    });
  };

  const selectedDocument = documents.find(d => d.id === selectedDocId);

  return (
    <div className="flex flex-col h-screen bg-[#FFF0DC] font-sans text-[#131010] relative overflow-hidden">
      
      {/* Welcome Message Modal */}
      {showWelcomeMessage && (
        <div className="absolute inset-0 z-50 bg-[#131010]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFF0DC] border border-[#F0BB78] rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
             <div className="flex items-center justify-center mb-4">
                <div className="bg-[#F0BB78] p-3 rounded-full">
                  <Bot size={32} className="text-[#131010]" />
                </div>
             </div>
             <h2 className="text-2xl font-bold text-center text-[#131010] mb-2">Welcome to Research LLM</h2>
             <p className="text-sm text-[#543A14] text-center mb-6">
                Your AI-powered academic assistant for analyzing and extracting value from research papers.
             </p>
             
             <div className="space-y-3 mb-6">
                 <div className="flex items-start gap-3 bg-[#F0BB78]/10 p-3 rounded-lg border border-[#F0BB78]/30">
                    <Network size={18} className="text-[#543A14] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#131010]"><strong>Mind Maps:</strong> Generate hierarchical knowledge graphs instantly.</p>
                 </div>
                 <div className="flex items-start gap-3 bg-[#F0BB78]/10 p-3 rounded-lg border border-[#F0BB78]/30">
                    <MonitorPlay size={18} className="text-[#543A14] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#131010]"><strong>Presentations:</strong> Convert papers into ready-to-present slide decks.</p>
                 </div>
                 <div className="flex items-start gap-3 bg-[#F0BB78]/10 p-3 rounded-lg border border-[#F0BB78]/30">
                    <Map size={18} className="text-[#543A14] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#131010]"><strong>Roadmaps:</strong> Create week-by-week learning guides for students.</p>
                 </div>
                 <div className="flex items-start gap-3 bg-[#F0BB78]/10 p-3 rounded-lg border border-[#F0BB78]/30">
                    <Rocket size={18} className="text-[#543A14] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#131010]"><strong>Paper-to-Startup:</strong> Extract product ideas and business plans.</p>
                 </div>
             </div>

             <div className="bg-[#131010] text-[#FFF0DC] p-3 rounded-lg mb-6 flex items-start gap-2 shadow-inner">
                <AlertCircle size={16} className="text-[#F0BB78] shrink-0 mt-0.5" />
                <p className="text-xs">
                   <strong>Note:</strong> You need a valid <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#F0BB78] underline">Gemini API Key</a> to use this application. Enter it in the top right corner.
                </p>
             </div>

             <button 
                onClick={() => setShowWelcomeMessage(false)}
                className="w-full bg-[#F0BB78] text-[#131010] py-3 rounded-xl font-bold hover:bg-[#F0BB78]/80 transition-colors shadow-sm"
             >
                Cheers!
             </button>
          </div>
        </div>
      )}

      {/* 5-Second Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-rose-500 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 transition-all">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:bg-rose-600 p-1 rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="h-16 bg-[#FFF0DC] border-b border-[#F0BB78]/50 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#F0BB78] p-1.5 rounded-lg">
            <Bot size={24} className="text-[#131010]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#131010]">Research <span className="text-[#543A14]">LLM</span></h1>
        </div>
        
        <div className="flex items-center gap-3 bg-[#FFF0DC] p-2 rounded-lg border border-[#F0BB78]/50">
          <Settings size={18} className="text-[#543A14]" />
          <input 
            type="password" 
            placeholder="Enter Gemini API Key..."
            className="bg-transparent border-none focus:outline-none text-sm w-64 text-[#131010] placeholder-[#543A14]/60"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setKeyStatus('idle');
            }}
            onKeyDown={(e) => e.key === 'Enter' && testApiKey(apiKey)}
          />
          <button 
            onClick={() => testApiKey(apiKey)}
            disabled={keyStatus === 'valid' || keyStatus === 'testing'}
            className="text-xs bg-[#F0BB78] text-[#131010] border border-[#F0BB78] px-3 py-1.5 rounded-md hover:bg-[#F0BB78]/80 disabled:opacity-80 transition-all font-medium w-[96px]"
          >
            {keyStatus === 'valid' ? 'Connected' : 'Connect'}
          </button>
          
          {/* Status Indicator */}
          <div className="flex items-center justify-center w-6 h-6">
            {keyStatus === 'valid' && <CheckCircle2 size={18} className="text-emerald-600" title="Connected" />}
            {keyStatus === 'invalid' && <AlertCircle size={18} className="text-rose-500" title="Invalid Key" />}
            {keyStatus === 'testing' && <Loader2 size={18} className="text-[#543A14] animate-spin" title="Testing..." />}
            {keyStatus === 'idle' && <div className="w-2.5 h-2.5 rounded-full bg-[#F0BB78]/50" title="Not Connected" />}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Document Manager (Collapsible Sidebar) */}
        <div 
          className={`bg-[#FFF0DC] border-r border-[#F0BB78]/50 flex flex-col shrink-0 transition-all duration-300 relative ${
            isSidebarOpen ? 'w-[240px]' : 'w-[50px]'
          }`}
        >
          {isSidebarOpen ? (
            <>
              {/* Sidebar Header with Toggle button inside */}
              <div className="p-4 border-b border-[#F0BB78]/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#543A14] uppercase tracking-wider">Sources</h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-[#543A14] hover:bg-[#F0BB78]/20 rounded-md transition-colors"
                  title="Collapse Sidebar"
                >
                  <ChevronFirst size={18} />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="p-4 border-b border-[#F0BB78]/50">
                <input 
                  type="file"
                  multiple 
                  accept=".pdf,.txt,.md"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 bg-[#131010] text-[#FFF0DC] py-2.5 px-4 rounded-lg hover:bg-[#131010]/80 transition-colors text-sm font-medium shadow-sm"
                >
                  <Upload size={16} />
                  Upload Documents
                </button>
                <p className="text-xs text-[#543A14]/70 mt-2 text-center">Supports PDF, TXT, MD</p>
              </div>
            
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {documents.length === 0 ? (
                  <div className="text-center text-[#543A14]/50 text-sm mt-10 flex flex-col items-center gap-2">
                    <FileText size={32} className="opacity-40" />
                    <p>No sources uploaded</p>
                  </div>
                ) : (
                  documents.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedDocId === doc.id 
                          ? 'bg-[#F0BB78]/30 border-[#F0BB78] shadow-sm' 
                          : 'bg-[#FFF0DC] border-[#F0BB78]/20 hover:bg-[#F0BB78]/10 hover:border-[#F0BB78]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                        <div className={`p-1.5 rounded-md shrink-0 ${selectedDocId === doc.id ? 'bg-[#F0BB78] text-[#131010]' : 'bg-[#F0BB78]/20 text-[#543A14]'}`}>
                          <File size={16} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className={`text-sm font-medium truncate block w-full ${selectedDocId === doc.id ? 'text-[#131010]' : 'text-[#543A14]'}`}>
                            {doc.name}
                          </span>
                          <span className="text-xs text-[#543A14]/70">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDocument(doc.id);
                        }}
                        className="p-1.5 text-[#543A14]/50 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors shrink-0"
                        title="Remove document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Slim Gemini-Style Sidebar (Closed state) */
            <div className="flex flex-col items-center py-4 gap-4 h-full">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-[#543A14] hover:bg-[#F0BB78]/20 rounded-md transition-colors shadow-sm border border-[#F0BB78]/20"
                title="Expand Sidebar"
              >
                <ChevronLast size={20} />
              </button>
              
              <div className="w-full border-t border-[#F0BB78]/30" />
              
              <div className="flex-1 flex flex-col items-center gap-3 overflow-y-auto w-full px-1">
                {documents.map(doc => (
                  <button 
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-2 rounded-lg relative transition-all ${
                      selectedDocId === doc.id ? 'bg-[#F0BB78] text-[#131010]' : 'bg-transparent text-[#543A14] hover:bg-[#F0BB78]/10'
                    }`}
                    title={doc.name}
                  >
                    <File size={18} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Panel: Document Viewer */}
        <div className="flex-1 bg-[#FFF0DC] flex flex-col min-w-0">
          {selectedDocument ? (
            <div className="flex-1 w-full h-full p-4 overflow-hidden">
              <div className="w-full h-full bg-[#FFF0DC] rounded-xl shadow-sm border border-[#F0BB78]/50 overflow-hidden flex flex-col">
                
                {/* Re-designed Adaptive Tab Switches */}
                <div className="h-12 bg-[#F0BB78]/10 border-b border-[#F0BB78]/50 flex items-center px-2 shrink-0 gap-1 overflow-x-auto select-none">
                  
                  <TabButton 
                    tabId="document" 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    icon={FileText} 
                    label="Document" 
                  />
                  
                  <TabButton 
                    tabId="mindmap" 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    icon={Network} 
                    label="Mind Map" 
                  />
                  
                  <TabButton 
                    tabId="presentation" 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    icon={MonitorPlay} 
                    label="Presentation" 
                  />

                  <TabButton 
                    tabId="roadmap" 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    icon={Map} 
                    label="Roadmap" 
                  />

                  <TabButton 
                    tabId="startup" 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    icon={Rocket} 
                    label="Startup" 
                  />

                  <div className="ml-auto flex items-center pr-2">
                     <span className="text-xs text-[#543A14] font-semibold truncate max-w-[150px]" title={selectedDocument.name}>{selectedDocument.name}</span>
                  </div>
                </div>

                {/* Tab Views */}
                {activeTab === 'document' && (
                  selectedDocument.type === 'application/pdf' ? (
                    isPdfjsLoaded ? (
                      <PdfViewer base64Data={selectedDocument.base64Data} />
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-[#FFF0DC] text-[#543A14] font-medium">
                        <Loader2 className="animate-spin mr-2" size={18} /> Loading Viewer...
                      </div>
                    )
                  ) : (
                    <div className="p-6 overflow-y-auto w-full h-full bg-[#FFF0DC] text-[#131010] font-mono text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedDocument.textContent}
                    </div>
                  )
                )}

                {activeTab === 'mindmap' && (
                  <div className="flex-1 overflow-hidden relative bg-[#FFF0DC] flex flex-col">
                    {!selectedDocument.mindmap ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FFF0DC]">
                         <div className="bg-[#F0BB78]/20 p-4 rounded-full mb-4">
                           <Network size={40} className="text-[#543A14]" />
                         </div>
                         <h3 className="text-lg font-bold text-[#131010] mb-2">Generate a Knowledge Map</h3>
                         <p className="text-sm text-[#543A14] mb-6 max-w-md font-sans leading-relaxed">Let Gemini construct an interactive hierarchical knowledge graph including rich concept summaries directly parsed from this paper.</p>
                         <button 
                           onClick={() => handleGenerateFeature('mindmap')}
                           disabled={isGeneratingFeature}
                           className="flex items-center gap-2 bg-[#F0BB78] text-[#131010] px-5 py-2.5 rounded-lg hover:bg-[#F0BB78]/80 disabled:opacity-50 transition-colors font-medium shadow-sm"
                         >
                           {isGeneratingFeature ? <><Loader2 size={18} className="animate-spin" /> Synthesizing Graph...</> : <><Network size={18} /> Generate Knowledge Graph</>}
                         </button>
                      </div>
                    ) : (
                      <PanZoomWrapper>
                        {/* Custom visual lines style for knowledge map */}
                        <style>{`
                          .css-tree ul { padding-top: 24px; position: relative; display: flex; justify-content: center; }
                          .css-tree li { float: left; text-align: center; list-style-type: none; position: relative; padding: 24px 8px 0 8px; }
                          .css-tree li::before, .css-tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid #F0BB78; width: 50%; height: 24px; }
                          .css-tree li::after { right: auto; left: 50%; border-left: 2px solid #F0BB78; }
                          .css-tree li:only-child::after, .css-tree li:only-child::before { display: none; }
                          .css-tree li:only-child { padding-top: 0; }
                          .css-tree li:first-child::before, .css-tree li:last-child::after { border: 0 none; }
                          .css-tree li:last-child::before { border-right: 2px solid #F0BB78; border-radius: 0 6px 0 0; }
                          .css-tree li:first-child::after { border-radius: 6px 0 0 0; }
                          .css-tree ul ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #F0BB78; width: 0; height: 24px; }
                        `}</style>
                        <div className="css-tree p-10 select-none">
                           <ul>
                             <MindmapNode node={selectedDocument.mindmap} />
                           </ul>
                        </div>
                      </PanZoomWrapper>
                    )}
                  </div>
                )}

                {activeTab === 'presentation' && (
                  <div className="flex-1 overflow-hidden relative bg-[#FFF0DC] flex flex-col">
                    {!selectedDocument.presentation ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FFF0DC]">
                         <div className="bg-[#F0BB78]/20 p-4 rounded-full mb-4">
                           <MonitorPlay size={40} className="text-[#543A14]" />
                         </div>
                         <h3 className="text-lg font-bold text-[#131010] mb-2">Generate Presentation</h3>
                         <p className="text-sm text-[#543A14] mb-6 max-w-md leading-relaxed">Transform this research paper into a structured, ready-to-present slide deck highlighting key findings.</p>
                         <button 
                           onClick={() => handleGenerateFeature('presentation')}
                           disabled={isGeneratingFeature}
                           className="flex items-center gap-2 bg-[#F0BB78] text-[#131010] px-5 py-2.5 rounded-lg hover:bg-[#F0BB78]/80 disabled:opacity-50 transition-colors font-medium shadow-sm"
                         >
                           {isGeneratingFeature ? <><Loader2 size={18} className="animate-spin" /> Synthesizing...</> : <><MonitorPlay size={18} /> Generate Deck</>}
                         </button>
                      </div>
                    ) : (
                      <PresentationViewer presentation={selectedDocument.presentation} />
                    )}
                  </div>
                )}

                {activeTab === 'roadmap' && (
                  <div className="flex-1 overflow-hidden relative bg-[#FFF0DC] flex flex-col">
                    {!selectedDocument.roadmap ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FFF0DC]">
                         <div className="bg-[#F0BB78]/20 p-4 rounded-full mb-4">
                           <Map size={40} className="text-[#543A14]" />
                         </div>
                         <h3 className="text-lg font-bold text-[#131010] mb-2">Generate Week-wise Roadmap</h3>
                         <p className="text-sm text-[#543A14] mb-6 max-w-md leading-relaxed">Create a comprehensive weekly curriculum summary tailored to guide students in reading and analyzing this specific publication step-by-step.</p>
                         <button 
                           onClick={() => handleGenerateFeature('roadmap')}
                           disabled={isGeneratingFeature}
                           className="flex items-center gap-2 bg-[#F0BB78] text-[#131010] px-5 py-2.5 rounded-lg hover:bg-[#F0BB78]/80 disabled:opacity-50 transition-colors font-medium shadow-sm"
                         >
                           {isGeneratingFeature ? <><Loader2 size={18} className="animate-spin" /> Structuring Curriculum...</> : <><Map size={18} /> Generate Student Roadmap</>}
                         </button>
                      </div>
                    ) : (
                      <RoadmapViewer roadmap={selectedDocument.roadmap} />
                    )}
                  </div>
                )}

                {activeTab === 'startup' && (
                  <div className="flex-1 overflow-hidden relative bg-[#FFF0DC] flex flex-col">
                    {!selectedDocument.startup ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FFF0DC]">
                         <div className="bg-[#F0BB78]/20 p-4 rounded-full mb-4">
                           <Rocket size={40} className="text-[#543A14]" />
                         </div>
                         <h3 className="text-lg font-bold text-[#131010] mb-2">Paper-to-Startup</h3>
                         <p className="text-sm text-[#543A14] mb-6 max-w-md leading-relaxed">Extract potential product ideas, target markets, value propositions, and MVP features to build a startup based on this research.</p>
                         <button 
                           onClick={() => handleGenerateFeature('startup')}
                           disabled={isGeneratingFeature}
                           className="flex items-center gap-2 bg-[#F0BB78] text-[#131010] px-5 py-2.5 rounded-lg hover:bg-[#F0BB78]/80 disabled:opacity-50 transition-colors font-medium shadow-sm"
                         >
                           {isGeneratingFeature ? <><Loader2 size={18} className="animate-spin" /> Analyzing Potential...</> : <><Rocket size={18} /> Generate Startup Plan</>}
                         </button>
                      </div>
                    ) : (
                      <StartupViewer startup={selectedDocument.startup} />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#543A14]">
              <div className="bg-[#F0BB78]/20 p-6 rounded-full mb-4 animate-bounce">
                <FileText size={48} className="text-[#543A14]" />
              </div>
              <h3 className="text-lg font-semibold text-[#131010]">Document Viewer</h3>
              <p className="text-sm">Select a document from the left panel to view it here.</p>
            </div>
          )}
        </div>

        {/* Right Panel: Chatbot */}
        <div className="w-[290px] bg-[#FFF0DC] border-l border-[#F0BB78]/50 flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)]">
          
          <div className="p-4 border-b border-[#F0BB78]/50 bg-[#FFF0DC] z-10 shadow-sm shrink-0 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#543A14] animate-pulse" />
            <h2 className="font-semibold text-[#131010]">Research Assistant</h2>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#FFF0DC]">
            {chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${
                  msg.role === 'user' ? 'bg-[#131010] text-[#FFF0DC]' : 'bg-[#F0BB78] text-[#131010]'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                </div>
                
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#131010] text-[#FFF0DC] rounded-tr-sm' 
                    : 'bg-[#FFF0DC] border border-[#F0BB78] text-[#131010] rounded-tl-sm'
                }`}>
                  {msg.role === 'model' ? formatText(msg.text) : <span className="whitespace-pre-wrap">{msg.text}</span>}
                </div>
              </div>
            ))}
            
            {isChatLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F0BB78] text-[#131010] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot size={18} />
                </div>
                <div className="bg-[#FFF0DC] border border-[#F0BB78] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#543A14] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-[#543A14] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-[#543A14] rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-[#FFF0DC] border-t border-[#F0BB78]/50 shrink-0">
            <div className="flex items-end gap-2 bg-[#FFF0DC] border border-[#F0BB78] rounded-xl p-1.5 focus-within:border-[#543A14] focus-within:ring-1 focus-within:ring-[#543A14] transition-all shadow-sm">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={documents.length === 0 ? "Upload documents first..." : "Ask about your documents..."}
                disabled={documents.length === 0 || isChatLoading}
                className="w-full max-h-32 min-h-[44px] bg-transparent border-none resize-none focus:outline-none p-3 text-sm text-[#131010] disabled:opacity-50 placeholder-[#543A14]/50"
                rows={1}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || documents.length === 0 || isChatLoading}
                className="mb-1 mr-1 p-2 bg-[#F0BB78] text-[#131010] rounded-lg hover:bg-[#F0BB78]/80 disabled:bg-[#F0BB78]/30 disabled:text-[#543A14]/50 transition-all shrink-0 shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-2">
               <span className="text-[10px] text-[#543A14]">Powered by Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
