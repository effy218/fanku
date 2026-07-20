export const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[0]}.${parts[1]}.${parts[2]}`
}

export const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[1]}.${parts[2]}`
}

export const clampTaste = (v: number): number => {
  const stepped = Math.round(v * 2) / 2
  return Math.max(0, Math.min(5, stepped))
}
