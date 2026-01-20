import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { conciergeSchema, type ConciergeSchema } from "@/schemas/admin/concierge.schema";
import ConciergeSkeleton from "@/skeleton/admin/ConciergeSkeleton";
import { UserPlus, Edit, Trash2, RefreshCw, KeyRound, Copy, Shield, Eye, Phone, Plus, X } from "lucide-react";
import {
	registerConcierge,
	listConcierges,
	updateConcierge,
	deleteConcierge as apiDeleteConcierge,
	forgetPasswordConcierge,
	type Concierge,
} from "@/services/concierge.service";
import {
	createUsefulContact,
	getUsefulContacts,
	deleteUsefulContact,
	updateUsefulContact,
	type UsefulContact,
	type CreateUsefulContactRequest,
	type UpdateUsefulContactRequest,
} from "@/services/api";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { MaskedInput } from "@/components/ui/masked-input";

export default function Concierge() {
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"list" | "create" | "contacts">("list");
	const navigate = useNavigate();
	const [editingId, setEditingId] = useState<number | null>(null);
	const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
	const [selectedForReset, setSelectedForReset] = useState<Concierge | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedForDelete, setSelectedForDelete] = useState<Concierge | null>(null);
	const [usefulContacts, setUsefulContacts] = useState<UsefulContact[]>([]);
	const [isLoadingContacts, setIsLoadingContacts] = useState(false);
	const [newContact, setNewContact] = useState<CreateUsefulContactRequest>({
		name: "",
		phone: "",
		observation: "",
	});
	const [editingContactId, setEditingContactId] = useState<string | null>(null);
	const [editingContact, setEditingContact] = useState<UpdateUsefulContactRequest>({
		name: "",
		phone: "",
		observation: "",
	});
	const [isDeleteContactDialogOpen, setIsDeleteContactDialogOpen] = useState(false);
	const [selectedContactForDelete, setSelectedContactForDelete] = useState<UsefulContact | null>(null);
	useEffect(() => {
		const load = async () => {
			try {
				// Verificar se o token está disponível
				const token =
					localStorage.getItem("coliseu_access_token") ||
					sessionStorage.getItem("coliseu_access_token");

				if (!token) {
					toast.error("Token não encontrado. Faça login novamente.");
					setIsLoading(false);
					return;
				}

				const items = await listConcierges();
				setConcierges(items);
			} catch (e: any) {
				toast.error(e?.message || "Erro ao carregar porteiros");
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, []);

	// Load useful contacts when list or contacts tab is active
	useEffect(() => {
		if (activeTab === "list" || activeTab === "contacts") {
			loadUsefulContacts();
		}
	}, [activeTab]);

	const loadUsefulContacts = async () => {
		try {
			setIsLoadingContacts(true);
			const response = await getUsefulContacts();
			if (response.success && response.data) {
				setUsefulContacts(response.data);
			}
		} catch (error: any) {
			toast.error(error?.message || "Erro ao carregar contatos úteis");
		} finally {
			setIsLoadingContacts(false);
		}
	};

	// Função para formatar telefone para salvar (+5513974080222)
	const formatPhoneForSave = (phone: string): string => {
		// Remove tudo exceto números
		const cleaned = phone.replace(/\D/g, "");
		// Se não começa com 55, adiciona 55
		if (cleaned.length > 0 && !cleaned.startsWith("55")) {
			return `+55${cleaned}`;
		}
		// Se já começa com 55, adiciona o + no início
		if (cleaned.startsWith("55")) {
			return `+${cleaned}`;
		}
		// Fallback: adiciona +55
		return `+55${cleaned}`;
	};

	// Função para formatar telefone para exibição (+55 13 97408-0222)
	const formatPhoneForDisplay = (phone: string | undefined): string => {
		if (!phone || phone.trim() === "") return "";
		// Remove tudo exceto números e +
		const cleaned = phone.replace(/[^\d+]/g, "");
		// Se já está no formato +5513974080222
		if (cleaned.startsWith("+55") && cleaned.length === 14) {
			const ddd = cleaned.slice(3, 5);
			const firstPart = cleaned.slice(5, 10);
			const secondPart = cleaned.slice(10, 14);
			return `+55 ${ddd} ${firstPart}-${secondPart}`;
		}
		// Se está no formato 5513974080222 (sem +)
		if (cleaned.startsWith("55") && cleaned.length === 13) {
			const ddd = cleaned.slice(2, 4);
			const firstPart = cleaned.slice(4, 9);
			const secondPart = cleaned.slice(9, 13);
			return `+55 ${ddd} ${firstPart}-${secondPart}`;
		}
		// Se tem 11 dígitos (assume DDD + número)
		if (cleaned.length === 11) {
			const ddd = cleaned.slice(0, 2);
			const firstPart = cleaned.slice(2, 7);
			const secondPart = cleaned.slice(7, 11);
			return `+55 ${ddd} ${firstPart}-${secondPart}`;
		}
		// Retorna como está se não conseguir formatar
		return phone;
	};

	const handleCreateContact = async () => {
		if (!newContact.name.trim() || !newContact.phone.trim()) {
			toast.error("Nome e telefone são obrigatórios");
			return;
		}

		try {
			const formattedPhone = formatPhoneForSave(newContact.phone);
			const response = await createUsefulContact({
				...newContact,
				phone: formattedPhone,
			});
			if (response.success) {
				toast.success("Contato útil cadastrado com sucesso!");
				setNewContact({ name: "", phone: "", observation: "" });
				loadUsefulContacts();
			}
		} catch (error: any) {
			toast.error(error?.message || "Erro ao cadastrar contato útil");
		}
	};

	const handleEditContact = (contact: UsefulContact) => {
		setEditingContactId(contact._id);
		// Formatar o telefone para exibição no campo de edição
		const formattedPhone = formatPhoneForDisplay(contact.phone);
		setEditingContact({
			name: contact.name,
			phone: formattedPhone,
			observation: contact.observation || "",
		});
	};

	const handleCancelEdit = () => {
		setEditingContactId(null);
		setEditingContact({ name: "", phone: "", observation: "" });
	};

	const handleSaveEdit = async () => {
		if (!editingContactId) return;
		if (!editingContact.name?.trim() || !editingContact.phone?.trim()) {
			toast.error("Nome e telefone são obrigatórios");
			return;
		}

		try {
			const formattedPhone = formatPhoneForSave(editingContact.phone);
			const response = await updateUsefulContact(editingContactId, {
				...editingContact,
				phone: formattedPhone,
			});
			if (response.success) {
				toast.success("Contato útil atualizado com sucesso!");
				setEditingContactId(null);
				setEditingContact({ name: "", phone: "", observation: "" });
				loadUsefulContacts();
			}
		} catch (error: any) {
			toast.error(error?.message || "Erro ao atualizar contato útil");
		}
	};

	const handleDeleteContactClick = (contact: UsefulContact) => {
		setSelectedContactForDelete(contact);
		setIsDeleteContactDialogOpen(true);
	};

	const confirmDeleteContact = async () => {
		if (!selectedContactForDelete) return;
		try {
			const response = await deleteUsefulContact(selectedContactForDelete._id);
			if (response.success) {
				toast.success("Contato útil excluído com sucesso!");
				setIsDeleteContactDialogOpen(false);
				setSelectedContactForDelete(null);
				loadUsefulContacts();
			}
		} catch (error: any) {
			toast.error(error?.message || "Erro ao excluir contato útil");
		}
	};

	const form = useForm<ConciergeSchema>({
		resolver: zodResolver(conciergeSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			shift: "MANHA",
			passwordHash: "",
			status: "ATIVO",
		},
	});

	const randomPassword = useMemo(() => {
		return () => {
			const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			const lower = "abcdefghijklmnopqrstuvwxyz";
			const digits = "0123456789"; // permitido, não obrigatório pelo schema, mas ajuda força
			const special = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?";
			const all = upper + lower + digits + special;

			const pick = (set: string) =>
				set[Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * set.length)];

			const requiredChars = [pick(upper), pick(lower), pick(special)];
			const targetLen = 12;
			const remainingLen = targetLen - requiredChars.length;
			const rest: string[] = [];
			for (let i = 0; i < remainingLen; i++) {
				rest.push(pick(all));
			}
			const combined = [...requiredChars, ...rest];
			// shuffle
			for (let i = combined.length - 1; i > 0; i--) {
				const j = Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * (i + 1));
				[combined[i], combined[j]] = [combined[j], combined[i]];
			}
			const value = combined.join("");
			form.setValue("passwordHash", value, { shouldDirty: true });
		};
	}, [form]);

	const [concierges, setConcierges] = useState<Concierge[]>([]);

	const handleEdit = (c: Concierge) => {
		navigate(`/admin/concierge/edit/${c.id}`);
	};

	const handleDelete = (c: Concierge) => {
		setSelectedForDelete(c);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!selectedForDelete) return;
		try {
			await apiDeleteConcierge(selectedForDelete.id);
			setConcierges((prev) => prev.filter((c) => c.id !== selectedForDelete.id));
			toast.success("Porteiro removido com sucesso!");
			setIsDeleteDialogOpen(false);
			setSelectedForDelete(null);
		} catch {
			toast.error("Erro ao remover porteiro");
		}
	};

	const handleResetPassword = (c: Concierge) => {
		setSelectedForReset(c);
		setIsResetDialogOpen(true);
	};

	const confirmResetPassword = async () => {
		if (!selectedForReset) return;
		try {
			await forgetPasswordConcierge(selectedForReset.email);
			toast.success("E-mail de redefinição de senha enviado com sucesso!");
			setIsResetDialogOpen(false);
			setSelectedForReset(null);
		} catch (e: any) {
			toast.error(e?.message || "Erro ao solicitar redefinição de senha");
		}
	};

	const onSubmit = async (data: ConciergeSchema) => {
		try {
			// Verificar se o token está disponível
			const token =
				localStorage.getItem("coliseu_access_token") ||
				sessionStorage.getItem("coliseu_access_token");

			if (!token) {
				toast.error("Token não encontrado. Faça login novamente.");
				return;
			}

			await new Promise((r) => setTimeout(r, 700));
			if (false) {
				// Edição não é feita nesta tela
			} else {
				await registerConcierge({
					name: data.name,
					email: data.email,
					password: data.passwordHash,
					phone: data.phone,
					shift: data.shift,
					status: data.status,
				});
				// reload list after create to sync with backend ids
				const items = await listConcierges();
				setConcierges(items);
				toast.success("Porteiro cadastrado com sucesso!");
			}
			form.reset({
				name: "",
				email: "",
				phone: "",
				shift: "MANHA",
				passwordHash: "",
				status: "ATIVO",
			});
			setActiveTab("list");
		} catch (e: any) {
			toast.error(e?.message || "Erro ao salvar porteiro");
		}
	};

	if (isLoading) return <ConciergeSkeleton />;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Portaria</h1>
					<p className="text-muted-foreground">Gerencie os porteiros do condomínio</p>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
				<TabsList>
					<TabsTrigger value="list">Listar</TabsTrigger>
					<TabsTrigger value="create">Cadastrar Porteiro</TabsTrigger>
					<TabsTrigger value="contacts">Contatos Úteis</TabsTrigger>
				</TabsList>

				<TabsContent value="list" className="space-y-6">
					{/* Seção de Porteiros */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Shield className="w-5 h-5 text-primary" />
							<h2 className="text-2xl font-semibold">Porteiros</h2>
						</div>
					{concierges.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
								<p className="text-lg font-medium text-muted-foreground">
									Nenhum porteiro cadastrado
								</p>
								<p className="text-sm text-muted-foreground mt-2">
										Cadastre um novo porteiro na aba "Cadastrar Porteiro"
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-4">
							{concierges.map((c) => (
								<Card key={c.id}>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<CardTitle className="flex items-center gap-2">
													<Shield className="w-5 h-5 text-primary" />
													{c.name}
												</CardTitle>
												<p className="text-sm text-muted-foreground mt-1">{c.email}</p>
												<div className="mt-2 flex gap-2">
													<Badge variant="secondary">
														{c.shift === "MANHA" && "Manhã"}
														{c.shift === "TARDE" && "Tarde"}
														{c.shift === "NOITE" && "Noite"}
													</Badge>
													{c.status && (
														<Badge
															variant={
																c.status === "ATIVO"
																	? "default"
																	: c.status === "DE_FERIAS"
																		? "secondary"
																		: "destructive"
															}
														>
															{c.status === "ATIVO" && "Ativo"}
															{c.status === "INATIVO" && "Inativo"}
															{c.status === "DE_FERIAS" && "De Férias"}
														</Badge>
													)}
												</div>
											</div>
											<div className="flex gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() => navigate(`/admin/concierge/view/${c.id}`)}
												>
													<Eye className="w-4 h-4" />
												</Button>
												<Button size="sm" variant="outline" onClick={() => handleEdit(c)}>
													<Edit className="w-4 h-4" />
												</Button>
												<Button size="sm" variant="outline" onClick={() => handleResetPassword(c)}>
													<KeyRound className="w-4 h-4" />
												</Button>
												<Button size="sm" variant="outline" onClick={() => handleDelete(c)}>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</div>
									</CardHeader>
								</Card>
							))}
						</div>
					)}
					</div>

					{/* Separador */}
					<div className="relative my-8">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-border" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">Contatos Úteis</span>
						</div>
					</div>

					{/* Seção de Contatos Úteis */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Phone className="w-5 h-5 text-primary" />
							<h2 className="text-2xl font-semibold">Contatos Úteis</h2>
						</div>
						{isLoadingContacts ? (
							<Card>
								<CardContent className="py-12 text-center">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
								</CardContent>
							</Card>
						) : usefulContacts.length === 0 ? (
							<Card>
								<CardContent className="py-12 text-center">
									<Phone className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
									<p className="text-lg font-medium text-muted-foreground">
										Nenhum contato útil cadastrado
									</p>
									<p className="text-sm text-muted-foreground mt-2">
										Cadastre contatos úteis na aba "Contatos Úteis"
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="grid grid-cols-1 gap-3">
								{usefulContacts.map((contact) => (
									<Card key={contact._id}>
										{editingContactId === contact._id ? (
											<CardContent className="pt-6">
												<div className="space-y-3">
													<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
														<div className="space-y-2">
															<Label htmlFor={`edit-name-${contact._id}`}>Nome *</Label>
															<Input
																id={`edit-name-${contact._id}`}
																value={editingContact.name}
																onChange={(e) =>
																	setEditingContact({ ...editingContact, name: e.target.value })
																}
															/>
														</div>
														<div className="space-y-2">
															<Label htmlFor={`edit-phone-${contact._id}`}>Telefone *</Label>
															<MaskedInput
																id={`edit-phone-${contact._id}`}
																mask="+55 99 99999-9999"
																maskChar={null}
																value={editingContact.phone}
																onChange={(e) =>
																	setEditingContact({ ...editingContact, phone: e.target.value })
																}
																placeholder="+55 13 97408-0222"
															/>
														</div>
													</div>
													<div className="space-y-2">
														<Label htmlFor={`edit-observation-${contact._id}`}>Observação</Label>
														<Input
															id={`edit-observation-${contact._id}`}
															value={editingContact.observation || ""}
															onChange={(e) =>
																setEditingContact({ ...editingContact, observation: e.target.value })
															}
														/>
													</div>
													<div className="flex gap-2 justify-end">
														<Button size="sm" variant="outline" onClick={handleCancelEdit}>
															Cancelar
														</Button>
														<Button size="sm" onClick={handleSaveEdit}>
															Salvar
														</Button>
													</div>
												</div>
											</CardContent>
										) : (
											<CardContent className="pt-6">
												<div className="flex items-center justify-between">
													<div className="flex-1 flex items-center gap-4">
														<Phone className="w-4 h-4 text-primary flex-shrink-0" />
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-3">
																<p className="font-semibold">{contact.name}</p>
																<span className="text-muted-foreground">•</span>
																<p className="text-sm text-muted-foreground">{formatPhoneForDisplay(contact.phone)}</p>
															</div>
															{contact.observation && (
																<p className="text-sm text-muted-foreground mt-1">{contact.observation}</p>
															)}
														</div>
													</div>
													<div className="flex gap-2 ml-4">
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleEditContact(contact)}
														>
															<Edit className="w-4 h-4" />
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleDeleteContactClick(contact)}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</div>
											</CardContent>
										)}
									</Card>
								))}
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value="create">
					<Card>
						<CardHeader>
							<CardTitle>{editingId ? "Editar Porteiro" : "Cadastrar Porteiro"}</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								{/* Linha 1: Nome e E-mail */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name">Nome</Label>
										<Input id="name" placeholder="Nome completo" {...form.register("name")} />
										{form.formState.errors.name && (
											<p className="text-sm text-destructive">
												{form.formState.errors.name.message}
											</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">E-mail</Label>
										<Input
											id="email"
											type="email"
											placeholder="email@exemplo.com"
											{...form.register("email")}
										/>
										{form.formState.errors.email && (
											<p className="text-sm text-destructive">
												{form.formState.errors.email.message}
											</p>
										)}
									</div>
								</div>

								{/* Linha 2: Telefone e Turno */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="phone">Telefone</Label>
										<Input id="phone" placeholder="+5511999999999" {...form.register("phone")} />
										{form.formState.errors.phone && (
											<p className="text-sm text-destructive">
												{form.formState.errors.phone.message}
											</p>
										)}
									</div>
									<div className="space-y-2">
										<Label>Turno</Label>
										<Select
											value={form.watch("shift")}
											onValueChange={(v) => form.setValue("shift", v as any, { shouldDirty: true })}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="MANHA">Manhã</SelectItem>
												<SelectItem value="TARDE">Tarde</SelectItem>
												<SelectItem value="NOITE">Noite</SelectItem>
											</SelectContent>
										</Select>
										{form.formState.errors.shift && (
											<p className="text-sm text-destructive">
												{form.formState.errors.shift.message}
											</p>
										)}
									</div>
								</div>

								{/* Linha 3: Status e Senha (apenas no create) */}
								{activeTab === "create" && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Status</Label>
											<Select
												value={form.watch("status")}
												onValueChange={(v) =>
													form.setValue("status", v as any, { shouldDirty: true })
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="ATIVO">Ativo</SelectItem>
													<SelectItem value="INATIVO">Inativo</SelectItem>
													<SelectItem value="DE_FERIAS">De Férias</SelectItem>
												</SelectContent>
											</Select>
											{form.formState.errors.status && (
												<p className="text-sm text-destructive">
													{form.formState.errors.status.message}
												</p>
											)}
										</div>
										<div className="space-y-2">
											<Label htmlFor="passwordHash">Senha Inicial</Label>
											<div className="flex gap-2">
												<Input
													id="passwordHash"
													type="text"
													placeholder="Gerar ou digitar senha"
													{...form.register("passwordHash")}
												/>
												<Button type="button" variant="outline" onClick={randomPassword}>
													<RefreshCw className="w-4 h-4" />
												</Button>
												<Button
													type="button"
													variant="outline"
													onClick={async () => {
														try {
															await navigator.clipboard.writeText(
																form.getValues("passwordHash") || "",
															);
															toast.success("Senha copiada para a área de transferência");
														} catch {}
													}}
												>
													<Copy className="w-4 h-4" />
												</Button>
											</div>
											{form.formState.errors.passwordHash && (
												<p className="text-sm text-destructive">
													{form.formState.errors.passwordHash.message}
												</p>
											)}
										</div>
									</div>
								)}
								<div>
									<Button type="submit" className="w-full">
										{editingId ? "Salvar Alterações" : "Cadastrar"}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="contacts" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Phone className="w-5 h-5" />
								Cadastrar Contato Útil
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="contactName">Nome *</Label>
										<Input
											id="contactName"
											placeholder="Ex: Bombeiros"
											value={newContact.name}
											onChange={(e) =>
												setNewContact({ ...newContact, name: e.target.value })
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="contactPhone">Telefone *</Label>
										<MaskedInput
											id="contactPhone"
											mask="+55 99 99999-9999"
											maskChar={null}
											placeholder="+55 13 97408-0222"
											value={newContact.phone}
											onChange={(e) =>
												setNewContact({ ...newContact, phone: e.target.value })
											}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="contactObservation">Observação</Label>
									<Textarea
										id="contactObservation"
										placeholder="Ex: Emergência 24h"
										value={newContact.observation || ""}
										onChange={(e) =>
											setNewContact({ ...newContact, observation: e.target.value })
										}
										rows={3}
									/>
								</div>
								<Button onClick={handleCreateContact} className="w-full">
									<Plus className="w-4 h-4 mr-2" />
									Cadastrar Contato
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog open={isResetDialogOpen} onOpenChange={() => setIsResetDialogOpen(false)}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Redefinir Senha</DialogTitle>
						<DialogDescription>
							Enviaremos um e-mail para {selectedForReset?.email} com instruções de redefinição de
							senha (simulação).
						</DialogDescription>
					</DialogHeader>
					<div className="flex gap-4">
						<Button className="flex-1" onClick={confirmResetPassword}>
							Enviar E-mail
						</Button>
						<Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
							Cancelar
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir o porteiro <strong>{selectedForDelete?.name}</strong>?
							Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={isDeleteContactDialogOpen} onOpenChange={setIsDeleteContactDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir o contato útil <strong>{selectedContactForDelete?.name}</strong>?
							Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteContact}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
