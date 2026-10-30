# Keyboard and responsive audit — 2026-10-30

## Keyboard contract

| Context | Enter | Shift+Enter | Other keys |
| --- | --- | --- | --- |
| Notes body | Save; retain textarea focus | Insert newline | Tab moves to the next control |
| Admin artwork title/description | Submit with native validation | Newline in description; no submit in single-line title | File picker/select/button retain native behavior |
| Admin category, Tasks, Music text fields | Submit the relevant form | No single-line submit | Tab/Shift+Tab remain native |
| Workspace command search | Run first matching result | No special action | Tab moves among results; Esc closes desktop dialog |
| Public links and buttons | Activate focused control | Native behavior | Tab/Shift+Tab navigate controls |

`src/lib/editor-keyboard.ts` applies only to the relevant text entry points. It ignores IME composition and key code 229, modified Enter, and previously handled events. Repeated or busy saves are blocked without inserting newlines. Forms use `requestSubmit()` so required fields and browser validation still apply. No global Enter/Tab cancellation was added.

## Corrections

- Skip targets (`main`) can receive programmatic focus after the skip link is activated.
- Notes move focus to a newly created note. Saving uses read-only state so focus survives a pending request.
- Admin editing moves focus into the title and back to the corresponding edit button on save/cancel. Category selection remains consistent after failed requests.
- The command dialog restores focus to its opener, keeps focus within the dialog, marks its background inert and stays above floating windows. Search supports Enter and composition protection.
- Keyboard focus raises the corresponding floating window; move/resize shortcuts do not intercept keys from child controls.
- Artwork links use the artwork title as a concise accessible name.
- Narrow screens use 16px input text, 44px key tap targets, wrapping headings/task text and input minimum-width fixes. Scrollable navigation reserves space for visible focus outlines. Admin/private input borders and Admin focus colors were strengthened.
- Calculated contrast: Admin input border/white 3.53:1, Admin focus/background 5.50:1, Workspace input border/surface 3.34:1. This is a targeted check, not a claim of full WCAG conformance.

## Verification boundaries

The keyboard regression suite covers save/newline, IME/229, repeat/busy guards, native controls, Tab/Escape/arrows and the validation submission path. Existing layout, starfield and gallery regressions plus TypeScript, Node and Pages builds are required before publication.

Live Pages preview checks passed for note creation focus, two-line Shift+Enter input, Enter save/focus retention, Tab/Shift+Tab navigation and command-dialog Tab cycling/Escape focus restoration. A follow-up directs focus to the newly launched app instead of the previous editor. Full deployment status is recorded in `progress.md`. Only ephemeral Workspace preview records may be used for interactive save tests; do not upload, edit or delete real artwork merely to test keyboard input.

This browser does not expose viewport/device emulation. Mobile layout changes were reviewed against the responsive rules, including narrow-screen wrapping, touch sizes and input text size; no real mobile browser, mobile virtual keyboard, iOS zoom, screen-reader or physical-device pass is claimed. Check Home, Works/detail, Admin edit/upload, mobile Notes/Tasks and the command dialog at 320/390/768 CSS px on actual devices or a supported responsive browser. Confirm horizontal reflow, focus visibility and keyboard-open layouts.
