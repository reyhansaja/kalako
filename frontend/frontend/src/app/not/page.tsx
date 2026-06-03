export default function NotPage() {
  return (
    <section className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-[120px] font-bold text-[#3B6C8D] leading-none">
          404
        </h1>

        <h2 className="mt-6 text-3xl font-semibold text-gray-800">
          Page Not Found
        </h2>

        <p className="mt-4 text-gray-600 leading-relaxed">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
      </div>
    </section>
  );
}
