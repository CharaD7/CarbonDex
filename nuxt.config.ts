export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt'
  ],

  css: [
    '@/assets/css/main.css',
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      kiteAIKey: process.env.KITE_AI_KEY,
      contractAddress: process.env.CONTRACT_ADDRESS,
      krakenApiKey: process.env.KRAKEN_API_KEY,
      krakenApiSecret: process.env.KRAKEN_API_SECRET
    }
  },

  compatibilityDate: '2025-02-11'
})