import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Password",
            credentials: {
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const rawAdminPassword = process.env.ADMIN_PASSWORD;
                if (!rawAdminPassword) return null;

                // Remove potential surrounding quotes and whitespace from the environment variable
                const adminPassword = rawAdminPassword.replace(/^["']|["']$/g, '').trim();

                if (credentials && credentials.password === adminPassword) {
                    return { id: "1", name: "Admin" };
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname.startsWith("/login");
            if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
                return true;
            }
            return isLoggedIn;
        },
    },
});
