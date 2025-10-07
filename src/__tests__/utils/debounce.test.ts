import { describe, it, expect, vi } from 'vitest'
import { debounce } from '../../utils/debounce'

describe('debounce', () => {
  it('debounces calls', async () => {
    const fn = vi.fn()
    const d = debounce(fn, 50)
    d(); d(); d();
    await new Promise(r => setTimeout(r, 80))
    expect(fn).toHaveBeenCalledTimes(1)
  })
})