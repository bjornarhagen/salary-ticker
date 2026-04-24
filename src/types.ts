export type SalaryUnit = 'hourly' | 'monthly' | 'yearly'

export type Currency = 'USD' | 'EUR' | 'NOK'

export const CURRENCIES: Currency[] = ['USD', 'EUR', 'NOK']

export interface Person {
    id: string
    name: string
    salary: number
    unit: SalaryUnit
}

export interface Ticker {
    id: string
    name: string
    participantIds: string[]
    running: boolean
    elapsedSeconds: number
    startedAt: number | null
}

export interface AppState {
    currency: Currency
    people: Person[]
    tickers: Ticker[]
}

export function perSecondRate(p: Person): number {
    if (p.salary <= 0) return 0
    switch (p.unit) {
        case 'hourly':  return p.salary / 3600
        case 'monthly': return p.salary / (160 * 3600)
        case 'yearly':  return p.salary / (2080 * 3600)
    }
}

export function tickerRate(ticker: Ticker, people: Person[]): number {
    const byId = new Map(people.map(p => [p.id, p]))
    let sum = 0
    for (const id of ticker.participantIds) {
        const person = byId.get(id)
        if (person) sum += perSecondRate(person)
    }
    return sum
}

export function formatCurrency(amount: number, currency: Currency, digits: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(amount)
}
