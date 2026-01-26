import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig, normalizeEmail } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
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
