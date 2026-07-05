// Regenerate the built-in theme name enum in schema/config.schema.json
// from the theme files in themes/. Run after adding or renaming a theme:
//   pnpm generate-schema
// A unit test (tests/unit/schema.test.ts) fails when the two drift apart.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const schemaPath = join(root, 'schema', 'config.schema.json')

const names = readdirSync(join(root, 'themes'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -'.json'.length))
  .sort()

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const named = schema.properties.theme.oneOf.find((v) => v.enum)
named.enum = names

writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`)
console.log(`schema updated with themes: ${names.join(', ')}`)
