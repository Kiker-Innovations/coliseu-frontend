import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  suggestionSchema,
  type SuggestionSchema,
} from "@/schemas/suggestions/suggestion.schema";

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      title: "Reforma da Piscina",
      description: "Melhorar a área de lazer",
    },
    {
      id: 2,
      title: "Nova Churrasqueira",
      description: "Expandir área gourmet",
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SuggestionSchema>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const description = watch("description");
  const canCreateMore = suggestions.length < 5;

  const onSubmit = (data: SuggestionSchema) => {
    if (editingId) {
      setSuggestions(
        suggestions.map((s) =>
          s.id === editingId
            ? { ...s, title: data.title, description: data.description }
            : s
        )
      );
      toast.success("Sugestão atualizada com sucesso!");
      setEditingId(null);
    } else {
      const newSuggestion = {
        id: Date.now(),
        title: data.title,
        description: data.description,
      };
      setSuggestions([...suggestions, newSuggestion]);
      toast.success("Sugestão criada com sucesso!");
      setIsCreating(false);
    }
    reset();
  };

  const handleEdit = (id: number) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (suggestion) {
      setValue("title", suggestion.title);
      setValue("description", suggestion.description);
      setEditingId(id);
    }
  };

  const handleDelete = (id: number) => {
    setSuggestions(suggestions.filter((s) => s.id !== id));
    toast.success("Sugestão excluída com sucesso!");
  };

  const handleCancel = () => {
    reset();
    setIsCreating(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Minhas Sugestões</h1>
          <p className="text-muted-foreground mt-1">
            Você pode criar até 5 sugestões ({suggestions.length}/5)
          </p>
        </div>
        {canCreateMore && !isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Sugestão
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              {editingId ? "Editar Sugestão" : "Nova Sugestão"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Ex: Reforma da Piscina"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Descreva sua sugestão em detalhes..."
                  rows={4}
                  maxLength={500}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground text-right">
                  {description?.length || 0}/500
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      <div className="grid gap-4">
        {suggestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não criou nenhuma sugestão.</p>
              <p className="text-sm mt-2">
                Clique em "Nova Sugestão" para começar!
              </p>
            </CardContent>
          </Card>
        ) : (
          suggestions.map((suggestion) => (
            <Card key={suggestion.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{suggestion.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(suggestion.id)}
                      disabled={editingId !== null || isCreating}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(suggestion.id)}
                      disabled={editingId !== null || isCreating}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {suggestion.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
