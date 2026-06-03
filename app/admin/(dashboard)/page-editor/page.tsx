import { PageHeader } from '@/components/admin/AdminCard'
import PageEditorPanel from '@/components/admin/PageEditorPanel'

export const metadata = { title: 'Редактор на страници' }

export default function PageEditorPage() {
  return (
    <div>
      <PageHeader title="Редактор на страници" />

      <div className="property-card-surface p-6 rounded-2xl mb-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: 'rgba(207,168,71,0.12)', border: '1px solid rgba(207,168,71,0.3)' }}>
            🎨
          </div>
          <div>
            <h2 className="font-display text-white font-semibold text-base">Визуален редактор</h2>
            <p className="text-sm text-[rgba(255,255,255,0.45)] mt-0.5">
              Избери страница, наредби блоковете с влачене, скрий нежелани секции и избери стил на картите.
            </p>
          </div>
        </div>

        <PageEditorPanel />
      </div>

      <div className="property-card-surface p-5 rounded-2xl">
        <p className="text-xs text-[rgba(255,255,255,0.35)]">
          <strong className="text-[rgba(255,255,255,0.5)]">Как работи:</strong>{' '}
          Промените в наредбата и видимостта на блоковете се записват в базата данни и влизат в сила
          при следващото зареждане на страницата от посетители. Вариантите на картите сменят техния визуален стил.
        </p>
      </div>
    </div>
  )
}
