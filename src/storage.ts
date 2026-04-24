import type { AppState, Person, SalaryUnit, Ticker } from './types'

const STORAGE_KEY = 'salary-ticker'

const SALARY_UNITS: SalaryUnit[] = ['hourly', 'monthly', 'yearly']

function isSalaryUnit(v: unknown): v is SalaryUnit {
    return typeof v === 'string' && (SALARY_UNITS as string[]).includes(v)
}

function parsePerson(v: unknown): [Person, null] | [null, Error] {
    if (typeof v !== 'object' || v === null) return [null, new Error('person not object')]
    const o = v as Record<string, unknown>
    if (typeof o.id !== 'string')     return [null, new Error('person.id not string')]
    if (typeof o.name !== 'string')   return [null, new Error('person.name not string')]
    if (typeof o.salary !== 'number') return [null, new Error('person.salary not number')]
    if (!isSalaryUnit(o.unit))        return [null, new Error('person.unit invalid')]
    return [{ id: o.id, name: o.name, salary: o.salary, unit: o.unit }, null]
}

function parseTicker(v: unknown): [Ticker, null] | [null, Error] {
    if (typeof v !== 'object' || v === null) return [null, new Error('ticker not object')]
    const o = v as Record<string, unknown>
    if (typeof o.id !== 'string')          return [null, new Error('ticker.id not string')]
    if (typeof o.name !== 'string')        return [null, new Error('ticker.name not string')]
    if (!Array.isArray(o.participantIds))  return [null, new Error('ticker.participantIds not array')]
    if (typeof o.running !== 'boolean')    return [null, new Error('ticker.running not boolean')]
    if (typeof o.accumulated !== 'number') return [null, new Error('ticker.accumulated not number')]
    if (o.startedAt !== null && typeof o.startedAt !== 'number') {
        return [null, new Error('ticker.startedAt not number|null')]
    }
    const participantIds = o.participantIds.filter((x): x is string => typeof x === 'string')
    return [{
        id:             o.id,
        name:           o.name,
        participantIds,
        running:        o.running,
        accumulated:    o.accumulated,
        startedAt:      o.startedAt,
    }, null]
}

// Migrates the pre-multi-ticker format `{ people, running, accumulated, startedAt }`
// into the new shape by wrapping the old single ticker with all current people.
function migrateLegacy(raw: Record<string, unknown>, people: Person[]): Ticker[] {
    const hasLegacyShape =
        'running'     in raw &&
        'accumulated' in raw &&
        'startedAt'   in raw

    if (!hasLegacyShape) return []

    const running     = typeof raw.running     === 'boolean' ? raw.running     : false
    const accumulated = typeof raw.accumulated === 'number'  ? raw.accumulated : 0
    const startedAt   = typeof raw.startedAt   === 'number'  ? raw.startedAt   : null

    return [{
        id:             crypto.randomUUID(),
        name:           'Ticker',
        participantIds: people.map(p => p.id),
        running,
        accumulated,
        startedAt,
    }]
}

export function loadState(): AppState {
    const empty: AppState = { people: [], tickers: [] }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty

    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return empty
    }

    if (typeof parsed !== 'object' || parsed === null) return empty
    const obj = parsed as Record<string, unknown>

    const people: Person[] = []
    if (Array.isArray(obj.people)) {
        for (const item of obj.people) {
            const [person, err] = parsePerson(item)
            if (err) continue
            people.push(person)
        }
    }

    let tickers: Ticker[] = []
    if (Array.isArray(obj.tickers)) {
        for (const item of obj.tickers) {
            const [ticker, err] = parseTicker(item)
            if (err) continue
            tickers.push(ticker)
        }
    } else {
        tickers = migrateLegacy(obj, people)
    }

    return { people, tickers }
}

export function saveState(state: AppState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
