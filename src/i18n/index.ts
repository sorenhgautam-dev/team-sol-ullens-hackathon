import { en, type StringKey } from './en'

export type { StringKey }
export type Params = Record<string, string | number>

/**
 * Translate a key (English only). Param values that are themselves string keys
 * (e.g. a bill nameKey carried in a log line) are translated too, so engine log
 * lines stay text-free and the UI never hard-codes copy.
 */
export function t(key: string, params?: Params): string {
  const template = en[key as StringKey] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = params[name]
    if (v === undefined) return `{${name}}`
    if (typeof v === 'number') return formatNumber(v)
    return v in en ? t(v) : v
  })
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}
