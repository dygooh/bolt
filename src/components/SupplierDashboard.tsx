import React, { useState, useEffect } from 'react';
import { Quote, Proposal, TechnicalDrawing } from '../types';
import { useAuth } from '../context/AuthContext';
import { FileText, Clock, CheckCircle, XCircle, Upload, Eye, AlertCircle, Send } from 'lucide-react';
import { apiService } from '../services/api';
import QuoteDetailsModal from './QuoteDetailsModal';

const SupplierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState<number | null>(null);
  const [showTechnicalUpload, setShowTechnicalUpload] = useState<number | null>(null);
  const [proposalData, setProposalData] = useState({
    value: '',
    observations: ''
  });
  const [technicalFile, setTechnicalFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setIsLoading(true);
      const quotesData = await apiService.getQuotes();
      setQuotes(quotesData);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

  const handleCreateProposal = async (quoteId: number) => {
    if (!proposalData.value.trim()) return;

    setIsSubmitting(true);

    try {
      await apiService.createProposal({
        quoteId,
        value: parseFloat(proposalData.value),
        observations: proposalData.observations
      });

      setProposalData({ value: '', observations: '' });
      setShowProposalForm(null);
      loadQuotes();
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Erro ao enviar proposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadTechnicalDrawing = async (proposalId: number) => {
    if (!technicalFile) return;

    setIsSubmitting(true);

    try {
      await apiService.uploadTechnicalDrawing(proposalId, technicalFile);
      setTechnicalFile(null);
      setShowTechnicalUpload(null);
      loadQuotes();
    } catch (error) {
      console.error('Error uploading technical drawing:', error);
      alert('Erro ao enviar desenho técnico');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSupplierTypeText = () => {
    return user?.role === 'knife-supplier' ? 'Facas' : 'Clichês';
  };

  const getSupplierIcon = () => {
    return user?.role === 'knife-supplier' ? '🔧' : '🎨';
  };

  const getMyProposal = (quote: Quote) => {
    return quote.proposals?.find(p => p.supplierId === user?.id);
  };

  const canCreateProposal = (quote: Quote) => {
    const myProposal = getMyProposal(quote);
    return quote.status === 'pending' && !myProposal;
  };

  const getQuoteStatusForSupplier = (quote: Quote) => {
    const myProposal = getMyProposal(quote);
    
    if (quote.status === 'pending') {
      return myProposal ? 'Proposta Enviada' : 'Aguardando Proposta';
    }
    
    if (quote.status === 'approved') {
      if (myProposal?.status === 'approved') {
        return 'Proposta Aprovada';
      }
      return 'Não Selecionado';
    }
    
    return 'Concluído';
  };

  const getStatusColor = (quote: Quote) => {
    const myProposal = getMyProposal(quote);
    
    if (quote.status === 'pending') {
      return myProposal ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
    }
    
    if (quote.status === 'approved') {
      if (myProposal?.status === 'approved') {
        return 'bg-green-100 text-green-800';
      }
      return 'bg-red-100 text-red-800';
    }
    
    return 'bg-gray-100 text-gray-800';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{getSupplierIcon()}</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard - {getSupplierTypeText()}</h1>
          <p className="text-gray-600 mt-1">Gerencie suas propostas e orçamentos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
              <p className="text-gray-600">Orçamentos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {quotes.filter(q => q.status === 'pending' && !getMyProposal(q)).length}
              </p>
              <p className="text-gray-600">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {quotes.filter(q => getMyProposal(q)?.status === 'approved').length}
              </p>
              <p className="text-gray-600">Aprovados</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {quotes.filter(q => getMyProposal(q)).length}
              </p>
              <p className="text-gray-600">Propostas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Orçamentos Disponíveis</h2>
        </div>
        <div className="p-6">
          {quotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum orçamento disponível no momento</p>
              <p className="text-sm text-gray-400 mt-1">
                Novos orçamentos aparecerão aqui quando estiverem disponíveis
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => {
                const myProposal = getMyProposal(quote);
                return (
                  <div key={quote.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{quote.quoteNumber} - {quote.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Criado em {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote)}`}>
                          {getQuoteStatusForSupplier(quote)}
                        </span>
                        <button
                          onClick={() => handleViewQuote(quote)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      {quote.materialType && (
                        <span>Material: {getMaterialTypeLabel(quote.materialType)}</span>
                      )}
                      {quote.knifeType && (
                        <span>Faca: {getKnifeTypeLabel(quote.knifeType)}</span>
                      )}
                    </div>

                    {quote.observations && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <strong>Observações:</strong> {quote.observations}
                        </p>
                      </div>
                    )}

                    {myProposal && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-gray-700">Sua Proposta:</p>
                        <p className="text-lg font-bold text-green-600">
                          R$ {myProposal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {myProposal.observations && (
                          <p className="text-sm text-gray-600 mt-1">
                            Obs: {myProposal.observations}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Proposal Form */}
                    {showProposalForm === quote.id && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-3">
                        <h4 className="font-medium text-blue-900 mb-3">Criar Proposta</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-blue-800 mb-1">
                              Valor (R$) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={proposalData.value}
                              onChange={(e) => setProposalData(prev => ({ ...prev, value: e.target.value }))}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0,00"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-800 mb-1">
                              Observações
                            </label>
                            <textarea
                              value={proposalData.observations}
                              onChange={(e) => setProposalData(prev => ({ ...prev, observations: e.target.value }))}
                              rows={3}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              placeholder="Informações adicionais sobre sua proposta..."
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setShowProposalForm(null)}
                              className="px-3 py-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleCreateProposal(quote.id)}
                              disabled={isSubmitting || !proposalData.value.trim()}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              {isSubmitting ? 'Enviando...' : 'Enviar Proposta'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      {canCreateProposal(quote) && (
                        <button
                          onClick={() => setShowProposalForm(quote.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Enviar Proposta
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showDetailsModal && selectedQuote && (
        <QuoteDetailsModal
          quote={selectedQuote}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedQuote(null);
          }}
        />
      )}
    </div>
  );
};

export default SupplierDashboard;