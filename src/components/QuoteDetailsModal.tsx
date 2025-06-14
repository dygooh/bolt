import React from 'react';
import { Quote } from '../types';
import { X, FileText, Download, Calendar, User } from 'lucide-react';
import { apiService } from '../services/api';

interface QuoteDetailsModalProps {
  quote: Quote;
  onClose: () => void;
}

const QuoteDetailsModal: React.FC<QuoteDetailsModalProps> = ({ quote, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'completed':
        return 'Concluído';
      default:
        return 'Desconhecido';
    }
  };

  const getMaterialTypeLabel = (type?: string) => {
    if (!type) return '';
    switch (type) {
      case 'micro-ondulado': return 'Micro Ondulado';
      case 'onda-t': return 'Onda T';
      case 'onda-b': return 'Onda B';
      case 'onda-c': return 'Onda C';
      case 'onda-tt': return 'Onda TT';
      case 'onda-bc': return 'Onda BC';
      default: return type;
    }
  };

  const getKnifeTypeLabel = (type?: string) => {
    if (!type) return '';
    switch (type) {
      case 'plana': return 'Plana';
      case 'rotativa': return 'Rotativa';
      case 'rotativa-plana': return 'Rotativa e Plana';
      default: return type;
    }
  };

  const getSupplierTypeLabel = (type: string) => {
    return type === 'knife' ? 'Facas' : 'Clichês';
  };

  const handleDownloadFile = (filename: string) => {
    window.open(apiService.getFileUrl(filename), '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">#{quote.quoteNumber} - {quote.name}</h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
                {getStatusText(quote.status)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quote Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações do Orçamento</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Tipo de Fornecedor:</span>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      quote.supplierType === 'knife' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getSupplierTypeLabel(quote.supplierType)}
                    </span>
                  </div>
                </div>
                {quote.materialType && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tipo de Material:</span>
                    <p className="mt-1 text-sm text-gray-800">{getMaterialTypeLabel(quote.materialType)}</p>
                  </div>
                )}
                {quote.knifeType && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tipo de Faca:</span>
                    <p className="mt-1 text-sm text-gray-800">{getKnifeTypeLabel(quote.knifeType)}</p>
                  </div>
                )}
                {quote.observations && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Observações:</span>
                    <p className="mt-1 text-sm text-gray-800">{quote.observations}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Files */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Arquivos Anexados</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {quote.originalFilePath && (
                    <div className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{quote.originalFileName}</p>
                          <p className="text-xs text-gray-500">Arquivo original</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(quote.originalFilePath)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {quote.correctionFilePath && (
                    <div className="flex items-center justify-between bg-white p-3 rounded border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{quote.correctionFileName}</p>
                          <p className="text-xs text-orange-600">Arquivo de correção</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(quote.correctionFilePath!)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Proposals */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Propostas Recebidas ({quote.proposals?.length || 0})
            </h3>
            {!quote.proposals || quote.proposals.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhuma proposta recebida ainda</p>
                <p className="text-sm text-gray-500 mt-1">
                  Os fornecedores receberão acesso para enviar suas propostas
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {quote.proposals.map((proposal) => (
                  <div key={proposal.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {proposal.supplierName} ({proposal.supplierCompany})
                        </h4>
                        <p className="text-sm text-gray-600">
                          Enviado em {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                        {getStatusText(proposal.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Valor Proposto:</span>
                        <p className="text-lg font-bold text-green-600">
                          R$ {proposal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {proposal.observations && (
                      <div className="mt-3">
                        <span className="text-sm font-medium text-gray-600">Observações:</span>
                        <p className="text-sm text-gray-800 mt-1">{proposal.observations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailsModal;