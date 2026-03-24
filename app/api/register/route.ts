import { pool } from "@/lib/db"
import { hashPassword } from "@/lib/auth/hash"
import { NextResponse } from "next/server"

export async function POST(req:Request){

const {username,email,password} = await req.json()

const hash = await hashPassword(password)

await pool.query(
`
INSERT INTO users (username,email,password_hash)
VALUES ($1,$2,$3)
`,
[username,email,hash]
)

return NextResponse.json({success:true})

}
