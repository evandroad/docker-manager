import { renderHook, act } from '@testing-library/react'
import { useFilter } from '../useFilter'
import { describe, it, expect } from 'vitest'

type Item = { Name: string; Driver: string }

const data: Item[] = [
  { Name: 'postgres_data', Driver: 'local' },
  { Name: 'redis_cache', Driver: 'local' },
  { Name: 'nginx_config', Driver: 'nfs' },
]

describe('useFilter', () => {
  it('returns all data when filter is empty', () => {
    const { result } = renderHook(() => useFilter(data))
    expect(result.current.filtered).toEqual(data)
  })

  it('filters by name', () => {
    const { result } = renderHook(() => useFilter(data))
    act(() => {
      result.current.input.props.onChange({ target: { value: 'redis' } })
    })
    expect(result.current.filtered).toEqual([data[1]])
  })

  it('filters by any field', () => {
    const { result } = renderHook(() => useFilter(data))
    act(() => {
      result.current.input.props.onChange({ target: { value: 'nfs' } })
    })
    expect(result.current.filtered).toEqual([data[2]])
  })

  it('is case insensitive', () => {
    const { result } = renderHook(() => useFilter(data))
    act(() => {
      result.current.input.props.onChange({ target: { value: 'POSTGRES' } })
    })
    expect(result.current.filtered).toEqual([data[0]])
  })

  it('returns empty for no match', () => {
    const { result } = renderHook(() => useFilter(data))
    act(() => {
      result.current.input.props.onChange({ target: { value: 'nonexistent' } })
    })
    expect(result.current.filtered).toEqual([])
  })
})
