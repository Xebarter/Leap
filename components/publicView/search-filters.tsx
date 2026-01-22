"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex w-full items-center gap-2 max-w-lg mx-auto">
      <Input
        placeholder="Search by location or description..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 text-lg shadow-sm"
      />
      <Button type="submit" size="lg" className="h-12 px-8">
        Search
      </Button>
    </form>
  )
}
