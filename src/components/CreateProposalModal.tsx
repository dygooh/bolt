import React, { useState } from 'react';
import { Quote, Proposal } from '../types';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

interface CreateProposalModalProps {
  quote: Quote;
  onClose: () => void;
  onProposalCreated: () => void;
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({ 
  quote, 
  onClose, 
  onProposalCreated 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    value: '',
    observations: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supplierType = user?.role === 'knife-supplier' ? 'knife' : 'die';
  const isKnifeSupplier = supplierType === 'knife';
  const isDieSupplier = supplierType === 'die';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    const newProposal: Proposal = {
      id: Math.random().toString(36).substr(2, 9),
      quoteId: quote.id,
      supplierId: user.id,
      supplierType,
      value: parseFloat(formData.value),
      observations: formData.observations,
      dieType: isDieSupplier ? 'Polímero' : undefined,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Save to localStorage
    const existingProposals = JSON.parse(localStorage.getItem('proposals') || '[]');
    const updatedProposals = [newProposal, ...existingProposals];
    localStorage.setItem('proposals', JSON.stringify(updatedProposals));

    setIsSubmitting(false);
    onProposalCreated();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Criar Proposta</h2>
            <p className="text-sm text-gray-600 mt-1">{quote.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {isDieSupplier && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Clichê
                </label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-900 font-medium">Polímero</p>
                  <p className="text-sm text-gray-600">Tipo fixo para todos os clichês</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                Valor {isKnifeSupplier ? 'da Faca' : 'do Clichê'} (R$) *
              </label>
              <input
                id="value"
                name="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                id="observations"
                name="observations"
                value={formData.observations}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Adicione informações adicionais sobre sua proposta..."
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Informações do Orçamento:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Nome:</strong> {quote.name}</p>
                <p><strong>Criado em:</strong> {new Date(quote.createdAt).toLocaleDateString('pt-BR')}</p>
                {quote.observations && (
                  <p><strong>Observações:</strong> {quote.observations}</p>
                )}
                {quote.files.length > 0 && (
                  <p><strong>Arquivos:</strong> {quote.files.length} arquivo(s) anexado(s)</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.value.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Proposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProposalModal;