import { formatCurrency, type Currency, type Person, type Ticker } from '../types'

interface Props {
    ticker: Ticker
    people: Person[]
    perSecond: number
    currency: Currency
    now: number
    onRename: (name: string) => void
    onToggleParticipant: (personId: string) => void
    onStart: () => void
    onPause: () => void
    onReset: () => void
    onDelete: () => void
}

function primaryLabel(running: boolean, displaySeconds: number): string {
    if (running) return 'Pause'
    if (displaySeconds > 0) return 'Continue'
    return 'Start'
}

function runSegmentSeconds(ticker: Ticker, now: number): number {
    if (!ticker.running) return 0
    if (ticker.startedAt === null) return 0
    const diff = (now - ticker.startedAt) / 1000
    if (diff < 0) return 0
    return diff
}

export default function TickerCard({
    ticker,
    people,
    perSecond,
    currency,
    now,
    onRename,
    onToggleParticipant,
    onStart,
    onPause,
    onReset,
    onDelete,
}: Props) {
    const { name, participantIds, running } = ticker
    const selected = new Set(participantIds)
    const displaySeconds = ticker.elapsedSeconds + runSegmentSeconds(ticker, now)
    const label = primaryLabel(running, displaySeconds)
    const cost = perSecond * displaySeconds

    function handlePrimary() {
        if (running) {
            onPause()
            return
        }
        onStart()
    }

    return (
        <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={name}
                    onChange={e => onRename(e.target.value)}
                    placeholder="Untitled ticker"
                    className="flex-1 bg-transparent text-lg font-semibold text-gray-100 placeholder-gray-600 focus:outline-none border-b border-transparent focus:border-gray-700 py-1"
                />
                <button
                    onClick={onDelete}
                    className="text-gray-500 hover:text-red-400 transition-colors px-1 cursor-pointer"
                    aria-label="Delete ticker"
                >
                    ✕
                </button>
            </div>

            <div>
                <div className={`text-4xl font-mono font-bold tabular-nums transition-colors ${running ? 'text-green-400' : 'text-gray-300'}`}>
                    {formatCurrency(cost, currency, 2)}
                </div>
                <div className="mt-2 text-xs text-gray-500 space-x-3">
                    <span>{formatCurrency(perSecond, currency, 6)} / sec</span>
                    <span>{formatCurrency(perSecond * 60, currency, 4)} / min</span>
                    <span>{formatCurrency(perSecond * 3600, currency, 2)} / hr</span>
                </div>
            </div>

            <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Participants</div>
                {people.length === 0 && (
                    <p className="text-sm text-gray-500">Add people below to include them here.</p>
                )}
                {people.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {people.map((p, i) => {
                            const isOn = selected.has(p.id)
                            const display = p.name.trim() || `Person ${i + 1}`
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => onToggleParticipant(p.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                                        isOn
                                            ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                                    }`}
                                >
                                    {display}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handlePrimary}
                    className={`px-6 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-colors ${
                        running
                            ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                >
                    {label}
                </button>
                <button
                    onClick={onReset}
                    disabled={displaySeconds === 0 && !running}
                    className="px-6 py-2 rounded-lg font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Reset
                </button>
            </div>
        </div>
    )
}
