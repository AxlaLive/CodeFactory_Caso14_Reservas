import { test } from "node:test";
import assert from "node:assert/strict";
import { sharedReferralAccessService } from "../api/sharedReferralAccessService.js";

test("demo referrals persist assignment, pending status, notification and decision ownership", async () => {
  const store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, value),
    },
    dispatchEvent: () => true,
  };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail;
    }
  };
  const { demoAccounts, demoClinicService } =
    await import("../api/demoClinicService.js?referral-test");
  const specialist = demoAccounts.find(
    (account) => account.id === "demo-endodontist",
  );
  const referral = await demoClinicService.referrals.create("patient-42", {
    patientName: "Paciente Prueba",
    specialistId: specialist.id,
    specialty: "Endodoncista",
    referringProfessionalId: "demo-professional",
    referringProfessionalName: "Daniel Rojas",
    reason: "Dolor",
    imageIds: ["img-1"],
  });
  assert.equal(referral.status, "pending");
  assert.equal(
    (await demoClinicService.referrals.notifications(specialist.id))[0]
      .referralId,
    referral.id,
  );
  await assert.rejects(
    demoClinicService.referrals.accept(referral.id, "another-professional"),
  );
  const accepted = await demoClinicService.referrals.accept(
    referral.id,
    specialist.id,
  );
  assert.equal(accepted.status, "accepted");
  assert.equal(accepted.acceptedBy, specialist.id);
  assert.ok(accepted.acceptedAt);

  await sharedReferralAccessService.allowReferralAccess(accepted);
  const specialistSession = { id: specialist.id, role: "professional" };
  assert.equal(sharedReferralAccessService.hasAcceptedReferral(accepted.id, "patient-42", specialistSession), true);
  assert.equal(sharedReferralAccessService.hasAcceptedReferral(accepted.id, "patient-42", { id: "another-professional", role: "professional" }), false);
});
