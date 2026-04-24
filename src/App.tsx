import { useEffect, useRef, useState } from 'react'
import PersonList from './components/PersonList'
import TickerCard from './components/Ticker'
import { loadState, saveState } from './storage'
import { CURRENCIES, tickerRate, type Currency, type Person, type Ticker } from './types'

function newTicker(participantIds: string[]): Ticker {
    return {
        id:             crypto.randomUUID(),
        name:           '',
        participantIds,
        running:        false,
        elapsedSeconds: 0,
        startedAt:      null,
    }
}

export default function App() {
    const initial = useRef(loadState()).current

    const [currency, setCurrency] = useState<Currency>(initial.currency)
    const [people, setPeople]     = useState<Person[]>(initial.people)
    const [tickers, setTickers]   = useState<Ticker[]>(initial.tickers)
    const [now, setNow]           = useState<number>(() => Date.now())

    // While any ticker is running, drive smooth re-renders via requestAnimationFrame.
    // `elapsedSeconds` stays as the pause-time baseline; the live value is computed
    // at render from `now - startedAt`.
    const anyRunning = tickers.some(t => t.running)
    useEffect(() => {
        if (!anyRunning) return

        let raf = 0
        const frame = () => {
            setNow(Date.now())
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)
        return () => cancelAnimationFrame(raf)
    }, [anyRunning])

    useEffect(() => {
        saveState({ currency, people, tickers })
    }, [currency, people, tickers])

    // When a person is removed, drop them from every ticker's participant list.
    function handlePeopleChange(next: Person[]) {
        const validIds = new Set(next.map(p => p.id))
        setPeople(next)
        setTickers(prev => prev.map(t => ({
            ...t,
            participantIds: t.participantIds.filter(id => validIds.has(id)),
        })))
    }

    function addTicker() {
        setTickers(prev => [...prev, newTicker(people.map(p => p.id))])
    }

    function updateTicker(id: string, patch: Partial<Ticker>) {
        setTickers(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)))
    }

    function deleteTicker(id: string) {
        setTickers(prev => prev.filter(t => t.id !== id))
    }

    function startTicker(id: string) {
        updateTicker(id, { running: true, startedAt: Date.now() })
    }

    function pauseTicker(id: string) {
        const t = tickers.find(x => x.id === id)
        if (!t) return
        if (!t.running || t.startedAt === null) {
            updateTicker(id, { running: false, startedAt: null })
            return
        }
        const runSegment = Math.max(0, (Date.now() - t.startedAt) / 1000)
        updateTicker(id, {
            running:        false,
            startedAt:      null,
            elapsedSeconds: t.elapsedSeconds + runSegment,
        })
    }

    function resetTicker(id: string) {
        updateTicker(id, { running: false, startedAt: null, elapsedSeconds: 0 })
    }

    function toggleParticipant(tickerId: string, personId: string) {
        const ticker = tickers.find(t => t.id === tickerId)
        if (!ticker) return
        const has = ticker.participantIds.includes(personId)
        const nextIds = has
            ? ticker.participantIds.filter(id => id !== personId)
            : [...ticker.participantIds, personId]
        updateTicker(tickerId, { participantIds: nextIds })
    }

    const selectClass = 'bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 border border-gray-700 focus:outline-none focus:border-gray-500 cursor-pointer'

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Salary Cost Ticker</h1>
                    <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value as Currency)}
                        className={selectClass}
                        aria-label="Currency"
                    >
                        {CURRENCIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-200">Tickers</h2>
                        <button
                            onClick={addTicker}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                            + Add ticker
                        </button>
                    </div>

                    {tickers.length === 0 && (
                        <p className="text-sm text-gray-500">No tickers yet. Add one above.</p>
                    )}

                    <div className="space-y-4">
                        {tickers.map(t => (
                            <TickerCard
                                key={t.id}
                                ticker={t}
                                people={people}
                                perSecond={tickerRate(t, people)}
                                currency={currency}
                                now={now}
                                onRename={name => updateTicker(t.id, { name })}
                                onToggleParticipant={personId => toggleParticipant(t.id, personId)}
                                onStart={() => startTicker(t.id)}
                                onPause={() => pauseTicker(t.id)}
                                onReset={() => resetTicker(t.id)}
                                onDelete={() => deleteTicker(t.id)}
                            />
                        ))}
                    </div>
                </div>

                <PersonList people={people} onChange={handlePeopleChange} />
            </div>
        </div>
    )
}
