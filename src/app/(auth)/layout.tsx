export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE] dark:bg-[#0F0F0F] p-4 md:p-8">
      {children}
    </div>
  );
}
