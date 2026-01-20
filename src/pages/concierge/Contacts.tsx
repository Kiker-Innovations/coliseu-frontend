import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";
import {
	getUsefulContacts,
	type UsefulContact,
	ApiClientError,
} from "@/services/api";
import ContactsSkeleton from "@/skeleton/concierge/ContactsSkeleton";

export default function Contacts() {
	const [contacts, setContacts] = useState<UsefulContact[]>([]);
	const [isLoading, setIsLoading] = useState(true);

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

	// Função para formatar telefone para WhatsApp (5513974080222 - sem +)
	const formatPhoneForWhatsApp = (phone: string | undefined): string => {
		if (!phone || phone.trim() === "") return "";
		// Remove tudo exceto números
		const cleaned = phone.replace(/\D/g, "");
		// Se não começa com 55, adiciona
		if (cleaned.length > 0 && !cleaned.startsWith("55")) {
			return `55${cleaned}`;
		}
		return cleaned;
	};

	useEffect(() => {
		loadContacts();
	}, []);

	const loadContacts = async () => {
		try {
			setIsLoading(true);
			const response = await getUsefulContacts();
			if (response.success && response.data) {
				setContacts(response.data);
			}
		} catch (error) {
			if (error instanceof ApiClientError) {
				toast.error(error.response.message || "Erro ao carregar contatos");
			} else {
				toast.error("Erro ao carregar contatos");
			}
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return <ContactsSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Contatos Úteis</h1>
				<p className="text-muted-foreground mt-1">
					Visualize os contatos úteis cadastrados pelo administrador
				</p>
			</div>

			{contacts.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center">
						<Phone className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
						<p className="text-lg font-medium text-muted-foreground">
							Nenhum contato útil cadastrado
						</p>
						<p className="text-sm text-muted-foreground mt-2">
							Os contatos úteis serão exibidos aqui quando o administrador cadastrá-los
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-4">
					{contacts.map((contact) => (
						<Card key={contact._id} className="hover:shadow-lg transition-shadow">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="w-5 h-5 text-primary" />
									{contact.name}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<p className="text-sm text-muted-foreground mb-2">Telefone</p>
									<div className="flex items-center gap-2">
										<Phone className="w-5 h-5 text-primary" />
										<a
											href={`tel:${contact.phone.replace(/\D/g, "")}`}
											className="text-lg font-semibold text-primary hover:underline"
										>
											{formatPhoneForDisplay(contact.phone)}
										</a>
										<a
											href={`https://wa.me/${formatPhoneForWhatsApp(contact.phone)}`}
											target="_blank"
											rel="noopener noreferrer"
											className="ml-auto"
										>
											<Button variant="outline" size="sm">
												<MessageCircle className="w-4 h-4 mr-2" />
												WhatsApp
											</Button>
										</a>
									</div>
								</div>
								{contact.observation && (
									<div>
										<p className="text-sm text-muted-foreground">Observação</p>
										<p className="text-sm">{contact.observation}</p>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

