import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { searchSessions } from '../api/client'

export function useSearch() {
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const setSearchResults = useStore((s) => s.setSearchResults)
  const setIsSearching = useStore((s) => s.setIsSearching)
  const searchResults = useStore((s) => s.searchResults)
  const isSearching = useStore((s) => s.isSearching)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchSessions(searchQuery)
        setSearchResults(data.results.map((r: any) => r.session))
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timerRef.current)
  }, [searchQuery, setSearchResults, setIsSearching])

  return { searchQuery, setSearchQuery, searchResults, isSearching }
}
