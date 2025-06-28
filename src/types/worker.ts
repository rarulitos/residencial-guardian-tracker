
export interface Worker {
  id: string;
  name: string;
  position: string;
  hospedaje: { [date: string]: boolean };
  monthYear?: string; // Para asociar trabajadores a meses específicos
}

export interface DayTotal {
  date: string;
  count: number;
}

export interface MonthlyWorkers {
  [monthYear: string]: Worker[];
}
