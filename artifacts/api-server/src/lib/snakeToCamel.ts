// Recursively convert snake_case object keys to camelCase.
// Used to normalise raw Supabase rows before sending them to the frontend.
export function snakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camel] = snakeToCamel(value);
  }
  return result;
}
