import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

// --- Helpers ---

export function normalizeEmail(email: string | null | undefined) {
    return email?.toLowerCase().trim().replace("@googlemail.com", "@gmail.com");
}

export const authConfig = {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;

                const userEmail = normalizeEmail(user.email);
                const adminEmail = normalizeEmail(process.env.INITIAL_ADMIN_EMAIL);
                const isInitialAdmin = userEmail && adminEmail && userEmail === adminEmail;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.role = isInitialAdmin ? "ADMIN" : (user as any).role;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.status = isInitialAdmin ? "APPROVED" : (user as any).status;

                console.log(`[Auth-Config] JWT Callback: user=${user.email}, isInitialAdmin=${isInitialAdmin}, status=${token.status}`);
            }
            return token;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.status = token.status;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isApproved = (auth?.user as any)?.status === "APPROVED";
            const isOnLogin = nextUrl.pathname.startsWith("/login");
            const isOnWaitingRoom = nextUrl.pathname === "/waiting-room";

            if (isOnLogin) {
                if (isLoggedIn) {
                    return isApproved
                        ? Response.redirect(new URL("/", nextUrl))
                        : Response.redirect(new URL("/waiting-room", nextUrl));
                }
                return true;
            }

            if (!isLoggedIn) return false;

            if (!isApproved && !isOnWaitingRoom) {
                return Response.redirect(new URL("/waiting-room", nextUrl));
            }

            return true;
        },
    },
} satisfies NextAuthConfig;
