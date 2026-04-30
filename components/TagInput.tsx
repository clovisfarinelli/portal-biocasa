'use client'

import { useState, useRef, KeyboardEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export default function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(value: string) {
    const trimmed = value.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (val.includes(',')) {
      const [before] = val.split(',')
      addTag(before)
    } else {
      setInput(val)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    }
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index))
  }

  return (
    <div
      className="input-field flex flex-wrap gap-1.5 cursor-text min-h-[2.5rem] h-auto py-1.5"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-dourado-400/15 border border-dourado-400/40 text-dourado-400 text-sm"
        >
          {tag}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); removeTag(i) }}
            className="text-dourado-400/70 hover:text-dourado-400 leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? (placeholder ?? 'Digite e pressione vírgula para adicionar...') : ''}
        className="bg-transparent outline-none text-sm text-white flex-1 min-w-24"
      />
    </div>
  )
}
