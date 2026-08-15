import { createHash, randomBytes } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  z,
} from "zod";
import { recordEmailEvent } from "../lib/email-events.js";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { logger } from "../lib/logger.js";

const levels = z.array(z.enum(["PRIMARY", "SECONDARY", "PRIMARY_SECONDARY"])).min(1);
const email = z.string().trim().email().max(320);
const requiredText = (minimum = 2) => z.string().trim().min(minimum).max(500);
const CreateEstablishmentApplicationBody = z.object({
  officialName: requiredText(),
  establishmentType: requiredText(),
  levels,
  address: requiredText(3),
  city: requiredText(),
  province: requiredText(),
  phone: requiredText(7),
  officialEmail: email,
  schoolYear: requiredText(4),
  principalFirstName: requiredText(),
  principalLastName: requiredText(),
  principalEmail: email,
  principalPassword: z.string().trim().min(8).max(128),
  principalPhone: requiredText(7),
  principalFunction: requiredText(),
});
const ListEstablishmentApplicationsQueryParams = z.object({
  status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
});
const RejectEstablishmentApplicationBody = z.object({
  reason: requiredText(5),
});

type ApplicationRow = {
  id: string;
  reference: string;
  status: string;
  principal_first_name: string;
  principal_last_name: string;
  principal_email: string;
  principal_phone: string;
  principal_function: string;
  rejection_reason: string | null;
  responsible_account_status: string;
  responsible_user_id: string | null;
  activation_expires_at: string | null;
  created_at: string;
  updated_at: string;
  establishments:
    | {
        id: string;
        code: string;
        official_name: string;
        establishment_type: string;
        levels: string[];
        address: string;
        city: string;
        province: string;
        phone: string;
        official_email: string;
        school_year: string;
      }
    | null;
  application_history?: Array<{
    action: string;
    old_status: string | null;
    new_status: string | null;
    created_at: string;
  }>;
};

const router: IRouter = Router();

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createReference() {
  return `EDU-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function createEditToken() {
  return randomBytes(32).toString("base64url");
}

function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getBearerToken(req: Request) {
  const value = req.header("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7) : null;
}

function getPublicAppUrl(req: Request) {
  const configuredUrl = process.env.PUBLIC_APP_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");

  const forwardedHost = req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req.header("host")?.trim();
  if (!host) return null;

  const forwardedProtocol = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    forwardedProtocol ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

async function requireSuperAdmin(req: Request, res: Response) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ message: "Authentification requise." });
    return null;
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    res.status(401).json({ message: "Session invalide ou expirée." });
    return null;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "SUPER_ADMIN" ||
    profile.is_active !== true
  ) {
    res.status(403).json({ message: "Accès Super Admin requis." });
    return null;
  }

  return userData.user.id;
}

async function getApplication(id: string) {
  const { data, error } = await supabaseAdmin
    .from("establishment_applications")
    .select(
        "id, reference, status, principal_first_name, principal_last_name, principal_email, principal_phone, principal_function, rejection_reason, responsible_account_status, responsible_user_id, activation_expires_at, created_at, updated_at, establishments(id, code, official_name, establishment_type, levels, address, city, province, phone, official_email, school_year), application_history(action, old_status, new_status, created_at)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as ApplicationRow | null;
}

function toApplicationResponse(row: ApplicationRow, includeHistory = true) {
  const establishment = row.establishments;
  return {
    id: row.id,
    reference: row.reference,
    establishmentCode: establishment?.code ?? "",
    officialName: establishment?.official_name ?? "",
    establishmentType: establishment?.establishment_type ?? "",
    levels: establishment?.levels ?? [],
    address: establishment?.address ?? "",
    city: establishment?.city ?? "",
    province: establishment?.province ?? "",
    phone: establishment?.phone ?? "",
    officialEmail: establishment?.official_email ?? "",
    schoolYear: establishment?.school_year ?? "",
    principalFirstName: row.principal_first_name,
    principalLastName: row.principal_last_name,
    principalEmail: row.principal_email,
    principalPhone: row.principal_phone,
    principalFunction: row.principal_function,
    status: row.status,
    rejectionReason: row.rejection_reason,
    responsibleAccountStatus: row.responsible_account_status,
    activationExpiresAt: row.activation_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: includeHistory ? (row.application_history ?? []).map((entry) => ({
      action: entry.action,
      oldStatus: entry.old_status,
      newStatus: entry.new_status,
      createdAt: entry.created_at,
    })) : [],
  };
}

async function notifySuperAdmins(
  applicationId: string,
  title: string,
  body: string,
) {
  try {
    const { data: admins, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "SUPER_ADMIN")
      .eq("is_active", true);
    if (error || !admins?.length) return;

    await supabaseAdmin.from("notifications").insert(
      admins.map((admin) => ({
        recipient_profile_id: admin.id,
        application_id: applicationId,
        type: "ESTABLISHMENT_APPLICATION",
        title,
        body,
      })),
    );

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const users = (authUsers?.users ?? []) as Array<{
      id: string;
      email?: string | null;
    }>;
    const emailByUserId = new Map(
      users
        .filter((user) => user.email)
        .map((user) => [user.id, user.email as string]),
    );

    await Promise.all(
      admins.flatMap((admin) => {
        const recipientEmail = emailByUserId.get(admin.id);
        if (!recipientEmail) return [];
        return [
          recordEmailEvent({
            applicationId,
            type: "SUPER_ADMIN_NOTIFICATION",
            recipientEmail,
            subject: title,
            body,
          }),
        ];
      }),
    );
  } catch (err) {
    logger.warn({ err }, "Unable to notify super admins");
  }
}

router.post(["/establishment-applications", "/"], async (req, res) => {
  const parsed = CreateEstablishmentApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Vérifiez les informations saisies." });
    return;
  }

  const input = parsed.data;
  try {
    const { data: duplicatePrincipal } = await supabaseAdmin
      .from("establishment_applications")
      .select("id")
      .eq("principal_email", input.principalEmail)
      .in("status", ["PENDING_REVIEW", "APPROVED"])
      .maybeSingle();

    const { data: duplicateOfficialEmail } = await supabaseAdmin
      .from("establishments")
      .select("id")
      .ilike("official_email", input.officialEmail)
      .in("status", ["PENDING_REVIEW", "APPROVED"])
      .maybeSingle();

    if (duplicatePrincipal || duplicateOfficialEmail) {
      res.status(409).json({
        message:
          "Une demande ou un établissement existe déjà pour cette adresse email.",
      });
      return;
    }

    let code = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `EDU-${randomBytes(3).toString("hex").toUpperCase()}`;
      const { data: existing } = await supabaseAdmin
        .from("establishments")
        .select("id")
        .eq("code", candidate)
        .maybeSingle();
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error("Impossible de générer le code établissement.");

    const { data: establishment, error: establishmentError } =
      await supabaseAdmin
        .from("establishments")
        .insert({
          code,
          official_name: input.officialName,
          establishment_type: input.establishmentType,
          levels: input.levels,
          address: input.address,
          city: input.city,
          province: input.province,
          phone: input.phone,
          official_email: input.officialEmail,
          school_year: input.schoolYear,
        })
        .select("id")
        .single();

    if (establishmentError || !establishment) {
      throw establishmentError ?? new Error("Création établissement impossible.");
    }

    const editToken = createEditToken();
    const reference = createReference();
    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email: input.principalEmail,
        password: input.principalPassword,
        email_confirm: true,
        user_metadata: {
          first_name: input.principalFirstName,
          last_name: input.principalLastName,
          phone: input.principalPhone,
          establishment_id: establishment.id,
          role: "DIRECTOR",
        },
      });

    if (createUserError || !createdUser?.user) {
      await supabaseAdmin.from("establishments").delete().eq("id", establishment.id);
      throw createUserError ?? new Error("Création du compte responsable impossible.");
    }

    try {
      const { error: profileSetupError } = await supabaseAdmin
        .from("profiles")
        .update({
          establishment_id: establishment.id,
          role: "DIRECTOR",
          first_name: input.principalFirstName,
          last_name: input.principalLastName,
          phone: input.principalPhone,
          must_change_password: false,
          is_active: false,
        })
        .eq("id", createdUser.user.id);

      if (profileSetupError) {
        req.log.warn({ err: profileSetupError }, "Profile trigger warning during registration, handled by handle_new_user_profile trigger");
      }
    } catch (profileSetupErr) {
      req.log.warn({ err: profileSetupErr }, "Profile setup exception during registration, handled by database defaults");
    }

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("establishment_applications")
        .insert({
          establishment_id: establishment.id,
          reference,
          principal_first_name: input.principalFirstName,
          principal_last_name: input.principalLastName,
          principal_email: input.principalEmail,
          principal_phone: input.principalPhone,
          principal_function: input.principalFunction,
          responsible_user_id: createdUser.user.id,
          responsible_account_status: "PENDING_ACTIVATION",
          edit_token_hash: hashToken(editToken),
        })
        .select("id, reference, status")
        .single();

    if (applicationError || !application) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id).catch(() => undefined);
      await supabaseAdmin.from("establishments").delete().eq("id", establishment.id);
      throw applicationError ?? new Error("Création demande impossible.");
    }

    await supabaseAdmin.from("application_history").insert({
      application_id: application.id,
      action: "APPLICATION_SUBMITTED",
      new_status: "PENDING_REVIEW",
      metadata: { official_name: input.officialName },
    });
    await notifySuperAdmins(
      application.id,
      "Nouvelle demande d’établissement",
      `${input.officialName} attend une validation.`,
    );
    const confirmationEmailError = await recordEmailEvent({
      applicationId: application.id,
      type: "APPLICATION_RECEIVED",
      recipientEmail: input.principalEmail,
      subject: "Votre demande d’inscription EducPAY a bien été reçue",
      body: [
        `Bonjour ${input.principalFirstName},`,
        "",
        `Votre demande pour ${input.officialName} a bien été enregistrée.`,
        "Elle est actuellement en attente de vérification par EducPAY.",
        `Référence : ${application.reference}`,
        "",
        "Aucun mot de passe n’est envoyé pendant cette étape.",
      ].join("\n"),
    });
    if (confirmationEmailError) {
      req.log.warn({ err: confirmationEmailError }, "Unable to record confirmation email event");
    }

    res.status(201).json({
      id: application.id,
      reference: application.reference,
      status: application.status,
      editToken,
      email: input.principalEmail,
    });
  } catch (error) {
    req.log.error({ err: error }, "Unable to create establishment application");
    res.status(500).json({ message: "La demande n’a pas pu être enregistrée." });
  }
});

router.get(["/establishment-applications", "/"], async (req, res) => {
  const actorId = await requireSuperAdmin(req, res);
  if (!actorId) return;

  const parsed = ListEstablishmentApplicationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Filtre de statut invalide." });
    return;
  }

  let query = supabaseAdmin
    .from("establishment_applications")
    .select(
        "id, reference, status, principal_first_name, principal_last_name, principal_email, principal_phone, principal_function, rejection_reason, responsible_account_status, responsible_user_id, activation_expires_at, created_at, updated_at, establishments(id, code, official_name, establishment_type, levels, address, city, province, phone, official_email, school_year), application_history(action, old_status, new_status, created_at)",
    )
    .order("created_at", { ascending: false });

  if (parsed.data.status) query = query.eq("status", parsed.data.status);
  const { data, error } = await query;
  if (error) {
    req.log.error({ err: error }, "Unable to list establishment applications");
    res.status(500).json({ message: "Impossible de charger les demandes." });
    return;
  }
  res.json((data as unknown as ApplicationRow[]).map((row) => toApplicationResponse(row)));
});

router.get(["/establishment-applications/:id", "/:id"], async (req, res) => {
  const application = await getApplication(getRouteParam(req.params.id));
  if (!application) {
    res.status(404).json({ message: "Demande introuvable." });
    return;
  }

  const adminToken = getBearerToken(req);
  let isAdmin = false;
  if (adminToken) {
    const { data: userData } = await supabaseAdmin.auth.getUser(adminToken);
    if (userData.user) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, is_active")
        .eq("id", userData.user.id)
        .maybeSingle();
      isAdmin = profile?.role === "SUPER_ADMIN" && profile.is_active === true;
    }
  }

  if (!isAdmin) {
    const token = String(req.query.token ?? "");
    const { data: secured } = await supabaseAdmin
      .from("establishment_applications")
      .select("edit_token_hash")
      .eq("id", getRouteParam(req.params.id))
      .maybeSingle();
    if (!token || !secured || hashToken(token) !== secured.edit_token_hash) {
      res.status(403).json({ message: "Lien de suivi invalide." });
      return;
    }
  }

  res.json(toApplicationResponse(application, isAdmin));
});

router.patch(["/establishment-applications/:id", "/:id"], async (req, res) => {
  const token = String(req.query.token ?? "");
  const parsed = CreateEstablishmentApplicationBody.safeParse(req.body);
  if (!token || !parsed.success) {
    res.status(400).json({ message: "Vérifiez les informations saisies." });
    return;
  }

  const { data: secured } = await supabaseAdmin
    .from("establishment_applications")
    .select("id, establishment_id, status, edit_token_hash")
    .eq("id", getRouteParam(req.params.id))
    .maybeSingle();
  if (!secured || hashToken(token) !== secured.edit_token_hash) {
    res.status(403).json({ message: "Lien de modification invalide." });
    return;
  }
  if (secured.status !== "REJECTED") {
    res.status(409).json({ message: "Cette demande ne peut plus être modifiée." });
    return;
  }

  const input = parsed.data;
  const { error: establishmentError } = await supabaseAdmin
    .from("establishments")
    .update({
      official_name: input.officialName,
      establishment_type: input.establishmentType,
      levels: input.levels,
      address: input.address,
      city: input.city,
      province: input.province,
      phone: input.phone,
      official_email: input.officialEmail,
      school_year: input.schoolYear,
    })
    .eq("id", secured.establishment_id);
  const { error: applicationError } = await supabaseAdmin
    .from("establishment_applications")
    .update({
      principal_first_name: input.principalFirstName,
      principal_last_name: input.principalLastName,
      principal_email: input.principalEmail,
      principal_phone: input.principalPhone,
      principal_function: input.principalFunction,
    })
    .eq("id", getRouteParam(req.params.id));

  if (establishmentError || applicationError) {
    res.status(500).json({ message: "La correction n’a pas pu être enregistrée." });
    return;
  }
  await supabaseAdmin.from("application_history").insert({
    application_id: getRouteParam(req.params.id),
    action: "APPLICATION_CORRECTED",
    old_status: "REJECTED",
    new_status: "REJECTED",
  });
  const updated = await getApplication(getRouteParam(req.params.id));
  res.json(toApplicationResponse(updated as ApplicationRow));
});

router.post(["/establishment-applications/:id/resubmit", "/:id/resubmit"], async (req, res) => {
  const token = String(req.query.token ?? "");
  const { data: secured } = await supabaseAdmin
    .from("establishment_applications")
    .select("id, establishment_id, status, edit_token_hash")
    .eq("id", getRouteParam(req.params.id))
    .maybeSingle();
  if (!secured || !token || hashToken(token) !== secured.edit_token_hash) {
    res.status(403).json({ message: "Lien de resoumission invalide." });
    return;
  }
  if (secured.status !== "REJECTED") {
    res.status(409).json({ message: "Seules les demandes refusées peuvent être resoumises." });
    return;
  }
  const { error } = await supabaseAdmin
    .from("establishment_applications")
    .update({
      status: "PENDING_REVIEW",
      rejection_reason: null,
    })
    .eq("id", getRouteParam(req.params.id));
  await supabaseAdmin
    .from("establishments")
    .update({ status: "PENDING_REVIEW" })
    .eq("id", secured.establishment_id);
  if (error) {
    res.status(500).json({ message: "La resoumission a échoué." });
    return;
  }
  await supabaseAdmin.from("application_history").insert({
    application_id: getRouteParam(req.params.id),
    action: "APPLICATION_RESUBMITTED",
    old_status: "REJECTED",
    new_status: "PENDING_REVIEW",
  });
  await notifySuperAdmins(
    getRouteParam(req.params.id),
    "Demande resoumise",
    "Une demande corrigée attend une nouvelle validation.",
  );
  const updated = await getApplication(getRouteParam(req.params.id));
  const resubmissionEmailError = await recordEmailEvent({
    applicationId: getRouteParam(req.params.id),
    type: "APPLICATION_RESUBMITTED",
    recipientEmail: updated?.principal_email ?? "",
    subject: "Votre demande EducPAY a été resoumise",
    body: "Votre demande corrigée est de nouveau en cours de vérification par EducPAY.",
  });
  if (resubmissionEmailError) {
    req.log.warn({ err: resubmissionEmailError }, "Unable to record resubmission email event");
  }
  res.json(toApplicationResponse(updated as ApplicationRow));
});

router.post(["/establishment-applications/:id/approve", "/:id/approve"], async (req, res) => {
  const actorId = await requireSuperAdmin(req, res);
  if (!actorId) return;

  const application = await getApplication(getRouteParam(req.params.id));
  if (!application || !application.establishments) {
    res.status(404).json({ message: "Demande introuvable." });
    return;
  }
  if (application.status !== "PENDING_REVIEW") {
    res.status(409).json({ message: "Cette demande a déjà été traitée." });
    return;
  }

  let responsibleUserId = application.responsible_user_id;
  if (!responsibleUserId) {
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (!listError) {
      const existing = listData.users.find(
        (user) => user.email?.toLowerCase() === application.principal_email.toLowerCase(),
      );
      responsibleUserId = existing?.id ?? null;
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from("establishment_applications")
    .update({
      status: "APPROVED",
      responsible_user_id: responsibleUserId,
      responsible_account_status: "ACTIVE",
      activation_expires_at: null,
    })
    .eq("id", getRouteParam(req.params.id));
  const { error: establishmentUpdateError } = await supabaseAdmin
    .from("establishments")
    .update({
      status: "APPROVED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: actorId,
    })
    .eq("id", application.establishments.id);

  if (updateError || establishmentUpdateError) {
    req.log.error({ err: updateError ?? establishmentUpdateError }, "Unable to finalize approval state");
    res.status(500).json({ message: "La validation n’a pas pu être finalisée." });
    return;
  }

  if (responsibleUserId) {
    let profileActivationError: Error | null = null;

    try {
      const { error: rpcError } = await supabaseAdmin.rpc("activate_director_profile", {
        p_user_id: responsibleUserId,
        p_establishment_id: application.establishments.id,
      });

      if (rpcError) {
        const { error: fallbackError } = await supabaseAdmin
          .from("profiles")
          .update({
            role: "DIRECTOR",
            is_active: true,
            must_change_password: false,
            establishment_id: application.establishments.id,
          })
          .eq("id", responsibleUserId);

        if (fallbackError) {
          profileActivationError = new Error(fallbackError.message);
        }
      }
    } catch (profileErr) {
      profileActivationError = profileErr instanceof Error ? profileErr : new Error("Unknown profile activation error");
    }

    if (profileActivationError) {
      req.log.error({ err: profileActivationError }, "Unable to activate director profile during approval");
      res.status(500).json({ message: "L’activation du profil directeur a échoué." });
      return;
    }
  }

  await supabaseAdmin.from("application_history").insert({
    application_id: getRouteParam(req.params.id),
    action: "APPLICATION_APPROVED",
    actor_id: actorId,
    old_status: "PENDING_REVIEW",
    new_status: "APPROVED",
  });

  await recordEmailEvent({
    applicationId: getRouteParam(req.params.id),
    type: "ACTIVATION_SENT",
    recipientEmail: application.principal_email,
    subject: "Votre accès EducPAY a été validé",
    body: "Votre compte a été validé et est désormais actif. Vous pouvez vous connecter avec le mot de passe choisi lors de votre inscription.",
    metadata: {
      provider: "APPROVAL_INTERNAL",
      expiresAt: null,
    },
    status: "SENT",
  }).catch((err) => req.log.warn({ err }, "Unable to record activation email event"));

  const updated = await getApplication(getRouteParam(req.params.id));
  res.json(toApplicationResponse(updated as ApplicationRow));
});

router.post(["/establishment-applications/:id/activate", "/:id/activate"], async (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ message: "Session d’activation introuvable." });
    return;
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    res.status(401).json({ message: "Le lien d’activation est invalide ou expiré." });
    return;
  }

  const application = await getApplication(getRouteParam(req.params.id));
  if (!application || application.responsible_user_id !== userData.user.id) {
    res.status(403).json({ message: "Ce lien ne correspond pas à cette demande." });
    return;
  }
  if (application.status !== "APPROVED") {
    res.status(409).json({ message: "Cette demande n’est pas prête à être activée." });
    return;
  }
  if (
    !application.activation_expires_at ||
    new Date(application.activation_expires_at).getTime() <= Date.now()
  ) {
    res.status(410).json({
      message:
        "Le lien d’activation a expiré. Demandez à l’équipe EducPAY de renvoyer une invitation.",
    });
    return;
  }
  if (application.responsible_account_status === "ACTIVE") {
    res.json(toApplicationResponse(application));
    return;
  }

  let profileActivationError: Error | null = null;
  const { error: profileError } = await supabaseAdmin.rpc("activate_director_profile", {
    p_user_id: userData.user.id,
    p_establishment_id: application.establishments?.id ?? application.establishments?.id,
  });
  if (profileError) {
    const { error: fallbackProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: "DIRECTOR",
        is_active: true,
        must_change_password: false,
        establishment_id: application.establishments?.id ?? null,
      })
      .eq("id", userData.user.id);

    if (fallbackProfileError) {
      profileActivationError = new Error(fallbackProfileError.message);
    }
  }

  const { error: applicationError } = await supabaseAdmin
    .from("establishment_applications")
    .update({ responsible_account_status: "ACTIVE" })
    .eq("id", getRouteParam(req.params.id));

  if (profileActivationError || applicationError) {
    req.log.error({ err: profileActivationError ?? applicationError }, "Unable to activate responsible account");
    res.status(500).json({ message: "L’activation n’a pas pu être finalisée." });
    return;
  }

  await supabaseAdmin.from("application_history").insert({
    application_id: getRouteParam(req.params.id),
    action: "ACCOUNT_ACTIVATED",
    actor_id: userData.user.id,
    metadata: { responsible_account_status: "ACTIVE" },
  });
  const updated = await getApplication(getRouteParam(req.params.id));
  res.json(toApplicationResponse(updated as ApplicationRow));
});

router.post(["/establishment-applications/:id/reject", "/:id/reject"], async (req, res) => {
  const actorId = await requireSuperAdmin(req, res);
  if (!actorId) return;
  const parsed = RejectEstablishmentApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Le motif du refus est obligatoire." });
    return;
  }

  const application = await getApplication(getRouteParam(req.params.id));
  if (!application || !application.establishments) {
    res.status(404).json({ message: "Demande introuvable." });
    return;
  }
  if (application.status !== "PENDING_REVIEW") {
    res.status(409).json({ message: "Cette demande a déjà été traitée." });
    return;
  }

  const { error } = await supabaseAdmin
    .from("establishment_applications")
    .update({ status: "REJECTED", rejection_reason: parsed.data.reason })
    .eq("id", getRouteParam(req.params.id));
  const { error: establishmentUpdateError } = await supabaseAdmin
    .from("establishments")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: actorId,
    })
    .eq("id", application.establishments.id);
  if (error || establishmentUpdateError) {
    res.status(500).json({ message: "Le refus n’a pas pu être enregistré." });
    return;
  }
  await supabaseAdmin.from("application_history").insert({
    application_id: getRouteParam(req.params.id),
    action: "APPLICATION_REJECTED",
    actor_id: actorId,
    old_status: "PENDING_REVIEW",
    new_status: "REJECTED",
    metadata: { reason: parsed.data.reason },
  });
  const rejectionEmailError = await recordEmailEvent({
    applicationId: getRouteParam(req.params.id),
    type: "APPLICATION_REJECTED",
    recipientEmail: application.principal_email,
    subject: "Mise à jour de votre demande EducPAY",
    body: [
      `Bonjour ${application.principal_first_name},`,
      "",
      `Votre demande pour ${application.establishments.official_name} a été refusée.`,
      `Motif : ${parsed.data.reason}`,
      "",
      "Vous pouvez corriger votre dossier depuis la page de suivi, puis le resoumettre.",
    ].join("\n"),
  });
  if (rejectionEmailError) {
    req.log.warn({ err: rejectionEmailError }, "Unable to record rejection email event");
  }
  const updated = await getApplication(getRouteParam(req.params.id));
  res.json(toApplicationResponse(updated as ApplicationRow));
});

export default router;