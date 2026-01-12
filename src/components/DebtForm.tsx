import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Debt } from '@/lib/debtCalculations';
import { DEBT_LIMITS } from '@/lib/constants';

interface DebtFormProps {
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  editingDebt?: Debt;
  onUpdateDebt?: (debt: Debt) => void;
  onCancel?: () => void;
}

export function DebtForm({ onAddDebt, editingDebt, onUpdateDebt, onCancel }: DebtFormProps) {
  const [formData, setFormData] = useState({
    name: editingDebt?.name || '',
    balance: editingDebt?.balance?.toString() || '',
    interestRate: editingDebt?.interestRate?.toString() || '',
    minimumPayment: editingDebt?.minimumPayment?.toString() || '',
    startDate: editingDebt?.startDate || new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // Add max length validation
    if (formData.name.length > DEBT_LIMITS.MAX_NAME_LENGTH) {
      newErrors.name = `El nombre es demasiado largo (máximo ${DEBT_LIMITS.MAX_NAME_LENGTH} caracteres)`;
    }

    const balance = parseFloat(formData.balance.replace(/,/g, ''));
    if (isNaN(balance) || balance <= 0) {
      newErrors.balance = 'El saldo debe ser mayor a 0';
    }

    // Add maximum validation
    if (balance > DEBT_LIMITS.MAX_BALANCE) {
      newErrors.balance = 'El saldo excede el límite permitido';
    }

    // Add decimal places validation
    const cleanBalance = formData.balance.replace(/,/g, '');
    if (cleanBalance.includes('.') &&
      cleanBalance.split('.')[1].length > DEBT_LIMITS.DECIMAL_PLACES) {
      newErrors.balance = `Máximo ${DEBT_LIMITS.DECIMAL_PLACES} decimales permitidos`;
    }

    const interestRate = parseFloat(formData.interestRate);
    if (isNaN(interestRate) || interestRate < DEBT_LIMITS.MIN_INTEREST_RATE || interestRate > DEBT_LIMITS.MAX_INTEREST_RATE) {
      newErrors.interestRate = `La tasa debe estar entre ${DEBT_LIMITS.MIN_INTEREST_RATE} y ${DEBT_LIMITS.MAX_INTEREST_RATE}%`;
    }

    const minimumPayment = parseFloat(formData.minimumPayment.replace(/,/g, ''));
    if (isNaN(minimumPayment) || minimumPayment <= 0) {
      newErrors.minimumPayment = 'El pago mínimo debe ser mayor a 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const debtData = {
        name: formData.name.trim(),
        balance: parseFloat(formData.balance.replace(/,/g, '')),
        interestRate: parseFloat(formData.interestRate),
        minimumPayment: parseFloat(formData.minimumPayment.replace(/,/g, '')),
        startDate: formData.startDate
      };

      if (editingDebt && onUpdateDebt) {
        await onUpdateDebt({ ...debtData, id: editingDebt.id });
      } else {
        await onAddDebt(debtData);
      }

      // Reset form
      setFormData({
        name: '',
        balance: '',
        interestRate: '',
        minimumPayment: '',
        startDate: new Date().toISOString().split('T')[0]
      });
      setErrors({});
      setIsDirty(false);

      // Close form after successful submission
      onCancel?.();
    } catch (error) {
      console.error('Error submitting debt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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

  const formatNumberInput = (value: string, decimals: number = 2): string => {
    const regex = new RegExp(`^-?\\d*\\.?\\d{0,${decimals}}$`);
    return regex.test(value) ? value : value.slice(0, -1);
  };

  const formatCurrency = (value: string): string => {
    const number = value.replace(/[^\d.]/g, '');
    const parts = number.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Use in balance and minimum payment inputs
  const handleCurrencyInput = (field: string, value: string) => {
    const formattedValue = formatCurrency(value);
    handleInputChange(field, formattedValue);
  };

  // Add unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty && !window.confirm('¿Deseas descartar los cambios?')) {
      return;
    }
    setFormData({
      name: '',
      balance: '',
      interestRate: '',
      minimumPayment: '',
      startDate: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    setIsDirty(false);
    onCancel?.();
  };

  const ErrorSummary = ({ errors }: { errors: Record<string, string> }) => {
    if (Object.keys(errors).length === 0) return null;

    return (
      <div className="bg-red-50 p-4 rounded-md mb-4">
        <h3 className="text-red-800 font-medium mb-2">Por favor corrige los siguientes errores:</h3>
        <ul className="list-disc pl-4 text-red-700">
          {Object.values(errors).map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingDebt ? 'Editar Deuda' : 'Agregar Nueva Deuda'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorSummary errors={errors} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Acreedor/Deuda</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Tarjeta de Crédito Banco X"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Saldo Total ($)</Label>
              <Input
                id="balance"
                type="text"
                value={formData.balance}
                onChange={(e) => handleCurrencyInput('balance', e.target.value)}
                className={errors.balance ? 'border-red-500' : ''}
              />
              {errors.balance && <p className="text-sm text-red-500">{errors.balance}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Tasa de Interés Anual (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                placeholder="0.00"
                className={errors.interestRate ? 'border-red-500' : ''}
              />
              {errors.interestRate && <p className="text-sm text-red-500">{errors.interestRate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumPayment">Pago Mínimo Mensual ($)</Label>
              <Input
                id="minimumPayment"
                type="text"
                value={formData.minimumPayment}
                onChange={(e) => handleCurrencyInput('minimumPayment', e.target.value)}
                className={errors.minimumPayment ? 'border-red-500' : ''}
              />
              {errors.minimumPayment && <p className="text-sm text-red-500">{errors.minimumPayment}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {editingDebt ? 'Actualizar Deuda' : 'Agregar Deuda'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}