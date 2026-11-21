const STORAGE_PREFIX = "dentia-medical-record-v1";

function storageKey(patientId, section) {
  return `${STORAGE_PREFIX}:${encodeURIComponent(patientId)}:${section}`;
}

function readSection(patientId, section) {
  try {
    return JSON.parse(
      window.localStorage.getItem(storageKey(patientId, section)) || "[]",
    );
  } catch {
    return [];
  }
}

export const sharedReferralAccessService = {
  hasReferralAccess(patientId, session, referralId) {
    if (session?.role !== "professional" || !session.id) return false;
    return readSection(patientId, "referralAccess").some(
      (entry) =>
        entry.professionalId === session.id &&
        entry.status === "accepted" &&
        (!referralId || entry.referralId === referralId),
    );
  },

  hasAcceptedReferral(referralId, patientId, session) {
    return this.hasReferralAccess(patientId, session, referralId);
  },

  listReferralAccessFor(session) {
    if (session?.role !== "professional" || !session.id) return [];
    const prefix = `${STORAGE_PREFIX}:`;
    return Object.keys(window.localStorage)
      .filter(
        (key) => key.startsWith(prefix) && key.endsWith(":referralAccess"),
      )
      .flatMap((key) => {
        const patientId = decodeURIComponent(
          key.slice(prefix.length, -":referralAccess".length),
        );
        return readSection(patientId, "referralAccess")
          .filter(
            (entry) =>
              entry.professionalId === session.id &&
              entry.status === "accepted",
          )
          .map((entry) => ({ patientId, ...entry }));
      });
  },

  listPatientReferrals(patientId) {
    return readSection(patientId, "referrals");
  },

  async allowReferralAccess(referral) {
    if (
      !referral?.patientId ||
      !referral?.specialistId ||
      referral.status !== "accepted"
    ) {
      throw new Error(
        "Solo una derivación aceptada puede conceder acceso al expediente.",
      );
    }
    const access = readSection(referral.patientId, "referralAccess");
    const existing = access.find(
      (entry) =>
        entry.professionalId === referral.specialistId &&
        entry.referralId === referral.id,
    );
    if (existing) return existing;
    const updated = [
      {
        professionalId: referral.specialistId,
        referralId: referral.id,
        status: "accepted",
        grantedAt: referral.acceptedAt || new Date().toISOString(),
      },
      ...access,
    ];
    window.localStorage.setItem(
      storageKey(referral.patientId, "referralAccess"),
      JSON.stringify(updated),
    );
    return updated[0];
  },
};
