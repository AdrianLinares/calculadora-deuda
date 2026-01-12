import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    viteSourceLocator({
      prefix: "mgx",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separar vendor chunks para mejor caching
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui')) {
              return 'vendor-radix-ui';
            }
            if (id.includes('recharts')) {
              return 'vendor-chart';
            }
            if (id.includes('sonner')) {
              return 'vendor-toast';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            return 'vendor-other';
          }
          // Separar componentes principales
          if (id.includes('components/DebtForm') || id.includes('components/DebtList') || id.includes('components/DataManager')) {
            return 'components-debt';
          }
          if (id.includes('components/SnowballCalculator') || id.includes('components/PaymentPlan')) {
            return 'components-calculator';
          }
          if (id.includes('components/Charts')) {
            return 'components-charts';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}))
