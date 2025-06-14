import React, { useState, useEffect } from 'react';
import { Quote, Proposal, TechnicalDrawing } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, FileText, Clock, CheckCircle, Eye, Upload, X, Edit2, Trash2, Users, AlertCircle, Download, DollarSign } from 'lucide-react';
import { apiService } from '../services/api';
import CreateQuoteModal from './CreateQuoteModal';
import QuoteDetailsModal from './QuoteDetailsModal';
import EditQuoteModal from './EditQuoteModal';
import UserManagementModal from './UserManagementModal';
import TechnicalDrawingReviewModal from './TechnicalDrawingReviewModal';
import FinancialReportModal from './FinancialReportModal';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pendingDrawings, setPendingDrawings] = useState<TechnicalDrawing[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showTechnicalReview, setShowTechnicalReview] = useState(false);
  const [showFinancialReport, setShowFinancialReport] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<TechnicalDrawing | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [quotesData, drawingsData] = await Promise.all([
        apiService.getQuotes(),
        apiService.getPendingTechnicalDrawings()
      ]);
      
      setQuotes(quotesData);
      setPendingDrawings(drawingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuoteCreated = () => {
    loadData();
    setShowCreateModal(false);
  };

  const handleQuoteUpdated = () => {
    loadData();
    setShowEditModal(false);
    setSelectedQuote(null);
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowEditModal(true);
  };

  const handleDeleteQuote = async (quote: Quote) => {
    if (window.confirm(`Tem certeza que deseja excluir o orçamento #${quote.quoteNumber} - ${quote.name}? Esta ação não pode ser desfeita.`)) {
      try {
        await apiService.deleteQuote(quote.id);
        loadData();
      } catch (error) {
        console.error('Error deleting quote:', error);
        alert('Erro ao excluir orçamento');
      }
    }
  };

  const handleReviewTechnicalDrawing = (drawing: TechnicalDrawing) => {
    setSelectedDrawing(drawing);
    setShowTechnicalReview(true);
  };

  const handleDrawingReviewed = () => {
    loadData();
    setShowTechnicalReview(false);
    setSelectedDrawing(null);
  };

  const handleApproveProposal = async (quoteId: number, proposalId: number) => {
    if (window.confirm('Tem certeza que deseja aprovar esta proposta? Esta ação é irreversível.')) {
      try {
        await apiService.approveProposal(quoteId, proposalId);
        loadData();
      } catch (error) {
        console.error('Error approving proposal:', error);
        alert('Erro ao aprovar proposta');
      }
    }
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">Gerencie orçamentos e propostas</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFinancialReport(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <DollarSign className="w-5 h-5" />
            <span>Relatório Financeiro</span>
          </button>
          <button
            onClick={() => setShowUserManagement(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Users className="w-5 h-5" />
            <span>Gerenciar Usuários</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Orçamento</span>
          </button>
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
              <p className="text-gray-600">Total de Orçamentos</p>
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
                {quotes.filter(q => q.status === 'pending').length}
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
                {quotes.filter(q => q.status === 'approved').length}
              </p>
              <p className="text-gray-600">Aprovados</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingDrawings.length}</p>
              <p className="text-gray-600">Desenhos Pendentes</p>
            </div>
          </div>
        </div>
      </div>

      {pendingDrawings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-800">Desenhos Técnicos Pendentes de Revisão</h3>
          </div>
          <div className="space-y-2">
            {pendingDrawings.map((drawing) => (
              <div key={drawing.id} className="flex justify-between items-center bg-white p-3 rounded border">
                <div>
                  <p className="font-medium text-gray-900">#{drawing.quoteNumber} - {drawing.quoteName}</p>
                  <p className="text-sm text-gray-600">
                    {drawing.supplierName} ({drawing.supplierCompany}) - 
                    Enviado em {new Date(drawing.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => handleReviewTechnicalDrawing(drawing)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Revisar Desenho
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Orçamentos</h2>
        </div>
        <div className="p-6">
          {quotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum orçamento criado</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Criar primeiro orçamento
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{quote.quoteNumber} - {quote.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Criado em {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                        {quote.createdByName && ` por ${quote.createdByName}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
                        {getStatusText(quote.status)}
                      </span>
                      <button
                        onClick={() => handleViewQuote(quote)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Visualizar detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditQuote(quote)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar orçamento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuote(quote)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir orçamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>Tipo: {getSupplierTypeLabel(quote.supplierType)}</span>
                    {quote.materialType && (
                      <span>Material: {getMaterialTypeLabel(quote.materialType)}</span>
                    )}
                    {quote.knifeType && (
                      <span>Faca: {getKnifeTypeLabel(quote.knifeType)}</span>
                    )}
                    <span>Propostas: {quote.proposals?.length || 0}</span>
                    <span className="flex items-center space-x-1">
                      <Upload className="w-4 h-4" />
                      <span>Arquivo original</span>
                    </span>
                    {quote.correctionFilePath && (
                      <span className="flex items-center space-x-1 text-orange-600">
                        <Upload className="w-4 h-4" />
                        <span>Arquivo de correção</span>
                      </span>
                    )}
                  </div>

                  {quote.observations && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <strong>Observações:</strong> {quote.observations}
                      </p>
                    </div>
                  )}

                  {quote.proposals && quote.proposals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Propostas recebidas:</p>
                      {quote.proposals.map((proposal) => (
                        <div key={proposal.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {proposal.supplierName} ({proposal.supplierCompany})
                            </p>
                            <p className="text-sm text-gray-600">
                              Valor: R$ {proposal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            {proposal.observations && (
                              <p className="text-sm text-gray-600">Obs: {proposal.observations}</p>
                            )}
                          </div>
                          {quote.status === 'pending' && proposal.status === 'pending' && (
                            <button
                              onClick={() => handleApproveProposal(quote.id, proposal.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Aprovar
                            </button>
                          )}
                          {proposal.status === 'approved' && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                              Aprovado
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateQuoteModal
          onClose={() => setShowCreateModal(false)}
          onQuoteCreated={handleQuoteCreated}
        />
      )}

      {showEditModal && selectedQuote && (
        <EditQuoteModal
          quote={selectedQuote}
          onClose={() => {
            setShowEditModal(false);
            setSelectedQuote(null);
          }}
          onQuoteUpdated={handleQuoteUpdated}
        />
      )}

      {showDetailsModal && selectedQuote && (
        <QuoteDetailsModal
          quote={selectedQuote}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {showUserManagement && (
        <UserManagementModal
          onClose={() => setShowUserManagement(false)}
          onUsersUpdated={loadData}
        />
      )}

      {showTechnicalReview && selectedDrawing && (
        <TechnicalDrawingReviewModal
          drawing={selectedDrawing}
          onClose={() => {
            setShowTechnicalReview(false);
            setSelectedDrawing(null);
          }}
          onReviewed={handleDrawingReviewed}
        />
      )}

      {showFinancialReport && (
        <FinancialReportModal
          onClose={() => setShowFinancialReport(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;