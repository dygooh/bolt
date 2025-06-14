import React, { useState } from 'react';
import { Proposal, TechnicalDrawing, QuoteFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, Upload, FileText, Trash2 } from 'lucide-react';

interface TechnicalDrawingUploadModalProps {
  proposal: Proposal;
  onClose: () => void;
  onUploaded: () => void;
}

const TechnicalDrawingUploadModal: React.FC<TechnicalDrawingUploadModalProps> = ({ 
  proposal, 
  onClose, 
  onUploaded 
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<QuoteFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      const newFile: QuoteFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        url: URL.createObjectURL(uploadedFile),
        version: 1,
        isOriginal: true,
        uploadedAt: new Date().toISOString()
      };
      setFile(newFile);
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
    if (!file || !user) return;

    setIsSubmitting(true);

    const technicalDrawing: TechnicalDrawing = {
      id: Math.random().toString(36).substr(2, 9),
      proposalId: proposal.id,
      file,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    // Save technical drawing
    const existingDrawings = JSON.parse(localStorage.getItem('technicalDrawings') || '[]');
    const updatedDrawings = [technicalDrawing, ...existingDrawings];
    localStorage.setItem('technicalDrawings', JSON.stringify(updatedDrawings));

    // Update proposal with technical drawing reference
    const existingProposals = JSON.parse(localStorage.getItem('proposals') || '[]');
    const updatedProposals = existingProposals.map((p: Proposal) => 
      p.id === proposal.id 
        ? { ...p, technicalDrawing }
        : p
    );
    localStorage.setItem('proposals', JSON.stringify(updatedProposals));

    setIsSubmitting(false);
    onUploaded();
  };

  // Get quote information
  const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
  const quote = quotes.find((q: any) => q.id === proposal.quoteId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enviar Desenho Técnico</h2>
            <p className="text-sm text-gray-600 mt-1">{quote?.name}</p>
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Informações da Proposta Aprovada:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Orçamento:</strong> {quote?.name}</p>
                <p><strong>Tipo:</strong> {proposal.supplierType === 'knife' ? 'Faca' : 'Clichê'}</p>
                <p><strong>Valor:</strong> R$ {proposal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                {proposal.observations && (
                  <p><strong>Observações:</strong> {proposal.observations}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desenho Técnico *
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Envie o desenho técnico para verificação. Formatos aceitos: PDF, JPG, PNG, DWG
              </p>
              
              {!file ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Clique para selecionar o arquivo</p>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,.pdf,.dwg,.dxf"
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

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Importante:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• O desenho será analisado pela equipe técnica</li>
                <li>• Você receberá feedback sobre aprovação ou correções necessárias</li>
                <li>• Certifique-se de que todas as medidas estão corretas</li>
                <li>• Inclua todas as especificações técnicas necessárias</li>
              </ul>
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
              disabled={isSubmitting || !file}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Desenho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TechnicalDrawingUploadModal;