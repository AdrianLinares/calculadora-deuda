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

/**
 * Hook personalizado para gestionar el formulario de deudas
 * @param initialDebt - Deuda inicial para edición
 * @param onSuccess - Callback ejecutado al éxito
 * @returns Objeto con estado y handlers del formulario
 */
export function useDebtForm({ initialDebt, onSuccess }: UseDebtFormProps = {}): {
    formData: FormData;
    errors: Record<string, string>;
    isLoading: boolean;
    handleInputChange: (field: string, value: string) => void;
    validateForm: () => boolean;
    reset: () => void;
    getDebtData: () => Omit<Debt, 'id'> | null;
    setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
    setIsLoading: (loading: boolean) => void;
    setErrors: (errors: Record<string, string>) => void;
} {
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
        setFormData((prev: FormData) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
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
