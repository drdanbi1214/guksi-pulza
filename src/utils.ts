import { startOfWeek, endOfWeek, format, differenceInCalendarDays, subDays } from 'date-fns'

export const MEMBERS = ['류혜승', '송은우', '이단비', '양성은', '이영선']
export const WEEKLY_GOAL = 70
export const DDAY_DATE = new Date('2026-05-28')
export const DDAY_NAME = '임종평 1차'

export function getDDay(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(DDAY_DATE)
  target.setHours(0, 0, 0, 0)
  return differenceInCalendarDays(target, today)
}

export function getWeekRange(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 })     // Sunday
  return { start, end }
}

export function getWeekRangeForMonth(year: number, month: number) {
  // Returns all week ranges that overlap with this month
  const weeks: { start: Date; end: Date; label: string }[] = []
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  let cursor = startOfWeek(firstDay, { weekStartsOn: 1 })
  let weekNum = 1
  while (cursor <= lastDay) {
    const end = endOfWeek(cursor, { weekStartsOn: 1 })
    weeks.push({ start: new Date(cursor), end: new Date(end), label: `${weekNum}주차` })
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 7)
    weekNum++
  }
  return weeks
}

export function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function getStreakDays(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  const today = toDateStr(new Date())
  const yesterday = toDateStr(subDays(new Date(), 1))

  // Streak counts only if today or yesterday is present
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let streak = 1
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i])
    const prev = new Date(sorted[i + 1])
    const diff = differenceInCalendarDays(curr, prev)
    if (diff === 1) streak++
    else break
  }
  return streak
}
