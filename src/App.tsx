import { useEffect, useRef, useState } from 'react'
import PersonList from './components/PersonList'
import TickerCard from './components/Ticker'
import { loadState, saveState } from './storage'
import { tickerRate, type Person, type Ticker } from './types'

function newTicker(participantIds: string[]): Ticker {
    return {
        id:             crypto.randomUUID(),
        name:           '',
        participantIds,
        running:        false,
        accumulated:    0,
        startedAt:      null,
    }
}

export default function App() {
    const initial = useRef(loadState()).current

    const [people, setPeople]   = useState<Person[]>(initial.people)
    const [tickers, setTickers] = useState<Ticker[]>(initial.tickers)

    // Catch up elapsed time for any ticker that was running when the page closed.
    // Runs once on mount.
    const catchUpDone = useRef(false)
    useEffect(() => {
        if (catchUpDone.current) return
        catchUpDone.current = true

        const now = Date.now()
        setTickers(prev => prev.map(t => {
            if (!t.running || t.startedAt === null) return t
            const elapsedSeconds = (now - t.startedAt) / 1000
            const rate = tickerRate(t, initial.people)
            return {
                ...t,
                accumulated: t.accumulated + elapsedSeconds * rate,
                startedAt:   now,
            }
        }))
    }, [initial.people])

    // Global 1s tick. Advances every running ticker by its current rate.
    useEffect(() => {
        const anyRunning = tickers.some(t => t.running)
        if (!anyRunning) return

        const id = setInterval(() => {
            setTickers(prev => prev.map(t => {
                if (!t.running) return t
                return { ...t, accumulated: t.accumulated + tickerRate(t, people) }
            }))
        }, 1000)
        return () => clearInterval(id)
    }, [tickers, people])

    useEffect(() => {
        saveState({ people, tickers })
    }, [people, tickers])

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
        updateTicker(id, { running: false, startedAt: null })
    }

    function resetTicker(id: string) {
        updateTicker(id, { running: false, startedAt: null, accumulated: 0 })
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

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
                <h1 className="text-2xl font-bold tracking-tight">Salary Cost Ticker</h1>

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
