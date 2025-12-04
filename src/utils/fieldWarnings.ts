/**
 * Field Warning System
 * Determines what warnings should be displayed for each field
 */

export interface FieldWarning {
  type: 'error' | 'warning' | 'info'
  message: string
  icon: string
}

export function getFieldWarnings(field: any): FieldWarning[] {
  const warnings: FieldWarning[] = []

  if (!field.currentCrop) {
    warnings.push({
      type: 'info',
      message: 'No crop planted',
      icon: '🌾'
    })
    return warnings
  }

  // Check weed state
  if (field.weedsState === 'Heavy') {
    warnings.push({
      type: 'error',
      message: 'Heavy weed infestation - needs immediate attention',
      icon: '🌱'
    })
  } else if (field.weedsState === 'Moderate') {
    warnings.push({
      type: 'warning',
      message: 'Moderate weed presence - consider treatment',
      icon: '🌱'
    })
  }

  // Check fertiliser state
  if (field.fertiliserState === 'Low' || field.fertiliserState === 'Very Low') {
    warnings.push({
      type: 'warning',
      message: 'Fertiliser levels low - apply fertiliser soon',
      icon: '💊'
    })
  }

  // Check growth stage (ready to harvest)
  if (field.growthStage === 'Ripe' || field.growthStage === 'Ready') {
    warnings.push({
      type: 'info',
      message: 'Crop is ready to harvest',
      icon: '✂️'
    })
  }

  return warnings
}

export function getFieldStatus(field: any): string {
  const warnings = getFieldWarnings(field)
  if (warnings.length === 0) return 'healthy'
  
  if (warnings.some(w => w.type === 'error')) return 'critical'
  if (warnings.some(w => w.type === 'warning')) return 'warning'
  return 'info'
}

export function getFieldStatusColor(status: string): string {
  switch (status) {
    case 'critical':
      return 'text-red-600 dark:text-red-400'
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'info':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-green-600 dark:text-green-400'
  }
}

export function getFieldStatusBgColor(status: string): string {
  switch (status) {
    case 'critical':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    case 'info':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    default:
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  }
}
