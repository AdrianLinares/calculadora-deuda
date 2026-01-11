export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  startDate: string;
}

export interface PaymentMonth {
  month: number;
  date: string;
  debts: {
    id: string;
    name: string;
    startingBalance: number;
    payment: number;
    interestPaid: number;
    principalPaid: number;
    endingBalance: number;
    isCompleted: boolean;
  }[];
  totalPayment: number;
  totalInterest: number;
  remainingDebts: number;
}

/**
 * Calcula el interés mensual de una deuda
 * @param balance - Saldo actual de la deuda
 * @param annualRate - Tasa de interés anual en porcentaje (0-100)
 * @returns Interés mensual calculado
 * @example
 * calculateMonthlyInterest(1000, 12) // 10
 */
export function calculateMonthlyInterest(balance: number, annualRate: number): number {
  return (balance * (annualRate / 100)) / 12;
}

/**
 * Ordena deudas por método bola de nieve (de menor a mayor saldo)
 * @param debts - Array de deudas a ordenar
 * @returns Nuevo array ordenado de menor a mayor saldo
 */
export function sortDebtsBySnowball(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => a.balance - b.balance);
}

/**
 * Ordena deudas por método avalancha (de mayor a menor tasa de interés)
 * @param debts - Array de deudas a ordenar
 * @returns Nuevo array ordenado por tasa de interés descendente
 */
export function sortDebtsByAvalanche(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => b.interestRate - a.interestRate);
}

/**
 * Calcula el plan de pago usando el método bola de nieve
 * @param debts - Array de deudas
 * @param monthlyBudget - Presupuesto mensual disponible
 * @returns Plan de pago con detalles mensuales y totales
 * @throws Error con código 'INSUFFICIENT_BUDGET' si el presupuesto es menor que los pagos mínimos
 */
export function calculateSnowballPlan(debts: Debt[], monthlyBudget: number): {
  paymentPlan: PaymentMonth[];
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
  debtFreeDate: string;
} {
  const MAX_MONTHS = 600; // 50 años máximo

  if (debts.length === 0 || monthlyBudget <= 0) {
    return {
      paymentPlan: [],
      totalMonths: 0,
      totalInterest: 0,
      totalPaid: 0,
      debtFreeDate: new Date().toISOString().split('T')[0]
    };
  }

  const sortedDebts = sortDebtsBySnowball(debts);
  const workingDebts = sortedDebts.map(debt => ({ ...debt }));
  const paymentPlan: PaymentMonth[] = [];
  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // Normalize to start of day

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  let appliedExtraThisMonth = false;
  while (workingDebts.some(debt => debt.balance > 0)) {
    month++;
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + month - 1);

    const monthData: PaymentMonth = {
      month,
      date: currentDate.toISOString().split('T')[0],
      debts: [],
      totalPayment: 0,
      totalInterest: 0,
      remainingDebts: workingDebts.filter(d => d.balance > 0).length
    };

    // Calculate minimum payments total
    const minimumTotal = workingDebts
      .filter(debt => debt.balance > 0)
      .reduce((sum, debt) => sum + debt.minimumPayment, 0);

    if (minimumTotal > monthlyBudget) {
      throw new Error('INSUFFICIENT_BUDGET');
    }

    // Extra amount for snowball (only first unpaid debt gets it unless leftover remains)
    let extraAmount = monthlyBudget - minimumTotal;
    appliedExtraThisMonth = false;

    // Process each debt
    for (const debt of workingDebts) {
      if (debt.balance <= 0) {
        monthData.debts.push({
          id: debt.id,
          name: debt.name,
          startingBalance: 0,
          payment: 0,
          interestPaid: 0,
          principalPaid: 0,
          endingBalance: 0,
          isCompleted: true
        });
        continue;
      }

      const startingBalance = debt.balance;
      const monthlyInterest = calculateMonthlyInterest(debt.balance, debt.interestRate);

      // Determine payment amount (minimum + possible extra only once per month)
      let payment = debt.minimumPayment;
      if (!appliedExtraThisMonth && extraAmount > 0) {
        payment += extraAmount;
        appliedExtraThisMonth = true;
        extraAmount = 0;
      }

      // Cap at balance + interest; carry leftover to next debt
      const maxPayment = debt.balance + monthlyInterest;
      if (payment > maxPayment) {
        const leftover = payment - maxPayment;
        payment = maxPayment;
        // Allow leftover to be applied to next debt in same month
        extraAmount += leftover;
      }

      const interestPaid = round2(monthlyInterest);
      const principalPaid = round2(payment - interestPaid);
      const endingBalance = round2(Math.max(0, debt.balance - principalPaid));

      debt.balance = endingBalance;
      totalInterest += interestPaid;
      totalPaid += payment;

      monthData.debts.push({
        id: debt.id,
        name: debt.name,
        startingBalance,
        payment,
        interestPaid,
        principalPaid,
        endingBalance,
        isCompleted: endingBalance === 0
      });

      monthData.totalPayment += payment;
      monthData.totalInterest += interestPaid;
    }

    paymentPlan.push(monthData);

    // Safety check to prevent infinite loops
    if (month > MAX_MONTHS) {
      console.warn(`Debt payoff exceeds ${MAX_MONTHS} months (50 years)`);
      break;
    }
  }

  const debtFreeDate = new Date(startDate);
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

  // Round aggregate totals
  totalInterest = round2(totalInterest);
  totalPaid = round2(totalPaid);
  return {
    paymentPlan,
    totalMonths: month,
    totalInterest,
    totalPaid,
    debtFreeDate: debtFreeDate.toISOString().split('T')[0]
  };
}

/**
 * Calcula el tiempo y costo de pagar solo el m\u00ednimo de cada deuda
 * @param debts - Array de deudas
 * @returns Total de meses, inter\u00e9s y monto pagado con solo m\u00ednimos\n */
export function calculateMinimumOnlyPlan(debts: Debt[]): {
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
} {
  let totalInterest = 0;
  let totalPaid = 0;
  let maxMonths = 0;

  for (const debt of debts) {
    if (debt.balance === 0 || debt.minimumPayment === 0) continue;

    const monthlyRate = debt.interestRate / 100 / 12;
    let balance = debt.balance;
    let months = 0;
    let interestPaid = 0;

    if (monthlyRate === 0) {
      // No interest case
      months = Math.ceil(balance / debt.minimumPayment);
      totalPaid += balance;
    } else {
      // With interest
      while (balance > 0.01 && months < 600) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = Math.max(0, debt.minimumPayment - interestPayment);

        if (principalPayment <= 0) {
          // Minimum payment doesn't cover interest - debt will never be paid off
          months = 600;
          break;
        }

        balance -= principalPayment;
        interestPaid += interestPayment;
        months++;
      }

      totalPaid += debt.balance + interestPaid;
    }

    totalInterest += interestPaid;
    maxMonths = Math.max(maxMonths, months);
  }

  return {
    totalMonths: maxMonths,
    totalInterest,
    totalPaid
  };
}