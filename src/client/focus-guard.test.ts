import { afterEach, describe, expect, it } from 'vitest'
import { installMobileFocusGuard } from './focus-guard.ts'

function setupMobile() {
  document.body.setAttribute('data-dsh-mobile', '')
  const slot = document.createElement('div')
  slot.setAttribute('data-slot', 'conversation.composer.bar')
  const textarea = document.createElement('textarea')
  slot.appendChild(textarea)
  document.body.appendChild(slot)
  return { textarea }
}

const flush = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms))

afterEach(() => {
  document.body.innerHTML = ''
  document.body.removeAttribute('data-dsh-mobile')
})

describe('installMobileFocusGuard', () => {
  it('blurs the initial composer autofocus on mobile', async () => {
    const { textarea } = setupMobile()
    const off = installMobileFocusGuard(document)
    textarea.focus()
    await flush()
    expect(document.activeElement).not.toBe(textarea)
    off()
  })

  it('keeps blurring late re-focuses until the user interacts', async () => {
    const { textarea } = setupMobile()
    const off = installMobileFocusGuard(document)
    textarea.focus()
    await flush()
    expect(document.activeElement).not.toBe(textarea)
    textarea.focus() // late re-focus (shell settling)
    await flush()
    expect(document.activeElement).not.toBe(textarea)
    off()
  })

  it('blurs when the narrow marker appears while the composer is focused', async () => {
    const { textarea } = setupMobile()
    document.body.removeAttribute('data-dsh-mobile') // start "desktop"
    const off = installMobileFocusGuard(document)
    textarea.focus()
    expect(document.activeElement).toBe(textarea) // desktop: untouched
    document.body.setAttribute('data-dsh-mobile', '') // resize to mobile
    await flush()
    expect(document.activeElement).not.toBe(textarea)
    off()
  })

  it('allows composer focus after a pointer interaction', async () => {
    const { textarea } = setupMobile()
    const off = installMobileFocusGuard(document)
    document.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    textarea.focus()
    await flush()
    expect(document.activeElement).toBe(textarea)
    off()
  })

  it('ignores focus outside the composer slot', () => {
    setupMobile()
    const off = installMobileFocusGuard(document)
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    expect(document.activeElement).toBe(input)
    off()
  })

  it('does nothing on desktop (no data-dsh-mobile marker)', async () => {
    const { textarea } = setupMobile()
    document.body.removeAttribute('data-dsh-mobile')
    const off = installMobileFocusGuard(document)
    textarea.focus()
    await flush()
    expect(document.activeElement).toBe(textarea)
    off()
  })

  it('stops guarding after dispose', async () => {
    const { textarea } = setupMobile()
    const off = installMobileFocusGuard(document)
    off()
    textarea.focus()
    await flush()
    expect(document.activeElement).toBe(textarea)
  })
})
