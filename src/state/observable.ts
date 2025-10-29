export type Unsub = () => void

export class Observable<T> {
  private v: T
  private subs = new Set<(v: T) => void>()
  constructor(initial: T) { this.v = initial }
  get(): T { return this.v }
  set(next: T) { this.v = next; this.subs.forEach(f => f(next)) }
  update(updater: (prev: T) => T) { this.set(updater(this.v)) }
  subscribe(fn: (v: T) => void): Unsub { this.subs.add(fn); return () => this.subs.delete(fn) }
}