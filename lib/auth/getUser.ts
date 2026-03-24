import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/authOptions"

export async function getUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) return null

  return {
    id: Number(session.user.id),
    username: session.user.username
  }
}
