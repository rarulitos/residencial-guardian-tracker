
export interface Worker {
  id: string;
  name: string;
  position: string;
  hospedaje: { [date: string]: boolean };
}

export interface DayTotal {
  date: string;
  count: number;
}
