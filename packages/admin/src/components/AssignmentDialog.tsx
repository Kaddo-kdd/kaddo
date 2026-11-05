import { useEffect, useRef, useState } from 'react'

type Props = {
  title: string
  owners: string[]
  contributors: string[]
  saving?: boolean
  error?: string | null
  onSave: (owners: string[], contributors: string[]) => void
  onCancel: () => void
}

const parsePeople = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)

/** Accessible replacement for browser prompts used by assignment management. */
export function AssignmentDialog({ title, owners, contributors, saving = false, error, onSave, onCancel }: Props) {
  const [ownerValue, setOwnerValue] = useState(owners.join(', '))
  const [contributorValue, setContributorValue] = useState(contributors.join(', '))
  const ownersRef = useRef<HTMLInputElement>(null)

  useEffect(() => { ownersRef.current?.focus() }, [])
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="assignment-dialog-title" onClick={(event) => { if (event.target === event.currentTarget && !saving) onCancel() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(parsePeople(ownerValue), parsePeople(contributorValue)) }}
        style={{ width: 'min(100%, 480px)', background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', padding: 24 }}>
        <h3 id="assignment-dialog-title" style={{ margin: '0 0 8px', fontSize: 17 }}>{title}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--foreground-muted)' }}>Declared responsibility only. Observed Git authors remain separate.</p>
        <label style={{ display: 'grid', gap: 6, fontSize: 13, marginBottom: 14 }}>Owners
          <input ref={ownersRef} value={ownerValue} onChange={(event) => setOwnerValue(event.target.value)} placeholder="alice, bob" disabled={saving}
            style={{ padding: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', font: 'inherit' }} />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 13, marginBottom: 14 }}>Contributors
          <input value={contributorValue} onChange={(event) => setContributorValue(event.target.value)} placeholder="carol, dave" disabled={saving}
            style={{ padding: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', font: 'inherit' }} />
        </label>
        {error && <p role="alert" style={{ margin: '0 0 12px', color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onCancel} disabled={saving} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', font: 'inherit' }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ padding: '8px 12px', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', background: 'var(--primary)', color: '#fff', font: 'inherit', fontWeight: 600 }}>{saving ? 'Saving…' : 'Save assignments'}</button>
        </div>
      </form>
    </div>
  )
}
