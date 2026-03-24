"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Register() {

  const router = useRouter()

  const [username,setUsername]=useState("")
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")

  async function register(){

    if(!username || !email || !password){
      setError("All fields are required")
      return
    }

    setLoading(true)
    setError("")

    const res = await fetch("/api/register",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        username,
        email,
        password
      })
    })

    setLoading(false)

    if(!res.ok){
      setError("Failed to create account")
      return
    }

    alert("Account created successfully!")

    router.push("/login")

  }

  return(

  <div className="min-h-screen flex items-center justify-center bg-gray-100">

    <div className="bg-white p-8 rounded-xl shadow-lg w-[350px]">

      <h1 className="text-3xl font-bold text-center mb-6">
        Create Account
      </h1>

      <div className="flex flex-col gap-4">

        <div>
          <label className="text-sm font-medium">Username</label>
          <input
            className="w-full border rounded-md p-2 mt-1"
            placeholder="Enter username"
            value={username}
            onChange={e=>setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="w-full border rounded-md p-2 mt-1"
            placeholder="Enter email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
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
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        <button
          onClick={register}
          disabled={loading}
          className="bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Register"}
        </button>

      </div>

      <div className="mt-6 text-center text-sm">

        Already have an account?{" "}
        <Link
          href="/login"
          className="text-blue-600 font-medium hover:underline"
        >
          Login
        </Link>

      </div>

    </div>

  </div>

  )

}
