import type { Person, SalaryUnit } from '../types'

interface Props {
    people: Person[]
    onChange: (people: Person[]) => void
}

function newPerson(): Person {
    return { id: crypto.randomUUID(), name: '', salary: 0, unit: 'yearly' }
}

const inputClass = 'bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-gray-500'

export default function PersonList({ people, onChange }: Props) {
    function add() {
        onChange([...people, newPerson()])
    }

    function remove(id: string) {
        onChange(people.filter(p => p.id !== id))
    }

    function update(id: string, patch: Partial<Person>) {
        onChange(people.map(p => (p.id === id ? { ...p, ...patch } : p)))
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-200">People</h2>

            {people.length === 0 && (
                <p className="text-sm text-gray-500">No people added. Add someone below to start tracking.</p>
            )}

            <div className="space-y-3">
                {people.map((p, i) => (
                    <div key={p.id} className="flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder={`Person ${i + 1}`}
                            value={p.name}
                            onChange={e => update(p.id, { name: e.target.value })}
                            className={`${inputClass} flex-1 min-w-0`}
                        />
                        <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={p.salary === 0 ? '' : p.salary}
                            onChange={e => update(p.id, { salary: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className={`${inputClass} w-32`}
                        />
                        <select
                            value={p.unit}
                            onChange={e => update(p.id, { unit: e.target.value as SalaryUnit })}
                            className={`${inputClass} cursor-pointer`}
                        >
                            <option value="hourly">/ hour</option>
                            <option value="monthly">/ month</option>
                            <option value="yearly">/ year</option>
                        </select>
                        <button
                            onClick={() => remove(p.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors px-1 cursor-pointer"
                            aria-label="Remove"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={add}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
                + Add person
            </button>
        </div>
    )
}
