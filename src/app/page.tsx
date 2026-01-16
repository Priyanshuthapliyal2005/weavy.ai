import { SignedIn, SignedOut } from "@clerk/nextjs";
import { getOrCreateUser } from "@/lib/db/user";
import { prisma } from "@/lib/db/client";

async function getUserWorkflows() {
  const user = await getOrCreateUser();
  
  return prisma.workflow.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">weavy.ai</h1>
      <p className="mt-2 text-sm text-gray-600">
        Build and automate workflows with AI
      </p>

      <div className="mt-6">
        <SignedOut>
          <p className="text-sm">Sign in to continue.</p>
        </SignedOut>
        <SignedIn>
          <UserDashboard />
        </SignedIn>
      </div>
    </main>
  );
}

async function UserDashboard() {
  const workflows = await getUserWorkflows();
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Your Workflows</h2>
        {workflows.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No workflows yet. Create your first workflow to get started.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {workflows.map((workflow) => (
              <li key={workflow.id} className="rounded border p-3">
                <h3 className="font-medium">{workflow.name}</h3>
                {workflow.description && (
                  <p className="text-sm text-gray-600">{workflow.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
