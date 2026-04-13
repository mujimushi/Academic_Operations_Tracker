export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <h1 className="text-2xl font-heading text-nust-blue mb-4">You&apos;re Offline</h1>
        <p className="text-gray-600">Connect to the internet to view tasks and updates.</p>
      </div>
    </div>
  );
}
