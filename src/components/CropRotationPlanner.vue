<template>
  <div class="space-y-6">
    <div>
      <label class="block text-sm font-medium mb-2 text-text">What is currently planted?</label>
      <select
        v-model="currentCrop"
        class="w-full px-4 py-3 border-2 border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text"
      >
        <option value="">Select a crop</option>
        <optgroup label="Cereals">
          <option value="Wheat">Wheat</option>
          <option value="Barley">Barley</option>
          <option value="Oat">Oat</option>
          <option value="Sorghum">Sorghum</option>
        </optgroup>
        <optgroup label="Oilseeds">
          <option value="Canola">Canola (Oilseed Rape)</option>
          <option value="Sunflower">Sunflower</option>
          <option value="Soybean">Soybean</option>
        </optgroup>
        <optgroup label="Root Crops">
          <option value="Sugar Beet">Sugar Beet</option>
          <option value="Potato">Potato</option>
          <option value="Onions">Onions</option>
        </optgroup>
        <optgroup label="Legumes">
          <option value="Pea">Pea</option>
          <option value="Chickpea">Chickpea</option>
        </optgroup>
        <optgroup label="Industrial">
          <option value="Cotton">Cotton</option>
          <option value="Sugar Cane">Sugar Cane</option>
          <option value="Olives">Olives</option>
          <option value="Grapes">Grapes</option>
        </optgroup>
        <optgroup label="Forage/Silage">
          <option value="Corn">Corn (Maize)</option>
          <option value="Grass">Grass</option>
        </optgroup>
        <optgroup label="Specialty">
          <option value="Poplar">Poplar</option>
          <option value="Spinach">Spinach</option>
          <option value="Green Beans">Green Beans</option>
          <option value="Carrots">Carrots</option>
          <option value="Parsnips">Parsnips</option>
          <option value="Red Beet">Red Beet</option>
        </optgroup>
      </select>
    </div>

    <button
      @click="getSuggestion"
      :disabled="!currentCrop"
      class="w-full bg-secondary text-white dark:text-surface py-3 rounded-lg font-medium hover:bg-secondary/90 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      What should I plant next?
    </button>

    <div v-if="suggestion" class="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 dark:border-primary/30 rounded-lg p-6 space-y-4 backdrop-blur-sm">
      <div>
        <h3 class="text-lg font-bold text-primary mb-2">🌱 Best Recommendations</h3>
        <div class="space-y-2">
          <div
            v-for="(rec, index) in suggestion.recommendations"
            :key="index"
            class="p-4 bg-surface rounded-lg border border-primary/10 hover:border-primary/20 transition-all duration-200 hover:shadow-sm dark:hover:bg-surface/80"
          >
            <p class="font-semibold text-text">{{ rec.crop }}</p>
            <p class="text-sm text-text/80 mt-1">{{ rec.reason }}</p>
          </div>
        </div>
      </div>

      <div v-if="suggestion.benefits.length > 0" class="border-t border-primary/10 pt-4">
        <h4 class="font-semibold text-primary mb-2">✓ Benefits:</h4>
        <ul class="space-y-1">
          <li v-for="(benefit, index) in suggestion.benefits" :key="index" class="text-sm text-text/80">
            • {{ benefit }}
          </li>
        </ul>
      </div>

      <div v-if="suggestion.avoid.length > 0" class="border-t border-primary/10 pt-4">
        <h4 class="font-semibold text-red-500 dark:text-red-400 mb-2">⚠️ Avoid:</h4>
        <ul class="space-y-1">
          <li v-for="(avoid, index) in suggestion.avoid" :key="index" class="text-sm text-text/80">
            • {{ avoid }}
          </li>
        </ul>
      </div>
    </div>

    <div class="bg-surface/50 dark:bg-surface/30 rounded-lg p-4 border border-primary/10 dark:border-primary/20">
      <h4 class="font-semibold text-primary mb-2">💡 About Crop Rotation</h4>
      <p class="text-sm text-text/80">
        Proper crop rotation helps maintain soil fertility, reduce pests and diseases, improve soil structure, 
        and can increase yields by 10-25%. Different crop families use nutrients differently and affect soil health uniquely.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Recommendation {
  crop: string
  reason: string
}

interface Suggestion {
  recommendations: Recommendation[]
  benefits: string[]
  avoid: string[]
}

const currentCrop = ref('')
const suggestion = ref<Suggestion | null>(null)

const cropRotationData: Record<string, Suggestion> = {
  'Wheat': {
    recommendations: [
      { crop: 'Canola (Oilseed Rape)', reason: 'Deep roots break up soil, excellent disease break, high profitability' },
      { crop: 'Pea or Chickpea', reason: 'Fixes nitrogen (saves 30-50kg/ha fertilizer), breaks cereal disease cycle' },
      { crop: 'Sugar Beet', reason: 'Different root system improves soil structure, breaks cereal pests' }
    ],
    benefits: [
      'Break cereal disease cycle (especially take-all)',
      'Improve soil structure with different root types',
      'Reduce chemical usage'
    ],
    avoid: [
      'Another cereal (Barley/Oat) - increases disease pressure',
      'Wheat again - same diseases and pests will multiply'
    ]
  },
  'Barley': {
    recommendations: [
      { crop: 'Pea or Chickpea', reason: 'Nitrogen fixation benefits next crop, breaks disease cycle' },
      { crop: 'Canola', reason: 'Brassica family provides excellent disease break' },
      { crop: 'Potato', reason: 'Completely different growth habit, great disease break' }
    ],
    benefits: [
      'Nitrogen fixation from legumes (20-40kg N/ha)',
      'Break cereal-specific pests and diseases',
      'Improve soil organic matter'
    ],
    avoid: [
      'Wheat or another Barley - disease carryover',
      'Oat immediately after - similar pest pressures'
    ]
  },
  'Oat': {
    recommendations: [
      { crop: 'Canola', reason: 'Breaks cereal diseases, deep tap root improves drainage' },
      { crop: 'Sugar Beet', reason: 'Root crop breaks all cereal issues, different nutrient demands' },
      { crop: 'Legumes (Pea/Chickpea)', reason: 'Nitrogen fixation, excellent for following cereals' }
    ],
    benefits: [
      'Oats are allelopathic (suppresses some weeds)',
      'Good for soil health',
      'Following crops benefit from residual weed suppression'
    ],
    avoid: [
      'Any cereal - continue disease pressure',
      'Grass immediately - both are Poaceae family'
    ]
  },
  'Canola': {
    recommendations: [
      { crop: 'Wheat', reason: 'Benefits from deep rooting and residual nutrients, high yields after canola' },
      { crop: 'Barley', reason: 'Good cereal choice, benefits from improved soil structure' },
      { crop: 'Corn', reason: 'Different family, uses canola\'s deep cultivation benefits' }
    ],
    benefits: [
      'Deep tap root breaks compaction',
      'Leaves soil in excellent tilth',
      'Reduces many cereal diseases'
    ],
    avoid: [
      'Canola again - 4+ year gap needed (clubroot, sclerotinia)',
      'Sugar Beet - shares some disease pressures'
    ]
  },
  'Sunflower': {
    recommendations: [
      { crop: 'Wheat or Barley', reason: 'Cereals benefit from sunflower\'s deep rooting' },
      { crop: 'Soybean', reason: 'Nitrogen fixation helps soil recovery' },
      { crop: 'Corn', reason: 'Different nutrient demands, good rotation partner' }
    ],
    benefits: [
      'Excellent tap root (1-2m deep) breaks hardpan',
      'Scavenges deep nutrients',
      'Low disease carryover to most crops'
    ],
    avoid: [
      'Sunflower again - needs 4-5 year break',
      'Canola - shares some soil diseases'
    ]
  },
  'Soybean': {
    recommendations: [
      { crop: 'Wheat', reason: 'Excellent nitrogen availability from soybean residue' },
      { crop: 'Corn', reason: 'Traditional rotation partner, complementary nutrient needs' },
      { crop: 'Canola', reason: 'Benefits from nitrogen, different pest/disease profile' }
    ],
    benefits: [
      'Fixes 40-70kg N/ha for following crops',
      'Breaks pest cycles for non-legumes',
      'Improves soil structure'
    ],
    avoid: [
      'Pea or Chickpea - same disease pressures (legumes)',
      'Green Beans - all legumes share diseases'
    ]
  },
  'Sugar Beet': {
    recommendations: [
      { crop: 'Wheat', reason: 'Cereals perform excellently after beet, good soil structure' },
      { crop: 'Barley', reason: 'Spring cereal works well, avoids beet cyst nematode' },
      { crop: 'Corn', reason: 'Different family, uses beet\'s deep cultivation' }
    ],
    benefits: [
      'Deep cultivation improves drainage',
      'Leaves soil very clean (late harvest)',
      'Different pest/disease profile from cereals'
    ],
    avoid: [
      'Sugar Beet - minimum 3 year gap (nematodes)',
      'Spinach - same family (Chenopodiaceae), shares diseases'
    ]
  },
  'Potato': {
    recommendations: [
      { crop: 'Wheat', reason: 'Cereals do well after potatoes, soil well-cultivated' },
      { crop: 'Barley', reason: 'Spring cereal benefits from potato cultivation' },
      { crop: 'Canola', reason: 'Break crop after potato, different disease pressures' }
    ],
    benefits: [
      'Excellent weed control from regular cultivation',
      'Soil left in good tilth',
      'High organic matter from residue'
    ],
    avoid: [
      'Potato again - minimum 4 year gap (blight, nematodes)',
      'Tomato/Peppers - same family (Solanaceae)'
    ]
  },
  'Onions': {
    recommendations: [
      { crop: 'Wheat', reason: 'Cereals benefit from clean weed-free soil after onions' },
      { crop: 'Barley', reason: 'Spring cereal works well, different nutrient demands' },
      { crop: 'Legumes (Pea/Chickpea)', reason: 'Nitrogen fixation improves soil after heavy feeder' }
    ],
    benefits: [
      'Soil left very clean from hand/mechanical weeding',
      'Low disease pressure to most other crops',
      'Good for breaking pest cycles'
    ],
    avoid: [
      'Onions again - minimum 3-4 year gap (white rot, onion fly)',
      'Garlic/Leeks - same Allium family diseases'
    ]
  },
  'Pea': {
    recommendations: [
      { crop: 'Wheat', reason: 'Excellent nitrogen availability (30-50kg N/ha savings)' },
      { crop: 'Canola', reason: 'Benefits from nitrogen, breaks legume diseases' },
      { crop: 'Corn', reason: 'Uses residual nitrogen effectively' }
    ],
    benefits: [
      'Nitrogen fixation reduces fertilizer costs',
      'Early harvest allows good establishment of following crop',
      'Breaks cereal disease cycles'
    ],
    avoid: [
      'Pea again - 5+ year gap (wilt, root diseases)',
      'Soybean or Chickpea - shared legume diseases',
      'Green Beans - all legumes share issues'
    ]
  },
  'Chickpea': {
    recommendations: [
      { crop: 'Wheat', reason: 'Cereals benefit greatly from chickpea nitrogen' },
      { crop: 'Corn', reason: 'Uses residual nitrogen, different pest profile' },
      { crop: 'Sunflower', reason: 'Oilseed after legume works well' }
    ],
    benefits: [
      'Fixes 25-40kg N/ha',
      'Drought tolerant deep roots improve soil',
      'Low disease carryover to non-legumes'
    ],
    avoid: [
      'Any legume - shared diseases (Pea, Soybean, Green Beans)',
      'Chickpea again - minimum 4 year gap'
    ]
  },
  'Corn': {
    recommendations: [
      { crop: 'Soybean', reason: 'Classic corn-soy rotation, nitrogen fixation benefits' },
      { crop: 'Wheat or Barley', reason: 'Cereals work well, different growth period' },
      { crop: 'Canola', reason: 'Brassica provides disease break' }
    ],
    benefits: [
      'High biomass improves soil organic matter',
      'Deep roots break compaction',
      'Different pest/disease from small grains'
    ],
    avoid: [
      'Corn again - increases pest pressure (corn borer)',
      'Sorghum - same family, similar pests'
    ]
  },
  'Sorghum': {
    recommendations: [
      { crop: 'Soybean', reason: 'Nitrogen fixation after heavy feeder' },
      { crop: 'Wheat', reason: 'Winter cereal provides different growing season' },
      { crop: 'Chickpea', reason: 'Legume break crop, nitrogen benefits' }
    ],
    benefits: [
      'Drought tolerant, conditions soil for following crops',
      'Allelopathic properties suppress some weeds',
      'Deep roots improve subsoil'
    ],
    avoid: [
      'Corn - same family (Poaceae), shared pests',
      'Sorghum again - pest build-up'
    ]
  },
  'Grass': {
    recommendations: [
      { crop: 'Wheat or Barley', reason: 'Cereals after grass ley build on improved soil structure' },
      { crop: 'Canola', reason: 'Brassica after grass works well' },
      { crop: 'Corn', reason: 'Benefits from grass ley soil improvement' }
    ],
    benefits: [
      'Multi-year grass improves soil structure dramatically',
      'Increases organic matter',
      'Breaks many crop disease cycles'
    ],
    avoid: [
      'Grass again (unless intended permanent pasture)',
      'Oat - both Poaceae family'
    ]
  },
  'Cotton': {
    recommendations: [
      { crop: 'Corn', reason: 'Different nutrient demands, good rotation partner' },
      { crop: 'Wheat', reason: 'Winter cereal provides different season coverage' },
      { crop: 'Sorghum', reason: 'Works in similar climates, different family' }
    ],
    benefits: [
      'Deep tap root improves drainage',
      'Long growing season',
      'Residue provides organic matter'
    ],
    avoid: [
      'Cotton again - pest and disease build-up',
      'Repeated cotton leads to soil degradation'
    ]
  },
  'Sugar Cane': {
    recommendations: [
      { crop: 'Soybean', reason: 'Nitrogen fixation helps soil recovery after heavy feeder' },
      { crop: 'Pea or Chickpea', reason: 'Legume benefits soil structure and nitrogen' },
      { crop: 'Corn', reason: 'Alternative grass, different pest profile' }
    ],
    benefits: [
      'Perennial crop protects soil',
      'High organic matter from residue',
      'Deep roots improve structure'
    ],
    avoid: [
      'Sugar Cane immediately - allow soil recovery',
      'Sorghum - similar pest pressures'
    ]
  },
  'Olives': {
    recommendations: [
      { crop: 'Cover crops between trees', reason: 'Legume cover crops fix nitrogen' },
      { crop: 'Grass strips', reason: 'Prevent erosion, improve soil' },
      { crop: 'Permanent crop', reason: 'Typically not rotated - maintain trees' }
    ],
    benefits: [
      'Long-term investment crop',
      'Minimal soil disturbance',
      'Inter-row cropping possible'
    ],
    avoid: [
      'Olives are permanent - rotation is inter-row management',
      'Deep tillage damages tree roots'
    ]
  },
  'Grapes': {
    recommendations: [
      { crop: 'Cover crops between rows', reason: 'Clover or vetch improves soil' },
      { crop: 'Grass alleys', reason: 'Erosion control, easier harvest access' },
      { crop: 'Permanent crop', reason: 'Vineyard rotation is between-row management' }
    ],
    benefits: [
      'Perennial crop stabilizes soil',
      'Inter-row diversity improves vineyard health',
      'Cover crops reduce erosion'
    ],
    avoid: [
      'Grapes are permanent - focus on cover crop rotation',
      'Bare soil increases erosion risk'
    ]
  },
  'Poplar': {
    recommendations: [
      { crop: 'Poplar is a perennial energy crop (3-5 year harvest cycle)', reason: 'Not typically rotated' },
      { crop: 'After harvest: Cereals or legumes', reason: 'Following crops benefit from improved soil' }
    ],
    benefits: [
      'Fast-growing biomass crop',
      'Improves soil structure over time',
      'Can remediate contaminated soils'
    ],
    avoid: [
      'Poplars grown for 3-5 years before harvest',
      'Not suitable for annual rotation'
    ]
  },
  'Spinach': {
    recommendations: [
      { crop: 'Wheat or Barley', reason: 'Cereals after leafy greens work well' },
      { crop: 'Corn', reason: 'Different nutrient demands, good follow crop' },
      { crop: 'Potato', reason: 'Root crop provides variety in rotation' }
    ],
    benefits: [
      'Quick growing, short season crop',
      'Can fit multiple crops per year',
      'Low residue for easy field prep'
    ],
    avoid: [
      'Sugar Beet - same family (Chenopodiaceae)',
      'Red Beet - shares diseases with spinach'
    ]
  },
  'Green Beans': {
    recommendations: [
      { crop: 'Wheat', reason: 'Cereals benefit from nitrogen fixation' },
      { crop: 'Corn', reason: 'Uses residual nitrogen effectively' },
      { crop: 'Potato', reason: 'Different family, breaks disease cycle' }
    ],
    benefits: [
      'Nitrogen fixation (20-30kg N/ha)',
      'Quick turnaround crop',
      'Improves soil for following crops'
    ],
    avoid: [
      'Pea, Soybean, Chickpea - all legumes share diseases',
      'Green Beans again - 3 year minimum gap'
    ]
  },
  'Carrots': {
    recommendations: [
      { crop: 'Wheat or Barley', reason: 'Cereals after root crops work well' },
      { crop: 'Canola', reason: 'Brassica provides good rotation diversity' },
      { crop: 'Pea', reason: 'Legume adds nitrogen after heavy feeder' }
    ],
    benefits: [
      'Deep cultivation benefits following crops',
      'Breaks disease cycles for cereals',
      'Soil left in good condition'
    ],
    avoid: [
      'Parsnips - same family (Apiaceae)',
      'Carrots again - carrot fly, diseases need 3-4 year gap'
    ]
  },
  'Parsnips': {
    recommendations: [
      { crop: 'Wheat', reason: 'Winter cereal after root crop harvest' },
      { crop: 'Barley', reason: 'Spring cereal utilizes good soil structure' },
      { crop: 'Legumes', reason: 'Nitrogen fixation helps soil recovery' }
    ],
    benefits: [
      'Deep roots break compaction',
      'Late harvest provides clean field',
      'Good for soil structure'
    ],
    avoid: [
      'Carrots - same family (Apiaceae), shared pests',
      'Parsnips again - minimum 3 year gap'
    ]
  },
  'Red Beet': {
    recommendations: [
      { crop: 'Wheat or Barley', reason: 'Cereals perform well after beets' },
      { crop: 'Canola', reason: 'Brassica provides good disease break' },
      { crop: 'Corn', reason: 'Different family, complementary rotation' }
    ],
    benefits: [
      'Improves soil structure',
      'Good for weed control',
      'Breaks cereal disease cycles'
    ],
    avoid: [
      'Sugar Beet - same family, shares diseases',
      'Spinach - Chenopodiaceae family',
      'Red Beet again - 3 year gap minimum'
    ]
  }
}

function getSuggestion() {
  if (currentCrop.value && cropRotationData[currentCrop.value]) {
    suggestion.value = cropRotationData[currentCrop.value]
  } else {
    suggestion.value = {
      recommendations: [
        { crop: 'Wheat', reason: 'Versatile cereal, works in most rotations' },
        { crop: 'Canola', reason: 'Break crop with deep roots' },
        { crop: 'Legume (Pea/Soybean)', reason: 'Nitrogen fixation benefits' }
      ],
      benefits: ['Diverse rotation improves soil health', 'Reduces disease and pest pressure'],
      avoid: []
    }
  }
}
</script>
