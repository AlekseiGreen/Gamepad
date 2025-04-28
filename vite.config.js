import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    wasm(), // Добавляет поддержку Wasm
    legacy({ 
      targets: ['defaults', 'not IE 11'], // Для совместимости
    }),
  ],
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d'], // Исключаем Wasm-модули из оптимизации
  },
  server: {
    fs: {
      allow: ['..'], // Разрешает доступ к Wasm-файлам
    },
  },
});