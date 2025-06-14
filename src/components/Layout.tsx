import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, User, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'knife-supplier':
        return 'Fornecedor de Facas';
      case 'die-supplier':
        return 'Fornecedor de Clichês';
      default:
        return 'Usuário';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'knife-supplier':
        return 'bg-orange-100 text-orange-800';
      case 'die-supplier':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Onducart Embalagens</h1>
                <p className="text-sm text-gray-500">Sistema de Orçamentos</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  {user?.companyName && (
                    <p className="text-xs text-gray-500">{user.companyName}</p>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user?.role || '')}`}>
                    {getRoleName(user?.role || '')}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;