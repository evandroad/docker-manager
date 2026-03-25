import { renderHook, act } from '@testing-library/react'
import { useSort } from '../useSort'
import { describe, it, expect } from 'vitest'

type Item = { Name: string; Size: number }

const data: Item[] = [
  { Name: 'charlie', Size: 3 },
  { Name: 'alpha', Size: 1 },
  { Name: 'bravo', Size: 2 },
]

describe('useSort', () => {
  it('returns unsorted data by default', () => {
    const { result } = renderHook(() => useSort(data))
    expect(result.current.sorted).toEqual(data)
  })

  it('sorts ascending on first toggle', () => {
    const { result } = renderHook(() => useSort(data))
    act(() => result.current.toggleSort('Name'))
    expect(result.current.sorted.map(i => i.Name)).toEqual(['alpha', 'bravo', 'charlie'])
  })

  it('sorts descending on second toggle', () => {
    const { result } = renderHook(() => useSort(data))
    act(() => result.current.toggleSort('Name'))
    act(() => result.current.toggleSort('Name'))
    expect(result.current.sorted.map(i => i.Name)).toEqual(['charlie', 'bravo', 'alpha'])
  })

  it('resets on third toggle', () => {
    const { result } = renderHook(() => useSort(data))
    act(() => result.current.toggleSort('Name'))
    act(() => result.current.toggleSort('Name'))
    act(() => result.current.toggleSort('Name'))
    expect(result.current.sorted).toEqual(data)
  })

  it('accepts a default sort key', () => {
    const { result } = renderHook(() => useSort(data, 'Name'))
    expect(result.current.sorted.map(i => i.Name)).toEqual(['alpha', 'bravo', 'charlie'])
  })

  it('shows correct icon', () => {
    const { result } = renderHook(() => useSort(data))
    expect(result.current.icon('Name')).toBe(' ⇅')
    act(() => result.current.toggleSort('Name'))
    expect(result.current.icon('Name')).toBe(' ↑')
    act(() => result.current.toggleSort('Name'))
    expect(result.current.icon('Name')).toBe(' ↓')
  })
})
