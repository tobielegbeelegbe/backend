const express = require("express");
const SplitBillController = require("../../Controllers/SplitBill/SplitBillController");
const {
  verifyToken,
  validateRequest,
  checkBillAccess,
  checkBillOwnership,
} = require("../../middleware");
const {
  createBillSchema,
  applyPaymentSchema,
  participantSchema,
} = require("../../Validators/billValidator");

const router = express.Router();

router.use(express.urlencoded({ extended: true }));

router.get(
  "/:id",
  verifyToken,
  checkBillAccess,
  SplitBillController.getSplitBill
);

router.post(
  "/create",
  verifyToken,
  validateRequest(createBillSchema),
  SplitBillController.createSplitBill
);

router.get("/", verifyToken, SplitBillController.getUserSplitBills);

router.patch(
  "/:id",
  verifyToken,
  checkBillOwnership,
  SplitBillController.updateBill
);

router.delete(
  "/:id/cancel",
  verifyToken,
  checkBillOwnership,
  SplitBillController.cancelBill
);

router.post(
  "/:id/participants",
  verifyToken,
  checkBillOwnership,
  validateRequest(participantSchema),
  SplitBillController.addParticipant
);

router.delete(
  "/:id/participants/:participantId",
  verifyToken,
  checkBillOwnership,
  SplitBillController.removeParticipant
);

router.post(
  "/participants/:id/payments",
  verifyToken,
  validateRequest(applyPaymentSchema),
  SplitBillController.applyPayment
);

router.post(
  "/pay/:id",
  validateRequest(applyPaymentSchema),
  SplitBillController.payAsGuest
);

router.post("/:id/finalize", verifyToken, SplitBillController.finalizeBill);

router.get(
  "/participants/:participantId",
  verifyToken,
  SplitBillController.getParticipantStatus
);

router.post("/invites/:inviteCode/accept", SplitBillController.acceptInvite);

router.post(
  "/:billId/reminders",
  verifyToken,
  checkBillOwnership,
  SplitBillController.sendReminders
);

module.exports = router;
