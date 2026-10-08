This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication and routes

Profile selection fields use the reusable Radix-based `Select` component, with
keyboard navigation, focus management, and a consistently styled popup menu.
The profile form also sends an optional `name` through the existing profile
endpoint. A successful save updates the shared user, avatar initials, and sidebar
name without reloading the workspace.

### Page transitions

Public routes share a native React `ViewTransition` through `app/template.tsx`.
Navigation uses a short crossfade without navigation delays or router overrides.
Chat and profile live in the `(workspace)` route group, without changing their
URLs. Its shared layout owns `AppShell`, including the desktop/mobile sidebar,
user data, thread list, active conversation, and collapsed/expanded state.
The workspace template animates only the content pane; loading a page never
unmounts the sidebar. Unsupported browsers continue navigating normally.

`PageContent` adds a 300ms content reveal after client-side loading, plus short
exit/enter transitions for login/register, onboarding steps, and profile views.
Selected content groups reveal with 40ms stagger intervals. Chat content reveals
once on entry, not on every message or keystroke. Global `MotionConfig` and CSS
respect the operating system's reduced-motion preference. Exiting form content
is inert until removed so it cannot receive input during the transition.

- `/profile` is available from the user name at the bottom of the desktop/mobile chat sidebar. It loads the real user from `/auth/me`, shows subscription status and personal data, and saves style preferences through `/auth/me/onboarding`. Password changes call `PUT /auth/me/password` with the current and new passwords; Google accounts use Google's security settings. Support remains disabled pending configuration. No avatar URL is returned by the backend, so the avatar uses the real user's initials.
- `/` is the public landing page, including for signed-in users.
- `/login` displays the existing login and registration forms. Login, registration, Google sign-in, and existing sessions redirect to `/onboarding` if `onboardingCompleted` is false, otherwise to `/chat`.
- `/chat` requires a session and a profile confirmed by `GET /auth/me` before requesting history or displaying the chat. Incomplete profiles redirect to `/onboarding`; missing, malformed, or expired tokens redirect to `/login`.
- `/onboarding` checks the session, loads any existing profile values, and submits with `authService.updateOnboarding` to `PUT /auth/me/onboarding`. It redirects to `/chat` only after the server confirms completion. Fashion preference values are `FEMALE`, `MALE`, and `NEUTRAL`, matching the Java enum.
- Auth service login methods save the JWT and return `UserResponseDto`, not the full `{ token, user }` envelope. Profile fields are `cityName`, `cityCoordinates`, `lifestyles`, `stellaPersona`, and `onboardingCompleted`. The Axios base URL already includes `/api/v1`; service paths must not repeat that prefix.
- Login calls `POST http://localhost:8080/api/v1/auth/login` with `{ email, password }` and expects `{ token, user }` containing a JWT and the user profile.
- Registration calls `POST /auth/register`. A filled-in email is reused directly in the password step; its local part provides a provisional name if none was entered. Passwords require at least 8 characters, an uppercase letter, a number, and matching confirmation; the service also enforces the BCrypt limit of 72 UTF-8 bytes.
- Google uses the Google Identity Services authorization-code popup, not One Tap/FedCM. It sends `{ code }` to `POST /auth/google` with `X-Requested-With: XmlHttpRequest`. The backend checks the origin, exchanges the code for an ID token, then creates or signs in the account. The endpoint also accepts the previous `{ idToken }` payload.
- The token is stored under `@stella:token` in localStorage and sent as `Authorization: Bearer <token>`.
- Chat responses with status `401` or `403` clear the local session and redirect to `/login?reason=access-denied`. A persistent `403` after login requires checking backend permissions/security configuration.
- Logout calls `POST /auth/logout`, then clears the local token and redirects to `/login`, even if the server is unavailable. JWTs are not revoked by this stateless endpoint.

### Google configuration

Create a Google OAuth client of type **Web application**. Add the frontend origin (for example, `http://localhost:3000`) to its authorized JavaScript origins. Configure the same client ID on both sides:

```dotenv
# Frontend: .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
# Backend: execution environment
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000
```

Set the secret only in the backend environment, never in `.env.local` or any `NEXT_PUBLIC_` variable. Obtain it from Google Auth Platform > Clients, not Branding. `GOOGLE_REDIRECT_URI` must be the exact frontend origin used by the popup. Add that origin to the OAuth client's authorized JavaScript origins. In testing mode, include your Google account in Audience > Test users. Allow popups for the frontend and restart both applications. The SDK is preloaded when login mounts to preserve the button's user gesture.

The local JWT check only checks structure and expiration; the backend must validate the signature and authorize all protected endpoints. Client-side route checks do not replace backend security. For production, prefer an HttpOnly cookie-based session rather than exposing tokens to JavaScript.

Opening the bare domain and opening `/` are the same request, so both show the landing page. The landing page's login links enter the session-aware flow.

The root HTML suppresses attribute-level hydration warnings caused by browser extensions (such as `data-xt-extension-active`). It does not suppress mismatches inside the application. Disable the injecting extension to remove the external mutation itself.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
