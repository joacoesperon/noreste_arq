"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Bold, Braces, Heading1, Heading2, Italic, List, ListOrdered, Minus, Redo, Underline, Undo } from "lucide-react";
import { BLOQUES, DATOS_FIJOS, type Dato } from "@/lib/documentos/datos";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Resalta los {{datos}} en el editor para distinguirlos del texto fijo. */
const ResaltarDatos = Extension.create({
  name: "resaltarDatos",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("resaltarDatos"),
        props: {
          decorations(state) {
            const decos: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              for (const m of node.text.matchAll(/\{\{\s*[\w.]+\s*\}\}/g)) {
                const desde = pos + m.index!;
                decos.push(Decoration.inline(desde, desde + m[0].length, { class: "dato-plantilla" }));
              }
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});

export function EditorTexto({
  contenido,
  onChange,
  datosDocumento = [],
}: {
  contenido: JSONContent;
  onChange: (c: JSONContent) => void;
  /** Campos propios del tipo de documento ({{doc.*}}). */
  datosDocumento?: Dato[];
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ code: false, codeBlock: false, blockquote: false, strike: false, link: false, heading: { levels: [1, 2, 3] } }),
      ResaltarDatos,
    ],
    content: contenido,
    immediatelyRender: false,
    editorProps: { attributes: { class: "editor-documento min-h-[420px] px-4 py-3 text-sm focus:outline-none" } },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  // Si el contenido cambia desde afuera (p. ej. «actualizar desde la plantilla»).
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(contenido)) {
      editor.commands.setContent(contenido, { emitUpdate: false });
    }
  }, [contenido, editor]);

  if (!editor) return <div className="min-h-[460px] rounded-lg border" />;

  const insertarDato = (key: string) => editor.chain().focus().insertContent(`{{${key}}}`).run();
  const insertarBloque = (key: string) =>
    editor
      .chain()
      .focus()
      .insertContent([{ type: "paragraph", content: [{ type: "text", text: `{{${key}}}` }] }])
      .run();

  const boton = (activo: boolean, accion: () => void, icono: React.ReactNode, label: string) => (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={accion}
      aria-label={label}
      title={label}
      className={cn(activo && "bg-muted")}
    >
      {icono}
    </Button>
  );

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        {boton(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 />, "Título")}
        {boton(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 />, "Subtítulo")}
        {boton(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold />, "Negrita")}
        {boton(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic />, "Cursiva")}
        {boton(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <Underline />, "Subrayado")}
        {boton(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List />, "Lista")}
        {boton(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered />, "Lista numerada")}
        {boton(false, () => editor.chain().focus().setHorizontalRule().run(), <Minus />, "Separador")}
        {boton(false, () => editor.chain().focus().undo().run(), <Undo />, "Deshacer")}
        {boton(false, () => editor.chain().focus().redo().run(), <Redo />, "Rehacer")}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Braces />
                Insertar dato
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {DATOS_FIJOS.map((g) => (
                <DropdownMenuSub key={g.grupo}>
                  <DropdownMenuSubTrigger>{g.grupo}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                    {g.datos.map((d) => (
                      <DropdownMenuItem key={d.key} onSelect={() => insertarDato(d.key)}>
                        {d.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
              {datosDocumento.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Este documento</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                    {datosDocumento.map((d) => (
                      <DropdownMenuItem key={d.key} onSelect={() => insertarDato(d.key)}>
                        {d.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Bloques (en su propio párrafo)</DropdownMenuLabel>
                {BLOQUES.map((b) => (
                  <DropdownMenuItem key={b.key} onSelect={() => insertarBloque(b.key)}>
                    {b.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
