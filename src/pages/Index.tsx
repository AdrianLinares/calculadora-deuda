import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Target, TrendingDown, Calendar, DollarSign, Snowflake, Database } from 'lucide-react';
import { DebtForm } from '@/components/DebtForm';
import { DebtList } from '@/components/DebtList';
import { SnowballCalculator } from '@/components/SnowballCalculator';
import PaymentPlan from '@/components/PaymentPlan';
import { Charts } from '@/components/Charts';
import { DataManager } from '@/components/DataManager';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Debt, calculateSnowballPlan, sortDebtsBySnowball } from '@/lib/debtCalculations';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from '@/hooks/use-toast';

// Add proper type definitions
interface ImportedDebt extends Omit<Debt, 'id'> {
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  startDate: string;
}

const ErrorFallback = () => (
  <Card className="p-6 text-center">
    <CardContent>
      <h2 className="text-xl font-bold text-red-600 mb-2">Algo salió mal</h2>
      <p className="text-gray-600 mb-4">Hubo un error al cargar la aplicación</p>
      <Button onClick={() => window.location.reload()}>
        Recargar página
      </Button>
    </CardContent>
  </Card>
);

export default function Index() {
  const [debts, setDebts] = useLocalStorage<Debt[]>('snowball-debts', []);
  const [monthlyBudget, setMonthlyBudget] = useLocalStorage<number>('snowball-budget', 0);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Memoize expensive calculations
  const statistics = useMemo(() => ({
    totalDebt: debts.reduce((sum, debt) => sum + debt.balance, 0),
    totalMinimumPayments: debts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
    averageInterestRate: debts.length > 0
      ? debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length
      : 0
  }), [debts]);

  // Calculate snowball plan
  const snowballPlan = monthlyBudget > 0 && debts.length > 0
    ? calculateSnowballPlan(debts, monthlyBudget)
    : null;

  // Sort debts for display
  const sortedDebts = sortDebtsBySnowball(debts);

  // Validation function for debt data
  const validateDebt = (debt: ImportedDebt): boolean => {
    if (!debt.name || debt.name.trim().length === 0) return false;
    if (typeof debt.balance !== 'number' || isNaN(debt.balance) || debt.balance <= 0) return false;
    if (typeof debt.interestRate !== 'number' || isNaN(debt.interestRate) || debt.interestRate < 0 || debt.interestRate > 100) return false;
    if (typeof debt.minimumPayment !== 'number' || isNaN(debt.minimumPayment) || debt.minimumPayment <= 0 || debt.minimumPayment > debt.balance) return false;
    if (!debt.startDate || !Date.parse(debt.startDate)) return false;
    return true;
  };

  // Memoize handlers
  const handleAddDebt = useCallback((debtData: ImportedDebt) => {
    if (!validateDebt(debtData)) {
      console.error('Datos de deuda inválidos:', debtData);
      toast({
        title: "Error",
        description: "Por favor verifica los datos de la deuda",
        variant: "destructive",
      });
      return;
    }

    const newDebt: Debt = {
      ...debtData,
      id: crypto.randomUUID() // More reliable than Date.now()
    };
    setDebts(prev => [...prev, newDebt]);
    setShowAddForm(false);
  }, [setDebts]);

  const handleUpdateDebt = (updatedDebt: Debt) => {
    setDebts(debts.map(debt => debt.id === updatedDebt.id ? updatedDebt : debt));
    setEditingDebt(null);
  };

  const handleDeleteDebt = (id: string) => {
    setDebts(debts.filter(debt => debt.id !== id));
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingDebt(null);
    setShowAddForm(false);
  };

  const handleImportDebts = (importedDebts: Debt[]) => {
    setDebts(importedDebts);
    setShowAddForm(false);
    setEditingDebt(null);
  };

  const handleImportBudget = (importedBudget: number) => {
    setMonthlyBudget(importedBudget);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (debts.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [debts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            {/* Add loading skeletons */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-blue-600 rounded-full">
                <Snowflake className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Método Bola de Nieve
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Elimina tus deudas de forma estratégica, empezando por las más pequeñas para crear impulso y motivación
            </p>
          </div>

          {/* Dashboard Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="text-sm text-muted-foreground">Total de Deudas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(statistics.totalDebt)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Número de Deudas</p>
                <p className="text-2xl font-bold">
                  {debts.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <TrendingDown className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-muted-foreground">Pagos Mínimos</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(statistics.totalMinimumPayments)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">
                  {snowballPlan ? 'Meses para Libertad' : 'Tasa Promedio'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {snowballPlan ? `${snowballPlan.totalMonths}` : `${statistics.averageInterestRate.toFixed(1)}%`}
                </p>
                {snowballPlan && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Libre: {formatDate(snowballPlan.debtFreeDate)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="debts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="debts">Mis Deudas</TabsTrigger>
              <TabsTrigger value="calculator">Calculadora</TabsTrigger>
              <TabsTrigger value="plan">Plan de Pagos</TabsTrigger>
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
              <TabsTrigger value="data">
                <Database className="h-4 w-4 mr-2" />
                Datos
              </TabsTrigger>
              <TabsTrigger value="add">
                <PlusCircle className="h-4 w-4 mr-2" />
                Agregar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="debts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Gestión de Deudas</h2>
                <Button onClick={() => setShowAddForm(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar Deuda
                </Button>
              </div>

              {showAddForm && (
                <DebtForm
                  onAddDebt={handleAddDebt}
                  editingDebt={editingDebt || undefined}
                  onUpdateDebt={handleUpdateDebt}
                  onCancel={handleCancelEdit}
                />
              )}

              <DebtList
                debts={sortedDebts}
                onEditDebt={handleEditDebt}
                onDeleteDebt={handleDeleteDebt}
                sortedBySnowball={true}
              />
            </TabsContent>

            <TabsContent value="calculator" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Calculadora Bola de Nieve</h2>
                {debts.length === 0 && (
                  <Badge variant="outline">
                    Agrega deudas para comenzar
                  </Badge>
                )}
              </div>

              <SnowballCalculator
                debts={debts}
                onBudgetChange={setMonthlyBudget}
              />
            </TabsContent>

            <TabsContent value="plan" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Plan de Pagos Detallado</h2>
                {!snowballPlan && (
                  <Badge variant="outline">
                    Configura tu presupuesto mensual
                  </Badge>
                )}
              </div>

              <PaymentPlan
                paymentPlan={snowballPlan?.paymentPlan || []}
                totalDebtAmount={statistics.totalDebt}
              />
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Visualizaciones</h2>
                {debts.length === 0 && (
                  <Badge variant="outline">
                    Agrega deudas para ver gráficos
                  </Badge>
                )}
              </div>

              <Charts
                debts={debts}
                paymentPlan={snowballPlan?.paymentPlan}
              />
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Gestión de Datos</h2>
                <Badge variant="outline">
                  Exportar/Importar JSON
                </Badge>
              </div>

              <DataManager
                debts={debts}
                monthlyBudget={monthlyBudget}
                onImportDebts={handleImportDebts}
                onImportBudget={handleImportBudget}
              />
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <h2 className="text-2xl font-bold">Agregar Nueva Deuda</h2>

              <DebtForm
                onAddDebt={handleAddDebt}
                editingDebt={editingDebt || undefined}
                onUpdateDebt={handleUpdateDebt}
                onCancel={handleCancelEdit}
              />

              {debts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen Actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Deudas Registradas</p>
                        <p className="text-xl font-bold">{debts.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Adeudado</p>
                        <p className="text-xl font-bold text-red-600">
                          {formatCurrency(statistics.totalDebt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pagos Mínimos</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(statistics.totalMinimumPayments)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Motivational Footer */}
          {snowballPlan && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  🎉 ¡Tu Plan de Libertad Financiera está Listo!
                </h3>
                <p className="text-green-700 mb-4">
                  En solo <strong>{snowballPlan.totalMonths} meses</strong> podrás estar completamente libre de deudas.
                  Ahorrarás <strong>{formatCurrency(snowballPlan.totalInterest)}</strong> siguiendo este plan.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <Badge className="bg-green-600">
                    Fecha objetivo: {formatDate(snowballPlan.debtFreeDate)}
                  </Badge>
                  <Badge className="bg-blue-600">
                    Total a pagar: {formatCurrency(snowballPlan.totalPaid)}
                  </Badge>
                  <Badge className="bg-purple-600">
                    {Math.floor(snowballPlan.totalMonths / 12)} años, {snowballPlan.totalMonths % 12} meses
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}