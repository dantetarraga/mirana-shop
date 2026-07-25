'use client'

import { cn } from '@/shared/lib/utils'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Undo2,
} from 'lucide-react'
import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// RichTextEditor — editor de texto enriquecido (TipTap) para el admin:
// páginas legales y descripción de productos. Emite HTML; ese mismo HTML se
// renderiza en la web pública con la clase .rich-prose, así el preview del
// editor y la página se ven iguales.
// ---------------------------------------------------------------------------

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  /** Alto mínimo del área editable (clase Tailwind). */
  minHeightClass?: string
  /** Alto máximo antes de hacer scroll interno (clase Tailwind). */
  maxHeightClass?: string
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'w-8 h-8 flex items-center justify-center border transition-colors cursor-pointer',
        'disabled:opacity-30 disabled:cursor-default',
        active
          ? 'border-(--gold) text-(--gold) bg-(--gold)/10'
          : 'border-transparent text-muted hover:text-text hover:bg-white/5',
      )}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-(--bd) flex-wrap sticky top-0 z-5 bg-card">
      <ToolbarButton
        title="Título"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Subtítulo"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <span className="w-px h-4 bg-(--bd) mx-1.5" aria-hidden />

      <ToolbarButton
        title="Negrita"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Cursiva"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={15} />
      </ToolbarButton>

      <span className="w-px h-4 bg-(--bd) mx-1.5" aria-hidden />

      <ToolbarButton
        title="Lista con viñetas"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Lista numerada"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        title="Separador"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={16} />
      </ToolbarButton>

      <span className="w-px h-4 bg-(--bd) mx-1.5" aria-hidden />

      <ToolbarButton
        title="Deshacer"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        title="Rehacer"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={15} />
      </ToolbarButton>
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  minHeightClass = 'min-h-90',
  maxHeightClass = 'max-h-140',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: cn('rich-prose px-4 sm:px-6 py-5 outline-none', minHeightClass) },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // El contenido inicial puede llegar después del montaje (p. ej. el reset de
  // react-hook-form en los drawers CRUD). Mientras se escribe, `content` ya
  // coincide con el HTML del editor, así que esto no interfiere.
  useEffect(() => {
    if (!editor || content === editor.getHTML()) return
    editor.commands.setContent(content || '', { emitUpdate: false })
  }, [content, editor])

  if (!editor) {
    return <div className="bg-card border border-(--bd) min-h-100 animate-pulse" />
  }

  return (
    <div className="bg-card border border-(--bd)">
      <Toolbar editor={editor} />
      {/* El área editable ya ocupa el alto mínimo completo, así que un clic en
          cualquier punto cae sobre el contenteditable y lo enfoca solo. */}
      <div className={cn('overflow-y-auto cursor-text', maxHeightClass)}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
