import { pool } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/hash"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },

      async authorize(credentials) {

        // ✅ Safety check
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // ✅ Fetch user
        const result = await pool.query(
          "SELECT * FROM users WHERE username = $1",
          [credentials.username]
        )

        const user = result.rows[0]

        if (!user) return null

        // ✅ Verify password
        const valid = await verifyPassword(
          credentials.password,
          user.password_hash
        )

        if (!valid) return null

        // ✅ Return user (IMPORTANT: convert to string)
        return {
          id: String(user.id),
          name: user.username ?? undefined // 🔥 FIX: null → undefined
        }
      }
    })
  ],

  session: {
    strategy: "jwt"
  },

  callbacks: {

    async jwt({ token, user }) {

      if (user) {
        token.id = user.id

        // 🔥 FIX: null → undefined
        token.username = user.name ?? undefined
      }

      return token
    },

    async session({ session, token }) {

      if (session.user) {
        session.user.id = token.id as string

        // 🔥 FIX: null → undefined
        session.user.username = token.username ?? undefined
      }

      return session
    }

  },

  secret: process.env.NEXTAUTH_SECRET
}
