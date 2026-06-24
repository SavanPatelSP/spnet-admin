import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (token !== process.env.MIGRATION_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  try {
    const prismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma");
    const { stdout, stderr } = await execFileAsync(prismaBin, ["migrate", "deploy"], {
      env: { ...process.env, APP_ENV: "production" },
      timeout: 60_000,
    });

    return Response.json({
      success: true,
      output: stdout,
      errors: stderr || undefined,
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
      stderr: error.stderr || undefined,
      stdout: error.stdout || undefined,
    }, { status: 500 });
  }
}
