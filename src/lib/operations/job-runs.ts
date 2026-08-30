import { createAdminClient } from "@/lib/supabase/admin";

export type SystemJobName = "publish" | "integrations" | "maintenance";
export type SystemJobStatus = "succeeded" | "failed" | "partial";

export async function recordSystemJob(input: {
  jobName: SystemJobName;
  status: SystemJobStatus;
  startedAt: Date;
  summary?: Record<string, unknown>;
  errorMessage?: string;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from("system_job_runs").insert({
      job_name: input.jobName,
      status: input.status,
      summary: input.summary ?? {},
      error_message: input.errorMessage?.slice(0, 1000) ?? null,
      started_at: input.startedAt.toISOString(),
      finished_at: new Date().toISOString(),
    });
  } catch {
    // Job telemetry must never turn a successful job into a failed job.
  }
}
