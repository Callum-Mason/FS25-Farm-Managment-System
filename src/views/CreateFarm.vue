<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- Header Section -->
    <div class="bg-white/80 dark:bg-surface/80 backdrop-blur-sm border-b border-primary/10 dark:border-primary/20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-4 shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">
            Create Your Farm
          </h1>
          <p class="text-sm sm:text-lg text-text/70 max-w-2xl mx-auto">
            {{ stepTitles[currentStep - 1] }}
          </p>
        </div>

        <!-- Step Progress Breadcrumbs -->
        <div class="bg-white/90 dark:bg-surface/90 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10 dark:border-primary/20 p-4">
          <div class="flex items-center justify-between overflow-x-auto pb-2">
            <div class="flex items-center space-x-2 min-w-max">
              <div 
                v-for="step in totalSteps" 
                :key="step"
                class="flex items-center"
              >
                <!-- Step Circle -->
                <div 
                  class="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300"
                  :class="[
                    step < currentStep ? 'bg-primary text-white' : 
                    step === currentStep ? 'bg-primary text-white ring-4 ring-primary/20' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  ]"
                >
                  <svg v-if="step < currentStep" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span v-else class="text-sm font-semibold">{{ step }}</span>
                </div>

                <!-- Step Label (Desktop) -->
                <div class="hidden sm:flex flex-col ml-3">
                  <span 
                    class="text-sm font-medium transition-colors duration-200"
                    :class="step <= currentStep ? 'text-primary' : 'text-gray-500 dark:text-gray-400'"
                  >
                    {{ stepTitles[step - 1] }}
                  </span>
                  <span 
                    class="text-xs transition-colors duration-200"
                    :class="step <= currentStep ? 'text-text/60' : 'text-gray-400 dark:text-gray-500'"
                  >
                    {{ stepDescriptions[step - 1] }}
                  </span>
                </div>

                <!-- Connector Line -->
                <div 
                  v-if="step < totalSteps"
                  class="flex-1 h-0.5 mx-4 transition-colors duration-300"
                  :class="step < currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <form @submit.prevent="handleCreate">
        <div class="bg-white/90 dark:bg-surface/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-primary/10 dark:border-primary/20 overflow-hidden">
          <!-- Step Content -->
          <div class="p-6 sm:p-8 min-h-[500px]">
            <!-- Step 1: Farm Details -->
            <div v-if="currentStep === 1" class="space-y-6">
              <div class="text-center mb-8">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-text mb-2">Let's name your farm</h2>
                <p class="text-text/60">Choose a name and map for your farming adventure</p>
              </div>

              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-semibold text-text mb-3">Farm Name *</label>
                  <input
                    v-model="formData.name"
                    type="text"
                    required
                    placeholder="e.g., Green Valley Farm"
                    class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-lg"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-text mb-3">Select Your World</label>
                  <select
                    v-model="formData.mapName"
                    required
                    class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-lg"
                  >
                    <option value="">Choose your farming world...</option>
                    <option value="Hutan Pantai">🌴 Hutan Pantai</option>
                    <option value="Riverbend Springs">🏞️ Riverbend Springs</option>
                    <option value="Zielonka">🌲 Zielonka</option>
                    <option value="Elmcreek">🌳 Elmcreek</option>
                    <option value="Erlengrat">🏔️ Erlengrat</option>
                    <option value="Haut-Beyleron">🍇 Haut-Beyleron</option>
                    <option value="Custom">🎨 Custom Map</option>
                  </select>
                </div>

                <div v-if="formData.mapName === 'Custom'" class="animate-fadeIn">
                  <label class="block text-sm font-semibold text-text mb-3">Custom Map Name</label>
                  <input
                    v-model="customMapName"
                    type="text"
                    placeholder="Enter your custom map name"
                    class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <!-- Step 2: Financial Setup -->
            <div v-if="currentStep === 2" class="space-y-6">
              <div class="text-center mb-8">
                <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-text mb-2">Set up your finances</h2>
                <p class="text-text/60">Configure your starting capital and regional preferences</p>
              </div>

              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-semibold text-text mb-3">Starting Capital</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span class="text-gray-500 text-xl font-semibold">
                        {{ getCurrencySymbol(formData.currency) }}
                      </span>
                    </div>
                    <input
                      v-model.number="formData.startingFunds"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="100,000"
                      class="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-lg font-semibold"
                    />
                  </div>
                  <p class="text-xs text-text/60 mt-2">💰 Your initial budget for equipment and operations</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-semibold text-text mb-3">Currency</label>
                    <select
                      v-model="formData.currency"
                      class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm"
                    >
                      <option value="GBP">🇬🇧 British Pound (£)</option>
                      <option value="USD">🇺🇸 US Dollar ($)</option>
                      <option value="EUR">🇪🇺 Euro (€)</option>
                      <option value="CAD">🇨🇦 Canadian Dollar</option>
                      <option value="AUD">🇦🇺 Australian Dollar</option>
                      <option value="DKK">🇩🇰 Danish Krone</option>
                      <option value="NOK">🇳🇴 Norwegian Krone</option>
                      <option value="SEK">🇸🇪 Swedish Krona</option>
                      <option value="CHF">🇨🇭 Swiss Franc</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-text mb-3">Field Measurement</label>
                    <select
                      v-model="formData.areaUnit"
                      class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm"
                    >
                      <option value="hectares">📏 Hectares (ha)</option>
                      <option value="acres">📐 Acres (ac)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: Game Settings -->
            <div v-if="currentStep === 3" class="space-y-6">
              <div class="text-center mb-8">
                <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-text mb-2">Game time settings</h2>
                <p class="text-text/60">Configure your farming calendar and time progression</p>
              </div>

              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-semibold text-text mb-3">🗓️ Starting Date</label>
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="block text-xs text-text/60 mb-2">Year</label>
                      <input
                        v-model.number="formData.currentYear"
                        type="number"
                        min="1"
                        max="9999"
                        class="w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-center font-semibold"
                      />
                    </div>
                    <div>
                      <label class="block text-xs text-text/60 mb-2">Month</label>
                      <select
                        v-model.number="formData.currentMonth"
                        class="w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-center font-semibold"
                      >
                        <option :value="1">Jan</option>
                        <option :value="2">Feb</option>
                        <option :value="3">Mar</option>
                        <option :value="4">Apr</option>
                        <option :value="5">May</option>
                        <option :value="6">Jun</option>
                        <option :value="7">Jul</option>
                        <option :value="8">Aug</option>
                        <option :value="9">Sep</option>
                        <option :value="10">Oct</option>
                        <option :value="11">Nov</option>
                        <option :value="12">Dec</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs text-text/60 mb-2">Day</label>
                      <input
                        v-model.number="formData.currentDay"
                        type="number"
                        :min="1"
                        :max="formData.daysPerMonth"
                        class="w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-center font-semibold"
                      />
                    </div>
                  </div>
                  <p class="text-xs text-text/60 mt-2">🌱 When your farming journey begins</p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-text mb-3">📅 Days Per Month</label>
                  <input
                    v-model.number="formData.daysPerMonth"
                    type="number"
                    min="1"
                    max="31"
                    class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 shadow-sm text-lg font-semibold text-center"
                  />
                  <p class="text-xs text-text/60 mt-2">⏰ Custom month length (1-31 days)</p>
                </div>
              </div>
            </div>

            <!-- Step 4: Fields Setup -->
            <div v-if="currentStep === 4" class="space-y-6">
              <div class="text-center mb-8">
                <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4a1 1 0 011-1h4m6 0h4a1 1 0 011 1v4m0 6v4a1 1 0 01-1 1h-4m-6 0H4a1 1 0 01-1-1v-4"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-text mb-2">Set up your fields</h2>
                <p class="text-text/60">Add fields where you'll grow your crops</p>
              </div>

              <div class="space-y-6">
                <!-- Fields List -->
                <div v-if="fields.length > 0" class="space-y-3">
                  <h3 class="text-lg font-semibold text-text">Your Fields</h3>
                  <div class="space-y-2">
                    <div
                      v-for="(field, index) in fields"
                      :key="index"
                      class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ index + 1 }}</span>
                        </div>
                        <div>
                          <div class="font-medium text-text">{{ field.name }}</div>
                          <div class="text-sm text-text/60">{{ field.size }} {{ formData.areaUnit }} • {{ field.crop || 'No crop selected' }}</div>
                        </div>
                      </div>
                      <button
                        @click="removeField(index)"
                        type="button"
                        class="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Add Field Form -->
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
                  <h3 class="text-lg font-semibold text-text mb-4">Add New Field</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text/70 mb-2">Field Name</label>
                      <input
                        v-model="newField.name"
                        type="text"
                        placeholder="e.g., North Field"
                        class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text/70 mb-2">Size ({{ formData.areaUnit }})</label>
                      <input
                        v-model.number="newField.size"
                        type="number"
                        min="0.1"
                        step="0.1"
                        placeholder="10.5"
                        class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text/70 mb-2">Initial Crop</label>
                      <select
                        v-model="newField.crop"
                        class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">No crop</option>
                        <option value="Wheat">🌾 Wheat</option>
                        <option value="Barley">🌾 Barley</option>
                        <option value="Canola">🌻 Canola</option>
                        <option value="Corn">🌽 Corn</option>
                        <option value="Soybeans">🫘 Soybeans</option>
                        <option value="Potatoes">🥔 Potatoes</option>
                        <option value="Sugar Beet">🧅 Sugar Beet</option>
                        <option value="Cotton">🤍 Cotton</option>
                      </select>
                    </div>
                  </div>
                  <button
                    @click="addField"
                    type="button"
                    :disabled="!newField.name || !newField.size"
                    class="mt-4 flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Field
                  </button>
                </div>

                <div class="text-center text-sm text-text/60">
                  💡 You can add more fields later in the farm management section
                </div>
              </div>
            </div>

            <!-- Step 5: Vehicles -->
            <div v-if="currentStep === 5" class="space-y-6">
              <div class="text-center mb-8">
                <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-text mb-2">Choose your vehicles</h2>
                <p class="text-text/60">Tractors, harvesters, and other drivable machinery</p>
              </div>

              <div class="space-y-6">
                <!-- Vehicles List -->
                <div v-if="vehicles.length > 0" class="space-y-3">
                  <h3 class="text-lg font-semibold text-text">Your Vehicles</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      v-for="(vehicle, index) in vehicles"
                      :key="index"
                      class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <span class="text-red-600 dark:text-red-400 font-bold text-lg">🚜</span>
                        </div>
                        <div>
                          <div class="font-medium text-text">{{ vehicle.brand }} {{ vehicle.model }}</div>
                          <div class="text-sm text-text/60">{{ vehicle.category }} • {{ vehicle.owned ? formatCurrency(vehicle.purchasePrice, formData.currency) : `£${vehicle.dailyCost}/day` }}</div>
                        </div>
                      </div>
                      <button
                        @click="removeVehicle(index)"
                        type="button"
                        class="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Add Vehicle Form -->
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 space-y-4">
                  <h3 class="text-lg font-semibold text-text mb-4">Add Vehicle</h3>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text/70 mb-2">Brand *</label>
                      <input
                        v-model="newVehicle.brand"
                        type="text"
                        placeholder="e.g., John Deere, Claas"
                        class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text/70 mb-2">Model *</label>
                      <input
                        v-model="newVehicle.model"
                        type="text"
                        placeholder="e.g., 6R Series, Axion 800"
                        class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text/70 mb-2">Category *</label>
                    <select
                      v-model="newVehicle.category"
                      class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select category...</option>
                      <option value="Tractor">🚜 Tractor</option>
                      <option value="Harvester">🌾 Harvester</option>
                      <option value="Truck">🚛 Truck</option>
                      <option value="Forklift">🏗️ Forklift</option>
                      <option value="ATV">🏍️ ATV</option>
                      <option value="Pickup">🛻 Pickup Truck</option>
                    </select>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="flex items-center space-x-2">
                        <input
                          v-model="newVehicle.owned"
                          type="checkbox"
                          class="w-4 h-4 text-red-600"
                        />
                        <span class="text-sm font-medium">Owned</span>
                      </label>
                    </div>
                    <div>
                      <label class="flex items-center space-x-2">
                        <input
                          v-model="newVehicle.leased"
                          type="checkbox"
                          class="w-4 h-4 text-red-600"
                        />
                        <span class="text-sm font-medium">Leased</span>
                      </label>
                    </div>
                  </div>

                  <div v-if="newVehicle.leased" class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <label class="block text-sm font-medium text-text/70 mb-2">Daily Lease Cost ({{ getCurrencySymbol(formData.currency) }})</label>
                    <input
                      v-model.number="newVehicle.dailyCost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="150.00"
                      class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text/70 mb-2">Condition: {{ newVehicle.condition }}%</label>
                    <input
                      v-model.number="newVehicle.condition"
                      type="range"
                      min="0"
                      max="100"
                      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div class="flex justify-between text-xs text-text/60 mt-1">
                      <span>Needs Repair</span>
                      <span>Fair</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  <div v-if="newVehicle.owned" class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-3">
                    <h4 class="font-medium text-green-700 dark:text-green-300">💰 Purchase Details</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-sm font-medium mb-2">Purchase Price ({{ getCurrencySymbol(formData.currency) }})</label>
                        <input
                          v-model.number="newVehicle.purchasePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="50000.00"
                          class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-2">Purchase Date</label>
                        <input
                          v-model="newVehicle.purchaseDate"
                          type="date"
                          class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text/70 mb-2">Notes</label>
                    <textarea
                      v-model="newVehicle.notes"
                      rows="2"
                      placeholder="Maintenance schedule, special features, etc."
                      class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    ></textarea>
                  </div>

                  <button
                    @click="addVehicle"
                    type="button"
                    :disabled="!newVehicle.brand || !newVehicle.model || !newVehicle.category"
                    class="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Vehicle
                  </button>
                </div>

                <div class="text-center text-sm text-text/60">
                  💡 Only owned vehicle purchase prices will be deducted from your starting funds
                </div>
              </div>
            </div>

            <!-- Step 6: Equipment/Implements -->
            <div v-if="currentStep === 6" class="space-y-6">
              <div class="text-center mb-8">
                <div class="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-text mb-2">Select your implements</h2>
                <p class="text-text/60">Tools, plows, seeders, and other attachments</p>
              </div>

              <div class="space-y-6">
                <!-- Equipment List -->
                <div v-if="equipment.length > 0" class="space-y-3">
                  <h3 class="text-lg font-semibold text-text">Your Equipment</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      v-for="(item, index) in equipment"
                      :key="index"
                      class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <span class="text-amber-600 dark:text-amber-400 font-bold text-lg">🔧</span>
                        </div>
                        <div>
                          <div class="font-medium text-text">{{ item.brand }} {{ item.model }}</div>
                          <div class="text-sm text-text/60">{{ item.category }} • {{ item.owned ? formatCurrency(item.purchasePrice, formData.currency) : `£${item.dailyCost}/day` }}</div>
                        </div>
                      </div>
                      <button
                        @click="removeEquipment(index)"
                        type="button"
                        class="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Add Equipment Form -->
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 space-y-4">
                  <h3 class="text-lg font-semibold text-text mb-4">Add Equipment</h3>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text/70 mb-2">Brand *</label>
                      <input
                        v-model="newEquipment.brand"
                        type="text"
                        placeholder="e.g., Kuhn, Lemken"
                        class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text/70 mb-2">Model *</label>
                      <input
                        v-model="newEquipment.model"
                        type="text"
                        placeholder="e.g., 3-Bottom Plow, HR 4004"
                        class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text/70 mb-2">Category *</label>
                    <select
                      v-model="newEquipment.category"
                      class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Select category...</option>
                      <option value="Plough">🪓 Plough</option>
                      <option value="Cultivator">⚡ Cultivator</option>
                      <option value="Seeder">🌱 Seeder</option>
                      <option value="Sprayer">💨 Sprayer</option>
                      <option value="Baler">📦 Baler</option>
                      <option value="Trailer">🚐 Trailer</option>
                      <option value="Loader">🏗️ Loader</option>
                      <option value="Other">🔧 Other</option>
                    </select>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="flex items-center space-x-2">
                        <input
                          v-model="newEquipment.owned"
                          type="checkbox"
                          class="w-4 h-4 text-amber-600"
                        />
                        <span class="text-sm font-medium">Owned</span>
                      </label>
                    </div>
                    <div>
                      <label class="flex items-center space-x-2">
                        <input
                          v-model="newEquipment.leased"
                          type="checkbox"
                          class="w-4 h-4 text-amber-600"
                        />
                        <span class="text-sm font-medium">Leased</span>
                      </label>
                    </div>
                  </div>

                  <div v-if="newEquipment.leased" class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <label class="block text-sm font-medium text-text/70 mb-2">Daily Lease Cost ({{ getCurrencySymbol(formData.currency) }})</label>
                    <input
                      v-model.number="newEquipment.dailyCost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="25.00"
                      class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text/70 mb-2">Condition: {{ newEquipment.condition }}%</label>
                    <input
                      v-model.number="newEquipment.condition"
                      type="range"
                      min="0"
                      max="100"
                      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div class="flex justify-between text-xs text-text/60 mt-1">
                      <span>Needs Repair</span>
                      <span>Fair</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  <div v-if="newEquipment.owned" class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-3">
                    <h4 class="font-medium text-green-700 dark:text-green-300">💰 Purchase Details</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-sm font-medium mb-2">Purchase Price ({{ getCurrencySymbol(formData.currency) }})</label>
                        <input
                          v-model.number="newEquipment.purchasePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="5000.00"
                          class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-2">Purchase Date</label>
                        <input
                          v-model="newEquipment.purchaseDate"
                          type="date"
                          class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text/70 mb-2">Notes</label>
                    <textarea
                      v-model="newEquipment.notes"
                      rows="2"
                      placeholder="Maintenance schedule, special features, etc."
                      class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    ></textarea>
                  </div>

                  <button
                    @click="addEquipment"
                    type="button"
                    :disabled="!newEquipment.brand || !newEquipment.model || !newEquipment.category"
                    class="w-full flex items-center justify-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Equipment
                  </button>
                </div>

                <div class="text-center text-sm text-text/60">
                  💡 Only owned equipment purchase prices will be deducted from your starting funds
                </div>
              </div>
            </div>

            <!-- Step 7: Review & Create -->
            <div v-if="currentStep === 7" class="space-y-6">
              <div class="text-center mb-8">
                <div class="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-text mb-2">Ready to launch!</h2>
                <p class="text-text/60">Review your farm setup before creating</p>
              </div>

              <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 space-y-4">
                <h3 class="font-semibold text-text mb-4">Farm Summary</h3>
                
                <div class="grid grid-cols-1 gap-3 text-sm">
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Farm Name:</span>
                    <span class="font-medium">{{ formData.name || 'Unnamed Farm' }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Map:</span>
                    <span class="font-medium">{{ formData.mapName === 'Custom' ? customMapName || 'Custom Map' : formData.mapName || 'Not Selected' }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Starting Funds:</span>
                    <span class="font-medium">{{ formatCurrency(formData.startingFunds, formData.currency) }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Currency:</span>
                    <span class="font-medium">{{ formData.currency }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Field Units:</span>
                    <span class="font-medium">{{ formData.areaUnit === 'hectares' ? 'Hectares' : 'Acres' }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Starting Date:</span>
                    <span class="font-medium">Year {{ formData.currentYear }}, {{ getMonthName(formData.currentMonth) }} {{ formData.currentDay }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Days Per Month:</span>
                    <span class="font-medium">{{ formData.daysPerMonth }} days</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Fields:</span>
                    <span class="font-medium">{{ fields.length }} field{{ fields.length !== 1 ? 's' : '' }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Vehicles:</span>
                    <span class="font-medium">{{ vehicles.length }} vehicle{{ vehicles.length !== 1 ? 's' : '' }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Equipment:</span>
                    <span class="font-medium">{{ equipment.length }} item{{ equipment.length !== 1 ? 's' : '' }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-text/60">Total Equipment Cost:</span>
                    <span class="font-medium">{{ formatCurrency(getTotalEquipmentCost(), formData.currency) }}</span>
                  </div>
                  
                  <div class="flex justify-between py-2">
                    <span class="text-text/60 font-semibold">Remaining Funds:</span>
                    <span class="font-bold" :class="getRemainingFunds() >= 0 ? 'text-green-600' : 'text-red-600'">
                      {{ formatCurrency(getRemainingFunds(), formData.currency) }}
                    </span>
                  </div>
                </div>
                
                <!-- Equipment Summary -->
                <div v-if="fields.length > 0 || vehicles.length > 0 || equipment.length > 0" class="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
                  <h3 class="font-semibold text-text mb-4">Equipment Summary</h3>
                  
                  <div v-if="fields.length > 0" class="mb-4">
                    <h4 class="text-sm font-medium text-text/80 mb-2">Fields ({{ fields.length }})</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div v-for="field in fields" :key="field.name" class="flex justify-between">
                        <span>{{ field.name }}</span>
                        <span>{{ field.size }} {{ formData.areaUnit }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="vehicles.length > 0" class="mb-4">
                    <h4 class="text-sm font-medium text-text/80 mb-2">Vehicles ({{ vehicles.length }})</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div v-for="vehicle in vehicles" :key="`${vehicle.brand}-${vehicle.model}`" class="flex justify-between">
                        <span>{{ vehicle.brand }} {{ vehicle.model }}</span>
                        <span>{{ vehicle.owned ? formatCurrency(vehicle.purchasePrice, formData.currency) : `£${vehicle.dailyCost}/day` }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="equipment.length > 0">
                    <h4 class="text-sm font-medium text-text/80 mb-2">Equipment ({{ equipment.length }})</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div v-for="item in equipment" :key="`${item.brand}-${item.model}`" class="flex justify-between">
                        <span>{{ item.brand }} {{ item.model }}</span>
                        <span>{{ item.owned ? formatCurrency(item.purchasePrice, formData.currency) : `£${item.dailyCost}/day` }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <button
              v-if="currentStep > 1"
              @click="prevStep"
              type="button"
              class="flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors duration-200 font-medium"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Previous
            </button>
            <div v-else></div>

            <div class="text-sm text-gray-500 dark:text-gray-400">
              Step {{ currentStep }} of {{ totalSteps }}
            </div>

            <button
              v-if="currentStep < totalSteps"
              @click="nextStep"
              type="button"
              :disabled="!canProceedFromStep(currentStep)"
              class="flex items-center px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
            >
              Next
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <button
              v-else
              type="submit"
              :disabled="isSubmitting || !canProceedFromStep(currentStep)"
              class="flex items-center px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-2xl"
            >
              {{ isSubmitting ? '🌱 Creating...' : '🚜 Launch Farm' }}
            </button>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="mt-6">
          <div class="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border border-red-200 dark:border-red-700/50 rounded-2xl p-4 shadow-lg">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-red-800 dark:text-red-300 font-medium">{{ error }}</p>
            </div>
          </div>
        </div>
      </form>

      <!-- Join Farm Section -->
      <div class="mt-8">
        <div class="text-center mb-6">
          <div class="flex items-center justify-center">
            <div class="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
            <div class="px-6 text-sm text-text/60">or</div>
            <div class="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
          </div>
        </div>

        <form @submit.prevent="handleJoin" class="bg-white/90 dark:bg-surface/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700/50">
          <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-text">Join Existing Farm</h3>
              <p class="text-sm text-text/60">Connect to a friend's farm instead</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-text mb-3">Farm Join Code</label>
              <input
                v-model="joinCode"
                type="text"
                placeholder="Enter 10-character code"
                maxlength="10"
                class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm font-mono tracking-wider"
              />
              <p class="text-xs text-text/60 mt-2">🤝 Ask the farm owner for their join code</p>
            </div>

            <button
              type="submit"
              :disabled="isJoining || !joinCode"
              class="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
            >
              {{ isJoining ? '🔗 Joining...' : '🚪 Join Farm' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmStore } from '../stores/farm'

const router = useRouter()
const farmStore = useFarmStore()

// Step management
const currentStep = ref(1)
const totalSteps = 7

const stepTitles = [
  'Farm Details',
  'Financial Setup', 
  'Game Settings',
  'Fields Setup',
  'Vehicles',
  'Implements',
  'Review & Create'
]

const stepDescriptions = [
  'Name, map & basic setup',
  'Budget & regional settings',
  'Calendar & time settings',
  'Add your crop fields',
  'Tractors & machinery',
  'Tools & attachments',
  'Review & launch'
]

const formData = ref({
  name: '',
  mapName: '',
  startingFunds: 100000,
  currentYear: 1,
  currentMonth: 9,
  currentDay: 1,
  currency: 'GBP',
  areaUnit: 'hectares',
  daysPerMonth: 30
})

// Equipment data types
interface Field {
  name: string
  size: number
  crop: string
}

interface Vehicle {
  brand: string
  model: string
  category: string
  owned: boolean
  leased: boolean
  dailyCost: number
  condition: number
  purchasePrice: number
  purchaseDate: string
  notes: string
}

interface Equipment {
  brand: string
  model: string
  category: string
  owned: boolean
  leased: boolean
  dailyCost: number
  condition: number
  purchasePrice: number
  purchaseDate: string
  notes: string
}

const fields = ref<Field[]>([])
const vehicles = ref<Vehicle[]>([])
const equipment = ref<Equipment[]>([])

// New form objects
const newField = ref({ name: '', size: 0, crop: '' })
const newVehicle = ref({
  brand: '',
  model: '',
  category: '',
  owned: true,
  leased: false,
  dailyCost: 0,
  condition: 100,
  purchasePrice: 0,
  purchaseDate: '',
  notes: ''
})
const newEquipment = ref({
  brand: '',
  model: '',
  category: '',
  owned: true,
  leased: false,
  dailyCost: 0,
  condition: 100,
  purchasePrice: 0,
  purchaseDate: '',
  notes: ''
})

const customMapName = ref('')
const joinCode = ref('')
const error = ref('')
const isSubmitting = ref(false)
const isJoining = ref(false)

// Helper functions
function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++
    error.value = ''
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    error.value = ''
  }
}

function canProceedFromStep(step: number): boolean {
  switch (step) {
    case 1:
      return !!(formData.value.name && formData.value.mapName)
    case 2:
      return formData.value.startingFunds >= 0
    case 3:
      return true // All game settings have defaults
    case 4:
      return true // Fields are optional
    case 5:
      return true // Vehicles are optional
    case 6:
      return true // Equipment is optional
    case 7:
      return getRemainingFunds() >= 0 // Must have non-negative remaining funds
    default:
      return true
  }
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥',
    CAD: 'C$', AUD: 'A$', DKK: 'kr', NOK: 'kr', SEK: 'kr', CHF: 'CHF'
  }
  return symbols[currency] || currency
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${amount.toLocaleString()}`
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || 'Unknown'
}

// Equipment management functions
function addField() {
  if (newField.value.name && newField.value.size > 0) {
    fields.value.push({ 
      name: newField.value.name, 
      size: newField.value.size, 
      crop: newField.value.crop 
    })
    newField.value = { name: '', size: 0, crop: '' }
  }
}

function removeField(index: number) {
  fields.value.splice(index, 1)
}

function addVehicle() {
  if (newVehicle.value.brand && newVehicle.value.model && newVehicle.value.category) {
    vehicles.value.push({ 
      brand: newVehicle.value.brand,
      model: newVehicle.value.model,
      category: newVehicle.value.category,
      owned: newVehicle.value.owned,
      leased: newVehicle.value.leased,
      dailyCost: newVehicle.value.dailyCost,
      condition: newVehicle.value.condition,
      purchasePrice: newVehicle.value.purchasePrice,
      purchaseDate: newVehicle.value.purchaseDate,
      notes: newVehicle.value.notes
    })
    newVehicle.value = {
      brand: '',
      model: '',
      category: '',
      owned: true,
      leased: false,
      dailyCost: 0,
      condition: 100,
      purchasePrice: 0,
      purchaseDate: '',
      notes: ''
    }
  }
}

function removeVehicle(index: number) {
  vehicles.value.splice(index, 1)
}

function addEquipment() {
  if (newEquipment.value.brand && newEquipment.value.model && newEquipment.value.category) {
    equipment.value.push({ 
      brand: newEquipment.value.brand,
      model: newEquipment.value.model,
      category: newEquipment.value.category,
      owned: newEquipment.value.owned,
      leased: newEquipment.value.leased,
      dailyCost: newEquipment.value.dailyCost,
      condition: newEquipment.value.condition,
      purchasePrice: newEquipment.value.purchasePrice,
      purchaseDate: newEquipment.value.purchaseDate,
      notes: newEquipment.value.notes
    })
    newEquipment.value = {
      brand: '',
      model: '',
      category: '',
      owned: true,
      leased: false,
      dailyCost: 0,
      condition: 100,
      purchasePrice: 0,
      purchaseDate: '',
      notes: ''
    }
  }
}

function removeEquipment(index: number) {
  equipment.value.splice(index, 1)
}

function getTotalEquipmentCost(): number {
  const vehicleCost = vehicles.value.reduce((total, vehicle) => {
    return total + (vehicle.owned ? vehicle.purchasePrice : 0)
  }, 0)
  const equipmentCost = equipment.value.reduce((total, item) => {
    return total + (item.owned ? item.purchasePrice : 0)
  }, 0)
  return vehicleCost + equipmentCost
}

function getRemainingFunds(): number {
  return formData.value.startingFunds - getTotalEquipmentCost()
}

// Watch for changes in daysPerMonth and adjust currentDay if needed
watch(() => formData.value.daysPerMonth, (newDaysPerMonth) => {
  if (formData.value.currentDay > newDaysPerMonth) {
    formData.value.currentDay = newDaysPerMonth
  }
})

async function handleCreate() {
  if (!formData.value.name || !formData.value.mapName) {
    error.value = 'Please fill in all required fields'
    return
  }

  // Additional validation
  if (formData.value.currentYear < 1 || formData.value.currentYear > 9999) {
    error.value = 'Year must be between 1 and 9999'
    return
  }
  if (formData.value.startingFunds < 0) {
    error.value = 'Starting funds cannot be negative'
    return
  }
  if (formData.value.currentDay > formData.value.daysPerMonth) {
    error.value = `Day cannot be greater than ${formData.value.daysPerMonth} for the selected month length`
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const mapName = formData.value.mapName === 'Custom' 
      ? customMapName.value || 'Custom Map'
      : formData.value.mapName

    await farmStore.createFarmWithEquipment(
      formData.value.name, 
      mapName, 
      formData.value.startingFunds,
      formData.value.currentYear,
      formData.value.currentMonth,
      formData.value.currentDay,
      formData.value.currency,
      formData.value.areaUnit,
      formData.value.daysPerMonth,
      fields.value,
      vehicles.value,
      equipment.value
    )
    router.push('/app')
  } catch (err: any) {
    error.value = err.message || 'Failed to create farm'
  } finally {
    isSubmitting.value = false
  }
}

async function handleJoin() {
  if (joinCode.value.length !== 10) {
    alert('Please enter a valid 10-character join code')
    return
  }

  isJoining.value = true

  try {
    await farmStore.joinFarm(joinCode.value)
    router.push('/app')
  } catch (err: any) {
    alert(err.message || 'Failed to join farm')
  } finally {
    isJoining.value = false
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

/* Custom scroll styling for better UX */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>
