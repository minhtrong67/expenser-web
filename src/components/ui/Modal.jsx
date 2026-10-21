import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n';
import IconButton from './IconButton';

// Several dialogs can stack (e.g. a confirm over a form) - only unlock page
// scrolling once the last one closes.
let openCount = 0;

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const DIALOG_WIDTH = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

/**
 * Overlay.
 *  - variant "dialog" (default): centred dialog on every screen size. For short
 *    content and confirmations.
 *  - variant "sheet": full-height side sheet (full-screen on phones, slides in
 *    from the right on larger screens). For forms with many fields.
 *  - variant "drawer": bottom sheet on phones (drag handle, swipe down to
 *    close), side drawer on larger screens. For read-only detail lists.
 * Nothing is auto-focused (no keyboard popping up on phones); focus lands on
 * the panel itself and is trapped inside until the overlay closes.
 */
export default function Modal({ open, onClose, title, children, size = 'md', variant = 'dialog', footer }) {
  const t = useT();
  const panelRef = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Drawer on phones: drag the handle/header down to dismiss.
  const dragRef = useRef({ startY: 0, dy: 0, active: false });
  function onDragStart(e) {
    dragRef.current = { startY: e.clientY, dy: 0, active: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (panelRef.current) panelRef.current.style.transition = 'none';
  }
  function onDragMove(e) {
    const d = dragRef.current;
    if (!d.active) return;
    d.dy = Math.max(0, e.clientY - d.startY);
    if (panelRef.current) panelRef.current.style.transform = `translateY(${d.dy}px)`;
  }
  function onDragEnd() {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const panel = panelRef.current;
    if (!panel) return;
    if (d.dy > 90) {
      onCloseRef.current?.();
      return;
    }
    panel.style.transition = 'transform 200ms cubic-bezier(0.2, 0, 0, 1)';
    panel.style.transform = '';
  }

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    openCount += 1;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    panel?.focus({ preventScroll: true });

    function onKey(e) {
      if (e.key === 'Escape') {
        // Only the top-most overlay reacts.
        const dialogs = document.querySelectorAll('[data-modal]');
        if (dialogs[dialogs.length - 1] === panel) onCloseRef.current?.();
      } else if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const [first, last] = [items[0], items[items.length - 1]];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      openCount -= 1;
      if (openCount <= 0) {
        openCount = 0;
        document.body.style.overflow = '';
      }
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const isSheet = variant === 'sheet';
  const isDrawer = variant === 'drawer';

  const wrapperClass = isSheet ? 'justify-end' : isDrawer ? 'items-end justify-center sm:items-stretch sm:justify-end' : 'items-center justify-center p-4';
  const panelClass = isSheet
    ? 'h-dvh animate-sheet-right sm:max-w-xl sm:rounded-l-4xl'
    : isDrawer
      ? 'max-h-[85dvh] animate-sheet-up rounded-t-4xl sm:h-dvh sm:max-h-none sm:max-w-md sm:animate-sheet-right sm:rounded-l-4xl sm:rounded-tr-none'
      : `max-h-[90dvh] animate-scale-in rounded-4xl ${DIALOG_WIDTH[size] || DIALOG_WIDTH.md}`;

  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${wrapperClass}`}>
      <div className="absolute inset-0 animate-fade-in bg-scrim/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        data-modal
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={isSheet || isDrawer ? { paddingTop: isSheet ? 'env(safe-area-inset-top, 0px)' : undefined, paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
        className={`relative z-10 flex w-full flex-col overflow-hidden border border-line bg-popover shadow-elev-3 outline-none ${panelClass}`}
      >
        {isDrawer && (
          <div
            className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-3 active:cursor-grabbing sm:hidden"
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            aria-hidden="true"
          >
            <span className="h-1 w-8 rounded-full bg-on-surface-variant/40" />
          </div>
        )}
        <div className={`flex shrink-0 items-center gap-2 pb-2 ${isSheet ? 'px-4 pt-3 sm:px-6' : isDrawer ? 'px-6 pt-1 sm:pt-5' : 'px-6 pt-5'}`}>
          {isSheet && <IconButton icon="close" label={t('common.close')} onClick={onClose} className="-ml-2" />}
          <h2 id={titleId} className={`min-w-0 flex-1 wrap-any text-on-surface ${isSheet ? 'text-title-lg' : 'text-title-lg font-semibold'}`}>
            {title}
          </h2>
          {!isSheet && <IconButton icon="close" label={t('common.close')} onClick={onClose} className="-mr-3" />}
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 ${isSheet ? 'px-4 sm:px-6' : 'px-6'}`}>{children}</div>
        {footer && <div className={`shrink-0 border-outline-variant pt-3 ${isSheet ? 'border-t px-4 pb-4 sm:px-6' : 'px-6 pb-6'}`}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
