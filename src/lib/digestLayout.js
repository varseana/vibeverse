// ---------------------------------------------------------------------------
// Digest layout model: rows -> columns -> block
// ---------------------------------------------------------------------------
// The Monthly Digest used to be a flat list of blocks stacked vertically. To
// support LEGO-style horizontal composition (drag a block to the side of
// another to open a new column), the layout is now a list of ROWS, each with
// one or more COLUMNS, each column holding exactly one block.
//
//   Row    = { id, type: 'row', columns: Column[] }
//   Column = { id, span, block }   // span 1..MAX_SPAN, relative flex weight
//   Block  = the same block shape as before (heading/text/image/.../divider)
//
// Legacy digests (and the seed) store a flat array of blocks. `normalizeRows`
// upgrades those on read: every legacy block becomes a full-width single-column
// row, with STABLE ids derived from the block id (so React keys never shuffle).
// Nothing needs a store-key bump because the read path is fully backward
// compatible; when the editor saves, it writes the new rows shape.
//
// All mutation helpers are PURE: they take rows and return a new rows array,
// never mutating in place (same rule the rest of the store follows).
// ---------------------------------------------------------------------------

export const MAX_SPAN = 4        // widest a single column can grow
export const MAX_COLS_PER_ROW = 4 // most columns a row can hold

// Unique id generator. Date.now for ids is fine (it is the id, not business
// data); the random suffix avoids collisions inside the same millisecond.
export function genId(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

export function isRow(section) {
  return section && section.type === 'row' && Array.isArray(section.columns)
}

// Upgrade a mixed/legacy sections array into a clean rows array. Idempotent:
// running it on already-normalized rows returns an equivalent, valid structure.
export function normalizeRows(sections) {
  const list = Array.isArray(sections) ? sections : []
  const rows = []
  for (const sec of list) {
    if (isRow(sec)) {
      const columns = (sec.columns || [])
        .filter((c) => c && c.block)
        .map((c) => ({
          id: c.id || genId('col'),
          span: clampSpan(c.span),
          block: c.block,
        }))
      if (columns.length > 0) rows.push({ id: sec.id || genId('row'), type: 'row', columns })
    } else if (sec && sec.type) {
      // Legacy flat block: wrap in a full-width single-column row with stable ids.
      rows.push({
        id: 'row_' + sec.id,
        type: 'row',
        columns: [{ id: 'col_' + sec.id, span: 1, block: sec }],
      })
    }
  }
  return rows
}

function clampSpan(span) {
  const n = Number(span)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(MAX_SPAN, Math.round(n))
}

// ---- lookups -------------------------------------------------------------

export function findRowIndex(rows, rowId) {
  return rows.findIndex((r) => r.id === rowId)
}

// Returns { rowIndex, colIndex } for a column id, or null.
export function locateColumn(rows, colId) {
  for (let r = 0; r < rows.length; r++) {
    const c = rows[r].columns.findIndex((col) => col.id === colId)
    if (c !== -1) return { rowIndex: r, colIndex: c }
  }
  return null
}

// Given any drag id (a column id OR a row id), return the containing row id.
export function containerOf(rows, id) {
  if (rows.some((r) => r.id === id)) return id
  const loc = locateColumn(rows, id)
  return loc ? rows[loc.rowIndex].id : null
}

// ---- pure mutations ------------------------------------------------------

// Drop empty rows (a row with no columns is meaningless).
function pruneEmptyRows(rows) {
  return rows.filter((r) => r.columns.length > 0)
}

// Move a column to a target row at a specific index (used for live drag-over
// between containers). No-op-safe: returns a new array either way.
export function moveColumn(rows, colId, targetRowId, targetIndex) {
  const from = locateColumn(rows, colId)
  const targetRowIdx = findRowIndex(rows, targetRowId)
  if (!from || targetRowIdx === -1) return rows
  const sourceRow = rows[from.rowIndex]
  const column = sourceRow.columns[from.colIndex]

  // Respect the per-row column cap when moving into a different row.
  if (from.rowIndex !== targetRowIdx && rows[targetRowIdx].columns.length >= MAX_COLS_PER_ROW) {
    return rows
  }

  const next = rows.map((r) => ({ ...r, columns: [...r.columns] }))
  // Remove from source.
  next[from.rowIndex].columns.splice(from.colIndex, 1)
  // Insert into target (index clamped).
  const insertAt = Math.max(0, Math.min(targetIndex, next[targetRowIdx].columns.length))
  next[targetRowIdx].columns.splice(insertAt, 0, column)
  return pruneEmptyRows(next)
}

// Reorder whole rows (dragging a row by its handle).
export function reorderRows(rows, activeRowId, overRowId) {
  const a = findRowIndex(rows, activeRowId)
  const b = findRowIndex(rows, overRowId)
  if (a === -1 || b === -1 || a === b) return rows
  const next = [...rows]
  const [moved] = next.splice(a, 1)
  next.splice(b, 0, moved)
  return next
}

// Pull a column out into a brand-new row inserted at `rowPosition`
// (0 = before the first row, rows.length = after the last). This is what the
// horizontal rails do: "drop here to make a new full-width row".
export function extractColumnToNewRow(rows, colId, rowPosition) {
  const from = locateColumn(rows, colId)
  if (!from) return rows
  const column = rows[from.rowIndex].columns[from.colIndex]
  const next = rows.map((r) => ({ ...r, columns: [...r.columns] }))
  next[from.rowIndex].columns.splice(from.colIndex, 1)
  const newRow = { id: genId('row'), type: 'row', columns: [{ ...column, span: 1 }] }
  // Account for the fact that removing the column may empty its row; compute
  // the insert index against the pruned array to keep placement intuitive.
  const pruned = pruneEmptyRows(next)
  const removedRowEmptied = next[from.rowIndex].columns.length === 0
  let pos = rowPosition
  if (removedRowEmptied && from.rowIndex < rowPosition) pos -= 1
  pos = Math.max(0, Math.min(pos, pruned.length))
  pruned.splice(pos, 0, newRow)
  return pruned
}

// Append a fresh block as a new full-width row at top or bottom.
export function addBlockRow(rows, block, position = 'bottom') {
  const row = { id: genId('row'), type: 'row', columns: [{ id: genId('col'), span: 1, block }] }
  return position === 'top' ? [row, ...rows] : [...rows, row]
}

// Insert a fresh block as a new column inside an existing row at `index`.
export function addBlockColumn(rows, rowId, index, block) {
  const rowIdx = findRowIndex(rows, rowId)
  if (rowIdx === -1) return rows
  if (rows[rowIdx].columns.length >= MAX_COLS_PER_ROW) return rows
  const next = rows.map((r) => ({ ...r, columns: [...r.columns] }))
  const col = { id: genId('col'), span: 1, block }
  const at = Math.max(0, Math.min(index, next[rowIdx].columns.length))
  next[rowIdx].columns.splice(at, 0, col)
  return next
}

export function removeColumn(rows, colId) {
  const from = locateColumn(rows, colId)
  if (!from) return rows
  const next = rows.map((r) => ({ ...r, columns: [...r.columns] }))
  next[from.rowIndex].columns.splice(from.colIndex, 1)
  return pruneEmptyRows(next)
}

// Replace the block inside a column (used by inline block editing).
export function updateColumnBlock(rows, colId, block) {
  const from = locateColumn(rows, colId)
  if (!from) return rows
  return rows.map((r, ri) =>
    ri !== from.rowIndex
      ? r
      : { ...r, columns: r.columns.map((c) => (c.id === colId ? { ...c, block } : c)) }
  )
}

// Duplicate a column right after itself (deep copy, fresh ids).
export function duplicateColumn(rows, colId) {
  const from = locateColumn(rows, colId)
  if (!from) return rows
  if (rows[from.rowIndex].columns.length >= MAX_COLS_PER_ROW) return rows
  const original = rows[from.rowIndex].columns[from.colIndex]
  const copy = {
    id: genId('col'),
    span: original.span,
    block: { ...JSON.parse(JSON.stringify(original.block)), id: genId('sec') },
  }
  const next = rows.map((r) => ({ ...r, columns: [...r.columns] }))
  next[from.rowIndex].columns.splice(from.colIndex + 1, 0, copy)
  return next
}

// Nudge a column's relative width. dir = +1 wider, -1 narrower.
export function resizeColumn(rows, colId, dir) {
  const from = locateColumn(rows, colId)
  if (!from) return rows
  return rows.map((r, ri) =>
    ri !== from.rowIndex
      ? r
      : { ...r, columns: r.columns.map((c) => (c.id === colId ? { ...c, span: clampSpan(c.span + dir) } : c)) }
  )
}
