import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Debt, PaymentMonth, sortDebtsBySnowball } from '@/lib/debtCalculations';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from 'react-error-boundary';

interface ChartsProps {
  debts: Debt[];
  paymentPlan?: PaymentMonth[];
}

// Add runtime validation
const validateProps = (props: ChartsProps) => {
  if (!Array.isArray(props.debts)) {
    throw new Error('debts must be an array');
  }
  if (props.paymentPlan && !Array.isArray(props.paymentPlan)) {
    throw new Error('paymentPlan must be an array if provided');
  }
};

const CHART_CONSTANTS = {
  HEIGHT: 320,
  MAX_NAME_LENGTH: 15,
  MAX_TIMELINE_MONTHS: 24,
  MAX_BREAKDOWN_MONTHS: 12,
  COLORS: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'],
  CHART_MARGIN: { top: 20, right: 30, left: 20, bottom: 5 }
} as const;

export function Charts({ debts, paymentPlan }: ChartsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Memoize expensive calculations
  const debtComparisonData = useMemo(() => 
    sortDebtsBySnowball(debts).map((debt, index) => ({
      name: debt.name.length > 15 ? debt.name.substring(0, 15) + '...' : debt.name,
      saldo: debt.balance,
      tasa: debt.interestRate,
      pagoMinimo: debt.minimumPayment,
      orden: index + 1
    })), [debts]
  );

  // Prepare data for progress timeline
  const timelineData = useMemo(() => 
    paymentPlan?.slice(0, Math.min(24, paymentPlan.length)).map(month => {
      const totalRemaining = month.debts.reduce((sum, debt) => sum + debt.endingBalance, 0);
      // Calculate total paid based on actual payment plan data
      const totalPaid = month.debts.reduce((sum, debt) => sum + (debt.startingBalance - debt.endingBalance), 0);
      
      return {
        mes: month.month,
        fecha: new Date(month.date).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        saldoRestante: totalRemaining,
        totalPagado: totalPaid,
        deudasRestantes: month.remainingDebts
      };
    }) || [], [paymentPlan]
  );

  // Prepare data for debt distribution pie chart
  const pieData = debts.map(debt => ({
    name: debt.name.length > 20 ? debt.name.substring(0, 20) + '. .' : debt.name,
    value: debt.balance,
    percentage: ((debt.balance / debts.reduce((sum, d) => sum + d.balance, 0)) * 100).toFixed(1)
  }));

  // Prepare monthly payment breakdown data
  const monthlyBreakdownData = paymentPlan?.slice(0, 12).map(month => ({
    mes: month.month,
    fecha: new Date(month.date).toLocaleDateString('es-MX', { month: 'short' }),
    pagoTotal: month.totalPayment,
    intereses: month.totalInterest,
    principal: month.totalPayment - month.totalInterest
  })) || [];

  useEffect(() => {
    let isSubscribed = true;

    const timer = setTimeout(() => {
      if (isSubscribed) {
        setIsLoading(false);
      }
    }, 1000);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, []);

  // Replace current loading state with skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12">
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-4 w-[250px] mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (debts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No hay datos de deudas</h3>
            <p className="text-gray-600">Agrega deudas para ver el análisis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ChartErrorFallback = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Error al cargar gráficas</h3>
          <p className="text-gray-600">Por favor, intente de nuevo más tarde</p>
        </div>
      </CardContent>
    </Card>
  );

  const responsiveText = {
    style: {
      fontSize: window.innerWidth < 768 ? '10px' : '12px'
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    
    return (
      <div className="bg-white p-4 rounded shadow-lg border">
        <p className="font-semibold">{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} style={{ color: item.color }}>
            {`${item.name}: ${formatCurrency(item.value)}`}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Debt Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación de Deudas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={debtComparisonData} margin={CHART_CONSTANTS.CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" {...responsiveText} />
                <YAxis tickFormatter={formatCurrency} {...responsiveText} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="saldo" 
                  fill="#3b82f6" 
                  name="Saldo"
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Debt Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Deudas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  nameKey="name"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_CONSTANTS.COLORS[index % CHART_CONSTANTS.COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Progress Timeline Chart */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progreso de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={CHART_CONSTANTS.CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" {...responsiveText} />
                  <YAxis tickFormatter={formatCurrency} {...responsiveText} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'deudasRestantes' ? value : formatCurrency(value),
                      name === 'saldoRestante' ? 'Saldo Restante' :
                      name === 'totalPagado' ? 'Total Pagado' :
                      name === 'deudasRestantes' ? 'Deudas Restantes' : name
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldoRestante" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name="saldoRestante"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalPagado" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    name="totalPagado"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Saldo Restante</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Total Pagado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Payment Breakdown */}
      {monthlyBreakdownData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose de Pagos Mensuales (Primeros 12 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBreakdownData} margin={CHART_CONSTANTS.CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" {...responsiveText} />
                  <YAxis tickFormatter={formatCurrency} {...responsiveText} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="principal" stackId="a" fill="#22c55e" name="Principal" />
                  <Bar dataKey="intereses" stackId="a" fill="#ef4444" name="Intereses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Pago a Principal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Pago de Intereses</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}