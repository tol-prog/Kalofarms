"use server";

import { db, schema } from "@/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createContact(formData: FormData) {
  const session = await requireUser();
  const name = str(formData, "name") ?? "Unnamed Contact";
  const type = (str(formData, "type") as "customer" | "vendor" | "employee" | "other") ?? "customer";
  await db.insert(schema.contacts).values({
    name,
    type,
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    address: str(formData, "address"),
    notes: str(formData, "notes"),
  });
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "contact_created",
    description: `${session.displayName} added a ${type} contact: ${name}.`,
  });
  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function createProduct(formData: FormData) {
  const session = await requireUser();
  const name = str(formData, "name") ?? "Unnamed Product";
  await db.insert(schema.products).values({
    name,
    sku: str(formData, "sku"),
    category: str(formData, "category"),
    price: str(formData, "price") ?? "0",
    wholesalePrice: str(formData, "wholesalePrice"),
  });
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "product_created",
    description: `${session.displayName} added product: ${name}.`,
  });
  revalidatePath("/market/products");
  redirect("/market/products");
}

export async function createOrder(formData: FormData) {
  const session = await requireUser();
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

  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "order_created",
    description: `${session.displayName} created order ${order.orderNumber} (ETB ${total}).`,
  });

  revalidatePath("/market/orders");
  redirect("/market/orders");
}
