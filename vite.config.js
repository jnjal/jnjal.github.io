import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // جدا کردن چانک وندور (ری‌اکت) — برای کش تکراربازدید
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react'
          }
          // موتور انیمیشن جدا می‌مونه تا با آپدیت محتوا کشش باطل نشه
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
            return 'motion'
          }
        },
      },
    },
  },
})
