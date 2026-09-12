/**
 * Seeds the database with Kalo Farms' real starting data, based on the
 * farm's existing Farmbrite account (users, accounting categories,
 * inventory items, livestock records, and one feed recipe).
 *
 * Usage: DATABASE_URL=... SESSION_SECRET=... npx tsx scripts/seed.ts
 */
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("Seeding Kalo Farm System...");

  // --- Farm settings -----------------------------------------------
  const existingFarm = await db.select().from(schema.farmSettings).limit(1);
  if (existingFarm.length === 0) {
    await db.insert(schema.farmSettings).values({
      farmName: "Kalo Farm PLC",
      location: "Holeta, Oromia, Ethiopia",
      latitude: 9.0667,
      longitude: 38.4833,
      currencyCode: "ETB",
      currencySymbol: "ETB ",
      establishedDate: new Date("2024-01-01"),
    });
    console.log("  Farm settings created.");
  }

  // --- Users ---------------------------------------------------------
  // NOTE: temporary passwords below — every user should change theirs on
  // first login. Share these out of band, not in this file long-term.
  const users: {
    displayName: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "operations_manager" | "staff";
    disabled?: boolean;
    tempPassword: string;
  }[] = [
    {
      displayName: "Kalo",
      firstName: "Kalo",
      lastName: "Farms",
      email: "kalofarms.et@gmail.com",
      role: "admin",
      tempPassword: "ChangeMe123!",
    },
    {
      displayName: "Aseffa Farm Manager",
      firstName: "Aseffa",
      lastName: "Gonfa",
      email: "assefagonfa201@gmail.com",
      role: "operations_manager",
      tempPassword: "ChangeMe123!",
    },
    {
      displayName: "Manager",
      firstName: "Manager",
      lastName: "",
      email: "manager.kalofarms@gmail.com",
      role: "operations_manager",
      disabled: true,
      tempPassword: "ChangeMe123!",
    },
    {
      displayName: "Misge",
      firstName: "Misge",
      lastName: "",
      email: "misganadegefa@gmail.com",
      role: "admin",
      tempPassword: "ChangeMe123!",
    },
    {
      displayName: "Negasa",
      firstName: "Negasa",
      lastName: "",
      email: "negasadib@gmail.com",
      role: "admin",
      tempPassword: "ChangeMe123!",
    },
  ];

  for (const u of users) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, u.email));
    if (existing.length > 0) continue;
    const passwordHash = await hashPassword(u.tempPassword);
    await db.insert(schema.users).values({
      displayName: u.displayName,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      passwordHash,
      role: u.role,
      disabled: u.disabled ?? false,
    });
    console.log(`  User created: ${u.email} (temp password: ${u.tempPassword})`);
  }

  // --- Accounting categories ------------------------------------------
  const categories: { name: string; type: "income" | "expense"; description?: string }[] = [
    { name: "Animal feed", type: "expense" },
    { name: "Capital injection", type: "income", description: "Additional capital injection from share holders" },
    { name: "Capital investment", type: "expense", description: "Expense used for capital investments on the farm" },
    { name: "Capital investment: Loan (borrowings)", type: "income" },
    { name: "Daily labour", type: "expense", description: "Daily labour expense for several tasks on the farm" },
    { name: "Egg sales", type: "income", description: "Sale of eggs produced on the farm" },
    { name: "Fattening feed sales", type: "income" },
    { name: "Labor loading unloading", type: "expense", description: "Expense paid for labor for loading and unloading" },
    { name: "Layers chicken feed sales", type: "income" },
    { name: "Loan (borrowings): Payable", type: "income" },
    { name: "Milk sales", type: "income" },
    { name: "Milking cow feed sales", type: "income" },
    { name: "Other", type: "income" },
    { name: "Others", type: "expense" },
    { name: "Payable", type: "income" },
    { name: "Receivable", type: "income" },
    { name: "Salary", type: "expense", description: "Monthly Salary" },
    { name: "Sale of layer chicken", type: "income", description: "Sale of Layer chicken that used to be under production" },
    { name: "Sheep sales", type: "income" },
    { name: "Utility", type: "expense" },
  ];

  const categoryIds: Record<string, string> = {};
  for (const c of categories) {
    const existing = await db.select().from(schema.accountingCategories).where(eq(schema.accountingCategories.name, c.name));
    if (existing.length > 0) {
      categoryIds[c.name] = existing[0].id;
      continue;
    }
    const [row] = await db.insert(schema.accountingCategories).values(c).returning();
    categoryIds[c.name] = row.id;
  }
  console.log(`  ${categories.length} accounting categories ensured.`);

  // --- Warehouses -----------------------------------------------------
  const existingWarehouses = await db.select().from(schema.warehouses);
  let feedMillId = existingWarehouses.find((w) => w.name === "Feed Mill")?.id;
  if (!feedMillId) {
    const [row] = await db.insert(schema.warehouses).values({ name: "Feed Mill", location: "Holeta" }).returning();
    feedMillId = row.id;
  }

  // --- Inventory items --------------------------------------------------
  const inventoryItems: {
    name: string;
    variety?: string;
    category?: string;
    unit: string;
    quantityAvailable: string;
    estValuePerUnit?: string;
    reorderThreshold?: string;
  }[] = [
    { name: "Akuri Atar", unit: "kilograms", quantityAvailable: "570", estValuePerUnit: "120", reorderThreshold: "200" },
    { name: "Beer - Residue by product", unit: "kilograms", quantityAvailable: "2400" },
    { name: "Broiler Chicken Feed", category: "Animal Feed and Hay", unit: "kilograms", quantityAvailable: "400", reorderThreshold: "500" },
    { name: "Calf Concentrate", unit: "kilograms", quantityAvailable: "0" },
    { name: "Dam ina Atint", unit: "kilograms", quantityAvailable: "1422", estValuePerUnit: "65" },
    { name: "Eggs", unit: "kilograms", quantityAvailable: "0" },
    { name: "Fattening Cow Concentrate", unit: "kilograms", quantityAvailable: "0" },
    { name: "Frushka", unit: "kilograms", quantityAvailable: "470", estValuePerUnit: "29", reorderThreshold: "500" },
    { name: "Hay", unit: "bales", quantityAvailable: "0" },
    { name: "Layer Chicken Feed", variety: "In house Mix", unit: "kilograms", quantityAvailable: "0", reorderThreshold: "1000" },
    { name: "Maize", variety: "Ethiopian Maize", unit: "kilograms", quantityAvailable: "2351", estValuePerUnit: "30" },
    { name: "Milking Cow Feed Concentrate", unit: "kilograms", quantityAvailable: "150" },
    { name: "Nora - CaCo3", unit: "kilograms", quantityAvailable: "1648" },
    { name: "Nug Fagulo", variety: "Nug biproduct", unit: "kilograms", quantityAvailable: "128", estValuePerUnit: "45", reorderThreshold: "200" },
    { name: "Premix - Laysen", variety: "Laysen", unit: "kilograms", quantityAvailable: "15.8", reorderThreshold: "20" },
    { name: "Premix - Mitihon", variety: "Matihon", unit: "kilograms", quantityAvailable: "39.78", reorderThreshold: "50" },
    { name: "Premix - Normal", variety: "Normal", unit: "kilograms", quantityAvailable: "25", reorderThreshold: "30" },
    { name: "Pullet Premix", unit: "kilograms", quantityAvailable: "48.5", estValuePerUnit: "524" },
    { name: "Rice Bran", unit: "kilograms", quantityAvailable: "1873", estValuePerUnit: "2000" },
    { name: "Salt", unit: "kilograms", quantityAvailable: "90.5" },
    { name: "Shiro Geleba", category: "Animal Feed and Hay", unit: "kilograms", quantityAvailable: "1972", estValuePerUnit: "3000" },
    { name: "Small Chicks Premix", unit: "kilograms", quantityAvailable: "5.1" },
    { name: "Starter Chicken Feed", unit: "kilograms", quantityAvailable: "0", reorderThreshold: "300" },
    { name: "Wheat Hay", unit: "kilograms", quantityAvailable: "350" },
  ];

  const itemIds: Record<string, string> = {};
  for (const item of inventoryItems) {
    const existing = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.name, item.name));
    if (existing.length > 0) {
      itemIds[item.name] = existing[0].id;
      continue;
    }
    const [row] = await db
      .insert(schema.inventoryItems)
      .values({ ...item, warehouseId: feedMillId })
      .returning();
    itemIds[item.name] = row.id;
  }
  console.log(`  ${inventoryItems.length} inventory items ensured.`);

  // --- Broiler Chicken Feed recipe ---------------------------------------
  const existingRecipes = await db.select().from(schema.inventoryRecipes);
  if (existingRecipes.length === 0 && itemIds["Broiler Chicken Feed"]) {
    const [recipe] = await db
      .insert(schema.inventoryRecipes)
      .values({
        name: "Broiler Chicken 1",
        producesItemId: itemIds["Broiler Chicken Feed"],
        recipeMakesAmount: "300",
        recipeMakesUnit: "kilograms",
      })
      .returning();

    const recipeIngredients: { name: string; amount: string }[] = [
      { name: "Maize", amount: "120" },
      { name: "Rice Bran", amount: "60" },
      { name: "Nug Fagulo", amount: "30" },
      { name: "Premix - Normal", amount: "5" },
      { name: "Salt", amount: "2" },
    ];
    for (const ing of recipeIngredients) {
      if (!itemIds[ing.name]) continue;
      await db.insert(schema.inventoryRecipeIngredients).values({
        recipeId: recipe.id,
        ingredientItemId: itemIds[ing.name],
        amount: ing.amount,
        unit: "kilograms",
      });
    }
    console.log("  Broiler Chicken 1 recipe created.");
  }

  // --- Livestock --------------------------------------------------------
  const existingLivestock = await db.select().from(schema.livestock);
  if (existingLivestock.length === 0) {
    const records: (typeof schema.livestock.$inferInsert)[] = [
      { nameOrLabel: "CALF001", internalId: "CALF001", animalType: "Cattle", breed: "Holstein", gender: "Female", numberInSet: 1, status: "active" },
      { nameOrLabel: "CW001", internalId: "CW001", animalType: "Cattle", breed: "Holstein", gender: "Female", numberInSet: 1, status: "active" },
      { nameOrLabel: "CW002", internalId: "CW002", animalType: "Cattle", breed: "Holstein", gender: "Female", numberInSet: 1, status: "active" },
      { nameOrLabel: "CW003", internalId: "CW003", animalType: "Cattle", breed: "Holstein", gender: "Female", numberInSet: 1, status: "active" },
      {
        nameOrLabel: "Layer Chicken",
        internalId: "L001",
        animalType: "Chicken",
        breed: "Bovans Brown",
        numberInSet: 6026,
        status: "active",
        birthDate: "2024-11-13",
      },
      {
        nameOrLabel: "Layer Chickens",
        internalId: "L001",
        animalType: "Chicken",
        gender: "Female",
        numberInSet: 1,
        status: "active",
      },
      {
        nameOrLabel: "Second Batch Bovans Browns Chickens",
        internalId: "L002",
        animalType: "Chicken",
        breed: "Bovans Browns",
        numberInSet: 2515,
        status: "active",
      },
      {
        nameOrLabel: "Trust Bovans Browns",
        animalType: "Chicken",
        breed: "Bovans Brown",
        numberInSet: 6000,
        status: "active",
      },
    ];
    for (const r of records) {
      await db.insert(schema.livestock).values(r);
    }
    console.log(`  ${records.length} livestock records created.`);

    // Livestock groups mirroring the farm's real groupings.
    const layerChicken = await db.select().from(schema.livestock).where(eq(schema.livestock.nameOrLabel, "Layer Chicken"));
    const secondBatch = await db.select().from(schema.livestock).where(eq(schema.livestock.nameOrLabel, "Second Batch Bovans Browns Chickens"));
    const trust = await db.select().from(schema.livestock).where(eq(schema.livestock.nameOrLabel, "Trust Bovans Browns"));

    const groupDefs: { name: string; memberLivestock: typeof layerChicken }[] = [
      { name: "Layer Chicken Bovans Brown", memberLivestock: layerChicken },
      { name: "Second Batch Bovans Browns Chickens Bovans Brown", memberLivestock: secondBatch },
      { name: "Trust Bovans Browns Bovans Brown", memberLivestock: trust },
    ];
    for (const g of groupDefs) {
      if (g.memberLivestock.length === 0) continue;
      const [group] = await db.insert(schema.livestockGroups).values({ name: g.name, type: "set" }).returning();
      await db.insert(schema.livestockGroupMembers).values({ groupId: group.id, livestockId: g.memberLivestock[0].id });
    }
    console.log("  Livestock groups created.");
  }

  console.log("Seed complete.");
  process.exit(0);
}


main().catch((err) => {
  console.error(err);
  process.exit(1);
});
