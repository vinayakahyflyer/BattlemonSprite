import { NextResponse } from "next/server"
import { getBattlemons } from "@/lib/queries/battlemons"

export async function GET() {

  const battlemons = await getBattlemons()

  return NextResponse.json(battlemons)

}
