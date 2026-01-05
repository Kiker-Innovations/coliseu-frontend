import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ConciergeSkeleton from "@/skeleton/admin/ConciergeSkeleton";
import { conciergeSchema, type ConciergeSchema } from "@/schemas/admin/concierge.schema";
import { getConcierge, updateConcierge } from "@/services/concierge.service";

export default function ConciergeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ConciergeSchema>({
    resolver: zodResolver(conciergeSchema),
    defaultValues: { name: "", email: "", phone: "", shift: "MANHA", status: "ATIVO" },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getConcierge(id as string);
        form.reset({ name: data.name, email: data.email, phone: data.phone, shift: data.shift, status: data.status });
      } catch (e: any) {
        toast.error(e?.message || "Erro ao carregar porteiro");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) load();
  }, [id, form]);

  const onSubmit = async (data: ConciergeSchema) => {
    try {
      await updateConcierge(id as string, {
        name: data.name,
        email: data.email,
        phone: data.phone!,
        shift: data.shift,
        status: data.status,
      });
      toast.success("Porteiro atualizado com sucesso!");
      navigate("/admin/concierge");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar porteiro");
    }
  };

  if (isLoading) return <ConciergeSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Editar Porteiro</h1>
          <p className="text-muted-foreground">Atualize os dados do porteiro</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/concierge")}>Voltar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Porteiro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Nome completo" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="+5511999999999" {...form.register("phone")} />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={form.watch("shift")} onValueChange={(v) => form.setValue("shift", v as any, { shouldDirty: true })}>
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
                  <p className="text-sm text-destructive">{form.formState.errors.shift.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as any, { shouldDirty: true })}>
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
                  <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                )}
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full">Salvar Alterações</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


