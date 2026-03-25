import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

type Params = {
  params: Promise<{
    id: string
  }>
}

export async function GET(req: Request, context: Params) {
  // ✅ FIX: await params
  const { id } = await context.params

  const battlemonId = Number(id)

  // 🚨 Safety check
  if (isNaN(battlemonId)) {
    return NextResponse.json(
      { error: "Invalid ID" },
      { status: 400 }
    )
  }

  try {
    // 🔹 Abilities
    const abilityRes = await pool.query(
      `
      SELECT 
        a.id,
        a.name,
        a.description,
        a.rules AS required_natures   -- 🔥 MAP HERE
      FROM abilities a
      JOIN battlemon_abilities ba
        ON a.id = ba.ability_id
      WHERE ba.battlemon_id = $1
      `,
      [battlemonId]
    )


    // 🔹 Special Moves
    const specialMoveRes = await pool.query(
      `
      SELECT 
        sm.id,
        sm.name,
        sm.description,
        sm.base_damage,
        sm.rules AS required_natures   -- 🔥 MAP HERE
      FROM special_moves sm
      JOIN battlemon_special_moves bsm
        ON sm.id = bsm.special_move_id
      WHERE bsm.battlemon_id = $1
      `,
      [battlemonId]
    )


    return NextResponse.json({
      abilities: abilityRes.rows,
      specialMoves: specialMoveRes.rows
    })

  } catch (error) {
    console.error("DETAIL API ERROR:", error)

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
