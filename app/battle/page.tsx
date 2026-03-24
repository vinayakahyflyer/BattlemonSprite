"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import battlegroundGrass from '../../BattlemonImages/Battlegrounds/Battlegrndgrass.png'
import Image from "next/image";

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
}

export default function BattlePage() {
  const { data: session, status } = useSession()

  const [playerTeam, setPlayerTeam] = useState<Battlemon[]>([])
  const [enemy, setEnemy] = useState<Battlemon | null>(null)

  const [playerActive, setPlayerActive] = useState<Battlemon | null>(null)
  const [enemyActive, setEnemyActive] = useState<Battlemon | null>(null)

  const [loading, setLoading] = useState(true)

  // ✅ Fetch player battlemons
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

        if (parsed.length > 0) {
          setPlayerActive(parsed[0])
        }

        // ✅ TEMP AI: pick random enemy from same list
        const randomEnemy = parsed[Math.floor(Math.random() * parsed.length)]
        setEnemy(randomEnemy)
        setEnemyActive(randomEnemy)

        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [status, session])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading battle...
      </div>
    )
  }

  if (!playerActive || !enemyActive) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        No battlemons available
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-green-600 overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <Image
            src={battlegroundGrass}
            alt="Battle Background"
            className="object-cover"
            fill
        />
      </div>

      {/* ENEMY TOP */}
      <div className="absolute top-4 right-4 w-1/3 bg-white rounded-lg p-3 shadow-lg">
        <div className="flex justify-between text-sm font-bold">
          <span>{enemyActive.name}</span>
          <span>HP</span>
        </div>

        <div className="w-full bg-gray-300 h-2 mt-1 rounded">
          <div className="bg-green-500 h-2 rounded w-full" />
        </div>

        <p className="text-xs mt-1">
          Stats HP {enemyActive.stats_json.health} AT {enemyActive.stats_json.attack}
        </p>
      </div>

      {/* PLAYER TOP LEFT */}
      <div className="absolute top-4 left-4 w-1/3 bg-white rounded-lg p-3 shadow-lg">
        <div className="flex justify-between text-sm font-bold">
          <span>{playerActive.name}</span>
          <span>HP</span>
        </div>

        <div className="w-full bg-gray-300 h-2 mt-1 rounded">
          <div className="bg-green-500 h-2 rounded w-full" />
        </div>

        <p className="text-xs mt-1">
          Stats HP {playerActive.stats_json.health} AT {playerActive.stats_json.attack}
        </p>
      </div>

      {/* PLAYER SPRITE (BACK) */}
      <img
        src={playerActive.back_image_url || "/placeholder.png"}
        className="absolute bottom-32 left-10 h-48 object-contain"
      />

      {/* ENEMY SPRITE (FRONT) */}
      <img
        src={enemyActive.image_url || "/placeholder.png"}
        className="absolute top-28 right-20 h-40 object-contain"
      />

      {/* ACTION PANEL */}
      <div className="absolute bottom-0 w-full bg-gray-200 border-t-4 border-gray-400 p-4 flex justify-between">

        <div className="grid grid-cols-2 gap-4 w-1/2">
          <button className="bg-white p-4 border rounded shadow">
            Battle
          </button>

          <button className="bg-white p-4 border rounded shadow">
            Special Move
          </button>

          <button className="bg-white p-4 border rounded shadow">
            Change
          </button>

          <button className="bg-white p-4 border rounded shadow">
            Run
          </button>
        </div>

        {/* MOVES PANEL (placeholder for next step) */}
        <div className="w-1/2 bg-white border rounded p-4">
          <p className="text-sm font-semibold mb-2">Moves</p>

          <div className="grid grid-cols-2 gap-2">
            {playerActive.moves_json?.map((move, i) => (
              <div
                key={i}
                className="bg-gray-100 p-2 rounded text-xs"
              >
                {move?.name}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
