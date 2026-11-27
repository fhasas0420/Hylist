<template>
  <div class="flex min-h-screen flex-col">
    <WelcomeNavbar />
    <main class="flex-1">
      <slot />
    </main>
    <WelcomeFooter />
  </div>
</template>
