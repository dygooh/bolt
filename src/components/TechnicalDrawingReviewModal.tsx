import React, { useState } from 'react';
import { TechnicalDrawing, Proposal, Quote } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, FileText, Download, CheckCircle, XCircle } from 'lucide-react';

interface TechnicalDrawingReviewModalProps {
  drawing: TechnicalDrawing;
  onClose: () => void;
  onReviewed: () => void;
}

const TechnicalDrawingReviewModal: React.FC<TechnicalDrawingReviewModalProps> = ({ 
  drawing, 
  onClose, 
  onReviewed 
}) => {
  const { user } = useAuth();
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get related data
  const proposals = JSON.parse(localStorage.getItem('proposals') || '[]');
  const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
  const proposal = proposals.find((p: Proposal) => p.id === drawing.proposalId);
  const quote = quotes.find((q: Quote) => q.id === proposal?.quoteId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision || !user) return;

    setIsSubmitting(true);

    const updatedDrawing: TechnicalDrawing = {
      ...drawing,
      status: decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy: user.id,
      rejectionReason: decision === 'rejected' ? rejectionReason : undefined
    };

    // Update technical drawings
    const existingDrawings = JSON.parse(localStorage.getItem('technicalDrawings') || '[]');
    const updatedDrawings = existingDrawings.map((d: TechnicalDrawing) => 
      d.id === drawing.id ? updatedDrawing : d
    );
    localStorage.setItem('technicalDrawings', JSON.stringify(updatedDrawings));

    // Update proposal with technical drawing status
    const updatedProposals = proposals.map((p: Proposal) => 
      p.id === drawing.proposalId 
        ? { ...p, technicalDrawing: updatedDrawing }
        : p
    );
    localStorage.setItem('proposals', JSON.stringify(updatedProposals));

    setIsSubmitting(false);
    onReviewed();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Revisar Desenho Técnico</h2>
            <p className="text-sm text-gray-600 mt-1">{quote?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Quote and Proposal Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Informações da Proposta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Orçamento:</span>
                  <p className="text-gray-900">{quote?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Fornecedor:</span>
                  <p className="text-gray-900">
                    {proposal?.supplierType === 'knife' ? 'Fornecedor de Facas' : 'Fornecedor de Clichês'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Valor da Proposta:</span>
                  <p className="text-gray-900 font-bold text-green-600">
                    R$ {proposal?.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Enviado em:</span>
                  <p className="text-gray-900">
                    {new Date(drawing.submittedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              {proposal?.observations && (
                <div className="mt-3">
                  <span className="font-medium text-gray-600">Observações da Proposta:</span>
                  <p className="text-gray-900 mt-1">{proposal.observations}</p>
                </div>
              )}
            </div>

            {/* Technical Drawing File */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Desenho Técnico Enviado</h3>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{drawing.file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(drawing.file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(drawing.file.url, '_blank')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Visualizar/Baixar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Review Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Decisão da Revisão</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approved"
                      checked={decision === 'approved'}
                      onChange={(e) => setDecision(e.target.value as 'approved')}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="font-medium text-green-800">Aprovar Desenho</span>
                      <p className="text-sm text-gray-600">O desenho técnico está correto e aprovado</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="rejected"
                      checked={decision === 'rejected'}
                      onChange={(e) => setDecision(e.target.value as 'rejected')}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <span className="font-medium text-red-800">Rejeitar Desenho</span>
                      <p className="text-sm text-gray-600">O desenho precisa de correções</p>
                    </div>
                  </label>
                </div>
              </div>

              {decision === 'rejected' && (
                <div>
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Rejeição *
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Descreva o que precisa ser corrigido no desenho técnico..."
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !decision || (decision === 'rejected' && !rejectionReason.trim())}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Revisão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalDrawingReviewModal;