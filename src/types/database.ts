export interface BillingPeriod {
  id: string;
  user_id: string;
  year: number;
  month: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  user_id: string;
  billing_period_id: string;
  name: string;
  position: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerHospedaje {
  id: string;
  worker_id: string;
  date: string;
  has_hospedaje: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExportedReport {
  id: string;
  user_id: string;
  billing_period_id: string;
  filename: string;
  export_type: string;
  file_data?: Uint8Array;
  created_at: string;
}

export interface WorkerWithHospedaje extends Worker {
  hospedaje: WorkerHospedaje[];
}