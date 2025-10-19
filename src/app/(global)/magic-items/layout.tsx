export default function MagicItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
      {children}
    </div>
  );
}