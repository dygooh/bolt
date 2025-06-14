import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X, Plus, Edit2, Trash2, Eye, EyeOff, Save, UserPlus } from 'lucide-react';
import { apiService } from '../services/api';

interface UserManagementModalProps {
  onClose: () => void;
  onUsersUpdated: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose, onUsersUpdated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'knife-supplier' as User['role'],
    companyName: '',
    isActive: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiService.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        companyName: formData.companyName || null
      });

      await loadUsers();
      onUsersUpdated();
      
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'knife-supplier',
        companyName: '',
        isActive: true
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erro ao criar usuário');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      companyName: user.companyName || '',
      isActive: user.isActive ?? true
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        companyName: formData.companyName || null,
        isActive: formData.isActive
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await apiService.updateUser(editingUser.id, updateData);
      await loadUsers();
      onUsersUpdated();

      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'knife-supplier',
        companyName: '',
        isActive: true
      });
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await apiService.deleteUser(userId);
        await loadUsers();
        onUsersUpdated();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Erro ao excluir usuário');
      }
    }
  };

  const toggleUserStatus = async (userId: number) => {
    try {
      await apiService.toggleUserStatus(userId);
      await loadUsers();
      onUsersUpdated();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Erro ao alterar status do usuário');
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Usuários</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Usuários do Sistema</h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>

          {(showCreateForm || editingUser) && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
              </h4>
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha {editingUser ? '(deixe em branco para manter)' : '*'}
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!editingUser}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Usuário *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="admin">Administrador</option>
                      <option value="knife-supplier">Fornecedor de Facas</option>
                      <option value="die-supplier">Fornecedor de Clichês</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa
                    </label>
                    <input
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Clicheria Caçador"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      name="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Usuário ativo
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingUser(null);
                      setFormData({
                        name: '',
                        email: '',
                        password: '',
                        role: 'knife-supplier',
                        companyName: '',
                        isActive: true
                      });
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingUser ? 'Atualizar' : 'Criar'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (user.isActive ?? true) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {(user.isActive ?? true) ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Email: {user.email}</p>
                      {user.companyName && (
                        <p className="text-sm text-gray-600 mb-2">Empresa: {user.companyName}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          (user.isActive ?? true)
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {(user.isActive ?? true) ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;