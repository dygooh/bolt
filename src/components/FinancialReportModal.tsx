import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Download } from 'lucide-react';
import { FinancialReport } from '../types';
import { apiService } from '../services/api';

interface FinancialReportModalProps {
  onClose: () => void;
}

const FinancialReportModal: React.FC<FinancialReportModalProps> = ({ onClose }) => {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [filters]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getFinancialReport(filters);
      setReport(data);
    } catch (error) {
      console.error('Error loading financial report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value ? parseInt(value) : undefined
    }));
  };

  const clearFilters = () => {
    setFilters({ month: 0, year: 0 });
  };

  const getSupplierTypeLabel = (type: string) => {
    return type === 'knife' ? 'Facas' : 'Clichês';
  };

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Relatório Financeiro</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês
                </label>
                <select
                  name="month"
                  value={filters.month || ''}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os meses</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano
                </label>
                <select
                  name="year"
                  value={filters.year || ''}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os anos</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando relatório...</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">
                        R$ {report?.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </p>
                      <p className="text-green-700">Valor Total</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{report?.count || 0}</p>
                      <p className="text-blue-700">Orçamentos Aprovados</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Orçamentos Aprovados</h3>
                </div>
                <div className="overflow-x-auto">
                  {!report?.items.length ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum orçamento aprovado encontrado</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Ajuste os filtros para ver mais resultados
                      </p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Orçamento
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fornecedor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  #{item.quoteNumber} - {item.quoteName}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.supplierName}</p>
                                <p className="text-sm text-gray-500">{item.supplierCompany}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.supplierType === 'knife' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {getSupplierTypeLabel(item.supplierType)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-bold text-green-600">
                                R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReportModal;