// Crop rotation recommendation system based on agricultural best practices

interface CropCategory {
  category: string
  crops: string[]
}

interface RotationRule {
  after: string[]
  recommended: string[]
  avoid: string[]
  reason: string
}

// Crop categories for rotation planning
const cropCategories: CropCategory[] = [
  { category: 'Cereals', crops: ['Wheat', 'Barley', 'Oat', 'Sorghum', 'Corn'] },
  { category: 'Oilseeds', crops: ['Canola', 'Sunflower', 'Soybean'] },
  { category: 'Root Crops', crops: ['Sugar Beet', 'Potato', 'Carrots', 'Parsnips', 'Red Beet'] },
  { category: 'Legumes', crops: ['Pea', 'Chickpea', 'Soybean', 'Green Beans'] },
  { category: 'Forage', crops: ['Grass'] },
  { category: 'Industrial', crops: ['Cotton', 'Sugar Cane', 'Olives', 'Grapes', 'Poplar', 'Spinach'] }
]

// Rotation rules based on agricultural best practices
const rotationRules: Record<string, RotationRule> = {
  // Cereals
  'Wheat': {
    after: ['Wheat'],
    recommended: ['Canola', 'Pea', 'Chickpea', 'Soybean', 'Grass'],
    avoid: ['Wheat', 'Barley', 'Oat'],
    reason: 'Break cereal disease cycles. Legumes fix nitrogen. Oilseeds provide good rotation.'
  },
  'Barley': {
    after: ['Barley'],
    recommended: ['Canola', 'Pea', 'Chickpea', 'Grass', 'Potato'],
    avoid: ['Wheat', 'Barley', 'Oat'],
    reason: 'Avoid successive cereals. Legumes and break crops improve soil.'
  },
  'Oat': {
    after: ['Oat'],
    recommended: ['Potato', 'Sugar Beet', 'Pea', 'Grass'],
    avoid: ['Wheat', 'Barley', 'Oat'],
    reason: 'Root crops and legumes break pest cycles.'
  },
  'Corn': {
    after: ['Corn'],
    recommended: ['Soybean', 'Wheat', 'Canola', 'Sunflower'],
    avoid: ['Corn', 'Sorghum'],
    reason: 'Legumes restore nitrogen. Small grains and oilseeds provide good rotation.'
  },
  'Sorghum': {
    after: ['Sorghum'],
    recommended: ['Soybean', 'Chickpea', 'Wheat', 'Canola'],
    avoid: ['Corn', 'Sorghum'],
    reason: 'Legumes fix nitrogen. Avoid successive grass crops.'
  },

  // Oilseeds
  'Canola': {
    after: ['Canola'],
    recommended: ['Wheat', 'Barley', 'Pea'],
    avoid: ['Canola', 'Sunflower'],
    reason: 'Cereals follow oilseeds well. Avoid club root and sclerotinia buildup.'
  },
  'Sunflower': {
    after: ['Sunflower'],
    recommended: ['Wheat', 'Corn', 'Soybean'],
    avoid: ['Sunflower', 'Canola'],
    reason: 'Long rotation needed to prevent disease. Wait 4-5 years before replanting.'
  },
  'Soybean': {
    after: ['Soybean'],
    recommended: ['Wheat', 'Corn', 'Barley', 'Canola'],
    avoid: ['Soybean', 'Pea', 'Chickpea'],
    reason: 'Good nitrogen fixer. Follow with nitrogen-demanding crops.'
  },

  // Root Crops
  'Potato': {
    after: ['Potato'],
    recommended: ['Wheat', 'Barley', 'Grass', 'Oat'],
    avoid: ['Potato', 'Sugar Beet', 'Carrots'],
    reason: 'Long rotation (4-5 years) needed. Prevents disease buildup.'
  },
  'Sugar Beet': {
    after: ['Sugar Beet'],
    recommended: ['Wheat', 'Barley', 'Grass'],
    avoid: ['Sugar Beet', 'Potato'],
    reason: '3-4 year rotation needed. Avoid other root crops.'
  },
  'Carrots': {
    after: ['Carrots'],
    recommended: ['Wheat', 'Barley', 'Grass', 'Pea'],
    avoid: ['Carrots', 'Parsnips', 'Potato'],
    reason: 'Avoid carrot fly and disease. Wait 3-4 years.'
  },
  'Parsnips': {
    after: ['Parsnips'],
    recommended: ['Wheat', 'Barley', 'Pea'],
    avoid: ['Parsnips', 'Carrots', 'Potato'],
    reason: 'Similar to carrots. Avoid successive root crops.'
  },
  'Red Beet': {
    after: ['Red Beet'],
    recommended: ['Wheat', 'Barley', 'Pea'],
    avoid: ['Red Beet', 'Sugar Beet', 'Spinach'],
    reason: 'Avoid beet family diseases.'
  },

  // Legumes
  'Pea': {
    after: ['Pea'],
    recommended: ['Wheat', 'Barley', 'Canola', 'Potato'],
    avoid: ['Pea', 'Chickpea', 'Soybean'],
    reason: 'Excellent nitrogen fixer. Follow with high nitrogen demand crops.'
  },
  'Chickpea': {
    after: ['Chickpea'],
    recommended: ['Wheat', 'Barley', 'Canola'],
    avoid: ['Chickpea', 'Pea', 'Soybean'],
    reason: 'Fixes nitrogen. Avoid successive legumes.'
  },
  'Green Beans': {
    after: ['Green Beans'],
    recommended: ['Wheat', 'Corn', 'Potato'],
    avoid: ['Green Beans', 'Pea', 'Soybean'],
    reason: 'Good nitrogen fixer. Rotate with high demand crops.'
  },

  // Forage
  'Grass': {
    after: ['Grass'],
    recommended: ['Wheat', 'Barley', 'Potato', 'Canola'],
    avoid: ['Grass', 'Corn'],
    reason: 'Good soil improver. Can be followed by most crops.'
  },

  // Industrial/Specialty
  'Cotton': {
    after: ['Cotton'],
    recommended: ['Wheat', 'Corn', 'Soybean'],
    avoid: ['Cotton'],
    reason: 'Rotate to prevent pest and disease buildup.'
  },
  'Spinach': {
    after: ['Spinach'],
    recommended: ['Wheat', 'Barley', 'Pea'],
    avoid: ['Spinach', 'Red Beet', 'Sugar Beet'],
    reason: 'Avoid beet family diseases.'
  },
  'Olives': {
    after: ['Olives'],
    recommended: ['Wheat', 'Barley', 'Grass'],
    avoid: ['Olives'],
    reason: 'Permanent crop. Rotation only when replanting.'
  },
  'Grapes': {
    after: ['Grapes'],
    recommended: ['Wheat', 'Barley', 'Grass'],
    avoid: ['Grapes'],
    reason: 'Permanent crop. Rotation only when replanting.'
  },
  'Poplar': {
    after: ['Poplar'],
    recommended: ['Wheat', 'Grass'],
    avoid: ['Poplar'],
    reason: 'Tree crop. Long-term commitment.'
  },
  'Sugar Cane': {
    after: ['Sugar Cane'],
    recommended: ['Soybean', 'Pea', 'Grass'],
    avoid: ['Sugar Cane'],
    reason: 'Multi-year crop. Legumes restore soil after harvest.'
  }
}

export interface CropRecommendation {
  crop: string
  priority: 'high' | 'medium' | 'low'
  reason: string
}

/**
 * Get crop recommendations based on the previous crop and field history
 */
export function getCropRecommendations(
  previousCrop: string | null,
  fieldHistory: { crop: string }[]
): CropRecommendation[] {
  if (!previousCrop) {
    return getGeneralRecommendations()
  }

  const rule = rotationRules[previousCrop]
  if (!rule) {
    return getGeneralRecommendations()
  }

  // Get recent crops from history (last 3 years)
  const recentCrops = fieldHistory
    .slice(0, 5)
    .map(h => h.crop)
    .filter((crop, index, self) => self.indexOf(crop) === index)

  const recommendations: CropRecommendation[] = []

  // High priority: recommended crops not recently grown
  rule.recommended.forEach(crop => {
    if (!recentCrops.includes(crop)) {
      recommendations.push({
        crop,
        priority: 'high',
        reason: rule.reason
      })
    }
  })

  // Medium priority: recommended crops grown but not recently
  rule.recommended.forEach(crop => {
    if (recentCrops.includes(crop) && recentCrops.indexOf(crop) > 1) {
      recommendations.push({
        crop,
        priority: 'medium',
        reason: `Good rotation choice, but was grown ${recentCrops.indexOf(crop) + 1} seasons ago`
      })
    }
  })

  // Add some variety if not many recommendations
  if (recommendations.length < 5) {
    const allCrops = Object.keys(rotationRules)
    allCrops.forEach(crop => {
      if (
        !rule.avoid.includes(crop) &&
        !recentCrops.includes(crop) &&
        !recommendations.find(r => r.crop === crop)
      ) {
        recommendations.push({
          crop,
          priority: 'low',
          reason: 'Compatible with crop rotation'
        })
      }
    })
  }

  // Sort by priority and limit to top 10
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 10)
}

function getGeneralRecommendations(): CropRecommendation[] {
  return [
    { crop: 'Wheat', priority: 'high', reason: 'Versatile cereal crop suitable for most conditions' },
    { crop: 'Barley', priority: 'high', reason: 'Reliable cereal with good market demand' },
    { crop: 'Canola', priority: 'high', reason: 'Excellent break crop with good returns' },
    { crop: 'Pea', priority: 'high', reason: 'Nitrogen-fixing legume improves soil' },
    { crop: 'Grass', priority: 'medium', reason: 'Good soil improver and versatile forage' },
    { crop: 'Oat', priority: 'medium', reason: 'Good cereal option' },
    { crop: 'Sunflower', priority: 'medium', reason: 'Profitable oilseed crop' },
    { crop: 'Potato', priority: 'low', reason: 'High value but requires specific conditions' }
  ]
}
