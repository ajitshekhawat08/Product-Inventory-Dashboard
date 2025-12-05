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