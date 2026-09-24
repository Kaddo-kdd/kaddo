import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRelative = 'packages/cli/src/skills/skills.ts'
const sourcePath = path.join(repoRoot, sourceRelative)
const outputRoot = path.join(repoRoot, 'agent-plugin', 'skills')
const checkOnly = process.argv.includes('--check')

function literal(node, label) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  throw new Error(`${label} must be a string literal in ${sourceRelative}`)
}

function stringArray(node, label) {
  if (!ts.isArrayLiteralExpression(node)) throw new Error(`${label} must be an array in ${sourceRelative}`)
  return node.elements.map((entry) => literal(entry, label))
}

function readCanonicalSkills() {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true)
  const definitions = new Map()
  let order = []

  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue
      const name = declaration.name.text
      const initializer = declaration.initializer

      if (
        ts.isCallExpression(initializer) &&
        ts.isIdentifier(initializer.expression) &&
        initializer.expression.text === 'skill'
      ) {
        const [idNode, titleNode, groupNode, appliesToNode, bodyNode] = initializer.arguments
        if (!bodyNode) throw new Error(`Incomplete canonical skill definition: ${name}`)
        definitions.set(name, {
          id: literal(idNode, `${name}.id`),
          title: literal(titleNode, `${name}.title`),
          group: literal(groupNode, `${name}.group`),
          appliesTo: stringArray(appliesToNode, `${name}.appliesTo`),
          body: literal(bodyNode, `${name}.body`).trim(),
        })
      }

      if (name === 'SKILLS' && ts.isArrayLiteralExpression(initializer)) {
        order = initializer.elements.map((entry) => {
          if (!ts.isIdentifier(entry)) throw new Error('SKILLS must contain canonical skill identifiers')
          return entry.text
        })
      }
    }
  }

  if (order.length === 0) throw new Error(`Could not find exported SKILLS order in ${sourceRelative}`)
  return order.map((name) => {
    const definition = definitions.get(name)
    if (!definition) throw new Error(`SKILLS references unknown definition: ${name}`)
    return definition
  })
}

function section(body, heading, id) {
  const match = body.match(new RegExp(`## ${heading}\\s+([\\s\\S]*?)(?=\\n## |$)`, 'i'))
  if (!match) throw new Error(`Canonical skill ${id} has no ${heading} section`)
  return match[1].replace(/\s+/g, ' ').trim()
}

function description(body, id) {
  const value = `${section(body, 'Purpose', id)} Use when: ${section(body, 'When to use', id)}`
  if (value.length > 1024 || /[<>]/.test(value)) {
    throw new Error(`Generated description for ${id} violates the Agent Skills specification`)
  }
  return value
}

function render(skill) {
  return [
    '---',
    `name: ${skill.id}`,
    `description: ${JSON.stringify(description(skill.body, skill.id))}`,
    '---',
    '',
    `<!-- Generated from ${sourceRelative}. Run \`pnpm agent-plugin:sync\`; do not edit directly. -->`,
    '',
    skill.body,
    '',
  ].join('\n')
}

const drift = []
for (const skill of readCanonicalSkills()) {
  const destination = path.join(outputRoot, skill.id, 'SKILL.md')
  const expected = render(skill)
  const current = fs.existsSync(destination) ? fs.readFileSync(destination, 'utf8').replace(/\r\n/g, '\n') : null

  if (current === expected) continue
  if (checkOnly) {
    drift.push(path.relative(repoRoot, destination).replaceAll('\\', '/'))
    continue
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, expected, 'utf8')
  process.stdout.write(`synced ${path.relative(repoRoot, destination)}\n`)
}

if (drift.length > 0) {
  process.stderr.write(`Agent Plugin Skills are out of sync:\n- ${drift.join('\n- ')}\n`)
  process.stderr.write('Run `pnpm agent-plugin:sync` and commit the generated files.\n')
  process.exit(1)
}

if (checkOnly) process.stdout.write('Agent Plugin Skills are in sync.\n')
