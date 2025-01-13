import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
        '/langflow-api': {
            target: 'https://api.langflow.astra.datastax.com',
            changeOrigin: true,
            rewrite: (path) => {
                const rewritten = path.replace(/^\/langflow-api/, '');
                console.log('Proxy rewrite:', { original: path, rewritten });
                return rewritten;
            },
        }
    }
}
})