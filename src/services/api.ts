const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  private async uploadRequest(endpoint: string, formData: FormData) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      method: 'POST',
      body: formData,
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  // Quotes
  async getQuotes() {
    return this.request('/quotes');
  }

  async createQuote(data: any, file: File) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('supplierType', data.supplierType);
    if (data.materialType) formData.append('materialType', data.materialType);
    if (data.knifeType) formData.append('knifeType', data.knifeType);
    if (data.observations) formData.append('observations', data.observations);
    formData.append('file', file);

    return this.uploadRequest('/quotes', formData);
  }

  async updateQuote(id: number, data: { name: string; observations: string }) {
    return this.request(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadCorrectionFile(id: number, file: File) {
    const formData = new FormData();
    formData.append('correctionFile', file);

    return this.uploadRequest(`/quotes/${id}/correction`, formData);
  }

  async deleteCorrectionFile(id: number) {
    return this.request(`/quotes/${id}/correction`, {
      method: 'DELETE',
    });
  }

  async approveProposal(quoteId: number, proposalId: number) {
    return this.request(`/quotes/${quoteId}/approve/${proposalId}`, {
      method: 'POST',
    });
  }

  async deleteQuote(id: number) {
    return this.request(`/quotes/${id}`, {
      method: 'DELETE',
    });
  }

  // Proposals
  async createProposal(data: { quoteId: number; value: number; observations: string }) {
    return this.request('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadTechnicalDrawing(proposalId: number, file: File) {
    const formData = new FormData();
    formData.append('technicalDrawing', file);

    return this.uploadRequest(`/proposals/${proposalId}/technical-drawing`, formData);
  }

  async resubmitTechnicalDrawing(proposalId: number, file: File) {
    const formData = new FormData();
    formData.append('technicalDrawing', file);

    return this.uploadRequest(`/proposals/${proposalId}/technical-drawing/resubmit`, formData);
  }

  async getPendingTechnicalDrawings() {
    return this.request('/proposals/technical-drawings/pending');
  }

  async reviewTechnicalDrawing(id: number, status: 'approved' | 'rejected', rejectionReason?: string) {
    return this.request(`/proposals/technical-drawings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleUserStatus(id: number) {
    return this.request(`/users/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  // Financial
  async getFinancialReport(filters?: { month?: number; year?: number }) {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    
    return this.request(`/financial/report?${params.toString()}`);
  }

  async getFinancialSummary() {
    return this.request('/financial/summary');
  }

  // File download
  getFileUrl(filename: string) {
    return `${API_BASE_URL}/quotes/download/${filename}`;
  }
}

export const apiService = new ApiService();