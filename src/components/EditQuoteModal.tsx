import React, { useState } from 'react';
import { Quote, QuoteFile } from '../types';
import { X, Upload, FileText, Trash2, AlertTriangle } from 'lucide-react';

interface EditQuoteModalProps {
  quote: Quote;
  onClose: () => void;
  onQuoteUpdated: () => void;
}

const EditQuoteModal: React.FC<EditQuoteModalProps> = ({ quote, onClose, onQuoteUpdated }) => {
  const [formData, setFormData] = useState({
    name: quote.name,
    observations: quote.observations,
    supplierType: quote.supplierType,
    materialType: quote.materialType,
    knifeType: quote.knifeType || ''
  });
  
  // Separate original files from updated versions
  const originalFiles = quote.files.filter(f => f.isOriginal !== false);
  const updatedFiles = quote.files.filter(f => f.isOriginal === false);
  
  const [newFiles, setNewFiles] = useState<QuoteFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    const processedFiles: QuoteFile[] = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      version: getNextVersion(),
      isOriginal: false,
      uploadedAt: new Date().toISOString()
    }));
    setNewFiles(prev => [...prev, ...processedFiles]);
  };

  const getNextVersion = () => {
    const allFiles = [...quote.files, ...newFiles];
    const versions = allFiles.map(f => f.version || 1);
    return Math.max(...versions, 1) + 1;
  };

  const removeNewFile = (fileId: string) => {
    setNewFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const removeUpdatedFile = (fileId: string) => {
    // This will remove updated versions, but keep originals
    const updatedQuoteFiles = quote.files.filter(f => f.id !== fileId);
    // We need to update the quote object temporarily for this session
    quote.files = updatedQuoteFiles;
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

    // Combine all files: originals (marked as original), existing updated versions, and new files
    const allFiles = [
      ...originalFiles.map(f => ({ ...f, isOriginal: true })),
      ...updatedFiles,
      ...newFiles
    ];

    const updatedQuote: Quote = {
      ...quote,
      name: formData.name,
      observations: formData.observations,
      supplierType: formData.supplierType,
      materialType: formData.materialType,
      knifeType: formData.supplierType === 'knife' ? formData.knifeType as 'rotativa' | 'plana' | 'ambos' : undefined,
      files: allFiles
    };

    // Update in localStorage
    const existingQuotes = JSON.parse(localStorage.getItem('quotes') || '[]');
    const updatedQuotes = existingQuotes.map((q: Quote) => 
      q.id === quote.id ? updatedQuote : q
    );
    localStorage.setItem('quotes', JSON.stringify(updatedQuotes));

    setIsSubmitting(false);
    onQuoteUpdated();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Orçamento</h2>
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
                <option value="knife">Fornecedor de Facas</option>
                <option value="die">Fornecedor de Clichês</option>
              </select>
            </div>

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
                <option value="micro-ondulado">Micro Ondulado</option>
                <option value="onda-t">Onda T</option>
                <option value="onda-b">Onda B</option>
                <option value="onda-tt">Onda TT</option>
                <option value="onda-bc">Onda BC</option>
              </select>
            </div>

            {formData.supplierType === 'knife' && (
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
                  <option value="rotativa">Rotativa</option>
                  <option value="plana">Plana</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
            )}

            {/* File Management Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gerenciamento de Arquivos
                </label>
                
                {/* Original Files - Protected */}
                {originalFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Arquivos Originais</h4>
                      <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Protegidos contra exclusão</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {originalFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-amber-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • Versão Original
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-amber-600 font-medium">Protegido</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Updated Files - Can be removed */}
                {updatedFiles.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Versões Atualizadas</h4>
                    <div className="space-y-2">
                      {updatedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • Versão {file.version || 2} • 
                                Enviado em {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUpdatedFile(file.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Files Upload */}
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Adicionar nova versão dos arquivos</p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                    >
                      Selecionar Arquivos
                    </label>
                  </div>
                  
                  {newFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Novos arquivos a serem adicionados:</p>
                      {newFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • Nova versão {file.version}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewFile(file.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
                Observações Gerais
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
              disabled={isSubmitting || !formData.supplierType || !formData.materialType || !formData.name.trim() || (formData.supplierType === 'knife' && !formData.knifeType)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditQuoteModal;