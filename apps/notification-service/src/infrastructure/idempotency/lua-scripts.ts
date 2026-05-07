/**
 * Two-phase capture script.
 *
 * KEYS[1]  = idempotency key (e.g. "idem:consumer-service:<eventId>")
 * ARGV[1]  = ttl in seconds
 * ARGV[2]  = in-progress grace period in seconds
 * ARGV[3]  = current epoch milliseconds (caller-supplied for testability)
 *
 * Returns one of: 'CAPTURED' | 'COMPLETED' | 'IN_PROGRESS'.
 *
 * Storage format:
 *   - "COMPLETED"                   — handler ran successfully
 *   - "IN_PROGRESS:<capturedAtMs>"  — handler currently in-flight
 */
export const CAPTURE_SCRIPT = `
local existing = redis.call('GET', KEYS[1])
if not existing then
  redis.call('SET', KEYS[1], 'IN_PROGRESS:' .. ARGV[3], 'EX', ARGV[1])
  return 'CAPTURED'
end
if existing == 'COMPLETED' then
  return 'COMPLETED'
end
local capturedAtMs = tonumber(string.sub(existing, 13))
if capturedAtMs == nil then
  redis.call('SET', KEYS[1], 'IN_PROGRESS:' .. ARGV[3], 'EX', ARGV[1])
  return 'CAPTURED'
end
local ageMs = tonumber(ARGV[3]) - capturedAtMs
if ageMs > tonumber(ARGV[2]) * 1000 then
  redis.call('SET', KEYS[1], 'IN_PROGRESS:' .. ARGV[3], 'EX', ARGV[1])
  return 'CAPTURED'
end
return 'IN_PROGRESS'
`;
