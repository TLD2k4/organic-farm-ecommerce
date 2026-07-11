export default function MainLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8faf5] animate-pulse">
      {/* TOPBAR */}
      <div className="hidden sm:block bg-white border-b">
        <div className="container-main h-11.5 flex items-center gap-6">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-44 bg-gray-200 rounded" />
        </div>
      </div>

      {/* HEADER */}
      <div className="bg-white border-b">
        <div className="container-main h-19 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200" />

          <div className="flex-1">
            <div className="h-11 rounded-xl bg-gray-200" />
          </div>

          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* NAVBAR */}
      <div className="hidden md:block bg-white border-b">
        <div className="container-main h-12.5 flex items-center gap-8">
          <div className="h-10 w-55 rounded-lg bg-gray-200" />

          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
      </div>

      {/* CONTENT */}
      <main className="container-main py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-55 rounded-2xl bg-gray-200" />
          <div className="h-55 rounded-2xl bg-gray-200" />
          <div className="h-55 rounded-2xl bg-gray-200" />
        </div>

        <div className="mt-6 h-100 rounded-2xl bg-gray-200" />
      </main>

      {/* FOOTER */}
      <div className="border-t bg-white">
        <div className="container-main py-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="h-32 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
