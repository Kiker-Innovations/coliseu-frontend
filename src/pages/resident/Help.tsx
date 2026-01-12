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
	Lightbulb,
	Vote,
	TrendingUp,
	MessageSquare,
	FileText,
	AlertTriangle,
	Package,
	Calendar,
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
		url: "/suggestions",
		title: "Sugestões",
		icon: Lightbulb,
		items: [
			{
				question: "Como criar uma sugestão?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Sugestões" no menu lateral</li>
						<li>Clique no botão "Nova Sugestão"</li>
						<li>Preencha o título da sua sugestão (máximo 100 caracteres)</li>
						<li>Descreva sua sugestão em detalhes no campo de descrição (máximo 1000 caracteres)</li>
						<li>Clique em "Criar" para enviar sua sugestão</li>
						<li>
							<strong>Importante:</strong> Você pode criar até 5 sugestões por temporada
						</li>
					</ol>
				),
			},
			{
				question: "Como editar ou excluir uma sugestão?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Sugestões", localize a sugestão que deseja modificar</li>
						<li>Clique no ícone de lápis para editar ou no ícone de lixeira para excluir</li>
						<li>Para editar: modifique os campos e clique em "Atualizar"</li>
						<li>Para excluir: confirme a exclusão</li>
						<li>
							<strong>Nota:</strong> Você só pode editar/excluir sugestões da temporada atual
						</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/vote",
		title: "Votar",
		icon: Vote,
		items: [
			{
				question: "Como votar em projetos?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Votar" no menu lateral</li>
						<li>Visualize os projetos disponíveis para votação</li>
						<li>Leia as informações de cada projeto (título, descrição, valor, etc.)</li>
						<li>Selecione até 3 projetos que você deseja aprovar</li>
						<li>Clique no botão "+" para adicionar seu voto ao projeto</li>
						<li>Você pode remover um voto clicando no botão "-"</li>
						<li>Após selecionar seus projetos, clique em "Confirmar Votos"</li>
						<li>
							<strong>Importante:</strong> Você só pode votar durante o período de votação ativo
						</li>
					</ol>
				),
			},
			{
				question: "Como escolher uma proposta (oferta)?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Após a votação, se um projeto tiver múltiplas propostas, você poderá escolher</li>
						<li>Visualize todas as propostas disponíveis para o projeto</li>
						<li>Compare valores, prazos e condições de cada proposta</li>
						<li>Selecione a proposta que você considera melhor</li>
						<li>Confirme sua escolha</li>
						<li>
							<strong>Nota:</strong> Você só pode escolher uma proposta por projeto
						</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/progress",
		title: "Acompanhar Progresso",
		icon: TrendingUp,
		items: [
			{
				question: "Como acompanhar o progresso dos projetos?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Acompanhar Progresso" no menu lateral</li>
						<li>Visualize todos os projetos aprovados e em andamento</li>
						<li>Veja informações como:
							<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
								<li>Progresso de pagamento (parcelas pagas/total)</li>
								<li>Valor total do projeto</li>
								<li>Valor da parcela mensal</li>
								<li>Valor restante a pagar</li>
							</ul>
						</li>
						<li>Os projetos são ordenados por progresso (maior para menor)</li>
						<li>Use os filtros para encontrar projetos específicos</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/poll",
		title: "Enquete",
		icon: MessageSquare,
		items: [
			{
				question: "Como participar de uma enquete?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Enquete" no menu lateral</li>
						<li>Visualize as enquetes ativas disponíveis</li>
						<li>Leia a pergunta e todas as opções de resposta</li>
						<li>Selecione a opção que você deseja votar</li>
						<li>Clique em "Votar" para confirmar sua participação</li>
						<li>Visualize os resultados atualizados em tempo real</li>
						<li>
							<strong>Importante:</strong> Você só pode votar uma vez em cada enquete
						</li>
					</ol>
				),
			},
			{
				question: "Como visualizar os resultados de uma enquete?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Enquete", você verá automaticamente os resultados</li>
						<li>Os resultados mostram:
							<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
								<li>Número de votos por opção</li>
								<li>Percentual de votos</li>
								<li>Total de participantes</li>
							</ul>
						</li>
						<li>Os resultados são atualizados automaticamente</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/fines",
		title: "Multas",
		icon: FileText,
		items: [
			{
				question: "Como visualizar minhas multas?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Multas" no menu lateral</li>
						<li>Visualize todas as multas associadas ao seu apartamento</li>
						<li>Veja informações como:
							<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
								<li>Data da multa</li>
								<li>Motivo da multa</li>
								<li>Valor</li>
								<li>Status (pendente, paga, etc.)</li>
							</ul>
						</li>
						<li>Use os filtros para encontrar multas específicas</li>
						<li>Clique em uma multa para ver mais detalhes</li>
					</ol>
				),
			},
			{
				question: "Como pagar uma multa?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Multas", localize a multa que deseja pagar</li>
						<li>Verifique se a multa está com status "Pendente"</li>
						<li>Clique na multa para ver os detalhes</li>
						<li>Siga as instruções de pagamento fornecidas</li>
						<li>
							<strong>Nota:</strong> O pagamento pode ser processado pela administração do
							condomínio
						</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/documents",
		title: "Documentos",
		icon: FileText,
		items: [
			{
				question: "Como visualizar documentos do condomínio?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Documentos" no menu lateral</li>
						<li>Visualize todos os documentos disponíveis</li>
						<li>Veja informações como:
							<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
								<li>Nome do documento</li>
								<li>Data de publicação</li>
								<li>Categoria</li>
								<li>Tamanho do arquivo</li>
							</ul>
						</li>
						<li>Use os filtros para encontrar documentos específicos</li>
						<li>Clique em "Visualizar" para abrir o documento</li>
						<li>Clique em "Download" para baixar o arquivo</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/notices",
		title: "Avisos",
		icon: AlertTriangle,
		items: [
			{
				question: "Como visualizar avisos do condomínio?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Avisos" no menu lateral</li>
						<li>Visualize todos os avisos ativos do condomínio</li>
						<li>Veja informações como:
							<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
								<li>Título do aviso</li>
								<li>Data de publicação</li>
								<li>Resumo do conteúdo</li>
							</ul>
						</li>
						<li>Clique em "Visualizar" para ler o aviso completo</li>
						<li>Se houver anexos, você poderá visualizá-los ou baixá-los</li>
						<li>Use a paginação para navegar entre os avisos</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/packages",
		title: "Encomendas",
		icon: Package,
		items: [
			{
				question: "Como visualizar minhas encomendas?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Encomendas" no menu lateral</li>
						<li>Visualize todas as encomendas registradas para você</li>
						<li>Veja informações como:
							<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
								<li>Data de recebimento</li>
								<li>Remetente</li>
								<li>Status (pendente, retirada, etc.)</li>
								<li>Código de rastreamento (se disponível)</li>
							</ul>
						</li>
						<li>Use os filtros para encontrar encomendas específicas</li>
						<li>Clique em uma encomenda para ver mais detalhes</li>
					</ol>
				),
			},
			{
				question: "Como marcar uma encomenda como retirada?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Encomendas", localize a encomenda que você retirou</li>
						<li>Verifique se a encomenda está com status "Pendente"</li>
						<li>Clique na encomenda para ver os detalhes</li>
						<li>Se disponível, clique em "Marcar como Retirada"</li>
						<li>
							<strong>Nota:</strong> Em alguns casos, a retirada pode ser confirmada pelo
							porteiro
						</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/bookings",
		title: "Reservas",
		icon: Calendar,
		items: [
			{
				question: "Como fazer uma reserva?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Reservas" no menu lateral</li>
						<li>Clique no botão "Nova Reserva"</li>
						<li>Selecione o espaço ou área que deseja reservar (ex: salão de festas, churrasqueira)</li>
						<li>Escolha a data desejada no calendário</li>
						<li>Selecione o horário de início e fim</li>
						<li>Preencha informações adicionais, se necessário</li>
						<li>Revise os detalhes da reserva</li>
						<li>Clique em "Confirmar Reserva"</li>
						<li>
							<strong>Importante:</strong> Verifique a disponibilidade antes de confirmar
						</li>
					</ol>
				),
			},
			{
				question: "Como visualizar minhas reservas?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Reservas", você verá todas as suas reservas</li>
						<li>Veja informações como:
							<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
								<li>Espaço reservado</li>
								<li>Data e horário</li>
								<li>Status (pendente, confirmada, cancelada)</li>
							</ul>
						</li>
						<li>Use os filtros para encontrar reservas específicas</li>
						<li>Clique em uma reserva para ver mais detalhes</li>
					</ol>
				),
			},
			{
				question: "Como cancelar uma reserva?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Reservas", localize a reserva que deseja cancelar</li>
						<li>Verifique se a reserva pode ser cancelada (depende do prazo e políticas)</li>
						<li>Clique na reserva para ver os detalhes</li>
						<li>Clique em "Cancelar Reserva"</li>
						<li>Confirme o cancelamento</li>
						<li>
							<strong>Nota:</strong> Algumas reservas podem ter restrições de cancelamento
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

