import React, { useEffect, useRef, useState } from 'react'

interface CorrectionModalProps {
  open: boolean
  originalText: string
  onClose: () => void
  onSubmit: (corrected: string) => void
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({ open, originalText, onClose, onSubmit }) => {
  const [text, setText] = useState(originalText)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { setText(originalText) }, [originalText])
  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 50) }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-xl">
        <div className="p-4 border-b">
          <h3 className="font-bold text-slate-800">Corrigir minha última resposta</h3>
        </div>
        <div className="p-4 space-y-3">
          <label className="text-xs text-slate-600">Edite sua frase em {''}</label>
          <textarea ref={ref} value={text} onChange={(e)=>setText(e.target.value)} rows={4} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"/>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border text-slate-700">Cancelar</button>
            <button onClick={()=>{ if(text.trim()) onSubmit(text.trim()) }} className="px-4 py-2 rounded-xl bg-primary text-white">Salvar correção</button>
          </div>
        </div>
      </div>
    </div>
  )
}