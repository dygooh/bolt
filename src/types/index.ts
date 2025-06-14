export interface User {
  id: number;
  email: string;
  role: 'admin' | 'knife-supplier' | 'die-supplier';
  name: string;
  companyName?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Quote {
  id: number;
  quoteNumber: number;
  name: string;
  supplierType: 'knife' | 'die';
  materialType?: 'micro-ondulado' | 'onda-t' | 'onda-b' | 'onda-c' | 'onda-tt' | 'onda-bc';
  knifeType?: 'plana' | 'rotativa' | 'rotativa-plana';
  observations: string;
  originalFilePath: string;
  originalFileName: string;
  correctionFilePath?: string;
  correctionFileName?: string;
  status: 'pending' | 'approved' | 'completed';
  approvedSupplierId?: number;
  createdBy: number;
  createdAt: string;
  createdByName?: string;
  approvedSupplierName?: string;
  approvedSupplierCompany?: string;
  proposals?: Proposal[];
}

export interface Proposal {
  id: number;
  quoteId: number;
  supplierId: number;
  value: number;
  observations: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  supplierName?: string;
  supplierCompany?: string;
  technicalDrawing?: TechnicalDrawing;
}

export interface TechnicalDrawing {
  id: number;
  proposalId: number;
  filePath: string;
  fileName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  createdAt: string;
  proposalValue?: number;
  quoteName?: string;
  quoteNumber?: number;
  supplierName?: string;
  supplierCompany?: string;
}

export interface FinancialItem {
  id: number;
  quoteNumber: number;
  quoteName: string;
  supplierType: 'knife' | 'die';
  value: number;
  supplierName: string;
  supplierCompany: string;
  createdAt: string;
}

export interface FinancialReport {
  items: FinancialItem[];
  total: number;
  count: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}