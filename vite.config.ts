import { defineConfig } from 'vite';

// Configuração do Vite: servidor de desenvolvimento em http://localhost:5173
export default defineConfig({
  base: './', // caminhos relativos, para o build funcionar em qualquer pasta
  server: {
    port: 5173,
    open: true, // abre o navegador automaticamente no "npm run dev"
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000, // o Phaser é grande; evita aviso desnecessário
  },
});
