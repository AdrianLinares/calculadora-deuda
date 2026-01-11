# 🛠️ GUÍA DE MEJORAS RECOMENDADAS - CAMBIOS ESPECÍFICOS

## 1. Habilitar TypeScript Strict Mode

**Archivo:** `tsconfig.json`

Cambiar de:
```json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "noUnusedParameters": false,
    "skipLibCheck": true,
    "allowJs": true,
    "noUnusedLocals": false,
    "strictNullChecks": false
  }
}
```

A:
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "allowJs": true,
    "noUnusedLocals": true,
    "strictNullChecks": true,
    "strict": true,
    "noImplicitThis": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 2. Mejorar configuración de ESLint

**Archivo:** `eslint.config.js`

Cambiar la sección de rules a:
```javascript
rules: {
  ...reactHooks.configs.recommended.rules,
  "react-refresh/only-export-components": [
    "warn",
    { allowConstantExport: true },
  ],
  "@typescript-eslint/no-unused-vars": [
    "warn",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_"
    }
  ],
  "@typescript-eslint/explicit-function-return-types": [
    "warn",
    { allowExpressions: true }
  ],
  "@typescript-eslint/no-explicit-any": "warn",
  "no-console": ["warn", { allow: ["warn", "error"] }]
}
```

---

## 3. Extender constants.ts

**Archivo:** `src/lib/constants.ts`

Agregar:
```typescript
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['application/json', 'text/csv'] as const,
} as const;

export const DEBT_LIMITS = {
  MAX_BALANCE: 999999999,
  MIN_BALANCE: 0.01,
  MAX_INTEREST_RATE: 100,
  MIN_INTEREST_RATE: 0,
  MAX_NAME_LENGTH: 100,
  DECIMAL_PLACES: 2,
} as const;

export const CALCULATION_LIMITS = {
  MAX_MONTHS: 600, // 50 años máximo
  MIN_MONTHLY_BUDGET: 0.01,
  DEBOUNCE_MS: 500,
  CHART_HEIGHT: 320,
  CHART_MAX_NAME_LENGTH: 15,
} as const;

export const DATE_FORMAT_OPTIONS = {
  SHORT: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  LONG: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
} as const;
```

---

## 4. Mejorar debtCalculations.ts con JSDoc

**Archivo:** `src/lib/debtCalculations.ts`

Agregar JSDoc a todas las funciones:

```typescript
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
export function calculateSnowballPlan(
  debts: Debt[],
  monthlyBudget: number
): {
  paymentPlan: PaymentMonth[];
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
  debtFreeDate: string;
} {
  // ... implementación
}
```

---

## 5. Mejorar validación en DataManager.tsx

**Archivo:** `src/components/DataManager.tsx`

Agregar función de validación mejorada:

```typescript
import { DEBT_LIMITS } from '@/lib/constants';

/**
 * Valida que un objeto sea una deuda válida
 * @param debt - Objeto a validar
 * @returns true si la deuda es válida
 */
function validateDebt(debt: unknown): debt is Debt {
  if (!debt || typeof debt !== 'object') return false;
  
  const d = debt as Record<string, unknown>;
  
  return (
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    d.name.length > 0 &&
    d.name.length <= DEBT_LIMITS.MAX_NAME_LENGTH &&
    typeof d.balance === 'number' &&
    d.balance > DEBT_LIMITS.MIN_BALANCE &&
    d.balance <= DEBT_LIMITS.MAX_BALANCE &&
    typeof d.interestRate === 'number' &&
    d.interestRate >= DEBT_LIMITS.MIN_INTEREST_RATE &&
    d.interestRate <= DEBT_LIMITS.MAX_INTEREST_RATE &&
    typeof d.minimumPayment === 'number' &&
    d.minimumPayment > DEBT_LIMITS.MIN_BALANCE &&
    d.minimumPayment <= d.balance &&
    typeof d.startDate === 'string' &&
    !isNaN(Date.parse(d.startDate))
  );
}

// Usarla en la validación:
const validatedDebts: Debt[] = importData.debts.filter(validateDebt);
if (validatedDebts.length !== importData.debts.length) {
  throw new Error(`${importData.debts.length - validatedDebts.length} deudas inválidas fueron descartadas`);
}
```

---

## 6. Mejorar error handling en PaymentPlan.tsx

**Archivo:** `src/components/PaymentPlan.tsx`

Cambiar de:
```tsx
console.error('Export failed:', error);
```

A:
```tsx
console.error('Export failed:', error);
toast({
  title: "Error",
  description: "No se pudo exportar el plan de pago. Por favor intenta nuevamente.",
  variant: "destructive",
});
```

---

## 7. Crear hook personalizado para formulario de deudas

**Archivo (nuevo):** `src/hooks/useDebtForm.ts`

```typescript
import { useState, useCallback } from 'react';
import { Debt } from '@/lib/debtCalculations';
import { DEBT_LIMITS } from '@/lib/constants';

interface FormData {
  name: string;
  balance: string;
  interestRate: string;
  minimumPayment: string;
  startDate: string;
}

interface UseDebtFormProps {
  initialDebt?: Debt;
  onSuccess?: () => void;
}

export function useDebtForm({ initialDebt, onSuccess }: UseDebtFormProps = {}) {
  const [formData, setFormData] = useState<FormData>({
    name: initialDebt?.name || '',
    balance: initialDebt?.balance?.toString() || '',
    interestRate: initialDebt?.interestRate?.toString() || '',
    minimumPayment: initialDebt?.minimumPayment?.toString() || '',
    startDate: initialDebt?.startDate || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length > DEBT_LIMITS.MAX_NAME_LENGTH) {
      newErrors.name = `El nombre no debe exceder ${DEBT_LIMITS.MAX_NAME_LENGTH} caracteres`;
    }

    const balance = parseFloat(formData.balance);
    if (isNaN(balance) || balance <= 0) {
      newErrors.balance = 'El saldo debe ser mayor a 0';
    } else if (balance > DEBT_LIMITS.MAX_BALANCE) {
      newErrors.balance = 'El saldo excede el límite permitido';
    }

    const interestRate = parseFloat(formData.interestRate);
    if (
      isNaN(interestRate) ||
      interestRate < DEBT_LIMITS.MIN_INTEREST_RATE ||
      interestRate > DEBT_LIMITS.MAX_INTEREST_RATE
    ) {
      newErrors.interestRate = `La tasa debe estar entre ${DEBT_LIMITS.MIN_INTEREST_RATE} y ${DEBT_LIMITS.MAX_INTEREST_RATE}%`;
    }

    const minimumPayment = parseFloat(formData.minimumPayment);
    if (isNaN(minimumPayment) || minimumPayment <= 0) {
      newErrors.minimumPayment = 'El pago mínimo debe ser mayor a 0';
    } else if (minimumPayment > balance) {
      newErrors.minimumPayment = 'El pago mínimo no puede ser mayor al saldo';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const reset = useCallback((): void => {
    setFormData({
      name: '',
      balance: '',
      interestRate: '',
      minimumPayment: '',
      startDate: new Date().toISOString().split('T')[0],
    });
    setErrors({});
  }, []);

  const getDebtData = (): Omit<Debt, 'id'> | null => {
    if (!validateForm()) return null;

    return {
      name: formData.name.trim(),
      balance: parseFloat(formData.balance),
      interestRate: parseFloat(formData.interestRate),
      minimumPayment: parseFloat(formData.minimumPayment),
      startDate: formData.startDate,
    };
  };

  return {
    formData,
    errors,
    isLoading,
    handleInputChange,
    validateForm,
    reset,
    getDebtData,
    setFormData,
    setIsLoading,
    setErrors,
  };
}
```

---

## 8. Optimizar App.tsx para lazy loading

**Archivo:** `src/App.tsx`

Cambiar de:
```tsx
import Index from './pages/Index';
import NotFound from './pages/NotFound';
```

A:
```tsx
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const Index = lazy(() => import('./pages/Index'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div className="p-4">
    <Skeleton className="h-96 w-full" />
  </div>
);

// En el JSX:
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</Suspense>
```

---

## 9. Mejorar uso de constantes en DebtForm.tsx

**Archivo:** `src/components/DebtForm.tsx`

Cambiar de:
```tsx
const FORM_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_BALANCE: 999999999,
  MAX_DECIMALS: 2,
  MIN_INTEREST_RATE: 0,
  MAX_INTEREST_RATE: 100,
} as const;
```

A:
```tsx
import { DEBT_LIMITS, CALCULATION_LIMITS } from '@/lib/constants';

// Luego usar:
if (formData.name.length > DEBT_LIMITS.MAX_NAME_LENGTH) {
  newErrors.name = `El nombre es demasiado largo (máximo ${DEBT_LIMITS.MAX_NAME_LENGTH} caracteres)`;
}
```

---

## 10. Agregar tipos explícitos a funciones

**Archivo:** `src/components/SnowballCalculator.tsx`

Cambiar de:
```tsx
const calculateResults = () => {
```

A:
```tsx
const calculateResults = (): void => {
  try {
    // ...
  } catch (error) {
    // ...
  }
};
```

---

## 📋 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Semana 1:**
   - [ ] Habilitar TypeScript strict mode (tsconfig.json)
   - [ ] Mejorar ESLint (eslint.config.js)
   - [ ] Extender constants.ts

2. **Semana 2:**
   - [ ] Agregar JSDoc a debtCalculations.ts
   - [ ] Mejorar validación en DataManager.tsx
   - [ ] Mejorar error handling en PaymentPlan.tsx

3. **Semana 3:**
   - [ ] Crear hook useDebtForm
   - [ ] Refactorizar DebtForm.tsx
   - [ ] Agregar tipos explícitos a funciones

4. **Semana 4:**
   - [ ] Implementar lazy loading en App.tsx
   - [ ] Optimizar Charts y PaymentPlan
   - [ ] Testing y revisión final

---

## ✅ TESTING DESPUÉS DE CAMBIOS

Después de implementar los cambios, ejecutar:

```bash
# Verificar tipos
pnpm exec tsc --noEmit

# Lint
pnpm run lint

# Build
pnpm run build

# Dev
pnpm run dev
```

---

*Última actualización: 11/01/2026*
