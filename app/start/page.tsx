"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function StartPage(){

const { data: session } = useSession()
const router = useRouter()

return (

<div className="min-h-screen flex flex-col items-center justify-center gap-4">

<h1 className="text-4xl font-bold mb-6">
BattleMon
</h1>

<p className="text-lg">
Welcome {session?.user?.username}
</p>

<button 
onClick={()=>router.push("/battle")}
className="px-6 py-2 bg-blue-500 text-white rounded">
Battle against AI
</button>

<button
onClick={()=>router.push("/build")}
className="px-6 py-2 bg-green-500 text-white rounded"
>
Build BattleMon
</button>

<button 
onClick={()=>router.push("/my-battlemons")}
className="px-6 py-2 bg-purple-500 text-white rounded">
My Battlemons
</button>

<button className="px-6 py-2 bg-red-500 text-white rounded">
Ranked Battles
</button>

<button
onClick={()=>signOut({callbackUrl:"/login"})}
className="px-6 py-2 bg-gray-500 text-white rounded"
>
Logout
</button>

</div>

)

}
