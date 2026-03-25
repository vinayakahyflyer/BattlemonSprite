import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { getUser } from "@/lib/auth/getUser"

// =======================
// TYPES
// =======================

type Stats = {
  health: number
  attack: number
  defense: number
  speed: number
  specialAttack: number
  specialDefense: number
  stamina: number
}

type Move = {
  id: number
  name: string
  base_damage: number
  accuracy: number
  stamina_cost: number
  nature: string
  damage_type: string
}

type CreatePlayerBattlemonBody = {
  battlemon_id: number
  name: string
  stats: Stats
  item_id?: number | null
  ability_id?: number | null
  special_move_id?: number | null
  moves: (Move | null)[]
}

// =======================
// ✅ CREATE / UPDATE
// =======================

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: CreatePlayerBattlemonBody = await req.json()

    const {
      battlemon_id,
      name,
      stats,
      item_id,
      ability_id,
      special_move_id,
      moves
    } = body

    if (!battlemon_id || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!Array.isArray(moves)) {
      return NextResponse.json(
        { error: "Moves must be an array" },
        { status: 400 }
      )
    }

    // ✅ Check existing
    const existingRes = await pool.query(
      `SELECT id, slot_position FROM player_battlemons 
       WHERE user_id = $1 AND battlemon_id = $2`,
      [user.id, battlemon_id]
    )

    const isUpdate = existingRes.rows.length > 0

    // ✅ Roster limit
    if (!isUpdate) {
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM player_battlemons WHERE user_id = $1`,
        [user.id]
      )

      const count = Number(countRes.rows[0].count)

      if (count >= 6) {
        return NextResponse.json(
          { error: "Roster limit reached (max 6)" },
          { status: 400 }
        )
      }
    }

    // ✅ Assign slot_position if new
    let slotPosition: number | null = null

    if (!isUpdate) {
      const slotRes = await pool.query(
        `SELECT COALESCE(MAX(slot_position), 0) + 1 AS next_slot
         FROM player_battlemons
         WHERE user_id = $1`,
        [user.id]
      )

      slotPosition = slotRes.rows[0].next_slot
    }

    const cleanedMoves = JSON.stringify(moves.filter(m => m !== null))
    const cleanedStats = JSON.stringify(stats)

    const result = await pool.query<{ id: number }>(
      `INSERT INTO player_battlemons 
      (user_id, battlemon_id, name, stats_json, moves_json, item_id, ability_id, special_move_id, slot_position)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      
      ON CONFLICT (user_id, battlemon_id)
      DO UPDATE SET
          name = EXCLUDED.name,
          stats_json = EXCLUDED.stats_json,
          moves_json = EXCLUDED.moves_json,
          item_id = EXCLUDED.item_id,
          ability_id = EXCLUDED.ability_id,
          special_move_id = EXCLUDED.special_move_id,
          updated_at = CURRENT_TIMESTAMP

      RETURNING id`,
      [
        user.id,
        battlemon_id,
        name,
        cleanedStats,
        cleanedMoves,
        item_id ?? null,
        ability_id ?? null,
        special_move_id ?? null,
        slotPosition
      ]
    )

    return NextResponse.json({
      success: true,
      id: result.rows[0].id
    })

  } catch (err: unknown) {
    console.error("SAVE ERROR:", err)

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// =======================
// ✅ GET (ORDERED)
// =======================

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const res = await pool.query(
      `
      SELECT 
        pb.id,
        pb.name,
        pb.stats_json,
        pb.moves_json,
        pb.slot_position,
        pb.battlemon_id,
        pb.slot_position,
        pb.item_id,          -- 🔥 REQUIRED
        pb.ability_id,       -- 🔥 REQUIRED
        pb.special_move_id,

        b.name AS battlemon_name,
        b.description,
        b.image_url,
        b.back_image_url,

        a.name AS ability_name,
        i.name AS item_name,
        sm.name AS special_move_name

      FROM player_battlemons pb
      JOIN battlemons b ON pb.battlemon_id = b.id
      LEFT JOIN abilities a ON pb.ability_id = a.id
      LEFT JOIN items i ON pb.item_id = i.id
      LEFT JOIN special_moves sm ON pb.special_move_id = sm.id

      WHERE pb.user_id = $1
      ORDER BY pb.slot_position ASC
      `,
      [user.id]
    )

    return NextResponse.json(res.rows)

  } catch (err) {
    console.error("GET ERROR:", err)

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// =======================
// ✅ DELETE (WITH SLOT FIX)
// =======================

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()

    const res = await pool.query(
      `SELECT slot_position FROM player_battlemons 
       WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    )

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      )
    }

    const deletedSlot = res.rows[0].slot_position

    // delete
    await pool.query(
      `DELETE FROM player_battlemons 
       WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    )

    // shift slots
    await pool.query(
      `UPDATE player_battlemons
       SET slot_position = slot_position - 1
       WHERE user_id = $1 AND slot_position > $2`,
      [user.id, deletedSlot]
    )

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error("DELETE ERROR:", err)

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// =======================
// ✅ REORDER (SWAP)
// =======================

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fromSlot, toSlot } = await req.json()

    if (!fromSlot || !toSlot) {
      return NextResponse.json(
        { error: "Missing slots" },
        { status: 400 }
      )
    }

    await pool.query("BEGIN")

    await pool.query(
      `UPDATE player_battlemons 
       SET slot_position = 0
       WHERE user_id = $1 AND slot_position = $2`,
      [user.id, fromSlot]
    )

    await pool.query(
      `UPDATE player_battlemons 
       SET slot_position = $2
       WHERE user_id = $1 AND slot_position = $3`,
      [user.id, fromSlot, toSlot]
    )

    await pool.query(
      `UPDATE player_battlemons 
       SET slot_position = $2
       WHERE user_id = $1 AND slot_position = 0`,
      [user.id, toSlot]
    )

    await pool.query("COMMIT")

    return NextResponse.json({ success: true })

  } catch (err) {
    await pool.query("ROLLBACK")

    console.error("REORDER ERROR:", err)

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
