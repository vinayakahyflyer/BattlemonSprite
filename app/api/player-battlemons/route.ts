import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

// ✅ Define Stats type
type Stats = {
  health: number
  attack: number
  defense: number
  speed: number
  specialAttack: number
  specialDefense: number
  stamina: number
}

// ✅ Define Request Body type
type CreatePlayerBattlemonBody = {
  user_id: number
  battlemon_id: number
  name: string
  stats: Stats
  item_id?: number | null
  ability_id?: number | null
  special_move_id?: number | null
  moves: (number | null)[]
}


// ✅ Define DB return type
type InsertResult = {
  id: number
}

export async function POST(req: NextRequest) {
  try {
    const body: CreatePlayerBattlemonBody = await req.json()

    console.log("BODY:", body)

    const {
      user_id,
      battlemon_id,
      name,
      stats,
      item_id,
      ability_id,
      special_move_id,
      moves
    } = body

    // ✅ Validation
    if (user_id == null || battlemon_id == null || !name) {
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

    // ✅ Clean moves (remove undefined, keep null for slots if you want)
    const cleanedMoves = JSON.stringify(
    moves.map(m => (m ? Number(m) : null))
    )

    const cleanedStats = JSON.stringify(stats)



    // ✅ Insert EVERYTHING in one row
    const result = await pool.query<{ id: number }>(
    `INSERT INTO player_battlemons 
    (user_id, battlemon_id, name, stats_json, moves_json, item_id, ability_id, special_move_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    
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
        user_id,
        battlemon_id,
        name,
        cleanedStats,
        cleanedMoves,
        item_id ?? null,
        ability_id ?? null,
        special_move_id ?? null
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
        error:
          err instanceof Error
            ? err.message
            : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 }
      )
    }

    const res = await pool.query(
      `
      SELECT 
      pb.id,
      pb.name,
      pb.stats_json,
      pb.moves_json,
      pb.item_id,
      pb.ability_id,
      pb.special_move_id,
      pb.created_at,

      b.name AS battlemon_name,
      b.description,
      b.image_url,
      b.back_image_url,

      a.name AS ability_name,
      i.name AS item_name,
      sm.name AS special_move_name

    FROM player_battlemons pb

    JOIN battlemons b 
      ON pb.battlemon_id = b.id

    LEFT JOIN abilities a 
      ON pb.ability_id = a.id

    LEFT JOIN items i 
      ON pb.item_id = i.id

    LEFT JOIN special_moves sm 
      ON pb.special_move_id = sm.id

    WHERE pb.user_id = $1
    ORDER BY pb.created_at DESC

      `,
      [Number(userId)]
    )

    return NextResponse.json(res.rows)

  } catch (err) {
    console.error("GET PLAYER BATTLEMONS ERROR:", err)

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

