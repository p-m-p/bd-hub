import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { COLOR_KEYS, PRISM_COLOR_KEYS } from '../../src/server/theme.js'
import { listBuiltinThemes } from '../../src/server/themes.js'

const schemaPath = join(process.cwd(), 'schema', 'config.schema.json')

// biome-ignore lint/suspicious/noExplicitAny: schema is free-form JSON
function loadSchema(): any {
  return JSON.parse(readFileSync(schemaPath, 'utf8'))
}

describe('config JSON schema', () => {
  it('is valid JSON with an id pointing at the GitHub repo', () => {
    const schema = loadSchema()
    expect(schema.$schema).toContain('json-schema.org')
    expect(schema.$id).toContain('github')
    expect(schema.$id).toContain('config.schema.json')
  })

  it('lists every theme file in the built-in name enum (run pnpm generate-schema after adding a theme)', () => {
    const schema = loadSchema()
    const variants = schema.properties.theme.oneOf
    // biome-ignore lint/suspicious/noExplicitAny: schema is free-form JSON
    const named = variants.find((v: any) => v.enum)
    expect(named.enum).toEqual(listBuiltinThemes())
  })

  it('describes every color key the server understands', () => {
    const schema = loadSchema()
    const variants = schema.properties.theme.oneOf
    // biome-ignore lint/suspicious/noExplicitAny: schema is free-form JSON
    const themeObject = variants.find((v: any) => v.type === 'object')
    const colorKeys = Object.keys(COLOR_KEYS).sort()
    for (const block of ['colors', 'light', 'dark']) {
      const props = themeObject.properties[block].$ref
        ? schema.$defs.themeColors.properties
        : themeObject.properties[block].properties
      expect(Object.keys(props).sort()).toEqual(colorKeys)
    }
  })

  it('describes every prism color key the server understands', () => {
    const schema = loadSchema()
    const variants = schema.properties.theme.oneOf
    // biome-ignore lint/suspicious/noExplicitAny: schema is free-form JSON
    const themeObject = variants.find((v: any) => v.type === 'object')
    const prism = themeObject.properties.prism
    expect(Object.keys(prism.properties).sort()).toEqual([
      'colors',
      'dark',
      'light',
    ])
    expect(Object.keys(schema.$defs.prismColors.properties).sort()).toEqual(
      Object.keys(PRISM_COLOR_KEYS).sort(),
    )
  })

  it('describes spacing, mode, font, and prismTheme options', () => {
    const schema = loadSchema()
    const variants = schema.properties.theme.oneOf
    // biome-ignore lint/suspicious/noExplicitAny: schema is free-form JSON
    const themeObject = variants.find((v: any) => v.type === 'object')
    expect(themeObject.properties.spacing.enum).toEqual([
      'dense',
      'normal',
      'spacious',
    ])
    expect(themeObject.properties.mode.enum).toEqual(['auto', 'light', 'dark'])
    expect(Object.keys(themeObject.properties.font.properties).sort()).toEqual([
      'family',
      'monoFamily',
      'scale',
    ])
    expect(themeObject.properties.prismTheme.oneOf).toHaveLength(2)
  })

  it('validates the README example config shape (smoke test)', () => {
    const schema = loadSchema()
    // Not a full ajv validation — assert the schema allows $schema alongside
    // theme so a config referencing the schema does not violate it.
    expect(schema.properties.$schema).toBeDefined()
  })
})
