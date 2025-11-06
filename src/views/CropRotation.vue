<template>
  <div class="py-8">
    <h2 class="text-3xl font-bold text-primary mb-6">Crop Rotation Planner</h2>
    
    <div class="bg-white dark:bg-gray-800 rounded-card p-8 max-w-2xl border-2 border-gray-200 dark:border-gray-700">
      <CropRotationPlanner />
    </div>
  </div>
</template>

<script setup lang="ts">
import CropRotationPlanner from '../components/CropRotationPlanner.vue'
</script>
