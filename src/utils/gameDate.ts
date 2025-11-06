// Game date utilities

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function formatGameDate(year: number = 1, month: number = 1, day: number = 1): string {
  return `Year ${year}, ${MONTH_NAMES[month - 1] || 'January'}, Day ${day}`
}

export function formatShortGameDate(year: number = 1, month: number = 1, day: number = 1): string {
  return `Y${year} ${(MONTH_NAMES[month - 1] || 'January').substring(0, 3)} D${day}`
}
