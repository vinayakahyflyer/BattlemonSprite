import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const res = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.effect_type,
        i.effect_value,
        i.description
      FROM items i
      ORDER BY i.id ASC
    `)

    return NextResponse.json(res.rows)

  } catch (error) {
    console.error("ITEMS API ERROR:", error)

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
