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