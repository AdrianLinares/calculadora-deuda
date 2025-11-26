# 🌨️ Calculadora de Deudas - Método Bola de Nieve

Una aplicación web interactiva para gestionar y eliminar múltiples deudas utilizando la estrategia del **Método Bola de Nieve** (Snowball Method). Visualiza tu progreso, calcula planes de pago optimizados, y alcanza tu libertad financiera.

---

## 📋 Tabla de Contenidos

- [¿Qué hace esta app?](#qué-hace-esta-app)
- [Características principales](#características-principales)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Requisitos previos](#requisitos-previos)
- [Instalación paso a paso](#instalación-paso-a-paso)
- [Comandos disponibles](#comandos-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [¿Cómo funciona el código?](#cómo-funciona-el-código)
- [Contribuir](#contribuir)

---

## 🎯 ¿Qué hace esta app?

Esta calculadora te ayuda a:

1. **Registrar tus deudas**: Ingresa el saldo, tasa de interés, pago mínimo y fecha de inicio de cada deuda.
2. **Calcular un plan de pagos**: Basado en tu presupuesto mensual, la app genera un cronograma mes a mes.
3. **Método Bola de Nieve**: Ataca primero la deuda más pequeña (para motivación psicológica), mientras pagas el mínimo en las demás.
4. **Visualizar ahorros**: Compara cuánto pagarías solo con pagos mínimos vs. el método bola de nieve.
5. **Exportar datos**: Descarga tu plan en CSV para llevarlo a Excel o Google Sheets.

---

## ✨ Características principales

- **🎴 Gestión de deudas**: Agrega, edita y elimina deudas fácilmente
- **📊 Visualizaciones interactivas**: Gráficas de barras, pie charts y progreso en tiempo real
- **📅 Plan de pagos detallado**: Mes a mes, con intereses y saldos
- **🔄 Comparación automática**: Bola de nieve vs. solo pagos mínimos
- **💾 Persistencia local**: Tus datos se guardan en el navegador (localStorage)
- **📤 Exportar/Importar**: JSON y CSV compatibles
- **🎨 UI moderna**: Interfaz limpia con shadcn/ui y Tailwind CSS
- **📱 Responsive**: Funciona en desktop, tablet y móvil

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|-----------|-----|
| **React 19** | Framework principal (componentes y estado) |
| **TypeScript** | Tipado estático para evitar errores |
| **Vite** | Herramienta de desarrollo rápida |
| **Tailwind CSS** | Estilos utility-first |
| **shadcn/ui** | Componentes preconstruidos (botones, cards, etc.) |
| **Recharts** | Gráficas y visualizaciones |
| **React Router** | Navegación entre páginas |
| **Zustand** | Manejo de estado (opcional) |
| **pnpm** | Gestor de paquetes (más rápido que npm) |

---

## 📦 Requisitos previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js** (v18 o superior) → [Descargar aquí](https://nodejs.org/)
- **pnpm** (gestor de paquetes) → Instalar con:
  ```bash
  npm install -g pnpm
  ```

Para verificar que todo está instalado correctamente:

```bash
node --version   # Debe mostrar v18.x o superior
pnpm --version   # Debe mostrar 8.x o superior
```

---

## 🚀 Instalación paso a paso

### 1. Clona el repositorio

```bash
git clone https://github.com/AdrianLinares/calculadora-deuda.git
cd calculadora-deuda
```

### 2. Instala las dependencias

```bash
pnpm install
```

Esto descargará todas las librerías necesarias (puede tardar 1-2 minutos).

### 3. Inicia el servidor de desarrollo

```bash
pnpm run dev
```

Verás algo como:

```
  VITE v5.4.21  ready in 428 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Abre tu navegador

Ve a **http://localhost:5173/** y verás la aplicación funcionando. 🎉

---

## 📝 Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm install` | Instala todas las dependencias del proyecto |
| `pnpm run dev` | Inicia el servidor de desarrollo (puerto 5173) |
| `pnpm run build` | Compila la app para producción (carpeta `dist/`) |
| `pnpm run preview` | Previsualiza la versión compilada |
| `pnpm run lint` | Revisa errores de código con ESLint |

### Ejemplos comunes

```bash
# Agregar una nueva dependencia
pnpm add nombre-libreria

# Actualizar dependencias
pnpm update

# Limpiar caché y reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 📂 Estructura del proyecto

```
calculadora-deuda/
├── public/              # Archivos estáticos (favicon, etc.)
├── src/
│   ├── components/      # Componentes React reutilizables
│   │   ├── ui/          # Componentes de shadcn/ui (Button, Card, etc.)
│   │   ├── Charts.tsx         # Gráficas (Recharts)
│   │   ├── DebtForm.tsx       # Formulario para agregar deudas
│   │   ├── DebtList.tsx       # Lista de deudas (grid/table)
│   │   ├── SnowballCalculator.tsx  # Calculadora principal
│   │   └── PaymentPlan.tsx    # Tabla de plan de pagos
│   ├── hooks/           # Custom hooks (useLocalStorage, etc.)
│   ├── lib/             # Lógica de negocio y utilidades
│   │   ├── debtCalculations.ts  # ⭐ Algoritmo del método bola de nieve
│   │   ├── constants.ts         # Constantes globales
│   │   └── utils.ts             # Funciones helper (formateo, etc.)
│   ├── pages/           # Páginas de la app
│   │   ├── Index.tsx    # Página principal
│   │   └── NotFound.tsx # 404
│   ├── App.tsx          # Componente raíz (Router, ErrorBoundary)
│   ├── main.tsx         # Punto de entrada (ReactDOM.render)
│   └── index.css        # Estilos globales (Tailwind)
├── index.html           # HTML base
├── package.json         # Dependencias y scripts
├── tsconfig.json        # Configuración de TypeScript
├── vite.config.ts       # Configuración de Vite
├── tailwind.config.ts   # Configuración de Tailwind
└── README.md            # Este archivo 📖
```

### Archivos clave para entender

1. **`src/lib/debtCalculations.ts`**: Aquí está la lógica del método bola de nieve (cálculos mes a mes).
2. **`src/pages/Index.tsx`**: Componente principal que orquesta todos los demás.
3. **`src/components/SnowballCalculator.tsx`**: UI para ingresar presupuesto y ver resultados.

---

## 🧠 ¿Cómo funciona el código?

### 1. Flujo principal

```
Usuario ingresa deudas → SnowballCalculator calcula plan → debtCalculations.ts procesa lógica 
→ PaymentPlan muestra tabla → Charts visualiza gráficas
```

### 2. Algoritmo del Método Bola de Nieve

**Archivo**: `src/lib/debtCalculations.ts`

```typescript
// Pseudocódigo simplificado
function calculateSnowballPlan(debts, monthlyBudget) {
  // 1. Ordenar deudas por saldo (menor a mayor)
  const sortedDebts = sortByBalance(debts);
  
  // 2. Para cada mes:
  while (hayDeudasPendientes) {
    // a) Pagar mínimos a todas las deudas
    pagarMinimos(debts);
    
    // b) Dinero extra = presupuesto - suma de mínimos
    const extra = monthlyBudget - totalMinimos;
    
    // c) Aplicar dinero extra a la deuda más pequeña
    aplicarExtraAPrimeraDeuda(sortedDebts[0], extra);
    
    // d) Si una deuda se paga, el extra pasa a la siguiente
  }
  
  // 3. Retornar plan detallado y totales
  return { paymentPlan, totalInterest, debtFreeDate };
}
```

**Mejoras recientes**:
- ✅ Redondeo a 2 decimales para evitar errores de punto flotante
- ✅ Rollover de dinero extra si una deuda se paga antes del mes
- ✅ Error explícito si el presupuesto < suma de mínimos

### 3. Persistencia de datos

Los datos se guardan automáticamente en `localStorage` del navegador:

```typescript
// src/hooks/useLocalStorage.ts
const [debts, setDebts] = useLocalStorage<Debt[]>('snowball-debts', []);
```

**Importante**: Si borras el historial del navegador, se pierden los datos. Para backups, usa el botón "Exportar JSON".

### 4. Componentes UI

Todos los botones, cards, inputs, etc. vienen de **shadcn/ui** (ya instalados en `src/components/ui/`). Ejemplo:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

<Card>
  <Button onClick={handleClick}>Calcular</Button>
</Card>
```

---

## 🤝 Contribuir

¿Quieres mejorar el proyecto? ¡Genial! Aquí hay algunas ideas:

### Ideas de mejoras

- [ ] Agregar autenticación (guardar datos en la nube)
- [ ] Modo oscuro (dark mode)
- [ ] Notificaciones por email cuando se pague una deuda
- [ ] Soporte para múltiples monedas
- [ ] Método Avalanche (ordenar por tasa de interés)
- [ ] Tests unitarios con Vitest

### Pasos para contribuir

1. **Fork** este repositorio
2. Crea una rama: `git checkout -b feature/mi-mejora`
3. Haz tus cambios y commit: `git commit -m "feat: agrega modo oscuro"`
4. Push: `git push origin feature/mi-mejora`
5. Abre un **Pull Request** en GitHub

### Reportar bugs

Si encuentras un error, [abre un issue](https://github.com/AdrianLinares/calculadora-deuda/issues) con:
- Descripción del problema
- Pasos para reproducirlo
- Capturas de pantalla (si aplica)

---

## 📚 Recursos para aprender

Si eres nuevo en estas tecnologías, aquí hay tutoriales recomendados:

- **React**: [Documentación oficial](https://react.dev/learn)
- **TypeScript**: [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- **Tailwind CSS**: [Guía básica](https://tailwindcss.com/docs/utility-first)
- **Vite**: [¿Por qué Vite?](https://vitejs.dev/guide/why.html)
- **shadcn/ui**: [Componentes](https://ui.shadcn.com/docs/components)

---

## 📄 Licencia

Este proyecto es de código abierto. Siéntete libre de usarlo y modificarlo.

---

## 👨‍💻 Autor

**Adrian Linares**  
GitHub: [@AdrianLinares](https://github.com/AdrianLinares)

---

## 🙏 Agradecimientos

- Inspirado por el método de Dave Ramsey
- UI components por [shadcn](https://ui.shadcn.com/)
- Comunidad de React y TypeScript

---

**¿Tienes preguntas?** Abre un [issue](https://github.com/AdrianLinares/calculadora-deuda/issues) o contáctame directamente.

¡Mucha suerte alcanzando tu libertad financiera! 💪💰
