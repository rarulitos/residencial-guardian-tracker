import React, { useState } from 'react';
import { Worker } from '@/types/worker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
interface FinancialSummaryProps {
  workers: Worker[];
  currentMonth: Date;
}
const FinancialSummary = ({
  workers,
  currentMonth
}: FinancialSummaryProps) => {
  const [unitPrice, setUnitPrice] = useState<number>(25000);
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({
      length: daysInMonth
    }, (_, i) => i + 1);
  };
  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };
  const calculateTotals = () => {
    const days = getDaysInMonth(currentMonth);

    // Calcular total de trabajadores hospedados en el mes
    const totalWorkerDays = workers.reduce((total, worker) => {
      return total + days.reduce((workerTotal, day) => {
        const dateStr = formatDate(day);
        return workerTotal + (worker.hospedaje[dateStr] ? 1 : 0);
      }, 0);
    }, 0);
    const netTotal = totalWorkerDays * unitPrice;
    const iva = netTotal * 0.19;
    const totalToPay = netTotal + iva;
    return {
      totalWorkerDays,
      unitPrice,
      netTotal,
      iva,
      totalToPay
    };
  };
  const totals = calculateTotals();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return <Card className="mb-6 ">
      <CardHeader>
        <CardTitle>
          Resumen Financiero - {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="unitPrice">Precio Unitario por Alojamiento</Label>
          <Input id="unitPrice" type="number" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} className="max-w-xs" placeholder="Precio por día" />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/3">Concepto</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                Total de trabajadores hospedados (días)
              </TableCell>
              <TableCell className="text-right font-mono">
                {totals.totalWorkerDays}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Precio unitario por alojamiento
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(totals.unitPrice)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Total neto (sin IVA)
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(totals.netTotal)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                IVA (19%)
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(totals.iva)}
              </TableCell>
            </TableRow>
            <TableRow className="border-t-2 border-gray-300">
              <TableCell className="font-bold text-lg">
                Monto total a pagar
              </TableCell>
              <TableCell className="text-right font-mono font-bold text-lg">
                {formatCurrency(totals.totalToPay)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>;
};
export default FinancialSummary;