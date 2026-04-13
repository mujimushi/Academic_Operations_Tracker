export default function AuthError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <h1 className="text-2xl font-heading text-nust-blue mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          Your account is not registered in the system. Please contact your
          System Administrator.
        </p>
      </div>
    </div>
  );
}
