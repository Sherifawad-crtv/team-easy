import { useEffect, useMemo, useRef, useState } from 'react'
import type { MessageDraft } from '../../data/types'
import { Banner, BottomSheet, Button, TextField } from '../../design/ui'
import { IconCamera, IconDocument } from '../../design/icons'
import { formatBytes, LIMITS } from '../../config/limits'
import { PhotoAccessBody } from './PhotoAccess'
import { usePermission } from './usePermission'
import { DocIcon } from './MessageAttachment'

type Step = 'choose' | 'rationale' | 'preview'
type Pick = 'photo' | 'document'

const ACCEPT: Record<Pick, string> = {
  photo: 'image/*',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip',
}

/**
 * Attach a photo or document (MED-01..03). Photos go through our own
 * explanation of why access is needed before the real request (NFR-04).
 */
export function AttachSheet({ onClose, onSend }: { onClose: () => void; onSend: (draft: MessageDraft) => void }) {
  const photos = usePermission('photos')
  const [step, setStep] = useState<Step>('choose')
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pickRef = useRef<Pick>('photo')

  const previewUrl = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const openPicker = (kind: Pick) => {
    pickRef.current = kind
    setProblem(null)
    if (inputRef.current) {
      inputRef.current.accept = ACCEPT[kind]
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }

  const choosePhoto = () => {
    if (photos.status === 'granted') openPicker('photo')
    else setStep('rationale')
  }

  const onFile = (f: File | undefined) => {
    if (!f) return
    if (f.size > LIMITS.maxAttachmentBytes) {
      setProblem(`That file is too big. The limit is ${formatBytes(LIMITS.maxAttachmentBytes)}.`)
      setStep('choose')
      return
    }
    setFile(f)
    setStep('preview')
  }

  return (
    <BottomSheet title={step === 'preview' ? 'Send' : step === 'choose' ? 'Attach' : 'Photo access'} onClose={onClose}>
      <input ref={inputRef} type="file" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {step === 'choose' && (
        <div className="stack">
          {problem && <Banner kind="error">{problem}</Banner>}
          <button type="button" className="list-row" onClick={choosePhoto}>
            <span className="attach-icon attach-icon--photo"><IconCamera size={24} /></span>
            <span><span className="t-title-sm" style={{ display: 'block' }}>Photo</span><span className="t-body-sm muted">Send an image from your device</span></span>
          </button>
          <button type="button" className="list-row" onClick={() => openPicker('document')}>
            <span className="attach-icon attach-icon--doc"><IconDocument size={24} /></span>
            <span><span className="t-title-sm" style={{ display: 'block' }}>Document</span><span className="t-body-sm muted">PDF, Word, Excel, PowerPoint, text, zip</span></span>
          </button>
        </div>
      )}

      {step === 'rationale' && <PhotoAccessBody onGranted={() => openPicker('photo')} onCancel={() => setStep('choose')} />}

      {step === 'preview' && file && (
        <div className="stack-lg">
          {previewUrl ? (
            <img className="attach-preview" src={previewUrl} alt={`Preview of ${file.name}`} />
          ) : (
            <div className="doc-row doc-row--static">
              <DocIcon name={file.name} />
              <span className="doc-row__text"><span className="doc-row__name">{file.name}</span><span className="doc-row__meta">{formatBytes(file.size)}</span></span>
            </div>
          )}
          <TextField label="Add a caption (optional)" value={caption} onChange={setCaption} />
          <div className="stack">
            <Button onClick={() => { onSend({ text: caption.trim(), file }); onClose() }}>Send</Button>
            <Button variant="tertiary" onClick={() => { setFile(null); setCaption(''); setStep('choose') }}>Choose a different file</Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
