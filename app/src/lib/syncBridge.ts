import { useExpenseStore } from '../store/useExpenseStore'
import { bootstrapSync, pushSnapshot, snapshotOf, type Snapshot } from './sync'

/**
 * Liga a store ao banco: importa/exporta na primeira conexão e, a partir daí,
 * grava em segundo plano cada mudança local (debounce curto para agrupar
 * edições seguidas, como digitar num campo).
 */

const DEBOUNCE_MS = 800

let stopCurrent: (() => void) | null = null

export function stopSync(): void {
  stopCurrent?.()
  stopCurrent = null
}

export function startSync(userId: string, onStatus?: (message: string) => void): () => void {
  stopSync()

  let paused = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight = false
  let dirty = false
  let last = ''

  const current = (): Snapshot => snapshotOf(useExpenseStore.getState())

  const flush = async () => {
    if (inFlight || paused) {
      dirty = true
      return
    }
    const snapshot = current()
    const serialized = JSON.stringify(snapshot)
    if (serialized === last) return

    inFlight = true
    dirty = false
    try {
      await pushSnapshot(snapshot, userId)
      last = serialized
    } catch (error) {
      // Marca como processado para o aviso abaixo não retriggerar a gravação
      // em looping; a próxima mudança real do estado tenta de novo.
      last = serialized
      onStatus?.(`Não foi possível salvar na nuvem: ${(error as Error).message}`)
    } finally {
      inFlight = false
      if (dirty) void flush()
    }
  }

  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void flush()
    }, DEBOUNCE_MS)
  }

  const unsubscribe = useExpenseStore.subscribe(schedule)

  const bootstrap = async () => {
    paused = true
    try {
      const result = await bootstrapSync(userId)
      if (result === 'uploaded') onStatus?.('Dados deste navegador enviados para sua conta.')
    } catch (error) {
      onStatus?.(`Sincronização indisponível: ${(error as Error).message}`)
    } finally {
      last = JSON.stringify(current())
      paused = false
      if (dirty) void flush()
    }
  }

  void bootstrap()

  const stopper = () => {
    unsubscribe()
    if (timer) clearTimeout(timer)
    timer = null
  }
  stopCurrent = stopper
  return stopper
}
