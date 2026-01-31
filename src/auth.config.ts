import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = normalizeEmail(credentials.email as string) as string;
                const password = credentials.password as string;

                // Find user in DB
                let user = await prisma.user.findUnique({
                    where: { email }
                });

                if (user && user.password) {
                    // Check password
                    const isValid = await bcrypt.compare(password, user.password);
                    if (!isValid) return null;
                    return user;
                } else if (!user) {
                    // Staging logic: Auto-create user on first login if it's for staging/testing
                    // but stay in WAITING status (requires admin approval)
                    const hashedPassword = await bcrypt.hash(password, 10);
                    user = await prisma.user.create({
                        data: {
                            email,
                            password: hashedPassword,
                            name: email.split('@')[0],
                            status: "WAITING",
                            role: "USER"
                        }
                    });
                    return user;
                }

                return null;
            }
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
            const isApproved = (auth?.user as any)?.status === "APPROVED";
            const isOnLogin = nextUrl.pathname.startsWith("/login");
            const isOnWaitingRoom = nextUrl.pathname === "/waiting-room";
            const isStatusApi = nextUrl.pathname === "/api/user/status";

            console.log(`[Middleware] Path: ${nextUrl.pathname}, isLoggedIn: ${isLoggedIn}, isApproved: ${isApproved}`);

            if (isOnLogin) {
                if (isLoggedIn) {
                    return isApproved
                        ? Response.redirect(new URL("/", nextUrl))
                        : Response.redirect(new URL("/waiting-room", nextUrl));
                }
                return true;
            }

            if (!isLoggedIn) {
                console.log(`[Middleware] Not logged in, redirecting to login from ${nextUrl.pathname}`);
                return false;
            }

            if (!isApproved && !isOnWaitingRoom && !isStatusApi) {
                console.log(`[Middleware] Not approved, redirecting to waiting-room from ${nextUrl.pathname}`);
                return Response.redirect(new URL("/waiting-room", nextUrl));
            }

            return true;
        },
    },
} satisfies NextAuthConfig;
