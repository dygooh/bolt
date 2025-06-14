import React, { useState, useEffect } from 'react';
import { Quote, Proposal, TechnicalDrawing } from '../types';
import { useAuth } from '../context/AuthContext';
import { FileText, Clock, CheckCircle, XCircle, Upload, Eye, AlertCircle, Send } from 'lucide-react';
import CreateProposalModal from './CreateProposalModal';
import QuoteDetailsModal from './QuoteDetailsModal';
import TechnicalDrawingUploadModal from './TechnicalDrawingUploadModal';

const SupplierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [technicalDrawings, setTechnicalDrawings] = useState<TechnicalDrawing[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTechnicalUpload, setShowTechnicalUpload] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedQuotes = localStorage.getItem('quotes');
    const savedProposals = localStorage.getItem('proposals');
    const savedDrawings = localStorage.getItem('technicalDrawings');
    
    if (savedQuotes) {
      const allQuotes: Quote[] = JSON.parse(savedQuotes);
      // Filter quotes based on supplier type
      const supplierType = user?.role === 'knife-supplier' ? 'knife' : 'die';
      const filteredQuotes = allQuotes.filter(quote => {
        // Don't show archived quotes
        if (quote.isArchived) return false;
        
        // Show quote if it matches this supplier type AND
        // either it's pending or this supplier was approved
        if (quote.supplierType !== supplierType) return false;
        
        if (quote.status === 'pending') return true;
        
        if (quote.status === 'approved') {
          const myProposal = JSON.parse(savedProposals || '[]').find(
            (p: Proposal) => p.quoteId === quote.id && p.supplierType === supplierType
          );
          return myProposal && myProposal.status === 'approved';
        }
        
        return false;
      });
      
      setQuotes(filteredQuotes);
    }
    
    if (savedProposals) {
      const allProposals: Proposal[] = JSON.parse(savedProposals);
      const supplierType = user?.role === 'knife-supplier' ? 'knife' : 'die';
      const myProposals = allProposals.filter(p => p.supplierType === supplierType);
      setProposals(myProposals);
    }

    if (savedDrawings) {
      setTechnicalDrawings(JSON.parse(savedDrawings));
    }
  };

  const handleCreateProposal = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowProposalModal(true);
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

  const handleUploadTechnicalDrawing = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowTechnicalUpload(true);
  };

  const handleProposalCreated = () => {
    loadData();
    setShowProposalModal(false);
    setSelectedQuote(null);
  };

  const handleTechnicalDrawingUploaded = () => {
    loadData();
    setShowTechnicalUpload(false);
    setSelectedProposal(null);
  };

  const getMyProposal = (quoteId: string) => {
    return proposals.find(p => p.quoteId === quoteId);
  };

  const getSupplierTypeText = () => {
    return user?.role === 'knife-supplier' ? 'Facas' : 'Clichês';
  };

  const getSupplierIcon = () => {
    return user?.role === 'knife-supplier' ? '🔧' : '🎨';
  };

  const canCreateProposal = (quote: Quote) => {
    const myProposal = getMyProposal(quote.id);
    return quote.status === 'pending' && !myProposal;
  };

  const canUploadTechnicalDrawing = (proposal: Proposal) => {
    return proposal.status === 'approved' && !proposal.technicalDrawing;
  };

  const getQuoteStatusForSupplier = (quote: Quote) => {
    const myProposal = getMyProposal(quote.id);
    
    if (quote.status === 'pending') {
      return myProposal ? 'Proposta Enviada' : 'Aguardando Proposta';
    }
    
    if (quote.status === 'approved') {
      if (myProposal?.status === 'approved') {
        if (!myProposal.technicalDrawing) {
          return 'Aguardando Desenho Técnico';
        } else if (myProposal.technicalDrawing.status === 'pending') {
          return 'Aguardando Verificação do Desenho';
        } else if (myProposal.technicalDrawing.status === 'approved') {
          return 'Desenho Aprovado';
        } else if (myProposal.technicalDrawing.status === 'rejected') {
          return 'Desenho Rejeitado';
        }
      }
      return 'Não Selecionado';
    }
    
    return 'Concluído';
  };

  const getStatusColor = (quote: Quote) => {
    const myProposal = getMyProposal(quote.id);
    
    if (quote.status === 'pending') {
      return myProposal ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
    }
    
    if (quote.status === 'approved') {
      if (myProposal?.status === 'approved') {
        if (!myProposal.technicalDrawing) {
          return 'bg-orange-100 text-orange-800';
        } else if (myProposal.technicalDrawing.status === 'pending') {
          return 'bg-blue-100 text-blue-800';
        } else if (myProposal.technicalDrawing.status === 'approved') {
          return 'bg-green-100 text-green-800';
        } else if (myProposal.technicalDrawing.status === 'rejected') {
          return 'bg-red-100 text-red-800';
        }
      }
      return 'bg-red-100 text-red-800';
    }
    
    return 'bg-gray-100 text-gray-800';
  };

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'micro-ondulado': return 'Micro Ondulado';
      case 'onda-t': return 'Onda T';
      case 'onda-b': return 'Onda B';
      case 'onda-tt': return 'Onda TT';
      case 'onda-bc': return 'Onda BC';
      default: return type;
    }
  };

  const getKnifeTypeLabel = (type: string) => {
    switch (type) {
      case 'rotativa': return 'Rotativa';
      case 'plana': return 'Plana';
      case 'ambos': return 'Ambos';
      default: return type;
    }
  };

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
                {quotes.filter(q => q.status === 'pending' && !getMyProposal(q.id)).length}
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
                {proposals.filter(p => p.status === 'approved').length}
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
              <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
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
                const myProposal = getMyProposal(quote.id);
                return (
                  <div key={quote.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{quote.name}</h3>
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
                      <span>Material: {getMaterialTypeLabel(quote.materialType)}</span>
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

                    {quote.files.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <strong>Arquivos anexados:</strong> {quote.files.length} arquivo(s)
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
                        
                        {/* Technical Drawing Status */}
                        {myProposal.status === 'approved' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {!myProposal.technicalDrawing ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-orange-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm font-medium">Desenho técnico necessário</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-700">Desenho Técnico:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    myProposal.technicalDrawing.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                    myProposal.technicalDrawing.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {myProposal.technicalDrawing.status === 'pending' ? 'Aguardando Verificação' :
                                     myProposal.technicalDrawing.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                  </span>
                                </div>
                                {myProposal.technicalDrawing.status === 'rejected' && myProposal.technicalDrawing.rejectionReason && (
                                  <div className="bg-red-50 p-2 rounded text-sm">
                                    <p className="font-medium text-red-800">Motivo da rejeição:</p>
                                    <p className="text-red-700">{myProposal.technicalDrawing.rejectionReason}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      {canCreateProposal(quote) && (
                        <button
                          onClick={() => handleCreateProposal(quote)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Enviar Proposta
                        </button>
                      )}
                      {myProposal && canUploadTechnicalDrawing(myProposal) && (
                        <button
                          onClick={() => handleUploadTechnicalDrawing(myProposal)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center space-x-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>Enviar Desenho Técnico</span>
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

      {showProposalModal && selectedQuote && (
        <CreateProposalModal
          quote={selectedQuote}
          onClose={() => {
            setShowProposalModal(false);
            setSelectedQuote(null);
          }}
          onProposalCreated={handleProposalCreated}
        />
      )}

      {showDetailsModal && selectedQuote && (
        <QuoteDetailsModal
          quote={selectedQuote}
          proposals={proposals.filter(p => p.quoteId === selectedQuote.id)}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedQuote(null);
          }}
        />
      )}

      {showTechnicalUpload && selectedProposal && (
        <TechnicalDrawingUploadModal
          proposal={selectedProposal}
          onClose={() => {
            setShowTechnicalUpload(false);
            setSelectedProposal(null);
          }}
          onUploaded={handleTechnicalDrawingUploaded}
        />
      )}
    </div>
  );
};

export default SupplierDashboard;