/**
 * Master switch for dark mode across the whole site — public portfolio and
 * admin alike.
 *
 * `false` hides the theme toggle and pins every visitor to light, **including
 * anyone who previously chose dark**: their stored preference is ignored rather
 * than erased, so flipping this back to `true` restores both the toggle and
 * everyone's saved choice exactly as it was.
 *
 * Nothing else needs to change to bring dark mode back — the `.dark` palette in
 * globals.css, the `dark:` variants throughout the components, and the
 * ThemeToggle component are all still in place and maintained.
 *
 * Read by:
 * - `app/layout.tsx` — whether the `theme` cookie may set `class="dark"` on SSR
 * - `components/providers/theme-provider.tsx` — whether a stored preference resolves
 * - `components/public/nav.tsx`, `app/admin/layout.tsx` — whether the toggle renders
 */
export const DARK_MODE_ENABLED = false;
