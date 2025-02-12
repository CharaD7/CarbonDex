<template>
  <div>
    <!-- Hero Section -->
    <section class="py-20 px-4 text-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-6">
          Decentralized Carbon Credit Marketplace
        </h1>
        <p class="text-xl mb-8 text-gray-600 dark:text-gray-300">
          Trade carbon credits securely and transparently on the blockchain
        </p>
        <div class="flex justify-center gap-4">
          <NuxtLink to="/marketplace">
            <UButton size="lg">
              Start Trading
            </UButton>
          </NuxtLink>
          <NuxtLink to="/learn">
            <UButton variant="outline" size="lg">
              Learn More
            </UButton>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 px-4">
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <UCard>
          <template #header>
            <Icon name="carbon:tree" class="h-12 w-12 text-green-600" />
            <h3 class="text-xl font-semibold mt-4">Verified Credits</h3>
          </template>
          <p class="text-gray-600 dark:text-gray-300">
            All carbon credits are verified using blockchain technology
          </p>
        </UCard>

        <UCard>
          <template #header>
            <Icon name="carbon:ai-status" class="h-12 w-12 text-blue-600" />
            <h3 class="text-xl font-semibold mt-4">AI-Powered Analytics</h3>
          </template>
          <p class="text-gray-600 dark:text-gray-300">
            Real-time insights and predictive modeling with Kite AI
          </p>
        </UCard>

        <UCard>
          <template #header>
            <Icon name="carbon:security" class="h-12 w-12 text-purple-600" />
            <h3 class="text-xl font-semibold mt-4">Secure Trading</h3>
          </template>
          <p class="text-gray-600 dark:text-gray-300">
            Enterprise-grade security for all transactions
          </p>
        </UCard>
      </div>
    </section>
  </div>
</template>