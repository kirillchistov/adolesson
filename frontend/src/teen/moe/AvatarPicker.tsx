import { useRef, useState } from 'react'
import logoUrl from '../../../assets/mhlogo.png'
import { cx, uid } from '../../ui/ui'
import { AVATAR_MAX_UPLOADS, LOGO_AVATAR_ID, bundledGallery, readAvatarFile } from './avatar'
import { useStore } from './state/context'

export function AvatarPicker() {
  const { state, update } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const gallery = bundledGallery()

  function choose(id: string) {
    setError('')
    update((current) => ({ ...current, avatarId: id }))
  }

  function remove(id: string) {
    setError('')
    update((current) => ({
      ...current,
      avatarUploads: current.avatarUploads.filter((item) => item.id !== id),
      avatarId: current.avatarId === id ? LOGO_AVATAR_ID : current.avatarId,
    }))
  }

  async function onFile(file: File | undefined) {
    setError('')
    if (!file) return
    try {
      const dataUrl = await readAvatarFile(file)
      const id = uid()
      const name = file.name.replace(/[\\/]/g, '').slice(0, 80) || 'картинка'
      update((current) => ({
        ...current,
        avatarId: id,
        avatarUploads: [...current.avatarUploads, { id, name, dataUrl }].slice(-AVATAR_MAX_UPLOADS),
      }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не получилось прочитать картинку.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <section className="stack">
      <h2>Аватар</h2>
      <p className="quiet">
        На экранах один портрет. Своя картинка остаётся в этом браузере: JPEG, PNG или WebP, до 2 МБ, своих — до восьми.
      </p>
      <div className="avatar-picks">
        <button
          type="button"
          className={cx('avatar-pick', state.avatarId === LOGO_AVATAR_ID && 'on')}
          aria-pressed={state.avatarId === LOGO_AVATAR_ID}
          aria-label="Логотип"
          onClick={() => choose(LOGO_AVATAR_ID)}
        >
          <img className="avatar face-md" src={logoUrl} alt="" />
        </button>
        {gallery.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cx('avatar-pick', state.avatarId === item.id && 'on')}
            aria-pressed={state.avatarId === item.id}
            aria-label={item.name}
            onClick={() => choose(item.id)}
          >
            <img className="avatar face-md" src={item.src} alt="" />
          </button>
        ))}
        {state.avatarUploads.map((item) => (
          <div key={item.id} className="avatar-own">
            <button
              type="button"
              className={cx('avatar-pick', state.avatarId === item.id && 'on')}
              aria-pressed={state.avatarId === item.id}
              aria-label={item.name}
              onClick={() => choose(item.id)}
            >
              <img className="avatar face-md" src={item.dataUrl} alt="" />
            </button>
            <button type="button" className="text-btn" onClick={() => remove(item.id)}>
              Убрать
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
        Загрузить свою
      </button>
      <input
        ref={fileRef}
        className="file"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  )
}
