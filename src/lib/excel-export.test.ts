
import { describe, it, expect, afterEach, vi } from 'vitest';
import { exportToExcel } from './excel-export';
import { Group, WorkerWithHospedaje } from '@/types/database';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

vi.mock('exceljs', () => {
  const actualExcelJS = vi.importActual('exceljs');
  return {
    ...actualExcelJS,
    Workbook: vi.fn().mockImplementation(() => ({
      addWorksheet: vi.fn(() => ({
        getCell: vi.fn(() => ({})),
        getRow: vi.fn(() => ({
          getCell: vi.fn(() => ({})),
        })),
        getColumn: vi.fn(() => ({})),
        mergeCells: vi.fn(),
        views: [],
      })),
      xlsx: {
        writeBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
      },
    })),
  };
});

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

describe('exportToExcel', () => {
  const group: Group = {
    id: 1,
    name: 'Test Group',
    start_date: '2025-07-01',
    end_date: '2025-07-31',
    price_per_night: 100,
    billing_period_id: 1,
    user_id: 'user1',
    created_at: ''
  };
  const workers: WorkerWithHospedaje[] = [
    {
      id: '1',
      name: 'John Doe',
      faena: 'Faena 1',
      user_id: 'user1',
      created_at: '',
      position: 'Position 1',
      hospedaje: [
        { id: 1, worker_id: '1', date: '2025-07-01', group_id: 1, user_id: 'user1', created_at: '', has_hospedaje: true },
        { id: 2, worker_id: '1', date: '2025-07-02', group_id: 1, user_id: 'user1', created_at: '', has_hospedaje: true },
      ]
    },
    {
      id: '2',
      name: 'Jane Smith',
      faena: 'Faena 2',
      user_id: 'user1',
      created_at: '',
      position: 'Position 2',
      hospedaje: [
        { id: 3, worker_id: '2', date: '2025-07-03', group_id: 1, user_id: 'user1', created_at: '', has_hospedaje: true },
      ]
    },
  ];

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call saveAs with the correct blob and filename', async () => {
    await exportToExcel(group, workers);

    expect(saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringContaining('Hospedaje_Test_Group')
    );
  });
});
