import React, { useState } from 'react';
import { Quote } from '../types';
import { X, Upload, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';

interface EditQuoteModalProps {
  quote: Quote;
  onClose: () => void;
  onQuoteUpdated: () => void;
}

const EditQuoteModal: React.FC<EditQuoteModalProps> = ({ quote, onClose, onQuoteUpdated }) => {
  const [formData, setFormData] = useState({
    name: quote.name,
    observations: quote.observations || ''
  });
  
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCorrection, setIsUploadingCorrection] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCorrectionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setCorrectionFile(uploadedFile);
    }
  };

  const removeCorrectionFile = () => {
    setCorrectionFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiService.updateQuote(quote.id, {
        name: formData.name,
        observations: formData.observations
      });

      onQuoteUpdated();
    } catch (error) {
      console.error('Error updating quote:', error);
      alert('Erro ao atualizar orçamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadCorrection = async () => {
    if (!correctionFile) return;

    setIsUploadingCorrection(true);

    try {
      await apiService.uploadCorrectionFile(quote.id, correctionFile);
      setCorrectionFile(null);
      onQuoteUpdated();
    } catch (error) {
      console.error('Error uploading correction file:', error);
      alert('Erro ao enviar arquivo de correção');
    } finally {
      setIsUploadingCorrection(false);
    }
  };

  const handleDeleteCorrectionFile = async () => {
    if (window.confirm('Tem certeza que deseja excluir o arquivo de correção?')) {
      try {
        await apiService.deleteCorrectionFile(quote.id);
        onQuoteUpdated();
      } catch (error) {
        console.error('Error deleting correction file:', error);
        alert('Erro ao excluir arquivo de correção');
      }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Orçamento #{quote.quoteNumber}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Quote Information (Read-only) */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Informações do Orçamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Tipo de Fornecedor:</span>
                  <p className="text-gray-900">{getSupplierTypeLabel(quote.supplierType)}</p>
                </div>
                {quote.materialType && (
                  <div>
                    <span className="font-medium text-gray-600">Tipo de Material:</span>
                    <p className="text-gray-900">{getMaterialTypeLabel(quote.materialType)}</p>
                  </div>
                )}
                {quote.knifeType && (
                  <div>
                    <span className="font-medium text-gray-600">Tipo de Faca:</span>
                    <p className="text-gray-900">{getKnifeTypeLabel(quote.knifeType)}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-600">Arquivo Original:</span>
                  <p className="text-gray-900">{quote.originalFileName}</p>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Orçamento *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Ex: Embalagem para produto XYZ"
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
                  placeholder="Adicione informações importantes sobre o orçamento..."
                />
              </div>

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
                  disabled={isSubmitting || !formData.name.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>

            {/* Correction File Management */}
            {quote.status === 'pending' && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Arquivo de Correção</h3>
                
                {quote.correctionFilePath ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">{quote.correctionFileName}</p>
                          <p className="text-sm text-orange-600">Arquivo de correção atual</p>
                        </div>
                      </div>
                      <button
                        onClick={handleDeleteCorrectionFile}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                        title="Excluir arquivo de correção"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {!correctionFile ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Adicionar arquivo de correção</p>
                        <input
                          id="correction-upload"
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.dwg,.dxf"
                          onChange={handleCorrectionFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="correction-upload"
                          className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors inline-block"
                        >
                          Selecionar Arquivo
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-8 h-8 text-orange-600" />
                              <div>
                                <p className="font-medium text-gray-900">{correctionFile.name}</p>
                                <p className="text-sm text-gray-500">{formatFileSize(correctionFile.size)}</p>
                              </div>
                            </div>
                            <button
                              onClick={removeCorrectionFile}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={handleUploadCorrection}
                          disabled={isUploadingCorrection}
                          className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isUploadingCorrection ? 'Enviando...' : 'Enviar Arquivo de Correção'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuoteModal;