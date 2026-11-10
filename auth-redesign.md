# Auth Screen Redesign Guide — Glimpse

> Elevate the auth flow from functional dark forms into a **cinematic brand moment** that sets the tone for every evening with Glimpse.

---

## Context

**Glimpse** is a curated movie discovery app — five handpicked films every night, no infinite scroll. The brand identity is "Quiet Cinema": dark, deliberate, unhurried. The auth screens are the **curtain rising** before the show.

**Brand assets already in place**: Cinema Red `#E50914` accent, aperture logo mark, `GLIMPSE` wordmark with red dot, Plus Jakarta Sans typography, dark gradient background (`#1C0B0E` → `#08080A`).

---

## Current State Assessment

| Screen           | Current implementation                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Login            | AuthShell header (logo + tagline) → title/subtitle → email/password → button |
| Register         | AuthShell header → name/email/password → button                         |
| Check Email      | AuthShell header → envelope icon → message → link                       |
| Activate         | AuthShell header → single token field → button → success state          |
| Forgot Password  | AuthShell header → email field → button → sent state                    |
| Reset Password   | AuthShell header → token + new password → button → success state        |

**What's working**: Consistent AuthShell wrapper, cinema red accent, gradient background, custom AuthField with icons, back button support, haptic feedback, error banners.

**What's not working**: Every screen looks identical at a glance — there's no visual differentiation or emotional progression. The layout is vertically centered text-and-fields with no imagery, no spatial drama, and no visual payoff. The header (logo + tagline) is small and static. The screens feel like a dark settings page, not a cinema lobby.

---

## Design Patterns from References

Analyzing the four Dribbble references reveals recurring patterns worth adopting:

| Pattern                       | Seen in                  | Relevance to Glimpse                             |
| ----------------------------- | ------------------------ | ------------------------------------------------ |
| **Hero image (top 35-40%)**   | All four                 | Movie stills are the core content — use them      |
| **Large logo in hero**        | Drivio, Zynema           | Aperture mark exists but is too small (48px)      |
| **Gradient fade into form**   | Drivio, Zynema, Letterboxd | Already have a gradient — extend it over imagery |
| **Rounded pill inputs**       | Drivio, Travel           | AuthField is rounded-2xl — already close          |
| **Leading icons in inputs**   | All four                 | Already implemented ✓                             |
| **Password visibility toggle**| Drivio, Travel           | Already implemented ✓                             |
| **Social login buttons**      | Drivio, Travel, Zynema   | Not relevant for Glimpse (email-only auth)        |
| **Bold CTA button**           | All four                 | Already have `h-[54px] rounded-2xl bg-primary`    |
| **"OR" divider**              | Drivio, Travel           | Could use for separating CTA from footer link     |
| **Contextual illustrations**  | Travel, Letterboxd       | Movie backdrops serve the same purpose             |
| **Screen-specific identity**  | All four                 | The biggest gap — each screen needs its own feel   |

---

## Step-by-Step Redesign

### Step 1 — Add a Cinematic Backdrop to AuthShell

**What**: Replace the plain gradient background with a **blurred movie still** overlaid with the existing gradient, occupying the top ~40% of the screen.

**Why**: This is the single highest-impact change. Every reference design uses a strong visual at the top. For a movie app, a tasteful backdrop image is the most natural and on-brand choice. The Letterboxd and Zynema references both use movie imagery behind the logo — Glimpse should do the same, since movie posters are literally the product.

**How**:

1. **Create `app/features/auth/components/auth-backdrop.tsx`**:
   - Fetch 3–4 curated movie poster/still URLs from TMDB (or bundle static fallback images in `assets/images/auth/`).
   - Pick one at random on mount (mirrors the "discovery" ethos).
   - Render with `expo-image` using `blurRadius={12}` and a dark tint overlay (`bg-black/50` absolutely positioned).
   - The existing `LinearGradient` (`#1C0B0E` → `#08080A`) goes **on top** of the image, fading from `transparent` at the top to the background color at the bottom.

2. **Update `auth-shell.tsx` layout**:
   - **Before**: `LinearGradient` fills the entire screen as a flat wash.
   - **After**: Split into two zones:
     ```
     SafeAreaView (flex:1)
     ├── Backdrop Zone (height: 40%, position: relative)
     │   ├── <AuthBackdrop /> (absolute fill)
     │   ├── LinearGradient overlay (absolute fill, transparent → bg)
     │   ├── Back button (absolute top-left, if showBack)
     │   └── Logo + Wordmark (centered, larger: 64px mark)
     └── Form Zone (flex:1, px-6, pt-4)
         ├── Title + Subtitle
         ├── {children}
         └── Bottom footnote (mt-auto)
     ```

3. **Accept a `compact` prop** for screens with more fields (Register). When `compact={true}`, reduce backdrop height to ~25%.

**Design notes**:
- Use a dark, moody still (like Letterboxd's approach) — not a bright poster. Think: a dimly lit street scene, a silhouette, a close-up with shallow depth of field.
- The blur ensures the image never competes with the form.
- Consider using the user's previously watched movie posters after login (future enhancement, not for MVP).

---

### Step 2 — Enlarge and Animate the Logo

**What**: Make the aperture logo mark the **centrepiece** of the backdrop zone and add a subtle entrance animation.

**Why**: The current 48×48px emblem badge is too small to function as a hero element. The Drivio and Zynema references both position their logos large and centered in the top half. Glimpse's aperture mark is distinctive — give it room to breathe.

**How**:

1. In the backdrop zone, render the existing `GlimpseLogo` component at a larger scale:
   - Mark: **72px** (up from 48px), keep the red-tinted badge background but enlarge to **88px** container.
   - Wordmark: **28px** font size, letter-spacing 5 (up from 22px/4.5).
   - Red dot: **9px** diameter (up from 7px).
   - Tagline: Keep current sizing, it's fine.

2. Add a subtle **entrance animation** with `react-native-reanimated`:
   - Mark: `FadeIn.delay(100).duration(600)` — fades in first.
   - Wordmark + dot: `FadeInDown.delay(300).duration(500)` — slides down after the mark.
   - Tagline: `FadeIn.delay(600).duration(400)` — last to appear.

3. Render the logo on top of the blurred backdrop, vertically centered in the backdrop zone.

---

### Step 3 — Give Each Screen a Distinct Visual Identity

**What**: Add a **screen-specific icon** or illustration above the title to immediately differentiate each screen.

**Why**: Currently, the only thing distinguishing login from register from forgot-password is the title text. The travel app reference gives each screen its own illustration. While full illustrations are overkill for Glimpse's minimal aesthetic, a **large contextual Phosphor icon** above the title accomplishes the same goal with zero design overhead.

**How**:

Add an `icon` prop to `AuthShell` and render it above the title in the form zone:

| Screen           | Icon (Phosphor)       | Color              | Why                              |
| ---------------- | --------------------- | ------------------ | -------------------------------- |
| Login            | `SignIn`              | `text-zinc-400`    | Returning user, neutral          |
| Register         | `UserPlus`            | `text-primary`     | New user, brand emphasis         |
| Check Email      | `EnvelopeSimple` ✓    | `text-primary/30`  | Already implemented              |
| Activate         | `Key`                 | `text-primary`     | Unlocking access                 |
| Forgot Password  | `LockKey`             | `text-zinc-400`    | Lost access, neutral             |
| Reset Password   | `ShieldCheck`         | `text-emerald-500` | Security action, success color   |

Render the icon in a **56px circle** with a subtle background tint (`bg-zinc-800/80`), centered above the title with `mb-4`:

```tsx
<View className="mb-4 self-center h-14 w-14 items-center justify-center rounded-full bg-zinc-800/80">
  <Icon size={28} weight="duotone" color={iconColor} />
</View>
```

Use `duotone` weight for visual richness without adding noise.

---

### Step 4 — Refine Input Field Styling

**What**: Polish the existing `AuthField` component with improved focus states and micro-interactions.

**Why**: The AuthField is already well-built (icons, toggle, error states, 54px height, rounded-2xl). But the focus/unfocused contrast is too subtle — `border-white/[0.08]` vs `border-primary` doesn't register at a glance. The Drivio reference shows inputs with a visible background shift on focus.

**How**:

1. **Enhance the focus state** in `auth-field.tsx`:
   - **Unfocused**: `border-white/[0.06] bg-zinc-900/50` — very receded, almost invisible.
   - **Focused**: `border-primary/60 bg-zinc-900` — red border glow + opaque background.
   - Add a **ring**: `ring-1 ring-primary/15` on focus for a soft outer glow (use a wrapping `View` with conditional shadow/border, since NativeWind doesn't support `ring` on RN).

2. **Animate the focus transition** with `react-native-reanimated`:
   - Interpolate `borderColor` and `backgroundColor` over 200ms using `useAnimatedStyle` and `withTiming`.
   - This replaces the hard binary switch and feels significantly more polished.

3. **Add a subtle scale pulse** on error:
   - When validation fails, briefly scale the field to `1.01` then back to `1.0` with a spring — draws attention without being aggressive.

---

### Step 5 — Redesign the Success / Confirmation States

**What**: Make the success states (activation success, reset success) and the check-email screen feel rewarding.

**Why**: These transitional screens are currently just a big icon + text. They're an opportunity for a micro-celebration. The user just completed an important step — acknowledge it.

**How**:

1. **Success state (Activate, Reset Password)**:
   - Scale up the checkmark icon: `h-20 w-20` container with `bg-emerald-500/10` border.
   - Add a **confetti-like shimmer**: Use `Animated.View` with a `FadeIn` + gentle `scale(0.8 → 1.0)` spring on the checkmark.
   - Title: "You're in." (Activate) / "All set." (Reset) — short, celebratory.
   - Subtitle: "Redirecting you to sign in..." with a brief auto-redirect after 2 seconds.

2. **Check Email screen**:
   - Add a subtle **pulsing animation** on the envelope icon to suggest "waiting" — use `withRepeat(withSequence(withTiming(1.05), withTiming(1.0)))`.
   - Show the email address in `text-white font-bold` (already done, but ensure prominence).

---

### Step 6 — Improve Spacing, Rhythm, and the Footer

**What**: Tighten the typographic hierarchy and push the footer navigation to the true bottom of the screen.

**Why**: The current footer links ("New to Glimpse? Create an account") float mid-screen because the form is vertically centered. In the reference designs, these links are anchored at the bottom — it's a convention users expect.

**How**:

1. **Title**: Reduce to `text-xl font-bold` (from `text-2xl`) — it doesn't need to compete with the logo above.
2. **Subtitle**: `text-[13px] text-zinc-500 leading-relaxed` — slightly smaller, lighter.
3. **Form gap**: Keep `gap-4` but add `mt-6` before the first field (already present).
4. **CTA button**: Add `mt-2` above the button for separation from the last field.
5. **Footer section**: Move from `mt-6` to `mt-auto pb-6` so it pins to the bottom:
   ```tsx
   <View className="mt-auto pb-6 items-center">
     <View className="mb-4 flex-row items-center gap-3">
       <View className="flex-1 h-px bg-white/[0.06]" />
       <Text className="text-[11px] text-zinc-600 tracking-wider">OR</Text>
       <View className="flex-1 h-px bg-white/[0.06]" />
     </View>
     <View className="flex-row items-center gap-1">
       <Text className="text-zinc-500 text-sm">New to Glimpse?</Text>
       <AuthTextLink label="Create an account" href="/register" tone="primary" />
     </View>
   </View>
   ```
6. **Bottom footnote** ("A quieter way to choose what to watch."): Remove or make truly subtle (`text-[10px] text-zinc-700`) — it competes with the footer link and doesn't add value on repeat visits.

---

### Step 7 — Add Screen Entry Animations

**What**: Animate the form content on screen mount for a polished feel.

**Why**: Static form loads feel abrupt. The current `animation: "fade"` on the Stack transition is a good start, but the content within the screen also benefits from staggered entrance. Zynema's login form visibly staggers its elements.

**How**:

1. In `AuthShell`, wrap the form zone elements in `Animated.View` with staggered `entering` props:
   - **Icon** (from Step 3): `FadeIn.delay(0).duration(300)`
   - **Title**: `FadeInDown.delay(100).duration(350).springify()`
   - **Subtitle**: `FadeIn.delay(200).duration(300)`
   - **Form fields**: `FadeInUp.delay(300).duration(400)`
   - **CTA + footer**: `FadeIn.delay(450).duration(350)`

2. Keep all animations **under 500ms total duration** and use `springify()` for natural motion. The goal is polish, not spectacle.

3. Do **not** animate the backdrop or logo on subsequent screen transitions (only on initial auth flow entry). Use a shared element or layout animation if the backdrop persists across screens.

---

### Step 8 — Refine the Color Palette for Auth

**What**: Introduce a subtle secondary surface color to create depth, and warm up the muted text.

**Why**: The current auth screens use `bg-zinc-900/70` for inputs against `#0C0C0E` background — the contrast is too low. The Drivio reference solves this with a slightly lighter card surface. The gradient is already warm-tinted (`#1C0B0E` has red undertones) — lean into that.

**How**:

1. **Input surface**: Brighten from `bg-zinc-900/70` to `bg-[#161618]` — a barely perceptible lift that makes inputs "float" on the background.
2. **Input border (default)**: Change from `rgba(255,255,255,0.08)` to `rgba(255,255,255,0.10)` — slightly more visible.
3. **Muted text**: Warm up `#71717A` (zinc-500) to `#8B8B94` for better readability without breaking the dark feel.
4. **Emblem badge**: Increase the red tint opacity from `0.12` to `0.18` for more presence in the enlarged hero.
5. **CTA button shadow**: Increase from `shadow-red-950/30` to `shadow-red-900/40` for more dramatic depth.

---

### Step 9 — Handle Keyboard Elegantly

**What**: When the keyboard opens, smoothly collapse the backdrop zone and keep the active field visible.

**Why**: A 40% hero image is beautiful until the keyboard covers the form. The current `KeyboardAvoidingView` shifts content up, which can push the hero awkwardly off-screen. A controlled collapse is more elegant.

**How**:

1. Use `useReanimatedKeyboardAnimation` from `react-native-keyboard-controller` (already in the project) to track keyboard height.
2. Animate the backdrop zone height from `40%` → `15%` when the keyboard opens:
   ```tsx
   const backdropHeight = useAnimatedStyle(() => ({
     height: interpolate(
       keyboardProgress.value,
       [0, 1],
       [SCREEN_HEIGHT * 0.4, SCREEN_HEIGHT * 0.15]
     ),
   }));
   ```
3. The logo can scale down proportionally (72px → 36px) or fade to 0 opacity when collapsed.
4. Use `withTiming(..., { duration: 250, easing: Easing.out(Easing.cubic) })` for smooth motion that matches the keyboard slide.

---

### Step 10 — Add Haptic Feedback to Key Moments

**What**: Extend the existing haptic feedback (already on CTA press) to more interaction points.

**Why**: Haptics reinforce the "tactile, deliberate" feel of the Quiet Cinema design language. They're already used on the primary button — extend to other touch points for consistency.

**How**:

| Interaction                      | Haptic type                          |
| -------------------------------- | ------------------------------------ |
| CTA button press ✓               | `Haptics.impactAsync(Light)` (done)  |
| Input field focus                 | `Haptics.selectionAsync()`           |
| Password visibility toggle       | `Haptics.selectionAsync()`           |
| Activation success               | `Haptics.notificationAsync(Success)` |
| Validation error shake           | `Haptics.notificationAsync(Error)`   |
| Back button press                | `Haptics.impactAsync(Light)`         |

---

## Implementation Order

| Priority | Step                               | Effort | Impact | Dependencies     |
| -------- | ---------------------------------- | ------ | ------ | ---------------- |
| **1**    | Step 1 — Cinematic Backdrop        | Medium | ★★★★★  | None             |
| **2**    | Step 2 — Enlarged Animated Logo    | Small  | ★★★★   | Step 1           |
| **3**    | Step 6 — Spacing & Footer          | Small  | ★★★★   | None             |
| **4**    | Step 3 — Screen-Specific Icons     | Small  | ★★★    | None             |
| **5**    | Step 9 — Keyboard Collapse         | Medium | ★★★★   | Step 1           |
| **6**    | Step 4 — Input Focus Animations    | Medium | ★★★    | None             |
| **7**    | Step 7 — Entry Animations          | Small  | ★★★    | None             |
| **8**    | Step 8 — Color Palette Refinement  | Small  | ★★     | None             |
| **9**    | Step 5 — Success State Polish      | Small  | ★★     | None             |
| **10**   | Step 10 — Extended Haptics         | Small  | ★      | None             |

---

## Files to Create

| File                                                  | Purpose                                   |
| ----------------------------------------------------- | ----------------------------------------- |
| `app/features/auth/components/auth-backdrop.tsx`       | Blurred movie still with gradient overlay  |
| `app/assets/images/auth/backdrop-1.jpg`                | Fallback backdrop image 1 (dark, moody)    |
| `app/assets/images/auth/backdrop-2.jpg`                | Fallback backdrop image 2                  |
| `app/assets/images/auth/backdrop-3.jpg`                | Fallback backdrop image 3                  |

## Files to Modify

| File                                                   | Changes                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| `app/features/auth/components/auth-shell.tsx`          | Split layout (backdrop + form), icon prop, entry animations, keyboard collapse, footer pinning |
| `app/features/auth/components/auth-field.tsx`          | Animated focus transition, error shake, selection haptic       |
| `app/features/auth/components/auth-actions.tsx`        | Extended haptics on interactions                               |
| `app/components/glimpse-logo.tsx`                      | Accept `size` prop for hero vs. compact rendering              |
| `app/app/(auth)/login.tsx`                             | Pass icon prop                                                 |
| `app/app/(auth)/register.tsx`                          | Pass icon + compact props                                      |
| `app/app/(auth)/check-email.tsx`                       | Pulsing envelope animation                                     |
| `app/app/(auth)/activate.tsx`                          | Pass icon prop, enhanced success state                         |
| `app/app/(auth)/forgot-password.tsx`                   | Pass icon prop                                                 |
| `app/app/(auth)/reset-password.tsx`                    | Pass icon prop, enhanced success state                         |
| `app/global.css`                                       | Refined surface/border values                                  |

---

## Design Principles

1. **Cinema-first**: Dark, atmospheric, unhurried. The auth screen is the lights dimming.
2. **One accent, used sparingly**: Cinema Red for CTAs and active states only. Everything else is zinc.
3. **Imagery over ornamentation**: Movie stills do the visual heavy-lifting — no decorative borders, patterns, or illustrations.
4. **Motion with purpose**: Animate entry and state transitions, not hover or idle. Keep total animation time under 500ms.
5. **Consistent with the grid**: The auth screen sets expectations for the daily 5-card experience — constrained, curated, intentional.
