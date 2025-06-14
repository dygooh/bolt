import React, { useState } from 'react';
import { X, Upload, FileText, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';

interface CreateQuoteModalProps {
  onClose: () => void;
  onQuoteCreated: () => void;
}

const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({ onClose, onQuoteCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    observations: '',
    supplierType: '' as 'knife' | 'die' | '',
    materialType: '' as 'micro-ondulado' | 'onda-t' | 'onda-b' | 'onda-c' | 'onda-tt' | 'onda-bc' | '',
    knifeType: '' as 'plana' | 'rotativa' | 'rotativa-plana' | ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
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
    if (!file) return;

    setIsSubmitting(true);

    try {
      await apiService.createQuote(formData, file);
      onQuoteCreated();
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Erro ao criar orçamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaterialTypeLabel = (type: string) => {
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

  const getKnifeTypeLabel = (type: string) => {
    switch (type) {
      case 'plana': return 'Plana';
      case 'rotativa': return 'Rotativa';
      case 'rotativa-plana': return 'Rotativa e Plana';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Criar Novo Orçamento</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
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
              <label htmlFor="supplierType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Fornecedor *
              </label>
              <select
                id="supplierType"
                name="supplierType"
                value={formData.supplierType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              >
                <option value="">Selecione o tipo de fornecedor</option>
                <option value="knife">Fornecedor de Facas</option>
                <option value="die">Fornecedor de Clichês</option>
              </select>
            </div>

            {formData.supplierType === 'knife' && (
              <>
                <div>
                  <label htmlFor="materialType" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Material *
                  </label>
                  <select
                    id="materialType"
                    name="materialType"
                    value={formData.materialType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Selecione o tipo de material</option>
                    <option value="micro-ondulado">Micro Ondulado</option>
                    <option value="onda-t">Onda T</option>
                    <option value="onda-b">Onda B</option>
                    <option value="onda-c">Onda C</option>
                    <option value="onda-tt">Onda TT</option>
                    <option value="onda-bc">Onda BC</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="knifeType" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Faca *
                  </label>
                  <select
                    id="knifeType"
                    name="knifeType"
                    value={formData.knifeType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Selecione o tipo de faca</option>
                    <option value="plana">Faca Plana</option>
                    <option value="rotativa">Faca Rotativa</option>
                    <option value="rotativa-plana">Rotativa e Plana</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo *
              </label>
              {!file ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Clique para selecionar arquivo ou arraste aqui</p>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.dwg,.dxf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                  >
                    Selecionar Arquivo
                  </label>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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
              disabled={isSubmitting || !formData.supplierType || !formData.name.trim() || !file || (formData.supplierType === 'knife' && (!formData.materialType || !formData.knifeType))}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Criando...' : 'Criar Orçamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuoteModal;