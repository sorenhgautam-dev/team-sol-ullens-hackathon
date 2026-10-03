/** Fix My Dates inputs. Stored only on this device. */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RealInputs, RealBill, RealIncome } from '@/engine/shiftFinder'

export const SITA_EXAMPLE: RealInputs = {
  startingCash: 3_000,
  incomes: [
    { id: 'work', label: 'Tailoring income', day: 1, amount: 10_000 },
    { id: 'remit', label: 'Remittance', day: 20, amount: 25_000, irregular: true },
  ],
  bills: [
    { id: 'rent', label: 'Rent', amount: 12_000, dueDay: 5, flexible: 'maybe' },
    { id: 'school', label: 'School fee', amount: 4_000, dueDay: 10, flexible: 'maybe' },
    { id: 'electricity', label: 'Electricity', amount: 1_500, dueDay: 12, flexible: 'yes' },
    { id: 'internet', label: 'Internet / phone', amount: 1_200, dueDay: 15, flexible: 'yes' },
    { id: 'groceries1', label: 'Groceries', amount: 2_000, dueDay: 1, flexible: 'no' },
    { id: 'groceries2', label: 'Groceries', amount: 2_000, dueDay: 8, flexible: 'no' },
    { id: 'groceries3', label: 'Groceries', amount: 2_000, dueDay: 15, flexible: 'no' },
    { id: 'groceries4', label: 'Groceries', amount: 2_000, dueDay: 22, flexible: 'no' },
  ],
}

const EMPTY: RealInputs = { startingCash: 0, incomes: [{ id: 'inc1', label: 'Pay', day: 1, amount: 0 }], bills: [{ id: 'bill1', label: 'Rent', amount: 0, dueDay: 5, flexible: 'maybe' }] }

interface FixState {
  inputs: RealInputs
  step: 1 | 2 | 3
  excluded: string[]
  asksCopied: number
  setStep: (s: 1 | 2 | 3) => void
  setCash: (n: number) => void
  updateIncome: (id: string, patch: Partial<RealIncome>) => void
  addIncome: () => void
  removeIncome: (id: string) => void
  updateBill: (id: string, patch: Partial<RealBill>) => void
  addBill: () => void
  removeBill: (id: string) => void
  useExample: () => void
  clear: () => void
  saidNo: (billId: string) => void
  resetExcluded: () => void
  countAsk: () => void
}

let counter = 1
const nextId = (prefix: string) => `${prefix}${Date.now().toString(36)}${counter++}`

export const useFix = create<FixState>()(
  persist(
    (set) => ({
      inputs: EMPTY,
      step: 1,
      excluded: [],
      asksCopied: 0,
      setStep: (step) => set({ step }),
      setCash: (startingCash) => set((s) => ({ inputs: { ...s.inputs, startingCash } })),
      updateIncome: (id, patch) => set((s) => ({ inputs: { ...s.inputs, incomes: s.inputs.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)) } })),
      addIncome: () => set((s) => ({ inputs: { ...s.inputs, incomes: [...s.inputs.incomes, { id: nextId('inc'), label: 'Income', day: 15, amount: 0 }] } })),
      removeIncome: (id) => set((s) => ({ inputs: { ...s.inputs, incomes: s.inputs.incomes.filter((i) => i.id !== id) } })),
      updateBill: (id, patch) => set((s) => ({ inputs: { ...s.inputs, bills: s.inputs.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)) } })),
      addBill: () => set((s) => ({ inputs: { ...s.inputs, bills: [...s.inputs.bills, { id: nextId('bill'), label: 'Bill', amount: 0, dueDay: 10, flexible: 'yes' }] } })),
      removeBill: (id) => set((s) => ({ inputs: { ...s.inputs, bills: s.inputs.bills.filter((b) => b.id !== id) } })),
      useExample: () => set({ inputs: SITA_EXAMPLE, excluded: [] }),
      clear: () => set({ inputs: EMPTY, excluded: [], step: 1 }),
      saidNo: (billId) => set((s) => ({ excluded: s.excluded.includes(billId) ? s.excluded : [...s.excluded, billId] })),
      resetExcluded: () => set({ excluded: [] }),
      countAsk: () => set((s) => ({ asksCopied: s.asksCopied + 1 })),
    }),
    { name: 'next-payday-fix-v1' },
  ),
)
