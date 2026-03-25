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
  back_image_url: string
  ability_name?: string
  item_name?: string
  special_move_name?: string
  description: string
  slot_position: number
}

const natureColors: Record<string, string> = {
  Fire: "bg-red-500",
  Water: "bg-blue-500",
  Grass: "bg-green-500",
  Electric: "bg-yellow-400",
  Ground: "bg-orange-900",
  Flying: "bg-teal-400",
  Ice: "bg-cyan-300",
  Mental: "bg-indigo-500"
}

export default function MyBattlemonsPage() {
  const [battlemons, setBattlemons] = useState<Battlemon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/player-battlemons`)
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

        setBattlemons(parsed)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // =======================
  // DELETE
  // =======================
  async function handleDelete(id: number) {
    if (!confirm("Remove this battlemon?")) return

    const res = await fetch(`/api/player-battlemons`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || "Delete failed")
      return
    }

    setBattlemons(prev => prev.filter(bm => bm.id !== id))
  }

  // =======================
  // 🔥 MOVE SLOT
  // =======================
  async function moveSlot(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= battlemons.length) return

    const fromSlot = battlemons[index].slot_position
    const toSlot = battlemons[targetIndex].slot_position

    // 🔥 Optimistic UI update
    const updated = [...battlemons]
    ;[updated[index], updated[targetIndex]] = [
      updated[targetIndex],
      updated[index]
    ]

    setBattlemons(updated)

    try {
      await fetch("/api/player-battlemons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromSlot,
          toSlot
        })
      })
    } catch (err) {
      console.error("Reorder failed:", err)
    }
  }

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

      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        My Battlemons
      </h1>

      <p className="text-sm text-gray-400 mb-6">
        {battlemons.length} / 6 in roster
      </p>

      {battlemons.length === 0 ? (
        <p className="text-gray-400">No battlemons created yet.</p>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {battlemons.map((bm, index) => {

            const natures = getNatures(bm.moves_json)

            return (
              <div
                key={bm.id}
                className="relative bg-gray-900/70 border border-gray-700 rounded-xl p-4 space-y-4"
              >

                {/* SLOT NUMBER */}
                {/* <div className="absolute top-2 left-2 text-xs bg-gray-800 px-2 py-1 rounded">
                  Slot {bm.slot_position}
                </div> */}

                {/* DELETE */}
                <button
                  onClick={() => handleDelete(bm.id)}
                  className="absolute top-2 right-2 bg-red-600 w-7 h-7 rounded-full text-xs"
                >
                  ✕
                </button>

                {/* 🔥 MOVE BUTTONS */}
                <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                  <button
                    onClick={() => moveSlot(index, "up")}
                    className="bg-gray-700 px-2 py-1 text-xs rounded hover:bg-gray-600"
                  >
                    ⬆
                  </button>
                  <button
                    onClick={() => moveSlot(index, "down")}
                    className="bg-gray-700 px-2 py-1 text-xs rounded hover:bg-gray-600"
                  >
                    ⬇
                  </button>
                </div>

                {/* IMAGE */}
                <div className="flex flex-col items-center text-center">
                  <img
                    src={bm.image_url || "/placeholder.png"}
                    className="h-48 object-contain mb-2"
                  />

                  <h2 className="text-xl font-semibold">{bm.name}</h2>

                  <p className="text-xs opacity-60">
                    {bm.description}
                  </p>
                </div>

                {/* NATURE */}
                <div>
                  <p className="text-sm font-semibold mb-1">Nature</p>

                  <div className="flex flex-wrap gap-2">
                    {natures.length > 0 ? (
                      natures.map((n, i) => (
                        <span
                          key={i}
                          className={`px-2 py-1 text-xs rounded ${
                            natureColors[n] || "bg-gray-700"
                          }`}
                        >
                          {n}
                        </span>
                      ))
                    ) : (
                      <span className="opacity-50 text-xs">None</span>
                    )}
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

                      if (!move || typeof move === "number") return null

                      return (
                        <div
                          key={i}
                          className="bg-gray-800 p-2 rounded text-xs"
                        >
                          <p className="font-semibold">{move.name}</p>

                          <p className="opacity-70">
                            {move.nature} | {move.damage_type}
                          </p>

                          <p className="opacity-70">
                            DMG: {move.base_damage} | ACC: {move.accuracy}
                          </p>

                          <p className="opacity-60">
                            STA: {move.stamina_cost}
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
            )
          })}

        </div>
      )}
    </div>
  )
}
