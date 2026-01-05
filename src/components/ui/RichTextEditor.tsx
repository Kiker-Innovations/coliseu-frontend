import React, { useMemo, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

// Função para carregar react-quill dinamicamente
const loadReactQuill = async () => {
	try {
		// Usar import dinâmico que só será resolvido em runtime
		const reactQuillModule = await import(/* @vite-ignore */ "react-quill");
		try {
			await import(/* @vite-ignore */ "react-quill/dist/quill.snow.css");
		} catch (cssError) {
		}
		return reactQuillModule.default;
	} catch (error) {
		return null;
	}
};

// Componente fallback
const FallbackEditor = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) => (
	<div className="space-y-2">
		<Textarea
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder || "Digite as normas de uso..."}
			rows={6}
			className="min-h-[150px]"
		/>
		<p className="text-xs text-muted-foreground">
			Editor avançado não disponível. Execute: npm install react-quill
		</p>
	</div>
);

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
	const [isClient, setIsClient] = useState(false);
	const [QuillComponent, setQuillComponent] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [internalValue, setInternalValue] = useState(value || "");
	const quillRef = React.useRef<any>(null);

	// TODOS os hooks devem ser chamados ANTES de qualquer return condicional
	useEffect(() => {
		setIsClient(true);
		loadReactQuill().then((Quill) => {
			if (Quill) {
				setQuillComponent(() => Quill);
			}
			setIsLoading(false);
		});
	}, []);

	// Inicializar o valor interno quando o componente montar ou quando value mudar
	useEffect(() => {
		setInternalValue(value || "");
	}, [value]);

	// Adicionar estilos globalmente quando o componente montar
	useEffect(() => {
		const styleId = "rich-text-editor-styles";
		if (!document.getElementById(styleId)) {
			const style = document.createElement("style");
			style.id = styleId;
			style.textContent = `
				.rich-text-editor .ql-container {
					min-height: 150px;
					font-size: 14px;
				}
				.rich-text-editor .ql-editor {
					min-height: 150px;
				}
				.rich-text-editor .ql-toolbar {
					border-top-left-radius: 0.375rem;
					border-top-right-radius: 0.375rem;
					border-bottom: none;
				}
				.rich-text-editor .ql-container {
					border-bottom-left-radius: 0.375rem;
					border-bottom-right-radius: 0.375rem;
				}
			`;
			document.head.appendChild(style);
		}
	}, []);

	const modules = useMemo(
		() => ({
			toolbar: [
				[{ header: [1, 2, 3, false] }],
				["bold", "italic", "underline", "strike"],
				[{ list: "ordered" }, { list: "bullet" }],
				[{ indent: "-1" }, { indent: "+1" }],
				["link"],
				["clean"],
			],
		}),
		[]
	);

	const formats = [
		"header",
		"bold",
		"italic",
		"underline",
		"strike",
		"list",
		"bullet",
		"indent",
		"link",
	];

	// Sincronizar o editor quando o valor interno mudar (após o editor estar montado)
	// Este hook DEVE estar antes dos early returns
	useEffect(() => {
		if (!isLoading && QuillComponent && quillRef.current && quillRef.current.getEditor) {
			const editor = quillRef.current.getEditor();
			if (editor) {
				const currentContent = editor.root.innerHTML;
				const newContent = internalValue || "";
				// Só atualizar se o conteúdo for diferente
				if (currentContent !== newContent && newContent !== "") {
					// Usar setTimeout para garantir que o editor esteja pronto
					setTimeout(() => {
						editor.clipboard.dangerouslyPasteHTML(newContent);
					}, 100);
				}
			}
		}
	}, [internalValue, isLoading, QuillComponent]);

	// Agora podemos fazer os early returns DEPOIS de todos os hooks
	if (!isClient || isLoading) {
		return (
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder || "Digite as normas de uso..."}
				rows={6}
				className="min-h-[150px]"
			/>
		);
	}

	if (!QuillComponent) {
		return <FallbackEditor value={value} onChange={onChange} placeholder={placeholder} />;
	}

	const handleChange = (content: string) => {
		setInternalValue(content);
		onChange(content);
	};

	const Quill = QuillComponent;

	return (
		<div className="rich-text-editor">
			<Quill
				ref={quillRef}
				theme="snow"
				value={internalValue}
				onChange={handleChange}
				modules={modules}
				formats={formats}
				placeholder={placeholder || "Digite as normas de uso..."}
				className="bg-background"
			/>
		</div>
	);
}

