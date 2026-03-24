import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const res = await pool.query(`
      SELECT 
        m.id,
        m.name,
        m.base_damage,
        m.accuracy,
        m.stamina_cost,
        m.description,
        nt.name AS nature,
        dt.name AS damage_type
      FROM moves m
      LEFT JOIN nature_types nt ON m.nature_id = nt.id
      LEFT JOIN damage_types dt ON m.damage_type_id = dt.id
      ORDER BY m.id ASC
    `)

    return NextResponse.json(res.rows)

  } catch (error) {
    console.error("MOVES API ERROR:", error)

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
