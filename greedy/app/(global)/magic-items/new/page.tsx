import Link from "next/link";
import { MagicItemForm } from "@/components/magic-items/MagicItemForm";
import { Button } from "@/components/ui/button";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

export default function NewMagicItemPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        sectionItems={[
          { label: "Magic Items", href: "/magic-items" },
          { label: "Create Magic Item" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Magic Item</h1>
      </div>

      <MagicItemForm mode="create" />
    </div>
  );
}
