export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-4">
      <h2 className="text-lg font-heading">Task {id}</h2>
      <p className="text-gray-500 text-sm mt-2">Coming soon</p>
    </div>
  );
}
