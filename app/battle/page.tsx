"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import battlegroundGrass from "../../BattlemonImages/Battlegrounds/Battlegrndgrass.png"

type Move = {
  id: number
  name: string
  base_damage: number
  accuracy: number
  stamina_cost: number
  nature: string
  damage_type: string
}

type Battlemon = {
  id: number
  name: string
  stats_json: any
  moves_json: Move[]
  battlemon_name: string
  image_url: string
  back_image_url: string
  description: string
  special_move_name?: string
}

const natureColors: Record<string, string> = {
  Fire: "bg-red-500",
  Water: "bg-blue-500",
  Grass: "bg-green-500",
  Electric: "bg-yellow-400",
  Ground: "bg-orange-800",
  Flying: "bg-teal-400",
  Ice: "bg-cyan-300",
  Mental: "bg-indigo-500"
}

export default function BattlePage() {
  const { data: session, status } = useSession()

  const [playerTeam, setPlayerTeam] = useState<Battlemon[]>([])
  const [playerActive, setPlayerActive] = useState<Battlemon | null>(null)
  const [enemyActive, setEnemyActive] = useState<Battlemon | null>(null)

  const [playerHP, setPlayerHP] = useState<Record<number, number>>({})
  const [enemyHP, setEnemyHP] = useState<number>(0)

  const [menuState, setMenuState] = useState<
    "main" | "moves" | "special" | "change"
  >("main")

  const [loading, setLoading] = useState(true)

  // ✅ Fetch using AUTH
  useEffect(() => {
    if (status !== "authenticated") return

    const userId = session?.user?.id
    if (!userId) return

    fetch(`/api/player-battlemons?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        const parsed = data.map((bm: any) => ({
          ...bm,
          stats_json:
            typeof bm.stats_json === "string"
              ? JSON.parse(bm.stats_json)
              : bm.stats_json,
          moves_json:
            typeof bm.moves_json === "string"
              ? JSON.parse(bm.moves_json)
              : bm.moves_json
        }))

        setPlayerTeam(parsed)

        // HP init
        const hpMap: Record<number, number> = {}
        parsed.forEach((bm: Battlemon) => {
          hpMap[bm.id] = bm.stats_json.health
        })
        setPlayerHP(hpMap)

        if (parsed.length > 0) {
          setPlayerActive(parsed[0])

          const enemy = parsed[Math.floor(Math.random() * parsed.length)]
          setEnemyActive(enemy)
          setEnemyHP(enemy.stats_json.health)
        }

        setLoading(false)
      })
  }, [status, session])

  function getNatures(moves: Move[]) {
    const set = new Set<string>()
    moves?.forEach(m => m?.nature && set.add(m.nature))
    return Array.from(set)
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading battle...
      </div>
    )
  }

  if (!playerActive || !enemyActive) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        No battlemons
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* BACKGROUND */}
      <Image src={battlegroundGrass} alt="bg" fill className="object-cover" />

      {/* PLAYER */}
      <div className="absolute top-4 left-4 w-1/3 bg-white p-3 rounded shadow">
        <div className="flex justify-between text-sm font-bold">
          <span>{playerActive.name}</span>
          <span>HP</span>
        </div>

        <div className="bg-gray-300 h-2 mt-1 rounded">
          <div
            className="bg-green-500 h-2 rounded"
            style={{
              width: `${(playerHP[playerActive.id] / playerActive.stats_json.health) * 100}%`
            }}
          />
        </div>

        <p className="text-xs">
          HP {playerHP[playerActive.id]} | AT {playerActive.stats_json.attack}
        </p>

        {/* ✅ NATURE COLORS */}
        <div className="flex gap-1 mt-1 flex-wrap">
          {getNatures(playerActive.moves_json).map((n, i) => (
            <span
              key={i}
              className={`text-[10px] px-2 py-0.5 rounded ${natureColors[n]}`}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* ENEMY */}
      <div className="absolute top-4 right-4 w-1/3 bg-white p-3 rounded shadow">
        <div className="flex justify-between text-sm font-bold">
          <span>{playerActive.name}</span>
          <span>HP</span>
        </div>

        <div className="bg-gray-300 h-2 mt-1 rounded">
          <div
            className="bg-green-500 h-2 rounded"
            style={{
              width: `${(enemyHP / enemyActive.stats_json.health) * 100}%`
            }}
          />
        </div>

        <p className="text-xs">
          HP {enemyHP} | AT {enemyActive.stats_json.attack}
        </p>

        <div className="flex gap-1 mt-1 flex-wrap">
          {getNatures(enemyActive.moves_json).map((n, i) => (
            <span
              key={i}
              className={`text-[10px] px-2 py-0.5 rounded ${natureColors[n]}`}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* SPRITES */}
      <img
        src={playerActive.back_image_url}
        className="absolute bottom-32 left-10 h-80"
      />

      <img
        src={enemyActive.image_url}
        className="absolute top-28 right-20 h-80"
      />

      {/* ACTION PANEL (YOUR EXACT DESIGN PRESERVED) */}
      <div className="absolute bottom-0 w-full bg-gray-200 border-t-4 border-gray-400 p-2">

        {/* MAIN MENU */}
        {menuState === "main" && (
          <div className="grid grid-cols-2 gap-4">

            <button
              onClick={() => setMenuState("moves")}
              className="bg-white p-4 border-2 border-gray-400 rounded-lg shadow text-lg font-semibold hover:bg-gray-100"
            >
              Battle
            </button>

            <button
              onClick={() => setMenuState("special")}
              className="bg-white p-4 border-2 border-gray-400 rounded-lg shadow text-lg font-semibold hover:bg-gray-100"
            >
              Special Move
            </button>

            <button
              onClick={() => setMenuState("change")}
              className="bg-white p-4 border-2 border-gray-400 rounded-lg shadow text-lg font-semibold hover:bg-gray-100"
            >
              Change
            </button>

            <button className="bg-white p-4 border-2 border-gray-400 rounded-lg shadow text-lg font-semibold hover:bg-gray-100">
              Run
            </button>

          </div>
        )}

        {/* MOVES PANEL */}
        {menuState === "moves" && (
          <div className="bg-white border-2 border-gray-400 rounded-lg p-4">

            <div className="flex justify-between mb-3">
              <p className="font-semibold">Choose Move</p>

              <button
                onClick={() => setMenuState("main")}
                className="text-sm text-gray-500 hover:text-black"
              >
                Back
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {playerActive.moves_json?.map((move, i) => (
                <button
                  key={i}
                  className="bg-gray-100 p-3 rounded-lg text-left hover:bg-gray-200 border"
                >
                  <p className="font-semibold text-sm">{move.name}</p>
                  <p className="text-xs opacity-70">
                    {move.nature} | {move.damage_type}
                  </p>
                  <p className="text-xs opacity-70">
                    DMG {move.base_damage} | ACC {move.accuracy}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SPECIAL PANEL */}
        {menuState === "special" && (
          <div className="bg-white border-2 border-gray-400 rounded-lg p-4">

            <div className="flex justify-between mb-3">
              <p className="font-semibold">Special Move</p>

              <button
                onClick={() => setMenuState("main")}
                className="text-sm text-gray-500 hover:text-black"
              >
                Back
              </button>
            </div>

            {playerActive.special_move_name ? (
              <div className="bg-gray-100 p-4 rounded-lg border">
                <p className="font-semibold text-sm mb-1">
                  {playerActive.special_move_name}
                </p>

                <button className="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Use Special Move
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No special move equipped
              </p>
            )}
          </div>
        )}

        {/* CHANGE PANEL (NEW, MATCHED STYLE) */}
        {menuState === "change" && (
          <div className="bg-white border-2 border-gray-400 rounded-lg p-4">

            <div className="flex justify-between mb-3">
              <p className="font-semibold">Choose Battlemon</p>

              <button
                onClick={() => setMenuState("main")}
                className="text-sm text-gray-500 hover:text-black"
              >
                Back
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {playerTeam.map((bm) => {
                const hp = playerHP[bm.id]

                return (
                  <button
                    key={bm.id}
                    disabled={hp <= 0 || bm.id === playerActive.id}
                    onClick={() => {
                      setPlayerActive(bm)
                      setMenuState("main")
                    }}
                    className="bg-gray-100 p-3 rounded-lg border w-full text-left hover:bg-gray-200"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">{bm.name}</span>
                      <span className="text-xs">HP: {hp}</span>
                    </div>
                  </button>
                )
              })}
            </div>

          </div>
        )}

      </div>

    </div>
  )
}
