import { pool } from "@/lib/db"

export async function GET() {
  const res = await pool.query("SELECT * FROM battlemons")
  return Response.json(res.rows)
}
