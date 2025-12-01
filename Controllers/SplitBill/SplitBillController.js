const SplitBillService = require("../../Services/splitBillService");
const NotificationService = require("../../Services/notificationService");
const { SplitBill } = require("../../Models");

const getSplitBill = async (req, res, next) => {
  try {
    const billId = req.params.id;
    const result = await SplitBillService.getBillById(billId);

    if (!result) {
      return res.status(400).json({ msg: "Bill not found" });
    }

    return res.status(200).json({
      msg: "Bill loaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching bill:", error);
    next(error);
  }
};

const createSplitBill = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const bill = await SplitBillService.createBill({
      creatorId,
      ...req.body,
    });

    await NotificationService.notifyParticipantsCreated(bill, creatorId);

    return res.status(201).json({
      msg: "Split bill created successfully",
      data: bill,
    });
  } catch (error) {
    console.error("Error creating bill:", error);
    next(error);
  }
};

const createFromSourceBill = async (req, res, next) => {
  try {
    const { sourceBillType, sourceBillId } = req.params;
    const creatorId = req.user.id;

    const bill = await SplitBillService.createFromSourceBill(
      sourceBillType,
      sourceBillId,
      req.body,
      creatorId
    );

    return res.status(201).json({
      success: true,
      message: "Split bill created from source successfully",
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

const getUserSplitBills = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, role, page, limit } = req.query;

    const result = await SplitBillService.getUserBills(userId, {
      status,
      role,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });

    return res.status(200).json({
      success: true,
      message: "User split bills retrieved successfully",
      data: result.bills,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const updateBill = async (req, res, next) => {
  try {
    const { id: billId } = req.params;
    const userId = req.user.id;

    const bill = await SplitBillService.updateBill(billId, req.body, userId);

    await NotificationService.billUpdated(bill, userId);

    return res.status(200).json({
      success: true,
      message: "Bill updated successfully",
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

const addParticipant = async (req, res, next) => {
  try {
    const billId = req.params.id;
    const actorId = req.user.id;
    const {
      type,
      userId,
      name,
      phone,
      email,
      amount,
      percentage,
      redistribution,
    } = req.body;

    const participantData = {
      userId: type === "USER" ? userId : null,
      guestName: type === "GUEST" ? name : null,
      guestPhone: type === "GUEST" ? phone : null,
      guestEmail: email || null,
      amount: amount ? parseFloat(amount) : null,
      percentage: percentage ? parseFloat(percentage) : null,
      redistribution: redistribution || null,
    };

    const result = await SplitBillService.addParticipant(
      billId,
      participantData,
      actorId
    );

    await NotificationService.participantAdded(
      billId,
      result.participant,
      actorId
    );

    return res.status(201).json({
      status: "success",
      message: result.message,
      data: {
        participant: result.participant,
        splitMethod: result.splitMethod,
        redistributed: result.redistributed,
        adjustments: result.adjustments,
      },
    });
  } catch (error) {
    next(error);
  }
};

const removeParticipant = async (req, res, next) => {
  try {
    const { id: billId, participantId } = req.params;
    const actorId = req.user.id;
    const { redistribution } = req.body;

    const result = await SplitBillService.removeParticipant(
      billId,
      participantId,
      redistribution || null,
      actorId
    );

    await NotificationService.participantRemoved(
      billId,
      result.removedParticipant,
      actorId
    );

    return res.status(200).json({
      status: "success",
      message: result.message,
      data: {
        removedParticipant: result.removedParticipant,
        remainingParticipants: result.remainingParticipants,
        redistributed: result.redistributed,
        adjustments: result.adjustments,
      },
    });
  } catch (error) {
    next(error);
  }
};

const applyPayment = async (req, res, next) => {
  try {
    const participantId = req.params.id;
    const { amount, paymentDetails } = req.body;
    const payerId = req.user.id;

    const result = await SplitBillService.applyPayment(
      participantId,
      amount,
      payerId,
      paymentDetails
    );

    await NotificationService.paymentApplied(result, payerId);

    return res.status(200).json({
      status: "success",
      message: "Payment applied successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const finalizeBill = async (req, res, next) => {
  try {
    const { id: billId } = req.params;
    const bill = await SplitBillService.finalizeBill(billId);

    // await NotificationService.notifyBillFinalized(bill);

    return res.status(200).json({ msg: "Bill finalized", data: bill });
  } catch (error) {
    next(error);
  }
};

const getParticipantStatus = async (req, res, next) => {
  try {
    const { participantId } = req.params;

    const status = await SplitBillService.getParticipantStatus(participantId);

    return res.status(200).json({
      success: true,
      message: "Participant status retrieved successfully",
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

const cancelBill = async (req, res, next) => {
  try {
    const { id: billId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const bill = await SplitBillService.cancelBill(billId, userId, reason);

    // NotificationService.notifyBillCancelled(bill).catch((err) =>
    //   console.error("Notification error:", err)
    // );

    return res.status(200).json({
      success: true,
      message: "Bill cancelled successfully",
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

const acceptInvite = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user.id;

    const participant = await SplitBillParticipant.findOne({
      where: { invite_code: inviteCode },
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Invalid invite code",
      });
    }

    if (
      participant.invite_expires_at &&
      new Date(participant.invite_expires_at) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invite code has expired",
      });
    }

    await participant.update({
      user_id: userId,
      accepted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Invite accepted successfully",
      data: participant,
    });
  } catch (error) {
    next(error);
  }
};

const sendReminders = async (req, res, next) => {
  try {
    const { billId } = req.params;

    const bill = await SplitBill.findByPk(billId, {
      include: [
        {
          model: SplitBillParticipant,
          as: "participants",
          where: { paid: false },
        },
      ],
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    // await NotificationService.sendBillReminders(bill);

    await bill.update({
      reminder_sent_count: bill.reminder_sent_count + 1,
      last_reminder_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Reminders sent to ${bill.participants.length} participants`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSplitBill,
  createSplitBill,
  createFromSourceBill,
  updateBill,
  getUserSplitBills,
  addParticipant,
  removeParticipant,
  applyPayment,
  finalizeBill,
  getParticipantStatus,
  cancelBill,
  acceptInvite,
  sendReminders,
};
