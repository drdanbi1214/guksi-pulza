import { useEffect, useState, useCallback } from 'react'
import { ChevronUp, ChevronDown, RotateCcw, Flame, BookOpen, Calendar } from 'lucide-react'
import { supabase } from './supabase'
import {
  MEMBERS, WEEKLY_GOAL, DDAY_NAME,
  getDDay, getWeekRange, getWeekRangeForMonth, toDateStr, getStreakDays,
} from './utils'
import { format } from 'date-fns'

interface DailyRecord {
  id: string
  member_name: string
  date: string
  count: number
}

async function upsertDaily(member: string, date: string, count: number) {
  await supabase.from('guksi_daily_records').upsert(
    { member_name: member, date, count },
    { onConflict: 'member_name,date' }
  )
}

// ── D-Day 배너 ────────────────────────────────────────────────────────────────
function DDayBanner() {
  const dd = getDDay()
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-5 flex items-center justify-between shadow-lg" style={{ fontFamily: "'Gamja Flower', cursive" }}>
      <div>
        <p className="text-2xl font-black">{DDAY_NAME}</p>
        <p className="text-indigo-300 text-xs mt-1">2026년 5월 28일</p>
      </div>
      <div className="text-right">
        <p className="text-indigo-200 text-xs font-semibold mb-1">남은 날</p>
        <p className="text-5xl font-black tabular-nums">
          {dd > 0 ? `D-${dd}` : dd === 0 ? 'D-Day!' : `D+${Math.abs(dd)}`}
        </p>
      </div>
    </div>
  )
}

// ── 오늘 문제 입력 ────────────────────────────────────────────────────────────
function TodayInput({ todayRecords, onSaved }: { todayRecords: DailyRecord[]; onSaved: () => void }) {
  const [member, setMember] = useState(MEMBERS[0])
  const [count, setCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const existing = todayRecords.find(r => r.member_name === member)

  useEffect(() => {
    setCount(existing?.count ?? 0)
    setSaved(false)
  }, [member, existing?.count])

  const handleSave = async () => {
    setSaving(true)
    await upsertDaily(member, toDateStr(new Date()), count)
    setSaving(false)
    setSaved(true)
    onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={18} className="text-indigo-500" />
        <h2 className="font-bold text-slate-700">오늘 문제 입력</h2>
        <span className="ml-auto text-xs text-slate-400">
          {format(new Date(), 'M월 d일')}
        </span>
      </div>

      {/* 멤버 선택 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {MEMBERS.map(m => (
          <button
            key={m}
            onClick={() => setMember(m)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              member === m ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 숫자 입력 (화살표 + 직접 입력) */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setCount(c => c + 1)}
            className="w-10 h-9 rounded-t-xl bg-slate-100 flex items-center justify-center text-slate-600 active:bg-indigo-100 transition-all"
          >
            <ChevronUp size={18} />
          </button>
          <button
            onClick={() => setCount(c => Math.max(0, c - 1))}
            className="w-10 h-9 rounded-b-xl bg-slate-100 flex items-center justify-center text-slate-600 active:bg-indigo-100 transition-all"
          >
            <ChevronDown size={18} />
          </button>
        </div>
        <input
          type="number"
          min={0}
          value={count}
          onChange={e => setCount(Math.max(0, Number(e.target.value)))}
          className="flex-1 text-center text-4xl font-black text-indigo-600 bg-indigo-50 rounded-xl py-3 outline-none border-2 border-indigo-100 focus:border-indigo-400 transition-all tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-slate-500 font-semibold text-lg">문제</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-3 rounded-xl font-bold shadow-sm active:scale-95 transition-all text-white ${
            saved ? 'bg-emerald-500' : 'bg-indigo-500'
          } disabled:opacity-50`}
        >
          {saving ? '...' : saved ? '✓' : '저장'}
        </button>
      </div>

      {existing && (
        <p className="text-xs text-slate-400 mt-2 text-center">
          저장됨: {existing.count}문제 · 수정 후 다시 저장하면 덮어씌워집니다
        </p>
      )}
    </div>
  )
}

// ── 이번 주 현황 ──────────────────────────────────────────────────────────────
function WeeklyProgress({ records }: { records: DailyRecord[] }) {
  const { start, end } = getWeekRange()
  const weekRecords = records.filter(r => r.date >= toDateStr(start) && r.date <= toDateStr(end))

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-emerald-500" />
        <h2 className="font-bold text-slate-700">이번 주 현황</h2>
        <span className="ml-auto text-xs text-slate-400">주간 목표 {WEEKLY_GOAL}문제</span>
      </div>
      <div className="space-y-3">
        {MEMBERS.map(m => {
          const total = weekRecords.filter(r => r.member_name === m).reduce((s, r) => s + r.count, 0)
          const pct = Math.min(100, Math.round((total / WEEKLY_GOAL) * 100))
          const done = total >= WEEKLY_GOAL
          return (
            <div key={m}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-semibold text-slate-700">{m}</span>
                <span className={`text-sm font-bold tabular-nums ${done ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {total} / {WEEKLY_GOAL}{done && ' ✓'}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 스트릭 ────────────────────────────────────────────────────────────────────
function StreakCard({ allRecords }: { allRecords: DailyRecord[] }) {
  const streaks = MEMBERS.map(m => ({
    name: m,
    streak: getStreakDays(allRecords.filter(r => r.member_name === m && r.count > 0).map(r => r.date)),
  }))

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-orange-500" />
        <h2 className="font-bold text-slate-700">매일매일풀자제발 🔥</h2>
      </div>
      <div className="flex gap-2">
        {streaks.map(({ name, streak }) => (
          <div key={name} className={`flex-1 rounded-xl p-3 text-center ${streak > 0 ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50'}`}>
            <p className="text-[11px] text-slate-500 font-semibold mb-1 truncate">{name}</p>
            <p className={`text-2xl font-black tabular-nums ${streak > 0 ? 'text-orange-500' : 'text-slate-300'}`}>{streak}</p>
            <p className={`text-[10px] ${streak > 0 ? 'text-orange-400' : 'text-slate-300'}`}>일 연속</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 월간 테이블 ───────────────────────────────────────────────────────────────
function MonthlyTable({ records, year, month }: { records: DailyRecord[]; year: number; month: number }) {
  const weeks = getWeekRangeForMonth(year, month)

  const getTotal = (member: string, start: Date, end: Date) =>
    records
      .filter(r => r.member_name === member && r.date >= toDateStr(start) && r.date <= toDateStr(end))
      .reduce((s, r) => s + r.count, 0)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-indigo-500" />
        <h2 className="font-bold text-slate-700">{year}년 {month}월 현황</h2>
      </div>
      <table className="w-full text-sm min-w-[360px]">
        <thead>
          <tr className="border-b-2 border-slate-100">
            <th className="text-left py-2 pr-3 text-slate-400 font-semibold">이름</th>
            <th className="py-2 px-2 text-slate-400 font-semibold">합계</th>
            {weeks.map(w => (
              <th key={w.label} className="py-2 px-2 text-slate-400 font-semibold text-center">{w.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MEMBERS.map(m => {
            const monthTotal = records.filter(r => r.member_name === m).reduce((s, r) => s + r.count, 0)
            return (
              <tr key={m} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-3 font-bold text-slate-700">{m}</td>
                <td className="py-3 px-2 text-center font-black text-indigo-600 text-base">{monthTotal}</td>
                {weeks.map(w => {
                  const total = getTotal(m, w.start, w.end)
                  const done = total >= WEEKLY_GOAL
                  return (
                    <td key={w.label} className="py-3 px-2 text-center">
                      <span className={`font-semibold ${done ? 'text-emerald-500' : total > 0 ? 'text-slate-600' : 'text-slate-200'}`}>
                        {total > 0 ? total : '-'}
                      </span>
                      {done && <span className="ml-0.5 text-[10px] text-emerald-400">✓</span>}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── 랭킹 ─────────────────────────────────────────────────────────────────────
// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function App() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [allRecords, setAllRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
      const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1
      const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

      const [monthRes, allRes] = await Promise.all([
        supabase.from('guksi_daily_records').select('*').gte('date', startDate).lt('date', endDate).order('date'),
        supabase.from('guksi_daily_records').select('*').order('date'),
      ])
      setRecords(monthRes.data ?? [])
      setAllRecords(allRes.data ?? [])
    } catch (e) {
      console.error('로드 실패:', e)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => { loadRecords() }, [loadRecords])

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1
  const todayStr = toDateStr(now)
  const todayRecords = records.filter(r => r.date === todayStr)

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedYear(y => y - 1); setSelectedMonth(12) }
    else setSelectedMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedYear(y => y + 1); setSelectedMonth(1) }
    else setSelectedMonth(m => m + 1)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-800">📚 국시를풀자</h1>
        <button onClick={loadRecords} className="text-slate-400 p-2 rounded-xl hover:bg-slate-100 transition-all" title="새로고침">
          <RotateCcw size={16} />
        </button>
      </div>

      <DDayBanner />

      {isCurrentMonth && <TodayInput todayRecords={todayRecords} onSaved={loadRecords} />}
      {isCurrentMonth && <WeeklyProgress records={records} />}
      {isCurrentMonth && <StreakCard allRecords={allRecords} />}

      {/* 월 네비게이션 */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-200 transition-all text-slate-500">
          <ChevronDown size={20} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <span className="font-bold text-slate-700 text-lg min-w-[120px] text-center">
          {selectedYear}년 {selectedMonth}월
        </span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-200 transition-all text-slate-500">
          <ChevronUp size={20} style={{ transform: 'rotate(90deg)' }} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">불러오는 중...</div>
      ) : (
        <>
          <MonthlyTable records={records} year={selectedYear} month={selectedMonth} />
        </>
      )}

      <p className="text-center text-xs text-slate-300 pb-6">국시를풀자 2026 · 다같이 파이팅! 💪</p>
    </div>
  )
}
