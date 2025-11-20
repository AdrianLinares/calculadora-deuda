import { Debt } from '@/lib/debtCalculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, TrendingUp, DollarSign, Calendar, Percent, Info, Loader2, LayoutGrid, List } from 'lucide-react';
import { useState, useMemo, memo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DebtListProps {
  debts: Debt[];
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
  sortedBySnowball?: boolean;
}

export function DebtList({ debts, onEditDebt, onDeleteDebt, sortedBySnowball = false }: DebtListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('debtlist-view-mode', 'grid');

  const totals = useMemo(() => ({
    balance: debts.reduce((sum, debt) => sum + debt.balance, 0),
    minimumPayments: debts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
    averageRate: debts.length > 0 
      ? (debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length)
      : 0
  }), [debts]);

  if (debts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay deudas registradas</h3>
          <p className="text-muted-foreground text-center">
            Comienza agregando tus deudas para calcular tu plan de amortización
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toLocaleDateString('es-MX');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  const handleDelete = (id: string) => {
    setDebtToDelete(id);
  };

  const confirmDelete = () => {
    if (debtToDelete) {
      onDeleteDebt(debtToDelete);
      setDebtToDelete(null);
    }
  };

  const DebtCard = memo(({ debt, index, onEdit, onDelete }: { 
    debt: Debt; 
    index: number; 
    onEdit: (debt: Debt) => void; 
    onDelete: (id: string) => void; 
  }) => {
    return (
      <Card className="relative">
        {sortedBySnowball && index === 0 && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-red-500 hover:bg-red-600">
              🎯 Objetivo Actual
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{debt.name}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(debt)}
                aria-label={`Editar deuda ${debt.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(debt.id)}
                className="text-red-600 hover:text-red-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className="font-semibold text-lg">
                  {formatCurrency(debt.balance)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tasa Anual</p>
                <p className="font-semibold">
                  {debt.interestRate.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Pago Mínimo</p>
                <p className="font-semibold">
                  {formatCurrency(debt.minimumPayment)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                <p className="font-semibold text-sm">
                  {formatDate(debt.startDate)}
                </p>
              </div>
            </div>
          </div>

          {sortedBySnowball && index === 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-medium">
                🎯 Esta es tu deuda objetivo actual. Todo el dinero extra se aplicará aquí.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  });

  DebtCard.displayName = 'DebtCard';

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">
              Lista de Deudas {sortedBySnowball && '(Ordenadas por Método Bola de Nieve)'}
            </h3>
            {sortedBySnowball && (
              <div className="p-2 rounded bg-blue-50 text-blue-800 text-xs flex items-center gap-2">
                <Info className="h-3 w-3" /> Ordenadas por saldo ascendente (Bola de Nieve)
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {debts.length} deuda{debts.length !== 1 ? 's' : ''}
            </Badge>
            <div className="flex rounded-md overflow-hidden border">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 flex items-center gap-1 text-sm transition ${viewMode==='grid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                aria-label="Vista en tarjetas"
              >
                <LayoutGrid className="h-4 w-4" /> Tarjetas
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 flex items-center gap-1 text-sm transition border-l ${viewMode==='list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                aria-label="Vista en lista"
              >
                <List className="h-4 w-4" /> Lista
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {debts.map((debt, index) => (
              <DebtCard key={debt.id} debt={debt} index={index} onEdit={onEditDebt} onDelete={onDeleteDebt} />
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-3 font-medium">Nombre</th>
                  <th className="p-3 font-medium">Saldo</th>
                  <th className="p-3 font-medium">Tasa %</th>
                  <th className="p-3 font-medium">Pago Mínimo</th>
                  <th className="p-3 font-medium">Fecha Inicio</th>
                  <th className="p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt, index) => (
                  <tr key={debt.id} className="border-t hover:bg-muted/50">
                    <td className="p-3 font-medium flex items-center gap-2">
                      {sortedBySnowball && index === 0 && (
                        <Badge className="bg-red-500">🎯</Badge>
                      )}
                      {debt.name}
                    </td>
                    <td className="p-3">{formatCurrency(debt.balance)}</td>
                    <td className="p-3">{debt.interestRate.toFixed(2)}%</td>
                    <td className="p-3">{formatCurrency(debt.minimumPayment)}</td>
                    <td className="p-3 text-xs">{formatDate(debt.startDate)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditDebt(debt)}
                          aria-label={`Editar deuda ${debt.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(debt.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total de Deudas</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totals.balance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagos Mínimos Totales</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totals.minimumPayments)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasa Promedio</p>
              <p className="text-2xl font-bold">
                {totals.averageRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!debtToDelete} onOpenChange={() => setDebtToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}