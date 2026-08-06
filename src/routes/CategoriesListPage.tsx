import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoggedStamp } from "@/components/LoggedStamp";
import { CategoryForm } from "../features/categories/CategoryForm";
import {
  useCategories,
  useCreateCategory,
  useRenameCategory,
  useSetCategoryStatus,
} from "../features/categories/hooks";
import type { CategoryStatus } from "../types";

export function CategoriesListPage() {
  const { data: categories, isPending, isError, error } = useCategories();
  const createCategory = useCreateCategory();
  const renameCategory = useRenameCategory();
  const setCategoryStatus = useSetCategoryStatus();

  const [statusFilter, setStatusFilter] = useState<CategoryStatus>("active");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  if (isPending) {
    return <p className="text-muted-foreground">Loading your categories…</p>;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : "Couldn't load your categories. Try reloading the page."}
        </AlertDescription>
      </Alert>
    );
  }

  const filtered = categories.filter(
    (category) => category.status === statusFilter,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium">Categories</h1>
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as CategoryStatus)}
        >
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No {statusFilter} categories.</p>
      ) : (
        <Card className="gap-0 py-0">
          <CardContent className="divide-y divide-border px-0">
            {filtered.map((category) =>
              editingId === category.categoryId ? (
                <div key={category.categoryId} className="px-4 py-3">
                  <CategoryForm
                    initialValues={{ name: category.name }}
                    submitLabel="Save changes"
                    isSubmitting={renameCategory.isPending}
                    onSubmit={(input) => {
                      renameCategory.mutate(
                        { ...category, name: input.name },
                        { onSuccess: () => setEditingId(null) },
                      );
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div
                  key={category.categoryId}
                  className="flex min-h-11 flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="font-medium">{category.name}</span>
                  <div className="flex items-center gap-2">
                    {category.categoryId === justCreatedId && <LoggedStamp />}
                    {category.status === "archived" && (
                      <Badge variant="secondary">Archived</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(category.categoryId)}
                    >
                      Rename
                    </Button>
                    {category.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={setCategoryStatus.isPending}
                        onClick={() =>
                          setCategoryStatus.mutate({
                            category,
                            status: "archived",
                          })
                        }
                      >
                        Archive
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={setCategoryStatus.isPending}
                        onClick={() =>
                          setCategoryStatus.mutate({
                            category,
                            status: "active",
                          })
                        }
                      >
                        Unarchive
                      </Button>
                    )}
                  </div>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      )}

      {showAddForm ? (
        <Card>
          <CardContent>
            <CategoryForm
              submitLabel="Add category"
              isSubmitting={createCategory.isPending}
              onSubmit={(input) => {
                createCategory.mutate(input, {
                  onSuccess: (category) => {
                    setShowAddForm(false);
                    setJustCreatedId(category.categoryId);
                  },
                });
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setShowAddForm(true)}
        >
          Add category
        </Button>
      )}
    </div>
  );
}
