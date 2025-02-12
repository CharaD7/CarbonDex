<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <nav class="border-b bg-white dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center">
              <Icon name="carbon:carbon" class="h-8 w-8 text-green-600" />
              <span class="ml-2 text-xl font-bold">CarbonDEX</span>
            </NuxtLink>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NuxtLink to="/marketplace" class="inline-flex items-center px-1 pt-1 text-sm font-medium">
                <Icon name="carbon:shopping-cart" class="mr-2" />
                Marketplace
              </NuxtLink>
              <NuxtLink to="/analytics" class="inline-flex items-center px-1 pt-1 text-sm font-medium">
                <Icon name="carbon:chart-line" class="mr-2" />
                Analytics
              </NuxtLink>
            </div>
          </div>
          <div class="flex items-center">
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
    <slot />
  </div>
</template>