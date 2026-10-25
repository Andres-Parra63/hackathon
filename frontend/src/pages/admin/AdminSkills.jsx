import { useRef, useState } from 'react'
import { api } from '../../api/client'
import { useAction, useApi } from '../../api/useApi'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Checkbox, SelectField, TextField } from '../../components/FormControls'
import LoadState, { ActionError } from '../../components/LoadState'
import AreaHeader from '../../components/area/AreaHeader'
import es from '../../i18n/es'
import { useReveal } from '../../motion/useReveal'
import './Admin.css'

const t = es.admin.skills
const CATEGORIES = Object.entries(es.enums.skillCategory)
const categoryValue = (label) => CATEGORIES.find(([, l]) => l === label)?.[0]

/** Skill catalog used by matching: add, remove and flag skills that require a certificate. */
export default function AdminSkills() {
  const { data, loading, error, reload, setData } = useApi(() => api.skills(), [])
  const { run, busy, error: actionError } = useAction()
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0][1])
  const [nameError, setNameError] = useState('')
  const [message, setMessage] = useState('')
  const root = useRef(null)
  useReveal(root, [loading])

  const skills = data ?? []

  const add = async (event) => {
    event.preventDefault()
    const clean = name.trim()
    if (clean.length < 2) return setNameError(t.empty)
    if (skills.some((s) => s.nombre.toLowerCase() === clean.toLowerCase())) return setNameError(t.duplicate)
    const created = await run('add', () => api.createSkill({ nombre: clean, categoria: categoryValue(category) }))
    if (created) {
      setData((current) => [...current, created])
      setName('')
      setMessage(t.added(clean))
    }
  }

  const remove = async (skill) => {
    const ok = await run(skill.id, async () => {
      await api.deleteSkill(skill.id)
      return true
    })
    if (ok) {
      setData((current) => current.filter((s) => s.id !== skill.id))
      setMessage(t.removed(skill.nombre))
    }
  }

  const setCertificate = async (skill, value) => {
    const updated = await run(skill.id, () => api.updateSkill(skill.id, { requiere_certificado: value }))
    if (updated) setData((current) => current.map((s) => (s.id === updated.id ? updated : s)))
  }

  return (
    <div ref={root}>
      <AreaHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        <form className="card adm__add" onSubmit={add} noValidate data-reveal="up">
          <TextField
            label={t.name}
            value={name}
            error={nameError}
            onChange={(e) => {
              setName(e.target.value)
              setNameError('')
            }}
          />
          <SelectField label={t.category} options={CATEGORIES.map(([, l]) => l)} value={category} onChange={(e) => setCategory(e.target.value)} />
          <Button type="submit" icon="plus" disabled={busy === 'add'} aria-busy={busy === 'add'}>
            {t.add}
          </Button>
        </form>

        <ActionError error={actionError} />

        <section className="card" aria-labelledby="skills-list" data-reveal="up">
          <div className="row-between">
            <h2 id="skills-list" className="t-h3 c-strong">
              {t.list} ({skills.length})
            </h2>
            <p className="t-caption c-muted" role="status">
              {message}
            </p>
          </div>
          <p className="t-caption c-muted">{t.certificateNote}</p>
          <LoadState loading={loading} error={error} onRetry={reload}>
            <ul className="adm__skills">
              {skills.map((skill) => (
                <li key={skill.id}>
                  <div>
                    <span className="t-label c-strong">{skill.nombre}</span>
                    {skill.descripcion && <p className="t-caption c-muted">{skill.descripcion}</p>}
                  </div>
                  <Badge tone="neutral">{es.enums.skillCategory[skill.categoria]}</Badge>
                  <Checkbox
                    checked={skill.requiere_certificado}
                    disabled={busy === skill.id}
                    onChange={(value) => setCertificate(skill, value)}
                  >
                    {t.certificate}
                  </Checkbox>
                  <Button
                    variant="tertiary"
                    disabled={busy === skill.id}
                    onClick={() => remove(skill)}
                    aria-label={`${t.remove} ${skill.nombre}`}
                  >
                    {t.remove}
                  </Button>
                </li>
              ))}
            </ul>
          </LoadState>
        </section>
      </div>
    </div>
  )
}
