
import { GoogleGenAI, Type } from "@google/genai";
import { TechnicalReport } from "../types";

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    identificacao: {
      type: Type.OBJECT,
      properties: {
        tipo_obra: { type: Type.STRING },
        data_analise: { type: Type.STRING },
        foto_referencia: { type: Type.STRING },
        responsavel: { type: Type.STRING }
      },
      required: ["tipo_obra", "data_analise", "foto_referencia", "responsavel"]
    },
    indicadores: {
      type: Type.OBJECT,
      properties: {
        conformidade_geral: { type: Type.NUMBER },
        prevencao_riscos: { type: Type.NUMBER }
      },
      required: ["conformidade_geral", "prevencao_riscos"]
    },
    parecer_ia: { type: Type.STRING },
    irregularidades: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item_numero: { type: Type.NUMBER },
          titulo: { type: Type.STRING },
          nr_referencia: { type: Type.STRING },
          risco_detalhado: { type: Type.STRING },
          acao_corretiva: { type: Type.STRING },
          x_percent: { type: Type.NUMBER, description: "Coordenada X do risco na imagem (0-100)" },
          y_percent: { type: Type.NUMBER, description: "Coordenada Y do risco na imagem (0-100)" }
        },
        required: ["item_numero", "titulo", "nr_referencia", "risco_detalhado", "acao_corretiva", "x_percent", "y_percent"]
      }
    },
    conclusao: {
      type: Type.OBJECT,
      properties: {
        avaliacao_geral: { type: Type.STRING },
        continuidade: { type: Type.BOOLEAN },
        interdicao: { type: Type.STRING, enum: ["nenhuma", "parcial", "total"] }
      },
      required: ["avaliacao_geral", "continuidade", "interdicao"]
    }
  },
  required: ["id", "identificacao", "indicadores", "parecer_ia", "irregularidades", "conclusao"]
};

export async function analyzeConstructionSite(
  images: string[],
  metadata: { type?: string; stage?: string; location?: string; date?: string }
): Promise<TechnicalReport> {
  // Inicialização direta usando a chave de ambiente conforme diretrizes
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = images.map(base64 => {
    const parts = base64.split(',');
    const data = parts.length > 1 ? parts[1] : parts[0];
    return {
      inlineData: {
        data: data,
        mimeType: "image/jpeg"
      }
    };
  });

  const prompt = `
    Você é um Engenheiro de Segurança do Trabalho sênior especializado em auditorias de canteiros de obras (NR-18, NR-35, NR-10, NR-12, NR-06).
    
    TAREFA: Analise as fotos anexadas e identifique riscos ocupacionais e não conformidades normativas.
    
    PARA CADA IRREGULARIDADE:
    - Identifique o ponto exato na PRIMEIRA imagem onde a falha ocorre.
    - Atribua coordenadas (x_percent, y_percent) de 0 a 100.
    
    ESTRUTURA DO LAUDO (JSON):
    1. Identificação completa.
    2. Indicadores de conformidade (0-100%).
    3. Parecer técnico detalhado citando as NRs.
    4. Lista de irregularidades numeradas com: Título, NR específica (ex: NR-35.4.1), Risco detalhado, Ação Corretiva imediata e Coordenadas X/Y.
    5. Conclusão sobre a continuidade da frente de trabalho.

    DADOS DO PROJETO:
    - Obra: ${metadata.type || 'Construção Civil'}
    - Etapa: ${metadata.stage || 'Não especificada'}
    - Local: ${metadata.location || 'Canteiro de obras'}
    - Data: ${metadata.date || new Date().toLocaleDateString('pt-BR')}

    Responda apenas em formato JSON válido.
  `;

  try {
    // Usando gemini-3-pro-preview para raciocínio complexo de engenharia e segurança
    // Adicionado thinkingBudget para estabilizar a resposta em análises profundas
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [...imageParts, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        thinkingConfig: { thinkingBudget: 8192 } // Proporciona espaço para o raciocínio técnico
      }
    });

    const text = response.text;
    if (!text) throw new Error("A IA retornou uma resposta vazia.");

    const report = JSON.parse(text) as TechnicalReport;
    report.data = new Date().toISOString();
    report.imagens = images;
    
    if (!report.id) report.id = `SST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return report;
  } catch (error: any) {
    console.error("Erro na análise do Gemini:", error);
    
    // Tratamento específico para erros de RPC/Conexão
    if (error.message?.includes("Rpc failed") || error.message?.includes("xhr error")) {
      throw new Error("Ocorreu um erro de comunicação com o servidor de IA (RPC Error). Tente reduzir o número de imagens ou o tamanho dos arquivos.");
    }
    
    throw new Error(error.message || "Falha na análise técnica. Verifique sua conexão e tente novamente.");
  }
}
