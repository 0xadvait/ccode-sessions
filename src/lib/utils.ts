import { clsx, type ClassValue } from 'clsx'
import { formatDistanceToNow, format, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function safeTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (!isValid(d)) return ''
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return ''
  }
}

export function safeFormat(dateStr: string, fmt: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (!isValid(d)) return ''
    return format(d, fmt)
  } catch {
    return ''
  }
}
