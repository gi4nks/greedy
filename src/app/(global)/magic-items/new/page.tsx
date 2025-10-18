import { MagicItemForm } from "@/components/magic-items/MagicItemForm";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

export default function NewMagicItemPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        sectionItems={[
          { label: "Magic Items", href: "/magic-items" },
          { label: "Create Magic Item" },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Magic Item</h1>
          <p className="text-base-content/70 mt-2">Add a new magic item to your collection</p>
        </div>
      </div>

      <MagicItemForm mode="create" />
    </div>
  );
}
