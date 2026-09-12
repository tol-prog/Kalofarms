"use server";

import { db, schema } from "@/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createContact(formData: FormData) {
  await requireUser();
  await db.insert(schema.contacts).values({
    name: str(formData, "name") ?? "Unnamed Contact",
    type: (str(formData, "type") as "customer" | "vendor" | "employee" | "other") ?? "customer",
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    address: str(formData, "address"),
    notes: str(formData, "notes"),
  });
  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function createProduct(formData: FormData) {
  await requireUser();
  await db.insert(schema.products).values({
    name: str(formData, "name") ?? "Unnamed Product",
    sku: str(formData, "sku"),
    category: str(formData, "category"),
    price: str(formData, "price") ?? "0",
    wholesalePrice: str(formData, "wholesalePrice"),
  });
  revalidatePath("/market/products");
  redirect("/market/products");
}

export async function createOrder(formData: FormData) {
  await requireUser();
  const productIds = formData.getAll("productId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];

  let total = 0;
  const items: { productId: string; quantity: number; unitPrice: string }[] = [];
  for (let i = 0; i < productIds.length; i++) {
    if (!productIds[i]) continue;
    const qty = Number(quantities[i] || 1);
    const price = unitPrices[i] || "0";
    total += qty * parseFloat(price);
    items.push({ productId: productIds[i], quantity: qty, unitPrice: price });
  }

  const [order] = await db
    .insert(schema.orders)
    .values({
      orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
      contactId: str(formData, "contactId"),
      date: str(formData, "date") ?? new Date().toISOString().slice(0, 10),
      status: (str(formData, "status") as "pending" | "confirmed" | "fulfilled" | "cancelled") ?? "pending",
      paymentMethod: str(formData, "paymentMethod"),
      total: String(total),
      notes: str(formData, "notes"),
    })
    .returning();

  for (const item of items) {
    await db.insert(schema.orderItems).values({ orderId: order.id, ...item });
  }

  revalidatePath("/market/orders");
  redirect("/market/orders");
}
