import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
	LayoutDashboard,
	Package,
	FileText,
	UserCheck,
	HelpCircle,
	Search,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { useAccessiblePages } from "@/hooks/use-accessible-pages";

interface HelpSection {
	url: string;
	title: string;
	icon: React.ComponentType<{ className?: string }>;
	items: {
		question: string;
		answer: React.ReactNode;
	}[];
}

const helpSections: HelpSection[] = [
	{
		url: "/concierge/dashboard",
		title: "Painel Principal",
		icon: LayoutDashboard,
		items: [
			{
				question: "Como visualizar o dashboard?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Painel Principal" no menu lateral</li>
						<li>Visualize as informações gerais do portaria</li>
						<li>Veja estatísticas de encomendas, visitantes e multas</li>
						<li>Monitore atividades recentes</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/concierge/packages",
		title: "Encomendas",
		icon: Package,
		items: [
			{
				question: "Como registrar uma nova encomenda?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Encomendas" no menu lateral</li>
						<li>Clique em "Nova Encomenda"</li>
						<li>Selecione o apartamento destinatário</li>
						<li>Preencha os dados: remetente, descrição, código de rastreamento (se houver)</li>
						<li>Registre a data de recebimento</li>
						<li>Clique em "Registrar Encomenda"</li>
						<li>
							<strong>Nota:</strong> O morador será notificado sobre a encomenda
						</li>
					</ol>
				),
			},
			{
				question: "Como marcar uma encomenda como retirada?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Encomendas", localize a encomenda que foi retirada</li>
						<li>Verifique a identidade do morador</li>
						<li>Clique em "Marcar como Retirada"</li>
						<li>Confirme a retirada</li>
						<li>
							<strong>Importante:</strong> Sempre verifique a identidade antes de entregar
						</li>
					</ol>
				),
			},
			{
				question: "Como visualizar e gerenciar encomendas?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Encomendas", visualize todas as encomendas</li>
						<li>Use os filtros para encontrar encomendas específicas (por apartamento, status, data)</li>
						<li>Veja o status de cada encomenda (pendente, retirada)</li>
						<li>Edite informações se necessário</li>
						<li>Use a busca para localizar rapidamente uma encomenda</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/concierge/fines",
		title: "Multas",
		icon: FileText,
		items: [
			{
				question: "Como criar uma multa?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Multas" no menu lateral</li>
						<li>Clique em "Nova Multa"</li>
						<li>Selecione o apartamento</li>
						<li>Preencha o motivo da multa</li>
						<li>Informe o valor</li>
						<li>Selecione a data</li>
						<li>Clique em "Criar Multa"</li>
						<li>
							<strong>Nota:</strong> O morador será notificado sobre a multa
						</li>
					</ol>
				),
			},
			{
				question: "Como visualizar e gerenciar multas?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Multas", visualize todas as multas</li>
						<li>Use os filtros para encontrar multas específicas (por apartamento, status, data)</li>
						<li>Veja o status de cada multa (pendente, paga, etc.)</li>
						<li>Edite ou exclua multas conforme necessário</li>
						<li>Use a busca para localizar rapidamente uma multa</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/concierge/visitors",
		title: "Visitantes",
		icon: UserCheck,
		items: [
			{
				question: "Como registrar um visitante?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Visitantes" no menu lateral</li>
						<li>Clique em "Novo Visitante"</li>
						<li>Preencha os dados: nome completo, documento (CPF/RG), telefone</li>
						<li>Selecione o apartamento que será visitado</li>
						<li>Registre a data e horário de entrada</li>
						<li>Se disponível, tire uma foto do visitante</li>
						<li>Clique em "Registrar Visitante"</li>
						<li>
							<strong>Importante:</strong> Sempre verifique a identidade do visitante
						</li>
					</ol>
				),
			},
			{
				question: "Como registrar a saída de um visitante?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Visitantes", localize o visitante que está saindo</li>
						<li>Verifique a identidade do visitante</li>
						<li>Clique em "Registrar Saída"</li>
						<li>Confirme a data e horário de saída</li>
						<li>
							<strong>Nota:</strong> O sistema registra automaticamente o tempo de permanência
						</li>
					</ol>
				),
			},
			{
				question: "Como visualizar e gerenciar visitantes?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Visitantes", visualize todos os visitantes</li>
						<li>Use os filtros para encontrar visitantes específicos (por apartamento, status, data)</li>
						<li>Veja o status de cada visitante (dentro, saiu)</li>
						<li>Visualize histórico de visitas</li>
						<li>Edite informações se necessário</li>
						<li>Use a busca para localizar rapidamente um visitante</li>
					</ol>
				),
			},
			{
				question: "Como tirar foto de um visitante?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Ao registrar um novo visitante, clique no botão de câmera</li>
						<li>Permita o acesso à câmera do dispositivo</li>
						<li>Posicione o visitante na frente da câmera</li>
						<li>Clique para capturar a foto</li>
						<li>Revise a foto e confirme</li>
						<li>
							<strong>Nota:</strong> A foto ajuda na identificação do visitante
						</li>
					</ol>
				),
			},
		],
	},
];

export default function Help() {
	const accessiblePages = useAccessiblePages();
	const [searchQuery, setSearchQuery] = useState("");
	const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

	// Filtrar seções baseado nas páginas acessíveis
	const availableSections = useMemo(() => {
		const accessibleUrls = accessiblePages.map((page) => page.url);
		return helpSections.filter((section) => accessibleUrls.includes(section.url));
	}, [accessiblePages]);

	// Filtrar seções e itens baseado na busca
	const filteredSections = useMemo(() => {
		if (!searchQuery.trim()) {
			return availableSections;
		}

		const query = searchQuery.toLowerCase();
		return availableSections
			.map((section) => {
				const filteredItems = section.items.filter(
					(item) =>
						item.question.toLowerCase().includes(query) ||
						section.title.toLowerCase().includes(query) ||
						item.answer?.toString().toLowerCase().includes(query),
				);

				if (filteredItems.length > 0) {
					return { ...section, items: filteredItems };
				}
				return null;
			})
			.filter((section): section is HelpSection => section !== null);
	}, [availableSections, searchQuery]);

	const toggleSection = (url: string) => {
		setOpenSections((prev) => ({
			...prev,
			[url]: !prev[url],
		}));
	};

	// Abrir automaticamente os cards que contêm resultados da busca
	useEffect(() => {
		if (searchQuery.trim()) {
			// Calcular quais seções devem ser abertas baseado na busca
			const query = searchQuery.toLowerCase();
			const sectionsToOpen: Record<string, boolean> = {};

			availableSections.forEach((section) => {
				// Verificar se a seção ou algum item contém o termo buscado
				const hasMatch =
					section.title.toLowerCase().includes(query) ||
					section.items.some(
						(item) =>
							item.question.toLowerCase().includes(query) ||
							item.answer?.toString().toLowerCase().includes(query),
					);

				if (hasMatch) {
					sectionsToOpen[section.url] = true;
				}
			});

			setOpenSections((prev) => ({
				...prev,
				...sectionsToOpen,
			}));
		} else {
			// Quando a busca é limpa, fechar todos os cards
			setOpenSections({});
		}
	}, [searchQuery, availableSections]);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<HelpCircle className="w-8 h-8 text-primary" />
				<div>
					<h1 className="text-3xl font-bold">Central de Ajuda</h1>
					<p className="text-muted-foreground mt-1">
						Guia completo de como usar todas as funcionalidades do sistema
					</p>
				</div>
			</div>

			{/* Filtro de busca */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
						<Input
							type="text"
							placeholder="Buscar ajuda..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Seções de ajuda */}
			{filteredSections.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						<Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p>Nenhum resultado encontrado para sua busca.</p>
						<p className="text-sm mt-2">Tente usar termos diferentes.</p>
					</CardContent>
				</Card>
			) : (
				filteredSections.map((section) => {
					const IconComponent = section.icon;
					const isOpen = openSections[section.url] ?? false;

					return (
						<Collapsible
							key={section.url}
							open={isOpen}
							onOpenChange={() => toggleSection(section.url)}
						>
							<Card>
								<CollapsibleTrigger asChild>
									<CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
										<CardTitle className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<IconComponent className="w-5 h-5" />
												{section.title}
											</div>
											{isOpen ? (
												<ChevronUp className="w-5 h-5 text-muted-foreground" />
											) : (
												<ChevronDown className="w-5 h-5 text-muted-foreground" />
											)}
										</CardTitle>
									</CardHeader>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<CardContent>
										<Accordion type="single" collapsible className="w-full">
											{section.items.map((item, index) => (
												<AccordionItem key={`${section.url}-${index}`} value={`${section.url}-${index}`}>
													<AccordionTrigger>{item.question}</AccordionTrigger>
													<AccordionContent>{item.answer}</AccordionContent>
												</AccordionItem>
											))}
										</Accordion>
									</CardContent>
								</CollapsibleContent>
							</Card>
						</Collapsible>
					);
				})
			)}
		</div>
	);
}

