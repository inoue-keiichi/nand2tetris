export type Command = {
  type: "A",
  symbol: string
} | {
  type: "C",
  comp?: string,
  dest?: string,
  jump?: string
} | {
  type: "L",
  symbol: string
}
