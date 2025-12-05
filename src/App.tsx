import React, { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category: string;
};

type FormState = {
  name: string;
  sku: string;
  price: string; // keep as string for input
  quantity: string;
  category: string;
};

const LOCAL_KEY = "products_v1";
const CATEGORIES = ["All", "electronics", "furniture", "stationery", "Clothing", "Home", "Books", "Accessories"];
const STATUS_OPTIONS = ["All", "In Stock", "Low Stock", "Out of Stock"];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function getStatus(quantity: number) {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= 10) return "Low Stock";
  return "In Stock";
}

export default function App(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", sku: "", price: "", quantity: "", category: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Product[];
        setProducts(parsed);
      } catch (e) {
        console.error("Failed to parse products from localStorage", e);
      }
    } else {
      // seed with some demo products
      const demo: Product[] = [
        { id: "p1", name: "Wireless Keyboard", sku: "KB-001", price: 79.99, quantity: 45, category: "electronics" },
        { id: "p2", name: "USB-C Hub", sku: "HUB-012", price: 49.99, quantity: 8, category: "electronics" },
        { id: "p3", name: "Ergonomic Mouse", sku: "MS-003", price: 59.99, quantity: 0, category: "electronics" },
        { id: "p4", name: "Desk Lamp", sku: "LMP-007", price: 34.99, quantity: 22, category: "furniture" },
        { id: "p5", name: "Monitor Stand", sku: "STD-009", price: 44.99, quantity: 3, category: "furniture" },
        { id: "p6", name: "Notebook Pack", sku: "NB-050", price: 12.99, quantity: 150, category: "stationery" },
      ];
      setProducts(demo);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(demo));
    }
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(products));
  }, [products]);

  const skuExists = (sku: string, exceptId?: string | null) => {
    return products.some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== exceptId);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", sku: "", price: "", quantity: "", category: "" });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, sku: p.sku, price: String(p.price), quantity: String(p.quantity), category: p.category });
    setErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (!form.price.trim()) e.price = "Price is required";
    else if (Number(form.price) <= 0 || isNaN(Number(form.price))) e.price = "Price must be a number > 0";
    if (!form.quantity.trim()) e.quantity = "Quantity is required";
    else if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) e.quantity = "Quantity must be an integer >= 0";
    if (!form.category.trim()) e.category = "Category is required";
    if (form.sku && skuExists(form.sku, editingId)) e.sku = "SKU must be unique";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload: Product = {
      id: editingId ?? uid(),
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(parseFloat(form.price).toFixed(2)),
      quantity: Number(form.quantity),
      category: form.category,
    };
    setProducts((prev) => {
      if (editingId) {
        return prev.map((p) => (p.id === editingId ? payload : p));
      }
      return [payload, ...prev];
    });
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        // search by name or sku
        const q = search.trim().toLowerCase();
        if (q) {
          const ok = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
          if (!ok) return false;
        }
        if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
        if (statusFilter !== "All") {
          const st = getStatus(p.quantity);
          if (st !== statusFilter) return false;
        }
        return true;
      })
      .sort((a, b) => b.name.localeCompare(a.name));
  }, [products, search, categoryFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Product Inventory Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Product</button>
          </div>
        </header>

        <section className="bg-white p-4 rounded shadow mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="flex-1 p-2 border rounded mr-0 md:mr-2"
            />

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-2 border rounded">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded ml-0 md:ml-2">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <article key={p.id} className="bg-white rounded shadow p-4 relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-medium">{p.name}</h2>
                    <p className="text-sm text-gray-500">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">₹{p.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Qty: {p.quantity}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm px-2 py-1 rounded-full border text-xs">{p.category}</span>

                  <div className="flex items-center gap-2">
                    <StatusBadge quantity={p.quantity} />
                    <button
                      onClick={() => openEdit(p)}
                      className="text-blue-600 text-sm px-2 py-1 border rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 text-sm px-2 py-1 border rounded hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center text-gray-500 mt-8">No products match the filters.</div>
          )}
        </section>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowModal(false)} />
            <div className="bg-white rounded shadow-lg w-full max-w-lg z-10 p-6">
              <h3 className="text-lg font-semibold mb-4">{editingId ? "Edit Product" : "Add Product"}</h3>

              <div className="grid grid-cols-1 gap-3">
                <label className="flex flex-col">
                  <span className="text-sm text-gray-700">Name</span>
                  <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="p-2 border rounded" />
                  {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-700">SKU</span>
                  <input value={form.sku} onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))} className="p-2 border rounded" />
                  {errors.sku && <span className="text-red-500 text-sm">{errors.sku}</span>}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-700">Price</span>
                    <input value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} className="p-2 border rounded" type="number" step="0.01" min="0" />
                    {errors.price && <span className="text-red-500 text-sm">{errors.price}</span>}
                  </label>

                  <label className="flex flex-col">
                    <span className="text-sm text-gray-700">Quantity</span>
                    <input value={form.quantity} onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))} className="p-2 border rounded" type="number" step="1" min="0" />
                    {errors.quantity && <span className="text-red-500 text-sm">{errors.quantity}</span>}
                  </label>
                </div>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-700">Category</span>
                  <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} className="p-2 border rounded">
                    <option value="">Select category</option>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.category && <span className="text-red-500 text-sm">{errors.category}</span>}
                </label>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ quantity }: { quantity: number }) {
  const status = getStatus(quantity);
  const base = "px-2 py-1 rounded text-xs font-medium";
  if (status === "Out of Stock") return <span className={`${base} bg-red-100 text-red-800 border border-red-200`}>Out of Stock</span>;
  if (status === "Low Stock") return <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-200`}>Low Stock</span>;
  return <span className={`${base} bg-green-100 text-green-800 border border-green-200`}>In Stock</span>;
}
