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

- `/` is the public landing page, including for signed-in users.
- `/login` displays the email/password form. Users with a locally valid JWT are redirected to `/chat`.
- `/chat` requires a session before requesting history or displaying the chat. Missing, malformed, or expired tokens redirect to `/login`.
- Login calls `POST http://localhost:8080/api/v1/auth/login` with `{ email, password }` and expects `{ token }` containing a JWT.
- The token is stored under `@stella:token` in localStorage and sent as `Authorization: Bearer <token>`.
- Chat responses with status `401` or `403` clear the local session and redirect to `/login?reason=access-denied`. A persistent `403` after login requires checking backend permissions/security configuration.
- Logout clears the local token and redirects to `/login`.

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
