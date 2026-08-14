import { supabaseAdmin } from "./supabase-admin.js";

export type EmailEventType =
  | "APPLICATION_RECEIVED"
  | "SUPER_ADMIN_NOTIFICATION"
  | "APPLICATION_REJECTED"
  | "APPLICATION_RESUBMITTED"
  | "ACTIVATION_SENT";

type EmailEventInput = {
  applicationId: string;
  type: EmailEventType;
  recipientEmail: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
  status?: "PENDING" | "SENT";
};

export async function recordEmailEvent(input: EmailEventInput) {
  const { error } = await supabaseAdmin.from("email_events").insert({
    application_id: input.applicationId,
    type: input.type,
    recipient_email: input.recipientEmail,
    subject: input.subject,
    body: input.body,
    metadata: input.metadata ?? {},
    status: input.status ?? "PENDING",
    sent_at: input.status === "SENT" ? new Date().toISOString() : null,
  });

  return error;
}