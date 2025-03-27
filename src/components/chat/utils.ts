// src/components/chat/utils.ts
export function maskName(fullName: string): string {
  const parts = fullName.split(" ")
  if (parts.length < 2) return fullName
  const mask = (str: string) => str[0] + "*".repeat(str.length - 1)
  return `${mask(parts[0])} ${mask(parts[1])}`
}

