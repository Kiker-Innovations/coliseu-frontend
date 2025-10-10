import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([
    { id: 1, title: "Reforma da Piscina", description: "Melhorar a área de lazer" },
    { id: 2, title: "Nova Churrasqueira", description: "Expandir área gourmet" },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const canCreateMore = suggestions.length < 5;

  const handleCreate = () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const newSuggestion = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
    };

    setSuggestions([...suggestions, newSuggestion]);
    setTitle("");
    setDescription("");
    setIsCreating(false);
    toast.success("Sugestão criada com sucesso!");
  };

  const handleEdit = (id: number) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (suggestion) {
      setTitle(suggestion.title);
      setDescription(suggestion.description);
      setEditingId(id);
    }
  };

  const handleUpdate = () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSuggestions(
      suggestions.map((s) =>
        s.id === editingId ? { ...s, title: title.trim(), description: description.trim() } : s
      )
    );
    setTitle("");
    setDescription("");
    setEditingId(null);
    toast.success("Sugestão atualizada com sucesso!");
  };

  const handleDelete = (id: number) => {
    setSuggestions(suggestions.filter((s) => s.id !== id));
    toast.success("Sugestão excluída com sucesso!");
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
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
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reforma da Piscina"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva sua sugestão em detalhes..."
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground text-right">
                {description.length}/500
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingId ? handleUpdate : handleCreate} className="flex-1">
                {editingId ? "Atualizar" : "Criar"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
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
              <p className="text-sm mt-2">Clique em "Nova Sugestão" para começar!</p>
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
                <p className="text-muted-foreground">{suggestion.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
