import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

type Params = {
  params: Promise<{ id: string }>
}

export async function DELETE(req: NextRequest, context: Params) {
  try {
    const { id } = await context.params
    const pbId = Number(id)

    if (isNaN(pbId)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      )
    }

    await pool.query(
      `DELETE FROM player_battlemons WHERE id = $1`,
      [pbId]
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
