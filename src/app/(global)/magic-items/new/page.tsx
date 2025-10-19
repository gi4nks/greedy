import { MagicItemForm } from "@/components/magic-items/MagicItemForm";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Sparkles } from "lucide-react";

export default function NewMagicItemPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        items={[
          { label: "Magic Items", href: "/magic-items" },
          { label: "Create Magic Item" },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">New Magic Item</h1>
            <p className="text-base-content/70 mt-2">Add to your collection</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <MagicItemForm mode="create" />
      </div>
    </div>
  );
}
