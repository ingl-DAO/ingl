export function chunks<T>(array: T[], size: number): T[][] {
    const result: Array<T[]> = []
    let i, j
    for (i = 0, j = array.length; i < j; i += size) {
      result.push(array.slice(i, i + size))
    }
    return result
  }

const SECONDS_PER_DAY = 86400

export function getDaysFromTimestamp(unixTimestamp: number) {
  return unixTimestamp / SECONDS_PER_DAY
}

export function getTimestampFromDays(days: number) {
  return days * SECONDS_PER_DAY
}
