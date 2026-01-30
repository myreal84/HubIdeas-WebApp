import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig, normalizeEmail } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger }: any) {
            // 1. Initial Sign-In
            if (user) {
                token.id = user.id;

                const userEmail = normalizeEmail(user.email);
                const adminEmail = normalizeEmail(process.env.INITIAL_ADMIN_EMAIL);
                const isInitialAdmin = userEmail && adminEmail && userEmail === adminEmail;

                token.role = isInitialAdmin ? "ADMIN" : (user as any).role || "USER";
                token.status = isInitialAdmin ? "APPROVED" : (user as any).status || "WAITING";

                console.log(`[Auth] JWT Init: ${user.email}, status=${token.status}`);
            }

            // 2. Database Refresh (on manual update or if not approved)
            if (token.id && (trigger === "update" || token.status !== "APPROVED")) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { role: true, status: true }
                });

                if (dbUser) {
                    token.role = dbUser.role;
                    token.status = dbUser.status;
                    console.log(`[Auth] JWT Refresh: id=${token.id}, status=${token.status}`);
                }
            }

            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.status = token.status;
            }
            return session;
        },
        authorized: authConfig.callbacks.authorized,
    },
    events: {
        async signIn({ user }) {
            const userEmail = normalizeEmail(user.email);
            const adminEmail = normalizeEmail(process.env.INITIAL_ADMIN_EMAIL);

            console.log(`[Auth-Server] SignIn Event: ${user.email} (normalized: ${userEmail})`);
            console.log(`[Auth-Server] Admin Config: ${process.env.INITIAL_ADMIN_EMAIL} (normalized: ${adminEmail})`);

            if (userEmail && adminEmail && userEmail === adminEmail) {
                console.log(`[Auth-Server] Match found! Promoting ${user.email} to ADMIN/APPROVED`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (prisma as any).user.update({
                    where: { email: user.email },
                    data: {
                        role: "ADMIN",
                        status: "APPROVED",
                    },
                });
            } else {
                console.log(`[Auth-Server] No match found.`);
            }
        },
    },
});
