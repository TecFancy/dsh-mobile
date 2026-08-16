/**
 * Mobile focus guard (0.1.7).
 *
 * On narrow viewports the shell auto-focuses the composer on the new-session
 * page (and re-focuses it once the session state settles), which pops the
 * on-screen keyboard immediately on phones. This guard keeps blurring
 * composer focuses while they happen BEFORE any user pointer interaction —
 * and also reacts when the narrow marker appears while the composer is
 * already focused (desktop→mobile resize) — then stands down completely
 * after the first pointerdown, so a focus caused by the user's own tap is
 * never interfered with.
 *
 * Desktop is untouched: the guard only acts while `body[data-dsh-mobile]` is
 * present (the narrow-tier marker set by the client entry).
 */

/** Composer focus candidates: any editable inside the composer bar slot. */
const COMPOSER_SLOT = '[data-slot="conversation.composer.bar"]'

const isComposerEditable = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement &&
  el.matches('textarea, input, [contenteditable]') &&
  el.closest(COMPOSER_SLOT) !== null

/**
 * Install the guard. Returns a disposer that removes the listeners and the
 * attribute observer (the plugin fiber owns it via ctx.effect).
 */
export function installMobileFocusGuard(doc: Document): () => void {
  let userTouched = false

  const cleanup = (): void => {
    observer.disconnect()
    doc.removeEventListener('focusin', onFocusIn, true)
    doc.removeEventListener('pointerdown', onPointer, true)
  }

  const onPointer = (): void => {
    userTouched = true
    cleanup()
  }

  const onFocusIn = (event: FocusEvent): void => {
    if (userTouched || !doc.body.hasAttribute('data-dsh-mobile')) return
    if (isComposerEditable(event.target as Element | null)) {
      ;(event.target as HTMLElement).blur()
    }
  }

  const blurComposerIfFocused = (): void => {
    if (userTouched) return
    if (isComposerEditable(doc.activeElement)) {
      doc.activeElement.blur()
    }
  }

  // React to the narrow marker appearing (e.g. a desktop→mobile resize that
  // happens after the composer already auto-focused): blur immediately.
  const observer = new MutationObserver(() => {
    if (doc.body.hasAttribute('data-dsh-mobile')) {
      blurComposerIfFocused()
    }
  })
  observer.observe(doc.body, { attributes: true, attributeFilter: ['data-dsh-mobile'] })

  // Mobile from the start: cover a focus that already happened before this
  // listener was attached.
  blurComposerIfFocused()

  doc.addEventListener('focusin', onFocusIn, true)
  doc.addEventListener('pointerdown', onPointer, true)
  return cleanup
}
