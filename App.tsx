
import React, { useState, useEffect, useRef } from 'react';
import { TechnicalReport, AppState } from './types';
import { FileUpload } from './components/FileUpload';
import { ReportView } from './components/ReportView';
import { SSTForm } from './components/SSTForm';
import { analyzeConstructionSite } from './services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    reports: [],
    isAnalyzing: false,
    error: null
  });

  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [activeReport, setActiveReport] = useState<TechnicalReport | null>(null);
  const [isPrintingId, setIsPrintingId] = useState<string | null>(null);
  
  // Ref para renderização oculta de impressão
  const printRef = useRef<HTMLDivElement>(null);
  const [reportToPrint, setReportToPrint] = useState<TechnicalReport | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sst_reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, reports: parsed }));
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
      }
    }
  }, []);

  // Save to localStorage whenever reports change
  useEffect(() => {
    localStorage.setItem('sst_reports', JSON.stringify(state.reports));
  }, [state.reports]);

  const handleImagesSelected = (images: string[]) => {
    setCurrentImages(images);
    setState(prev => ({ ...prev, error: null }));
  };

  const handleStartAnalysis = async (metadata: any) => {
    if (currentImages.length === 0) {
      setState(prev => ({ ...prev, error: "Por favor, selecione ao menos uma foto primeiro." }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
      const report = await analyzeConstructionSite(currentImages, metadata);
      setState(prev => ({
        ...prev,
        reports: [report, ...prev.reports],
        isAnalyzing: false
      }));
      setActiveReport(report);
      setCurrentImages([]);
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: err.message || "Ocorreu um erro inesperado na análise."
      }));
    }
  };

  const handlePrintHistoryReport = async (report: TechnicalReport) => {
    setIsPrintingId(report.id);
    setReportToPrint(report);
    
    // Pequeno delay para garantir que o React renderizou o componente oculto
    setTimeout(async () => {
      if (!printRef.current) {
        setIsPrintingId(null);
        return;
      }

      try {
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`RELATORIO_SST_${report.id.substring(0, 8)}.pdf`);
      } catch (error) {
        console.error('Erro ao gerar PDF do histórico:', error);
        alert('Erro ao gerar PDF.');
      } finally {
        setIsPrintingId(null);
        setReportToPrint(null);
      }
    }, 500);
  };

  const clearHistory = () => {
    if (window.confirm("Deseja realmente apagar todo o histórico de laudos?")) {
      setState(prev => ({ ...prev, reports: [] }));
      setActiveReport(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Container Oculto para Impressão */}
      <div className="absolute opacity-0 pointer-events-none -z-50 overflow-hidden h-0">
        {reportToPrint && (
          <div ref={printRef}>
            <ReportView report={reportToPrint} hidePrintButton={true} />
          </div>
        )}
      </div>

      {/* Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter uppercase leading-none">SST Vision Pro</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Inteligência Operacional</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => { setActiveReport(null); setCurrentImages([]); }}
              className="text-sm font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest"
            >
              Novo Laudo
            </button>
            <div className="h-4 w-px bg-slate-700 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Engineers v3.0</span>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {!activeReport ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Input */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">ANÁLISE DE CAMPO</h2>
                  <p className="text-slate-500 mt-2">Envie as evidências fotográficas para que a IA gere o laudo técnico automático baseado nas NRs do MTE.</p>
                </div>

                <FileUpload onImagesSelected={handleImagesSelected} isLoading={state.isAnalyzing} />

                {currentImages.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Fotos Selecionadas ({currentImages.length})</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {currentImages.map((img, i) => (
                        <div key={i} className="relative group shrink-0">
                          <img src={img} className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                          <button 
                            onClick={() => setCurrentImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {state.error && (
                  <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {state.error}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Sidebar */}
            <div className="lg:col-span-5 space-y-6">
              <SSTForm 
                onAnalyze={handleStartAnalysis} 
                isLoading={state.isAnalyzing} 
              />

              <button
                disabled={state.isAnalyzing || currentImages.length === 0}
                onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                className={`
                  w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-3
                  ${state.isAnalyzing || currentImages.length === 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] shadow-blue-500/25'}
                `}
              >
                {state.isAnalyzing ? 'Processando NRs...' : 'Gerar Laudo Técnico'}
                {!state.isAnalyzing && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                )}
              </button>

              {/* History */}
              <div className="bg-slate-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold uppercase tracking-tighter text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Histórico Recente
                  </h3>
                  {state.reports.length > 0 && (
                    <button onClick={clearHistory} className="text-[10px] text-slate-500 hover:text-rose-400 font-bold uppercase">Limpar</button>
                  )}
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {state.reports.length === 0 ? (
                    <div className="text-center py-10 opacity-30">
                      <p className="text-slate-400 text-xs font-bold uppercase">Nenhum laudo gerado</p>
                    </div>
                  ) : (
                    state.reports.map((report) => (
                      <div 
                        key={report.id}
                        onClick={() => setActiveReport(report)}
                        className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 cursor-pointer transition-all group relative"
                      >
                        <div className="flex justify-between items-start mb-1 pr-10">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{report.id.substring(0, 8)}</span>
                          <span className={`w-2 h-2 rounded-full ${report.indicadores.conformidade_geral >= 80 ? 'bg-emerald-500' : report.indicadores.conformidade_geral >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                        </div>
                        <p className="text-white font-bold text-xs truncate capitalize">{report.identificacao.tipo_obra} - {report.identificacao.responsavel}</p>
                        <p className="text-slate-500 text-[10px] mt-1">{new Date(report.data).toLocaleDateString('pt-BR')}</p>
                        
                        {/* Botão de Impressão Direta */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintHistoryReport(report);
                          }}
                          disabled={isPrintingId === report.id}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-700 hover:bg-blue-600 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Imprimir RELATÓRIO DE INSPEÇÃO SST"
                        >
                          {isPrintingId === report.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={() => setActiveReport(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold uppercase text-xs mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Voltar para Painel
            </button>
            <ReportView report={activeReport} />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2024 SST VISION PRO - TECNOLOGIA APLICADA À SEGURANÇA</p>
          <div className="flex gap-4">
             <span className="text-[10px] font-black text-slate-300 uppercase">ISO 45001 COMPLIANCE</span>
             <span className="text-[10px] font-black text-slate-300 uppercase">NR-18 CERTIFIED</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
