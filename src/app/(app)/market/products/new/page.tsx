import { PageHeader } from "@/components/ui/page-header";
import { createProduct } from "@/lib/actions/market-actions";

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="Add Product" />
      <form action={createProduct} className="kf-card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Name</label>
            <input name="name" required className="kf-input" />
          </div>
          <div>
            <label className="kf-label">SKU</label>
            <input name="sku" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Category</label>
            <input name="category" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Retail Price (ETB)</label>
            <input type="number" step="0.01" name="price" required className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Wholesale Price (ETB)</label>
            <input type="number" step="0.01" name="wholesalePrice" className="kf-input" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
