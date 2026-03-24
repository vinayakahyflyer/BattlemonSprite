import { pool } from "../db"

export async function getBattlemons() {

  const result = await pool.query(
    "SELECT * FROM battlemons"
  )

  return result.rows

}
