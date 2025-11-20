import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingDown, Calendar, DollarSign, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Debt, calculateSnowballPlan, calculateMinimumOnlyPlan, sortDebtsBySnowball, PaymentMonth } from '@/lib/debtCalculations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { debounce } from '@/lib/utils';

const CALCULATOR_CONSTANTS = {
  MIN_BUDGET: 0,
  MAX_BUDGET: 999999999,
  DEBOUNCE_MS: 500,
  INPUT_DECIMAL_PLACES: 2
} as const;

interface ValidationError {
  field: 'budget' | 'debts';
  message: string;
}

interface SnowballCalculatorProps {
  debts: Debt[];
  onBudgetChange?: (budget: number) => void;
}

interface SnowballResults {
  paymentPlan: PaymentMonth[];
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
  debtFreeDate: string;
}

interface MinimumResults {
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
}

export function SnowballCalculator({ debts, onBudgetChange }: SnowballCalculatorProps) {
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');
  const [results, setResults] = useState<SnowballResults | null>(null);
  const [minimumResults, setMinimumResults] = useState<MinimumResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const calculateResults = () => {
    try {
      setError(null);
      const budget = parseFloat(monthlyBudget);
      if (isNaN(budget) || budget <= 0) {
        throw new Error('El presupuesto debe ser mayor a 0');
      }
      if (debts.length === 0) {
        throw new Error('Agrega al menos una deuda para calcular');
      }
      if (budget < minimumPaymentsTotal) {
        throw new Error(`El presupuesto debe ser al menos ${formatCurrency(minimumPaymentsTotal)}`);
      }

      setIsLoading(true);
      const snowballResults = calculateSnowballPlan(debts, budget);
      const minimumOnlyResults = calculateMinimumOnlyPlan(debts);
      setResults(snowballResults);
      setMinimumResults(minimumOnlyResults);
      
      if (onBudgetChange) {
        onBudgetChange(budget);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular resultados');
      setResults(null);
      setMinimumResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the debounce implementation
  const debouncedCalculate = useMemo(
    () => debounce(calculateResults, CALCULATOR_CONSTANTS.DEBOUNCE_MS),
    [debts, monthlyBudget]
  );

  // Add cleanup
  useEffect(() => {
    if (monthlyBudget) {
      debouncedCalculate();
    }
    return () => {
      debouncedCalculate.cancel();
    };
  }, [debts, monthlyBudget, debouncedCalculate]);

  const minimumPaymentsTotal = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const budgetNumber = parseFloat(monthlyBudget) || 0;
  const extraAmount = Math.max(0, budgetNumber - minimumPaymentsTotal);

  const savings = minimumResults && results 
    ? minimumResults.totalPaid - results.totalPaid 
    : 0;

  const timeSaved = minimumResults && results 
    ? minimumResults.totalMonths - results.totalMonths 
    : 0;

  // Memoize expensive calculations
  const sortedDebts = useMemo(() => 
    sortDebtsBySnowball(debts), 
    [debts]
  );

  const resultsSummary = useMemo(() => {
    if (!results || !minimumResults) return null;
    
    return {
      savings: minimumResults.totalPaid - results.totalPaid,
      timeSaved: minimumResults.totalMonths - results.totalMonths,
      interestSaved: minimumResults.totalInterest - results.totalInterest
    };
  }, [results, minimumResults]);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Add file size check
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setImportStatus({
        type: 'error',
        message: 'El archivo es demasiado grande. El tamaño máximo es 5MB'
      });
      return;
    }

    // Rest of the code...
  };

  const handleBudgetChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const sanitizedValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = sanitizedValue.split('.');
    const formattedValue = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : sanitizedValue;
      
    // Limit to 2 decimal places
    if (parts[1]?.length > CALCULATOR_CONSTANTS.INPUT_DECIMAL_PLACES) {
      return;
    }

    setMonthlyBudget(formattedValue);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora Método Bola de Nieve
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto Mensual para Deudas ($)</Label>
              <Input
                id="budget"
                type="text"
                value={monthlyBudget}
                onChange={(e) => handleBudgetChange(e.target.value)}
                placeholder="Ingresa tu presupuesto mensual"
                className={error ? 'border-red-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Pagos Mínimos Requeridos</Label>
              <div className="p-2 bg-muted rounded text-center font-semibold">
                {formatCurrency(minimumPaymentsTotal)}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dinero Extra Disponible</Label>
              <div className={`p-2 rounded text-center font-semibold ${
                extraAmount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {formatCurrency(extraAmount)}
              </div>
            </div>
          </div>

          {budgetNumber > 0 && budgetNumber < minimumPaymentsTotal && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">
                ⚠️ El presupuesto es insuficiente para cubrir los pagos mínimos requeridos.
              </p>
              <p className="text-red-700 text-sm mt-1">
                Necesitas al menos {formatCurrency(minimumPaymentsTotal)} mensuales.
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={calculateResults} 
            className="w-full"
            disabled={!monthlyBudget || debts.length === 0}
          >
            Calcular Plan de Pagos
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Calculando plan de pagos...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        results && (
          <Tabs defaultValue="snowball" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="snowball">Método Bola de Nieve</TabsTrigger>
              <TabsTrigger value="comparison">Comparación</TabsTrigger>
            </TabsList>

            <TabsContent value="snowball" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Tiempo para estar libre</p>
                    <p className="text-2xl font-bold">
                      {results.totalMonths} meses
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(results.totalMonths / 12)} años, {results.totalMonths % 12} meses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-muted-foreground">Total a pagar</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(results.totalPaid)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
                    <p className="text-sm text-muted-foreground">Total en intereses</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(results.totalInterest)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm text-muted-foreground">Fecha libre de deudas</p>
                    <p className="text-lg font-bold">
                      {formatDate(results.debtFreeDate)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Orden de Ataque (Método Bola de Nieve)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sortedDebts.map((debt, index) => (
                      <div key={debt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-semibold">{debt.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(debt.balance)} • {debt.interestRate}% • Min: {formatCurrency(debt.minimumPayment)}
                            </p>
                          </div>
                        </div>
                        {index === 0 && (
                          <Badge className="bg-red-500">
                            <Zap className="h-3 w-3 mr-1" />
                            Atacar primero
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              {minimumResults && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Método Bola de Nieve</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Tiempo total:</span>
                        <span className="font-semibold">{results.totalMonths} meses</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total a pagar:</span>
                        <span className="font-semibold">{formatCurrency(results.totalPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Intereses totales:</span>
                        <span className="font-semibold">{formatCurrency(results.totalInterest)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Solo Pagos Mínimos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Tiempo total:</span>
                        <span className="font-semibold">
                          {minimumResults.totalMonths >= 600 ? '50+ años' : `${minimumResults.totalMonths} meses`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total a pagar:</span>
                        <span className="font-semibold">{formatCurrency(minimumResults.totalPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Intereses totales:</span>
                        <span className="font-semibold">{formatCurrency(minimumResults.totalInterest)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {resultsSummary && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-800">💰 Beneficios del Método Bola de Nieve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-green-700">Ahorras en total</p>
                        <p className="text-3xl font-bold text-green-800">
                          {formatCurrency(resultsSummary.savings)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-green-700">Te liberas</p>
                        <p className="text-3xl font-bold text-green-800">
                          {resultsSummary.timeSaved} meses antes
                        </p>
                        <p className="text-xs text-green-600">
                          ({Math.floor(resultsSummary.timeSaved / 12)} años, {resultsSummary.timeSaved % 12} meses)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )
      )}
    </div>
  );
}