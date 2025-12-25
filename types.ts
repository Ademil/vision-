
export type RiskGrade = 'baixo' | 'médio' | 'alto' | 'crítico';
export type WorkType = 'residencial' | 'comercial' | 'industrial' | 'outro';
export type WorkStage = 'fundação' | 'estrutura' | 'alvenaria' | 'acabamento' | 'cobertura';

export interface Irregularidade {
  item_numero: number;
  titulo: string;
  nr_referencia: string;
  risco_detalhado: string;
  acao_corretiva: string;
  x_percent: number; // Posição horizontal (0-100)
  y_percent: number; // Posição vertical (0-100)
}

export interface TechnicalReport {
  id: string;
  data: string;
  identificacao: {
    tipo_obra: string;
    data_analise: string;
    foto_referencia: string;
    responsavel: string;
  };
  indicadores: {
    conformidade_geral: number;
    prevencao_riscos: number;
  };
  parecer_ia: string;
  irregularidades: Irregularidade[];
  conclusao: {
    avaliacao_geral: string;
    continuidade: boolean;
    interdicao: 'nenhuma' | 'parcial' | 'total';
  };
  imagens: string[];
}

export interface AppState {
  reports: TechnicalReport[];
  isAnalyzing: boolean;
  error: string | null;
}
