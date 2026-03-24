"use client"

import { useEffect, useState } from "react"

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
  ability_name?: string
  item_name?: string
  special_move_name?: string
  description: string
}

export default function MyBattlemonsPage() {
  const [battlemons, setBattlemons] = useState<Battlemon[]>([])
  const [loading, setLoading] = useState(true)

  const userId = 1 // 🔥 replace later with auth session

  useEffect(() => {
    fetch(`/api/player-battlemons?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        console.log("MY BATTLEMONS:", data)
        setBattlemons(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  function getNatures(moves: Move[]) {
    const set = new Set<string>()
    moves?.forEach(m => m?.nature && set.add(m.nature))
    return Array.from(set)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-4 md:p-8">

      <h1 className="text-3xl md:text-4xl font-bold mb-6">
        My Battlemons
      </h1>

      {battlemons.length === 0 ? (
        <p className="text-gray-400">
          No battlemons created yet.
        </p>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {battlemons.map((bm) => (

            <div
              key={bm.id}
              className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 space-y-4"
            >

              {/* IMAGE + NAME */}
              <div className="flex flex-col items-center text-center">
                <img
                  src={bm.image_url || "/placeholder.png"}
                  className="h-24 object-contain mb-2"
                />

                <h2 className="text-xl font-semibold">
                  {bm.name}
                </h2>

                <p className="text-xs opacity-60">
                  Description: {bm.description}
                </p>
              </div>

              {/* NATURE */}
              <div>
                <p className="text-sm font-semibold mb-1">Nature</p>

                <div className="flex flex-wrap gap-2">
                  {getNatures(bm.moves_json).map((n, i) => (
                    <span
                      key={i}
                      className="bg-gray-700 px-2 py-1 text-xs rounded"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* STATS */}
              <div>
                <p className="text-sm font-semibold mb-1">Stats</p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(bm.stats_json || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex justify-between bg-gray-800 px-2 py-1 rounded"
                    >
                      <span className="capitalize">{key}</span>
                      <span>{val as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MOVES */}
              <div>
                <p className="text-sm font-semibold mb-1">Moves</p>

                <div className="space-y-2">
                  {(bm.moves_json || []).map((move: any, i: number) => {

                    // ⚠️ handle old numeric data safely
                    if (typeof move === "number") return null

                    return (
                      <div
                        key={i}
                        className="bg-gray-800 p-2 rounded text-xs"
                      >
                        <p className="font-semibold">
                          {move?.name || "—"}
                        </p>

                        <p className="opacity-70">
                          {move?.nature} | {move?.damage_type}
                        </p>

                        <p className="opacity-70">
                          DMG: {move?.base_damage} | ACC: {move?.accuracy}
                        </p>

                        <p className="opacity-60">
                          STA: {move?.stamina_cost}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ABILITY */}
              <div>
                <p className="text-sm font-semibold">Ability</p>
                <p className="text-xs opacity-70">
                  {bm.ability_name || "None"}
                </p>
              </div>

              {/* ITEM */}
              <div>
                <p className="text-sm font-semibold">Item</p>
                <p className="text-xs opacity-70">
                  {bm.item_name || "None"}
                </p>
              </div>

              {/* SPECIAL MOVE */}
              <div>
                <p className="text-sm font-semibold">Special Move</p>
                <p className="text-xs opacity-70">
                  {bm.special_move_name || "None"}
                </p>
              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  )
}
