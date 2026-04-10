"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // New category form
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, description, sort_order, is_active")
      .order("sort_order");

    setCategories(data ?? []);
    setLoading(false);
  }

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();

    const slug = newSlug || generateSlug(newName);
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);

    const { error } = await supabase.from("categories").insert({
      name: newName,
      slug,
      description: newDescription || null,
      sort_order: maxOrder + 1,
      is_active: true,
    });

    if (error) {
      showMessage("Алдаа: " + error.message);
      return;
    }

    setNewName("");
    setNewSlug("");
    setNewDescription("");
    showMessage("Категори нэмэгдлээ");
    fetchCategories();
  }

  async function startEdit(cat: CategoryRow) {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDescription(cat.description ?? "");
  }

  async function saveEdit() {
    if (!editId) return;

    const { error } = await supabase
      .from("categories")
      .update({
        name: editName,
        slug: editSlug,
        description: editDescription || null,
      })
      .eq("id", editId);

    if (error) {
      showMessage("Алдаа: " + error.message);
      return;
    }

    setEditId(null);
    showMessage("Хадгалагдлаа");
    fetchCategories();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("categories").update({ is_active: !current }).eq("id", id);
    fetchCategories();
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      showMessage("Алдаа: " + error.message);
      return;
    }
    showMessage("Устгагдлаа");
    fetchCategories();
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-zinc-900">Категори</h2>

      {message && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            message.startsWith("Алдаа")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Category list */}
      {loading ? (
        <p className="text-zinc-500">Уншиж байна...</p>
      ) : (
        <div className="mb-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="pb-2 pr-4">Нэр</th>
                <th className="pb-2 pr-4">Slug</th>
                <th className="pb-2 pr-4">Тайлбар</th>
                <th className="pb-2 pr-4">Дараалал</th>
                <th className="pb-2 pr-4">Идэвхтэй</th>
                <th className="pb-2">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-zinc-50">
                  {editId === cat.id ? (
                    <>
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="py-2 pr-4 text-zinc-500">{cat.sort_order}</td>
                      <td className="py-2 pr-4" />
                      <td className="py-2 flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          Хадгалах
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-700"
                        >
                          Болих
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 pr-4 font-medium text-zinc-900">
                        {cat.name}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-zinc-500">
                        {cat.slug}
                      </td>
                      <td className="py-2 pr-4 text-zinc-600">
                        {cat.description ?? "-"}
                      </td>
                      <td className="py-2 pr-4 text-zinc-500">{cat.sort_order}</td>
                      <td className="py-2 pr-4">
                        <button
                          onClick={() => toggleActive(cat.id, cat.is_active)}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            cat.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {cat.is_active ? "Тийм" : "Үгүй"}
                        </button>
                      </td>
                      <td className="py-2 flex gap-2">
                        <button
                          onClick={() => startEdit(cat)}
                          className="text-xs text-zinc-600 hover:text-zinc-900"
                        >
                          Засах
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Устгах
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add new category */}
      <form
        onSubmit={addCategory}
        className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
      >
        <h3 className="mb-3 text-sm font-medium text-zinc-700">
          Шинэ категори нэмэх
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            type="text"
            required
            placeholder="Нэр"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setNewSlug(generateSlug(e.target.value));
            }}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Slug (автомат)"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Тайлбар"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Нэмэх
        </button>
      </form>
    </div>
  );
}
