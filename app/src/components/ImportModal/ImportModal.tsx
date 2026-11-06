import { useRef, useState } from 'react'
import { useExpenseStore } from '../../store/useExpenseStore'
import { formatBRL, parseBankFile } from '../../utils/finance'
import type { ImportRow } from '../../utils/finance'

export function ImportModal() {
  const addExpenses = useExpenseStore((s) => s.addExpenses)
  const cards = useExpenseStore((s) => s.cards)

  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [cardId, setCardId] = useState('cash')
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setRows([])
    setFileName('')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '')
        const parsed = parseBankFile(text, file.name)
        if (parsed.length === 0) {
          setError('Nenhuma transação reconhecida no arquivo. Verifique se é um extrato OFX ou CSV.')
          setRows([])
        } else {
          setRows(parsed)
        }
        setFileName(file.name)
      } catch {
        setError('Não foi possível ler o arquivo.')
        setRows([])
      }
    }
    reader.onerror = () => setError('Falha ao ler o arquivo.')
    reader.readAsText(file)
  }

  function handleImport() {
    if (rows.length === 0) return
    addExpenses(
      rows.map((row) => ({
        description: row.description,
        date: `${row.date}T00:00:00.000Z`,
        amount: row.amount,
        category: row.category,
        cardId,
        type: row.type,
        isPaid: true,
        isRecurring: false,
        installments: 1,
        paidInstallments: 0,
        dueDay: Number(row.date.slice(8, 10)) || 1,
      }))
    )
    reset()
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 transition-colors"
      >
        ⬆ Importar extrato
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              reset()
              setOpen(false)
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-display text-nude-800">Importar extrato</h3>
                <p className="text-xs text-nude-400 mt-0.5">
                  Aceita arquivos OFX e CSV exportados do seu banco. Nada sai do seu computador.
                </p>
              </div>
              <button
                onClick={() => {
                  reset()
                  setOpen(false)
                }}
                className="text-nude-400 hover:text-nude-600 text-lg leading-none"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".ofx,.csv,.txt,text/csv,application/x-ofx"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="w-full text-sm text-nude-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-terracotta-50 file:text-terracotta-700 hover:file:bg-terracotta-100"
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            {rows.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-nude-500">
                    {fileName} · {rows.length} transaç{rows.length === 1 ? 'ão' : 'ões'}
                  </span>
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-border bg-surface text-nude-700"
                  >
                    <option value="cash">Dinheiro/Pix</option>
                    {cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-xl border border-nude-100 divide-y divide-nude-100">
                  {rows.map((row, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-nude-700 truncate">{row.description}</p>
                        <p className="text-[11px] text-nude-400">
                          {new Date(`${row.date}T00:00:00`).toLocaleDateString('pt-BR')} · {row.category}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold whitespace-nowrap ${
                          row.type === 'income' ? 'text-emerald-600' : 'text-nude-700'
                        }`}
                      >
                        {row.type === 'income' ? '+' : '−'} {formatBRL(row.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={reset}
                    className="px-3 py-2 text-xs font-medium text-nude-500 hover:text-nude-700"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={handleImport}
                    className="px-4 py-2 text-xs font-bold text-white bg-terracotta-600 hover:bg-terracotta-700 rounded-lg transition-colors"
                  >
                    Importar {rows.length}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}