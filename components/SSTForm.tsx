
import React, { useState } from 'react';
import { WorkType, WorkStage } from '../types';

interface SSTFormProps {
  onAnalyze: (metadata: { type: WorkType; stage: WorkStage; location: string; date: string }) => void;
  isLoading: boolean;
}

export const SSTForm: React.FC<SSTFormProps> = ({ onAnalyze, isLoading }) => {
  const [formData, setFormData] = useState({
    type: 'residencial' as WorkType,
    stage: 'estrutura' as WorkStage,
    location: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b pb-2">Contexto da Vistoria</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase">Tipo de Obra</label>
          <select 
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as WorkType})}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="residencial">Residencial</option>
            <option value="comercial">Comercial</option>
            <option value="industrial">Industrial</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase">Etapa Atual</label>
          <select 
            value={formData.stage}
            onChange={(e) => setFormData({...formData, stage: e.target.value as WorkStage})}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="fundação">Fundação</option>
            <option value="estrutura">Estrutura</option>
            <option value="alvenaria">Alvenaria</option>
            <option value="acabamento">Acabamento</option>
            <option value="cobertura">Cobertura</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Local/Endereço</label>
          <input 
            type="text"
            placeholder="Ex: Canteiro Norte - Bloco A"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Data da Vistoria</label>
          <input 
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <p className="text-[10px] text-slate-400 italic">Preencha os dados acima para enriquecer a precisão do laudo técnico gerado pela IA.</p>
    </form>
  );
};
