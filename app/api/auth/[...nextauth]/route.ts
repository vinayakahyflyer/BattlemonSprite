import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { pool } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/hash"

const handler = NextAuth({

providers:[

CredentialsProvider({

name:"Credentials",

credentials:{
username:{label:"Username", type:"text"},
password:{label:"Password", type:"password"}
},

async authorize(credentials){

const result = await pool.query(
"SELECT * FROM users WHERE username=$1",
[credentials?.username]
)

const user = result.rows[0]

if(!user) return null

const valid = await verifyPassword(
credentials!.password,
user.password_hash
)

if(!valid) return null

return {
id:user.id,
name:user.username
}

}

})

],

session:{
strategy:"jwt"
},

callbacks: {

async jwt({ token, user }) {

  if(user){
    token.id = String(user.id)
    token.username = user.name ?? undefined
  }

  return token

},

async session({ session, token }) {

  if(session.user){
    session.user.id = token.id ?? ""
    session.user.username = token.username ?? ""
  }

  return session

}

}
,

secret:process.env.NEXTAUTH_SECRET

})

export { handler as GET, handler as POST }
