"use client"

import { useState, useEffect } from "react"

export default function BuildBattlemon() {
  const MAX_POINTS = 100

  const [stats, setStats] = useState({
    health: 22,
    attack: 10,
    defense: 16,
    speed: 6,
    specialAttack: 13,
    specialDefense: 13,
    stamina: 20
  })

  const [battlemons, setBattlemons] = useState<any[]>([])
  const [selectedBattlemon, setSelectedBattlemon] = useState<any>(null)
  const [tempBattlemon, setTempBattlemon] = useState<any>(null)

  const [showSelector, setShowSelector] = useState(false)

  const [abilities, setAbilities] = useState<any[]>([])
  const [specialMoves, setSpecialMoves] = useState<any[]>([])

  const [moves, setMoves] = useState<any[]>([]) // all available moves
  const [selectedMoves, setSelectedMoves] = useState<(any | null)[]>([null, null, null, null])
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [showMoveSelector, setShowMoveSelector] = useState(false)

  const [items, setItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showItemSelector, setShowItemSelector] = useState(false)

  const [selectedAbility, setSelectedAbility] = useState<any>(null)
  const [selectedSpecialMove, setSelectedSpecialMove] = useState<any>(null)

  const [showAbilitySelector, setShowAbilitySelector] = useState(false)
  const [showSpecialMoveSelector, setShowSpecialMoveSelector] = useState(false)

  const [battlemonNatures, setBattlemonNatures] = useState<string[]>([])

  const [playerBattlemons, setPlayerBattlemons] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/player-battlemons")
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

        setPlayerBattlemons(parsed)
      })
  }, [])

  useEffect(() => {
    fetch("/api/battlemons")
      .then(res => res.json())
      .then(setBattlemons)
  }, [])

  useEffect(() => {
    fetch("/api/moves")
      .then(res => res.json())
      .then(data => {
        console.log("MOVES:", data)
        setMoves(data)
      })
  }, [])

  useEffect(() => {
    fetch("/api/items")
      .then(res => res.json())
      .then(data => {
        console.log("ITEMS:", data)
        setItems(data)
      })
  }, [])

  useEffect(() => {
    const natures = calculateNatures(selectedMoves)
    setBattlemonNatures(natures)

    // ❌ Remove invalid ability
    if (
      selectedAbility &&
      !isRequirementMet(selectedAbility.required_natures, natures)
    ) {
      setSelectedAbility(null)
    }

    // ❌ Remove invalid special move
    if (
      selectedSpecialMove &&
      !isRequirementMet(selectedSpecialMove.required_natures, natures)
    ) {
      setSelectedSpecialMove(null)
    }

  }, [selectedMoves])



  function calculateNatures(moves: (any | null)[]) {
    const natureSet = new Set<string>()

    moves.forEach(move => {
      if (move?.nature) {
        natureSet.add(move.nature)
      }
    })

    return Array.from(natureSet)
  }

  function getLiveNatures() {
    return calculateNatures(selectedMoves)
  }


  function normalizeRequired(req: any): string[] {
    if (!req) return []

    // ✅ CASE 1: Already array
    if (Array.isArray(req)) return req

    // ✅ CASE 2: Object format (YOUR CURRENT CASE)
    if (typeof req === "object") {
      if (Array.isArray(req.required_natures)) {
        return req.required_natures
      }
      return []
    }

    // ✅ CASE 3: String (JSON or plain)
    if (typeof req === "string") {
      try {
        const parsed = JSON.parse(req)

        // if parsed is object → extract again
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.required_natures)) {
            return parsed.required_natures
          }
        }

        if (Array.isArray(parsed)) return parsed
      } catch {}

      return [req]
    }

    return []
  }



  function isRequirementMet(required: any, current: string[]) {
    if (!required) return true

    let reqArray: string[] = []
    let requireAll = true
    let requirePure = false

    // ✅ Handle object format
    if (typeof required === "object" && !Array.isArray(required)) {
      reqArray = required.required_natures || []
      requireAll = required.require_all ?? true
      requirePure = required.require_pure ?? false
    } else {
      reqArray = normalizeRequired(required)
    }

    if (reqArray.length === 0) return true
    if (current.length === 0) return false

    const currentLower = current.map(c => c.toLowerCase())
    const reqLower = reqArray.map(r => r.toLowerCase())

    // =========================
    // 🔥 STEP 1: AND / OR CHECK
    // =========================

    let conditionMet = false

    if (requireAll) {
      conditionMet = reqLower.every(r => currentLower.includes(r))
    } else {
      conditionMet = reqLower.some(r => currentLower.includes(r))
    }

    if (!conditionMet) return false

    // =========================
    // 🔥 STEP 2: PURE CHECK
    // =========================

    if (requirePure) {
      // must ONLY contain required natures (no extras)
      const isExactMatch =
        currentLower.length === reqLower.length &&
        currentLower.every(c => reqLower.includes(c))

      return isExactMatch
    }

    return true
  }

  function formatRequirement(required: any): string {
    if (!required) return "No requirement"

    let reqArray: string[] = []
    let requireAll = true
    let requirePure = false

    if (typeof required === "object" && !Array.isArray(required)) {
      reqArray = required.required_natures || []
      requireAll = required.require_all ?? true
      requirePure = required.require_pure ?? false
    } else {
      reqArray = normalizeRequired(required)
    }

    if (reqArray.length === 0) return "No requirement"

    // 🔥 PURE CASE (MOST IMPORTANT)
    if (requirePure) {
      return `${reqArray.join(" + ")} ONLY`
    }

    // 🔥 AND CASE
    if (requireAll) {
      return `Requires: ${reqArray.join(" + ")}`
    }

    // 🔥 OR CASE
    return `Requires ANY: ${reqArray.join(" / ")}`
  }



  const totalPoints = Object.values(stats).reduce((a, b) => a + b, 0)

  function updateStat(stat: string, delta: number) {
    setStats(prev => {
      const currentValue = prev[stat as keyof typeof prev]
      const newValue = currentValue + delta

      if (newValue < 0) return prev
      if (delta > 0 && totalPoints >= MAX_POINTS) return prev

      return {
        ...prev,
        [stat]: newValue
      }
    })
  }

  // ✅ Confirm Selection (Save)
  async function handleConfirmSelection() {
    if (!tempBattlemon) return

    const existing = playerBattlemons.find(
      pb => Number(pb.battlemon_id) === Number(tempBattlemon.id)
    )

    setSelectedBattlemon(tempBattlemon)

    let abilitiesData: any[] = []
    let specialMovesData: any[] = []

    try {
      const res = await fetch(`/api/battlemon-details/${tempBattlemon.id}`)
      const data = await res.json()

      abilitiesData = data.abilities || []
      specialMovesData = data.specialMoves || []

      setAbilities(abilitiesData)
      setSpecialMoves(specialMovesData)

    } catch (err) {
      console.error("Fetch error:", err)
    }

    if (existing) {
      // =========================
      // LOAD EXISTING DATA
      // =========================

      setStats(existing.stats_json)

      // ✅ Moves mapping
      const mapped = [null, null, null, null]
      existing.moves_json.forEach((m: any, i: number) => {
        mapped[i] = m
      })
      setSelectedMoves(mapped)

      // ✅ Item
      setSelectedItem(
        items.find(i => i.id === existing.item_id) || null
      )

      // =========================
      // 🔥 IMPORTANT: VALIDATE AGAINST NATURE
      // =========================

      const natures = calculateNatures(mapped)

      const ability = abilitiesData.find(a => a.id === existing.ability_id)
      const special = specialMovesData.find(sm => sm.id === existing.special_move_id)

      setSelectedAbility(
        ability && isRequirementMet(ability.required_natures, natures)
          ? ability
          : null
      )

      setSelectedSpecialMove(
        special && isRequirementMet(special.required_natures, natures)
          ? special
          : null
      )

    } else {
      // =========================
      // RESET FOR NEW BUILD
      // =========================

      setSelectedMoves([null, null, null, null])
      setSelectedItem(null)
      setSelectedAbility(null)
      setSelectedSpecialMove(null)
    }

    setShowSelector(false)
    setTempBattlemon(null)
    console.log("EXISTING:", existing)
    console.log("ITEM ID:", existing?.item_id)
    console.log("ABILITY ID:", existing?.ability_id)
    console.log("SPECIAL MOVE ID:", existing?.special_move_id)
  }


async function handleSave() {
  try {
    if (!selectedBattlemon) {
      alert("Please select a Battlemon")
      return
    }

    const payload = {
      battlemon_id: selectedBattlemon.id,
      name: selectedBattlemon.name,
      stats,
      item_id: selectedItem?.id ?? null,
      ability_id: selectedAbility?.id ?? null,
      special_move_id: selectedSpecialMove?.id ?? null,

      // ✅ send FULL move objects
      moves: selectedMoves
    }

    const res = await fetch("/api/player-battlemons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || "Save failed")
      return
    }

    alert("Battlemon saved successfully 🚀")

  } catch (err) {
    console.error(err)
    alert("Something went wrong")
  }
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

const isSaveDisabled =
  !selectedBattlemon ||
  selectedMoves.every(m => m === null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-4 md:p-8">

      <h1 className="text-3xl md:text-4xl font-bold mb-6">Build BattleMon</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* LEFT PANEL — STATS */}
        <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4">
          <h2 className="text-xl mb-4 font-semibold">Stats</h2>

          <div className="space-y-3">
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2">
                <span className="capitalize text-sm">{key}</span>

                <div className="flex items-center gap-2">
                  <button onClick={() => updateStat(key, -1)} className="w-8 h-8 bg-gray-800 rounded">◀</button>
                  <span className="w-8 text-center">{val}</span>
                  <button onClick={() => updateStat(key, 1)} className="w-8 h-8 bg-gray-800 rounded">▶</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-gray-700 pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span className={totalPoints === MAX_POINTS ? "text-red-400" : ""}>
              {totalPoints} / {MAX_POINTS}
            </span>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 space-y-6">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-sm opacity-60 mb-2">Nature</p>

            <div className="flex flex-wrap gap-2 justify-center">
              {battlemonNatures.length > 0 ? (
                battlemonNatures.map((nature, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full text-sm ${natureColors[nature] || "bg-gray-700"}`}
                  >
                    {nature}
                  </span>
                ))
              ) : (
                <span className="opacity-50 text-sm">None</span>
              )}
            </div>
          </div>
   
          {/* Moves */}
          <h2 className="text-xl font-semibold">Moves</h2>

            <div className="grid grid-cols-2 gap-3">
              {selectedMoves.map((move, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveSlot(index)
                    setShowMoveSelector(true)
                  }}
                  className="bg-gray-800 h-20 rounded-lg flex items-center justify-center text-center hover:bg-gray-700"
                >
                  {move ? (
                    <div>
                      <p className="font-semibold">{move.name}</p>
                      <p className="text-xs opacity-70">
                        {move.nature} | {move.damage_type}
                      </p>

                      <p className="text-xs opacity-70">
                        DMG: {move.base_damage} | ACC: {move.accuracy}
                      </p>
                    </div>
                  ) : (
                    <span className="opacity-50">Select Move</span>
                  )}
                </button>
              ))}
            </div>

          {showMoveSelector && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-xl w-[90%] md:w-[800px] max-h-[85vh] flex flex-col">

                <h2 className="text-xl mb-4">Select Move</h2>

                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                    {moves.map((move) => (
                      <div
                        key={move.id}
                        onClick={() => {
                          if (activeSlot === null) return

                          const updated = [...selectedMoves]
                          updated[activeSlot] = move

                          setSelectedMoves(updated)
                          setShowMoveSelector(false)
                        }}
                        className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700"
                      >
                        <p className="font-semibold">{move.name}</p>

                        <p className="text-xs opacity-70">
                          DMG: {move.base_damage} | ACC: {move.accuracy}
                        </p>

                        <p className="text-xs opacity-70">
                          STA: {move.stamina_cost}
                        </p>

                        <p className="text-xs opacity-70">
                          Nat: {move.nature}
                        </p>

                        <p className="text-xs mt-1 opacity-60">
                          {move.description}
                        </p>
                      </div>
                    ))}

                  </div>
                </div>

                <button
                  onClick={() => setShowMoveSelector(false)}
                  className="mt-4 text-gray-400"
                >
                  Cancel
                </button>

              </div>
            </div>
          )}


      


          {/* Item */}
          <h2 className="text-xl font-semibold">Item</h2>

            <div className="relative">
              <button
                onClick={() => setShowItemSelector(true)}
                className="bg-gray-800 h-16 rounded-lg w-full flex items-center justify-center hover:bg-gray-700"
              >
                {selectedItem ? (
                  <div className="text-center">
                    <p className="font-semibold">{selectedItem.name}</p>
                    <p className="text-xs opacity-60">{selectedItem.effect}</p>
                  </div>
                ) : (
                  <span className="opacity-50">Select Item</span>
                )}
              </button>

              {/* ❌ DELETE BUTTON */}
              {selectedItem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation() // 🚨 prevents opening modal
                    setSelectedItem(null)
                  }}
                  className="absolute top-1 right-1 bg-red-600 w-6 h-6 rounded-full text-xs flex items-center justify-center hover:bg-red-700"
                >
                  ✕
                </button>
              )}
            </div>

            {showItemSelector && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

    <div className="bg-gray-900 p-6 rounded-xl w-[90%] md:w-[600px] max-h-[80vh] flex flex-col">

      <h2 className="text-xl mb-4">Select Item</h2>

      <div className="flex-1 overflow-y-auto pr-2">

        <div className="grid grid-cols-1 gap-3">

          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedItem(item)
                setShowItemSelector(false)
              }}
              className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700"
            >
              <p className="font-semibold">{item.name}</p>

              <p className="text-xs opacity-70">
                {item.effect}
              </p>

              <p className="text-xs mt-1 opacity-60">
                {item.description}
              </p>
                      </div>
                    ))}

                  </div>

                </div>

                <button
                  onClick={() => setShowItemSelector(false)}
                  className="mt-4 text-gray-400"
                >
                  Cancel
                </button>

              </div>
            </div>
          )}



          {/* Battlemon */}
          <h2 className="text-xl font-semibold">BattleMon</h2>

          <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center text-center">

            {selectedBattlemon ? (
              <>
                <img
                  src={selectedBattlemon.image_url || "/placeholder.png"}
                  className="h-24 mb-2 object-contain"
                />

                <p className="text-lg font-semibold">
                  {selectedBattlemon.name}
                </p>

                <p className="text-sm opacity-70">
                  ID: {selectedBattlemon.id}
                </p>

                <button
                  onClick={() => setShowSelector(true)}
                  className="mt-2 text-xs bg-gray-700 px-3 py-1 rounded"
                >
                  Change
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowSelector(true)}
                className="bg-blue-600 px-4 py-2 rounded"
              >
                Choose Battlemon
              </button>
            )}

          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4">

          {/* Abilities */}
          <h2 className="text-xl mb-4 font-semibold">Special Ability</h2>

          <div className="relative">
            <button
              onClick={() => setShowAbilitySelector(true)}
              className="w-full bg-gray-800 p-3 rounded text-left hover:bg-gray-700"
            >
              {selectedAbility ? (
                <div>
                  <p className="font-semibold">{selectedAbility.name}</p>
                  <p className="text-xs opacity-60">{selectedAbility.description}</p>
                </div>
              ) : (
                <span className="opacity-50">Select Ability</span>
              )}
            </button>

            {selectedAbility && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedAbility(null)
                }}
                className="absolute top-1 right-1 bg-red-600 w-6 h-6 rounded-full text-xs"
              >
                ✕
              </button>
            )}
          </div>
          {showAbilitySelector && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

              <div className="bg-gray-900 p-6 rounded-xl w-[90%] md:w-[600px] max-h-[80vh] flex flex-col">

                <h2 className="text-xl mb-4">Select Ability</h2>

                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-3">

                    {abilities.map((a: any) => {
                      const liveNatures = getLiveNatures()
                      console.log("REQ:", a.required_natures)
                      console.log("CURRENT:", liveNatures)


                      const isValid =
                        liveNatures.length > 0 &&
                        isRequirementMet(a.required_natures, liveNatures)

                      return (
                        <div
                          key={a.id}
                          onClick={(e) => {
                            e.stopPropagation()

                            // 🔥 HARD VALIDATION CHECK
                            const currentNatures = getLiveNatures()

                            const valid =
                              currentNatures.length > 0 &&
                              isRequirementMet(a.required_natures, currentNatures)

                            if (!valid) return

                            setSelectedAbility(a)
                            setShowAbilitySelector(false)
                          }}
                          className={`p-3 rounded-lg border transition
                            ${
                              isValid
                                ? "bg-gray-800 hover:bg-gray-700 cursor-pointer"
                                : "bg-gray-800 opacity-40 cursor-not-allowed"
                            }
                          `}
                        >
                          <p className="font-semibold">{a.name}</p>

                          <p className="text-xs opacity-60">
                            {a.description}
                          </p>

                          {normalizeRequired(a.required_natures).length > 0 && (
                            <p className="text-xs mt-1 text-yellow-400">
                              {formatRequirement(a.required_natures)}
                          </p>

                          )}

                          {!isValid && (
                            <p className="text-xs text-red-400 mt-1">
                              Missing required nature
                            </p>
                          )}
                        </div>
                      )
                    })}

                  </div>
                </div>

                <button
                  onClick={() => setShowAbilitySelector(false)}
                  className="mt-4 text-gray-400"
                >
                  Cancel
                </button>
                      
              </div>
            </div>
          )}





          {/* Special Moves */}
          <h2 className="text-xl mt-6 mb-4 font-semibold">Special Moves</h2>

          <div className="relative">
            <button
              onClick={() => setShowSpecialMoveSelector(true)}
              className="w-full bg-gray-800 p-3 rounded text-left hover:bg-gray-700"
            >
              {selectedSpecialMove ? (
                <div>
                  <p className="font-semibold">{selectedSpecialMove.name}</p>
                  <p className="text-xs opacity-60">
                    {selectedSpecialMove.description}
                  </p>
                </div>
              ) : (
                <span className="opacity-50">Select Special Move</span>
              )}
            </button>

            {selectedSpecialMove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedSpecialMove(null)
                }}
                className="absolute top-1 right-1 bg-red-600 w-6 h-6 rounded-full text-xs"
              >
                ✕
              </button>
            )}
          </div>
          {showSpecialMoveSelector && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

              <div className="bg-gray-900 p-6 rounded-xl w-[90%] md:w-[600px] max-h-[80vh] flex flex-col">

                <h2 className="text-xl mb-4">Select Special Move</h2>

                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-3">

                    {specialMoves.map((m: any) => {
                      const liveNatures = getLiveNatures()

                      const isValid =
                        liveNatures.length > 0 &&
                        isRequirementMet(m.required_natures, liveNatures)

                      return (
                        <div
                          key={m.id}
                          onClick={(e) => {
                            e.stopPropagation()

                            // 🔥 HARD VALIDATION CHECK
                            const currentNatures = getLiveNatures()

                            const valid =
                              currentNatures.length > 0 &&
                              isRequirementMet(m.required_natures, currentNatures)

                            if (!valid) return

                            setSelectedSpecialMove(m)
                            setShowSpecialMoveSelector(false)
                          }}
                          className={`p-3 rounded-lg border transition
                            ${
                              isValid
                                ? "bg-gray-800 hover:bg-gray-700 cursor-pointer"
                                : "bg-gray-800 opacity-40 cursor-not-allowed"
                            }
                          `}
                        >
                          <p className="font-semibold">{m.name}</p>

                          <p className="text-xs opacity-60">
                            {m.description}
                          </p>

                          <p className="text-xs opacity-60">
                            Base DMG: {m.base_damage}
                          </p>

                          {normalizeRequired(m.required_natures).length > 0 && (
                            <p className="text-xs mt-1 text-yellow-400">
                              {formatRequirement(m.required_natures)}
                            </p>

                          )}

                          {!isValid && (
                            <p className="text-xs text-red-400 mt-1">
                              Missing required nature
                            </p>
                          )}
                        </div>
                      )
                    })}

                  </div>
                </div>

                <button
                  onClick={() => setShowSpecialMoveSelector(false)}
                  className="mt-4 text-gray-400"
                >
                  Cancel
                </button>

              </div>
            </div>
          )}





        </div>
      </div>

      {/* MODAL */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

          <div className="bg-gray-900 p-6 rounded-xl w-[90%] md:w-[600px] max-h-[80vh] overflow-y-auto">

            <h2 className="text-xl mb-4">Select Battlemon</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

              {battlemons.map((b:any)=>(
                <div
                  key={b.id}
                  onClick={()=>setTempBattlemon(b)}
                  className={`p-4 rounded-lg cursor-pointer transition
                    ${tempBattlemon?.id === b.id
                      ? "bg-blue-600"
                      : "bg-gray-800 hover:bg-gray-700"}
                  `}
                >
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs opacity-70">{b.description}</p>
                </div>
              ))}

            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-between mt-4">
              <button
                onClick={()=>setShowSelector(false)}
                className="text-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmSelection}
                className="bg-blue-600 px-4 py-2 rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-center mt-6">
        <button
        onClick={handleSave}
        disabled={isSaveDisabled}
        className={`w-20 h-10 rounded ${
          isSaveDisabled
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-red-800"
        }`}
      >
        Save
      </button>
      </div>

    </div>
  )
}
