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
	BarChart3,
	FolderKanban,
	Vote,
	MessageSquare,
	Building2,
	FileText,
	AlertTriangle,
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
		url: "/admin/dashboard",
		title: "Painel Principal",
		icon: LayoutDashboard,
		items: [
			{
				question: "Como visualizar o dashboard?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Painel Principal" no menu lateral</li>
						<li>Visualize as informações gerais do condomínio</li>
						<li>Veja estatísticas e métricas importantes</li>
						<li>Monitore o status geral das operações</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/admin/financial",
		title: "Financeiro",
		icon: BarChart3,
		items: [
			{
				question: "Como gerenciar o financeiro do condomínio?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Financeiro" no menu lateral</li>
						<li>Visualize receitas e despesas do condomínio</li>
						<li>Gerencie despesas recorrentes e avulsas</li>
						<li>Monitore o saldo e caixa do condomínio</li>
						<li>Gere relatórios financeiros</li>
					</ol>
				),
			},
			{
				question: "Como adicionar uma despesa?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Financeiro", clique em "Nova Despesa"</li>
						<li>Selecione o tipo de despesa (recorrente ou avulsa)</li>
						<li>Preencha os dados: descrição, valor, categoria, data</li>
						<li>Para despesas recorrentes, configure a periodicidade</li>
						<li>Clique em "Salvar" para registrar a despesa</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/admin/projects",
		title: "Projetos",
		icon: FolderKanban,
		items: [
			{
				question: "Como gerenciar projetos?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Projetos" no menu lateral</li>
						<li>Visualize todos os projetos (sugestões, aprovados, em andamento)</li>
						<li>Gerencie o ciclo de vida dos projetos</li>
						<li>Acompanhe o progresso de pagamento</li>
					</ol>
				),
			},
			{
				question: "Como aprovar um projeto?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Projetos", localize a sugestão que deseja aprovar</li>
						<li>Clique em "Aprovar" ou "Ver Detalhes"</li>
						<li>Configure os dados do projeto: valor total, número de parcelas, valor mensal</li>
						<li>Defina a data de início</li>
						<li>Clique em "Confirmar Aprovação"</li>
						<li>
							<strong>Importante:</strong> O projeto só pode ser aprovado após a votação e escolha de proposta
						</li>
					</ol>
				),
			},
			{
				question: "Como iniciar ou finalizar um projeto?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Projetos", localize o projeto desejado</li>
						<li>Para iniciar: clique em "Iniciar Projeto" quando estiver pronto para começar</li>
						<li>Para finalizar: clique em "Finalizar Projeto" quando estiver concluído</li>
						<li>Confirme a ação</li>
					</ol>
				),
			},
			{
				question: "Como gerenciar propostas de projetos?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Projetos", localize o projeto com propostas</li>
						<li>Visualize todas as propostas recebidas</li>
						<li>Compare valores, prazos e condições</li>
						<li>Gerencie o status das propostas (aceita, rejeitada, pendente)</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/admin/voting",
		title: "Votação",
		icon: Vote,
		items: [
			{
				question: "Como criar uma votação?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Votação" no menu lateral</li>
						<li>Clique em "Nova Votação"</li>
						<li>Preencha o título e descrição da votação</li>
						<li>Configure a data e horário de início e fim</li>
						<li>Selecione os projetos que serão votados</li>
						<li>Clique em "Criar Votação"</li>
					</ol>
				),
			},
			{
				question: "Como agendar uma votação?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Votação", vá para a aba "Agendamentos"</li>
						<li>Clique em "Novo Agendamento"</li>
						<li>Selecione o mês e ano</li>
						<li>Configure a data e horário de início e fim</li>
						<li>Salve o agendamento</li>
						<li>
							<strong>Nota:</strong> O agendamento deve ser feito com pelo menos 5 minutos de antecedência
						</li>
					</ol>
				),
			},
			{
				question: "Como visualizar resultados de uma votação?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Votação", localize a votação desejada</li>
						<li>Visualize os resultados em tempo real</li>
						<li>Veja quantos votos cada projeto recebeu</li>
						<li>Monitore o progresso da votação</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/admin/polls",
		title: "Enquetes",
		icon: MessageSquare,
		items: [
			{
				question: "Como criar uma enquete?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Enquetes" no menu lateral</li>
						<li>Clique em "Nova Enquete"</li>
						<li>Digite a pergunta da enquete</li>
						<li>Adicione as opções de resposta</li>
						<li>Configure a data de início e fim</li>
						<li>Clique em "Criar Enquete"</li>
					</ol>
				),
			},
			{
				question: "Como editar ou excluir uma enquete?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Enquetes", localize a enquete desejada</li>
						<li>Clique no ícone de editar para modificar</li>
						<li>Ou clique no ícone de excluir para remover</li>
						<li>Confirme a ação</li>
						<li>
							<strong>Nota:</strong> Enquetes em andamento podem ter restrições de edição
						</li>
					</ol>
				),
			},
			{
				question: "Como visualizar resultados de uma enquete?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Enquetes", localize a enquete desejada</li>
						<li>Visualize os resultados em tempo real</li>
						<li>Veja o número de votos por opção</li>
						<li>Monitore o percentual de participação</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/admin/condominium-info",
		title: "Informações do Condomínio",
		icon: Building2,
		items: [
			{
				question: "Como editar informações do condomínio?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Informações do Condomínio" no menu lateral</li>
						<li>Visualize as informações atuais</li>
						<li>Clique em "Editar" para modificar</li>
						<li>Atualize os dados desejados (nome, endereço, CNPJ, etc.)</li>
						<li>Clique em "Salvar" para confirmar as alterações</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/admin/fines",
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
					</ol>
				),
			},
			{
				question: "Como visualizar e gerenciar multas?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Multas", visualize todas as multas do condomínio</li>
						<li>Use os filtros para encontrar multas específicas</li>
						<li>Veja o status de cada multa (pendente, paga, etc.)</li>
						<li>Edite ou exclua multas conforme necessário</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/admin/notices",
		title: "Avisos",
		icon: AlertTriangle,
		items: [
			{
				question: "Como criar um aviso?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Avisos" no menu lateral</li>
						<li>Clique em "Novo Aviso"</li>
						<li>Preencha o título do aviso</li>
						<li>Escreva o conteúdo completo</li>
						<li>Adicione anexos, se necessário</li>
						<li>Defina o status (ativo/inativo)</li>
						<li>Clique em "Criar Aviso"</li>
					</ol>
				),
			},
			{
				question: "Como editar ou excluir um aviso?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Avisos", localize o aviso desejado</li>
						<li>Clique no ícone de editar para modificar</li>
						<li>Ou clique no ícone de excluir para remover</li>
						<li>Confirme a ação</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/admin/documents",
		title: "Documentos",
		icon: FileText,
		items: [
			{
				question: "Como adicionar um documento?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Documentos" no menu lateral</li>
						<li>Clique em "Novo Documento"</li>
						<li>Preencha o nome do documento</li>
						<li>Selecione a categoria</li>
						<li>Faça upload do arquivo</li>
						<li>Clique em "Salvar"</li>
					</ol>
				),
			},
			{
				question: "Como gerenciar documentos?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Documentos", visualize todos os documentos</li>
						<li>Use os filtros para encontrar documentos específicos</li>
						<li>Edite ou exclua documentos conforme necessário</li>
						<li>Organize por categoria</li>
					</ol>
				),
			},
		],
	},
	{
		url: "/admin/concierge",
		title: "Porteiros",
		icon: UserCheck,
		items: [
			{
				question: "Como cadastrar um porteiro?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Acesse a página "Porteiros" no menu lateral</li>
						<li>Clique em "Novo Porteiro"</li>
						<li>Preencha os dados: nome, email, telefone</li>
						<li>Defina uma senha inicial</li>
						<li>Clique em "Criar Porteiro"</li>
						<li>
							<strong>Nota:</strong> O porteiro receberá as credenciais por email
						</li>
					</ol>
				),
			},
			{
				question: "Como editar ou excluir um porteiro?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Porteiros", localize o porteiro desejado</li>
						<li>Clique em "Editar" para modificar os dados</li>
						<li>Ou clique em "Excluir" para remover</li>
						<li>Confirme a ação</li>
					</ol>
				),
			},
			{
				question: "Como visualizar detalhes de um porteiro?",
				answer: (
					<ol className="list-decimal list-inside space-y-2 text-muted-foreground">
						<li>Na página "Porteiros", clique em "Visualizar" no porteiro desejado</li>
						<li>Veja todas as informações do porteiro</li>
						<li>Visualize histórico de atividades</li>
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

