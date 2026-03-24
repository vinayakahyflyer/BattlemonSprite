"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export default function Login() {

  const [username,setUsername]=useState("")
  const [password,setPassword]=useState("")
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")

 async function handleLogin(){

  if(!username || !password){
    setError("Username and password are required")
    return
  }

  setLoading(true)
  setError("")

  const result = await signIn("credentials",{
    username,
    password,
    redirect:false
  })

  setLoading(false)

  if(result?.error){
    setError("Invalid username or password")
  }else{
    window.location.href="/start"
  }

}


  return(

  <div className="min-h-screen flex items-center justify-center bg-gray-100">

    <div className="bg-white p-8 rounded-xl shadow-lg w-[350px]">

      <h1 className="text-3xl font-bold text-center mb-6">
        BattleMon
      </h1>

      <div className="flex flex-col gap-4">

        <div>
          <label className="text-sm font-medium">Username</label>
          <input
            className="w-full border rounded-md p-2 mt-1"
            placeholder="Enter username"
            value={username}
            onChange={e=>setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full border rounded-md p-2 mt-1"
            placeholder="Enter password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        <button
        onClick={handleLogin}
        disabled={!username || !password || loading}
        className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
        {loading ? "Logging in..." : "Login"}
        </button>


      </div>

      <div className="mt-6 text-center text-sm">

        Don't have an account?{" "}
        <Link
          href="/register"
          className="text-blue-600 font-medium hover:underline"
        >
          Register
        </Link>

      </div>

    </div>

  </div>

  )

}
