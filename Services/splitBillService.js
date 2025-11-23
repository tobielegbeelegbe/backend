const { Op } = require("sequelize");
const sequelize = require("../Config/sequalize_db");
const {
  SplitBill,
  SplitBillParticipant,
  Payment,
  SplitBillActivity,
  Refund,
} = require("../Models");
const { generateInviteCode } = require("../utils/codeGenerator");
const AppError = require("../utils/AppError");
const User = require("../Models/user");

class SplitBillService {
  static async validateParticipants(participants, creatorId = null) {
    const guestParticipants = [];
    const userParticipants = [];
    const userIdsToCheck = new Set();
    const guestPhonesSet = new Set();

    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!participants || participants.length === 0) {
      throw new AppError("You must add at least one participant", 400);
    }

    for (const p of participants) {
      if (p.type === "GUEST") {
        if (!p.name || p.name.trim().length < 2) {
          throw new AppError(`Invalid guest name: ${p.name}`, 400);
        }
        const isPhoneValid = p.phone && phoneRegex.test(p.phone);
        if (!isPhoneValid) {
          throw new AppError(
            `Guest '${p.name}' requires a valid phone number.`,
            400
          );
        }

        if (guestPhonesSet.has(p.phone)) {
          throw new AppError(`Duplicate guest phone: ${p.phone}`, 400);
        }
        guestPhonesSet.add(p.phone);

        guestParticipants.push({
          name: p.name.trim(),
          phone: p.phone,
          email: p.email || null,
          percentage: p.percentage ?? null,
          amount: p.amount ?? null,
          type: "GUEST",
        });
      } else if (p.type === "USER") {
        if (!p.userId) {
          throw new AppError("Participant of type USER missing userId", 400);
        }

        if (creatorId && p.userId === creatorId) {
          throw new AppError("Bill creator cannot be a participant", 400);
        }

        if (userIdsToCheck.has(p.userId)) {
          throw new AppError(`Duplicate user detected: ${p.userId}`, 400);
        }
        userIdsToCheck.add(p.userId);
        userParticipants.push({
          userId: p.userId,
          percentage: p.percentage ?? null,
          amount: p.amount ?? null,
          type: "USER",
        });
      } else {
        throw new AppError(
          "Invalid participant type. Must be USER or GUEST",
          400
        );
      }
    }

    // Validate user IDs exist in database
    // if (userIdsToCheck.size > 0) {
    //   const foundUsers = await User.findAll({
    //     where: {
    //       id: {
    //         [Op.in]: Array.from(userIdsToCheck),
    //       },
    //     },
    //     attributes: ["id"],
    //     raw: true,
    //   });

    //   if (foundUsers.length !== userIdsToCheck.size) {
    //     const foundIds = new Set(foundUsers.map((u) => u.id));
    //     const invalidIds = Array.from(userIdsToCheck).filter(
    //       (id) => !foundIds.has(id)
    //     );
    //     throw new AppError(`Invalid User IDs: ${invalidIds.join(", ")}`, 400);
    //   }
    // }

    if (userIdsToCheck.size > 0) {
      const normalizedUserIds = Array.from(userIdsToCheck).map(String);

      const foundUsers = await User.findAll({
        where: {
          id: {
            [Op.in]: normalizedUserIds,
          },
        },
        attributes: ["id"],
        raw: true,
      });

      const foundIds = new Set(foundUsers.map((u) => String(u.id)));

      const invalidIds = normalizedUserIds.filter((id) => !foundIds.has(id));

      if (invalidIds.length > 0) {
        throw new AppError(`Invalid User IDs: ${invalidIds.join(", ")}`, 400);
      }
    }

    return { guestParticipants, userParticipants };
  }

  static async createBill({
    creatorId,
    title,
    amount,
    currency = "NGN",
    participants = [],
    splitMethod = "EVEN",
    dueDate = null,
    description = null,
    imageUrl = null,
    billReceipt = null,
    sourceBillType = null,
    sourceBillId = null,
  }) {
    if (!title || !amount || !participants || participants.length === 0) {
      throw new AppError(
        "Missing required fields: title, amount, participants",
        400
      );
    }

    if (amount <= 0) {
      throw new AppError("Amount must be greater than zero", 400);
    }

    const validatedParticipants = await this.validateParticipants(
      participants,
      creatorId
    );

    const allParticipants = [
      ...validatedParticipants.guestParticipants,
      ...validatedParticipants.userParticipants,
    ];
    const totalParticipantsCount = allParticipants.length;

    return await sequelize.transaction(async (t) => {
      const bill = await SplitBill.create(
        {
          title,
          description,
          amount,
          currency,
          creator_id: creatorId,
          split_method: splitMethod,
          due_date: dueDate,
          image_url: imageUrl,
          bill_receipt: billReceipt,
          total_participants: totalParticipantsCount,
          source_bill_type: sourceBillType,
          source_bill_id: sourceBillId,
          status: "active",
        },
        { transaction: t }
      );

      const participantRecords = allParticipants.map((p) => {
        const baseRecord = {
          split_bill_id: bill.id,
          amount_owed: 0.0,
          percentage: p.percentage ?? null,
          invite_code: generateInviteCode(),
          invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invited_at: new Date(),
        };

        if (p.type === "USER") {
          return {
            ...baseRecord,
            user_id: p.userId,
            guest_name: null,
            guest_phone: null,
          };
        } else {
          return {
            ...baseRecord,
            user_id: null,
            guest_name: p.name,
            guest_phone: p.phone,
          };
        }
      });

      await SplitBillParticipant.bulkCreate(participantRecords, {
        transaction: t,
      });

      await this.computeAndSaveShares(bill.id, allParticipants, splitMethod, t);

      await SplitBillActivity.create(
        {
          split_bill_id: bill.id,
          actor_id: creatorId,
          action_type: "created",
          description: `Bill "${title}" created with ${totalParticipantsCount} participants`,
          metadata: {
            amount,
            splitMethod,
            participantCount: totalParticipantsCount,
          },
        },
        { transaction: t }
      );

      const completeBill = await SplitBill.findByPk(bill.id, {
        include: [
          {
            model: SplitBillParticipant,
            as: "participants",
          },
        ],
        transaction: t,
      });

      return completeBill;
    });
  }

  static async getUserBills(userId, options = {}) {
    const { status = null, role = null, page = 1, limit = 20 } = options;

    const offset = (page - 1) * limit;
    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    let bills;
    let total;

    if (role === "creator") {
      const result = await SplitBill.findAndCountAll({
        where: { creator_id: userId, ...whereClause },
        include: [
          {
            model: SplitBillParticipant,
            as: "participants",
            attributes: ["id", "status", "amount_owed", "amount_paid"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });
      bills = result.rows;
      total = result.count;
    } else if (role === "participant") {
      const participantBills = await SplitBillParticipant.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: SplitBill,
            as: "bill",
            where: whereClause,
          },
        ],
        order: [[{ model: SplitBill, as: "bill" }, "created_at", "DESC"]],
        limit,
        offset,
      });

      bills = participantBills.rows.map((p) => ({
        ...p.bill.toJSON(),
        user_participant_status: p.status,
        user_amount_owed: p.amount_owed,
        user_amount_paid: p.amount_paid,
      }));
      total = participantBills.count;
    } else {
      const [createdBills, participantData] = await Promise.all([
        SplitBill.findAll({
          where: { creator_id: userId, ...whereClause },
          include: [
            {
              model: SplitBillParticipant,
              as: "participants",
              attributes: ["id", "status", "amount_owed", "amount_paid"],
            },
          ],
          order: [["created_at", "DESC"]],
        }),
        SplitBillParticipant.findAll({
          where: { user_id: userId },
          include: [
            {
              model: SplitBill,
              as: "bill",
              where: whereClause,
            },
          ],
        }),
      ]);

      const participantBills = participantData.map((p) => ({
        ...p.bill.toJSON(),
        user_participant_status: p.status,
        user_amount_owed: p.amount_owed,
        user_amount_paid: p.amount_paid,
        is_participant: true,
      }));

      const billMap = new Map();

      createdBills.forEach((b) => {
        billMap.set(b.id, { ...b.toJSON(), is_creator: true });
      });

      participantBills.forEach((b) => {
        if (billMap.has(b.id)) {
          billMap.set(b.id, { ...billMap.get(b.id), ...b });
        } else {
          billMap.set(b.id, b);
        }
      });

      bills = Array.from(billMap.values()).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      total = bills.length;

      bills = bills.slice(offset, offset + limit);
    }

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getBillById(billId, userId = null) {
    const bill = await SplitBill.findByPk(billId, {
      include: [
        {
          model: SplitBillParticipant,
          as: "participants",
          include: [
            {
              model: Payment,
              as: "payments",
              attributes: ["id", "amount", "payment_method", "created_at"],
            },
          ],
        },
        // {
        //   model: SplitBillActivity,
        //   as: "activities",
        //   order: [["created_at", "DESC"]],
        //   limit: 10,
        // },
      ],
    });

    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    if (userId) {
      const isCreator = bill.creator_id === userId;
      const isParticipant = bill.participants.some((p) => p.user_id === userId);

      if (!isCreator && !isParticipant) {
        throw new AppError("You don't have access to this bill", 403);
      }
    }

    const amountRaised = parseFloat(bill.total_paid);
    const percentageComplete = (
      (amountRaised / parseFloat(bill.amount)) *
      100
    ).toFixed(2);

    return {
      ...bill.toJSON(),
      amount_raised: amountRaised.toFixed(2),
      percentage_complete: percentageComplete,
      is_overdue:
        bill.due_date &&
        new Date(bill.due_date) < new Date() &&
        bill.status === "active",
    };
  }

  static async applyPayment(
    participantId,
    amount,
    payerId = null,
    paymentDetails = {}
  ) {
    return await sequelize.transaction(async (transaction) => {
      const participant = await SplitBillParticipant.findOne({
        where: { id: participantId },
        include: [
          {
            model: SplitBill,
            as: "bill",
          },
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!participant) {
        throw new AppError("Participant not found", 404);
      }

      if (participant.bill.status === "cancelled") {
        throw new AppError("Cannot make payment to cancelled bill", 400);
      }

      if (participant.bill.status === "completed") {
        throw new AppError("Bill is already completed", 400);
      }

      const incoming = parseFloat(amount);
      if (isNaN(incoming) || incoming <= 0) {
        throw new AppError("Payment amount must be greater than zero", 400);
      }

      const required = parseFloat(participant.amount_owed);
      const paid = parseFloat(participant.amount_paid);
      const remaining = required - paid;

      if (incoming > remaining + 0.01) {
        throw new AppError(
          `Payment exceeds remaining amount. Remaining: ${remaining.toFixed(
            2
          )}`,
          400
        );
      }

      const payment = await Payment.create(
        {
          participant_id: participantId,
          payer_id: payerId,
          amount: incoming,
          currency: participant.bill.currency,
          payment_method: paymentDetails.payment_method || null,
          transaction_reference: paymentDetails.transaction_reference || null,
          payment_status: paymentDetails.payment_status || "completed",
          payment_gateway: paymentDetails.payment_gateway || null,
          metadata: paymentDetails.metadata || null,
          notes: paymentDetails.notes || null,
        },
        { transaction }
      );

      const newPaid = paid + incoming;
      const isSettled = newPaid >= required - 0.01;

      await participant.update(
        {
          amount_paid: newPaid,
          paid: isSettled,
          status: isSettled ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID",
          paid_at: isSettled ? new Date() : participant.paid_at,
        },
        { transaction }
      );

      const splitBill = participant.bill;
      const newTotalPaid = parseFloat(splitBill.total_paid) + incoming;
      const isBillCompleted =
        newTotalPaid >= parseFloat(splitBill.amount) - 0.01;

      await splitBill.update(
        {
          total_paid: newTotalPaid,
          status: isBillCompleted ? "completed" : splitBill.status,
        },
        { transaction }
      );

      await SplitBillActivity.create(
        {
          split_bill_id: splitBill.id,
          actor_id: payerId,
          action_type: "payment_made",
          description: `Payment of ${incoming} made by ${
            participant.user_id ? "user" : participant.guest_name
          }`,
          metadata: {
            amount: incoming,
            participantId,
            paymentId: payment.id,
          },
        },
        { transaction }
      );

      if (isBillCompleted) {
        await SplitBillActivity.create(
          {
            split_bill_id: splitBill.id,
            actor_id: null,
            action_type: "completed",
            description: "Bill completed - all payments received",
          },
          { transaction }
        );
      }

      return {
        participantId,
        amountPaid: newPaid,
        amountOwed: required,
        remainingAmount: Math.max(0, required - newPaid),
        participantPaidOff: isSettled,
        splitBillTotalPaid: newTotalPaid,
        billCompleted: isBillCompleted,
        paymentId: payment.id,
      };
    });
  }

  static async computeAndSaveShares(
    billId,
    participants,
    splitMethod,
    transaction
  ) {
    const bill = await SplitBill.findByPk(billId, { transaction });
    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    const totalAmount = parseFloat(bill.amount);
    const numParticipants = participants.length;

    const dbParticipants = await SplitBillParticipant.findAll({
      where: { split_bill_id: billId },
      order: [
        ["created_at", "ASC"],
        ["id", "ASC"],
      ],
      transaction,
    });

    if (dbParticipants.length !== numParticipants) {
      throw new AppError(
        "Mismatch between input participants and DB rows",
        500
      );
    }

    const round2 = (v) => Math.round(v * 100) / 100;
    const owedAmounts = new Array(numParticipants).fill(0.0);

    switch (splitMethod) {
      case "EVEN":
        const base = Math.floor((totalAmount / numParticipants) * 100) / 100;
        let sumBase = base * numParticipants;
        let remainder = Math.round((totalAmount - sumBase) * 100);

        for (let i = 0; i < numParticipants; i++) {
          let centAdd = 0;
          if (remainder > 0) {
            centAdd = 1;
            remainder--;
          }
          owedAmounts[i] = round2(base + centAdd / 100);
        }

        const totalComputed = owedAmounts.reduce((a, b) => a + b, 0);
        const diff = round2(totalAmount - totalComputed);
        if (Math.abs(diff) >= 0.01) {
          owedAmounts[0] = round2(owedAmounts[0] + diff);
        }
        break;

      case "MANUAL":
        let manualSum = 0;
        for (let i = 0; i < participants.length; i++) {
          const p = participants[i];
          if (typeof p.amount !== "number" || p.amount < 0) {
            throw new AppError(
              "Manual split requires valid amount for each participant",
              400
            );
          }
          owedAmounts[i] = round2(p.amount);
          manualSum += owedAmounts[i];
        }

        const manualDiff = Math.abs(round2(manualSum) - round2(totalAmount));
        if (manualDiff > 0.1) {
          throw new AppError(
            `Manual amounts sum to ${manualSum} but bill amount is ${totalAmount}`,
            400
          );
        }

        const totalManualComputed = owedAmounts.reduce((a, b) => a + b, 0);
        const manualAdjust = round2(totalAmount - totalManualComputed);
        if (Math.abs(manualAdjust) >= 0.01) {
          owedAmounts[0] = round2(owedAmounts[0] + manualAdjust);
        }
        break;

      case "PERCENTAGE":
        let percentageSum = 0;
        for (let i = 0; i < participants.length; i++) {
          const p = participants[i];
          if (
            typeof p.percentage !== "number" ||
            p.percentage < 0 ||
            p.percentage > 100
          ) {
            throw new AppError(
              "Percentage split requires valid percentage (0-100) for each participant",
              400
            );
          }
          percentageSum += p.percentage;
        }

        if (Math.abs(percentageSum - 100) > 0.01) {
          throw new AppError(
            `Percentages must sum to 100%, currently: ${percentageSum}%`,
            400
          );
        }

        for (let i = 0; i < participants.length; i++) {
          owedAmounts[i] = round2(
            (totalAmount * participants[i].percentage) / 100
          );
        }

        const totalPercentageComputed = owedAmounts.reduce((a, b) => a + b, 0);
        const percentageAdjust = round2(totalAmount - totalPercentageComputed);
        if (Math.abs(percentageAdjust) >= 0.01) {
          owedAmounts[0] = round2(owedAmounts[0] + percentageAdjust);
        }
        break;

      case "RANDOM_PICK":
        const payerIndex = Math.floor(Math.random() * numParticipants);
        for (let i = 0; i < numParticipants; i++) {
          owedAmounts[i] = i === payerIndex ? round2(totalAmount) : 0.0;
        }
        break;

      default:
        throw new AppError("Unsupported split method: " + splitMethod, 400);
    }

    const adjustments = [];
    let totalPaidSum = 0.0;

    for (let i = 0; i < dbParticipants.length; i++) {
      const row = dbParticipants[i];
      const oldOwed = parseFloat(row.amount_owed);
      const newOwed = owedAmounts[i];
      const amountPaid = parseFloat(row.amount_paid || 0.0);

      const owedDifference = newOwed - oldOwed;

      let newStatus = row.status;
      let requiresAction = false;
      let actionType = null;

      if (amountPaid > 0) {
        if (amountPaid >= newOwed) {
          newStatus = "PAID";
          if (amountPaid > newOwed + 0.01) {
            requiresAction = true;
            actionType = "REFUND_REQUIRED";
            adjustments.push({
              participantId: row.id,
              participantName: row.guest_name || "User",
              oldOwed,
              newOwed,
              amountPaid,
              overpaidAmount: round2(amountPaid - newOwed),
              action: "REFUND_REQUIRED",
              message: `Participant has overpaid by ₦${round2(
                amountPaid - newOwed
              )}. Refund required.`,
            });
          }
        } else {
          newStatus = "PARTIAL";
          if (owedDifference > 0) {
            requiresAction = true;
            actionType = "ADDITIONAL_PAYMENT_REQUIRED";
            adjustments.push({
              participantId: row.id,
              participantName: row.guest_name || "User",
              oldOwed,
              newOwed,
              amountPaid,
              additionalOwed: round2(newOwed - amountPaid),
              action: "ADDITIONAL_PAYMENT_REQUIRED",
              message: `Bill amount changed. Additional ₦${round2(
                newOwed - amountPaid
              )} required.`,
            });
          }
        }
      } else {
        newStatus = "UNPAID";
        if (Math.abs(owedDifference) > 0.01) {
          adjustments.push({
            participantId: row.id,
            participantName: row.guest_name || "User",
            oldOwed,
            newOwed,
            amountPaid: 0,
            action: "AMOUNT_ADJUSTED",
            message: `Amount owed changed from ₦${oldOwed} to ₦${newOwed}.`,
          });
        }
      }

      await SplitBillParticipant.update(
        {
          amount_owed: newOwed,
          status: newStatus,
        },
        {
          where: { id: row.id },
          transaction,
          validate: false,
        }
      );

      totalPaidSum += amountPaid;
    }

    await SplitBill.update(
      {
        total_participants: numParticipants,
        total_paid: round2(totalPaidSum),
      },
      { where: { id: billId }, transaction }
    );

    return {
      success: true,
      adjustments,
      hasRefundsRequired: adjustments.some(
        (a) => a.action === "REFUND_REQUIRED"
      ),
      hasAdditionalPaymentsRequired: adjustments.some(
        (a) => a.action === "ADDITIONAL_PAYMENT_REQUIRED"
      ),
    };
  }

  static async updateBill(billId, updates, actorId = null) {
    return await sequelize.transaction(async (t) => {
      const bill = await SplitBill.findByPk(billId, {
        include: [{ model: SplitBillParticipant, as: "participants" }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!bill) {
        throw new AppError("Bill not found", 404);
      }

      if (bill.is_finalized) {
        throw new AppError("Cannot update finalized bill", 400);
      }

      if (bill.status === "completed") {
        throw new AppError("Cannot update completed bill", 400);
      }

      if (bill.status === "cancelled") {
        throw new AppError("Cannot update cancelled bill", 400);
      }

      const amountChanged =
        updates.amount &&
        parseFloat(updates.amount) !== parseFloat(bill.amount);
      const splitMethodChanged =
        updates.split_method && updates.split_method !== bill.split_method;
      const hasCriticalChanges = amountChanged || splitMethodChanged;

      const oldAmount = parseFloat(bill.amount);
      const oldSplitMethod = bill.split_method;

      const allowedUpdates = [
        "title",
        "description",
        "due_date",
        "image_url",
        "bill_receipt",
        "amount",
        "split_method",
      ];

      const updateData = {};
      allowedUpdates.forEach((field) => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      if (updates.amount !== undefined) {
        const newAmount = parseFloat(updates.amount);
        if (isNaN(newAmount) || newAmount <= 0) {
          throw new AppError("Amount must be greater than zero", 400);
        }
      }

      if (updates.split_method) {
        const validMethods = ["EVEN", "MANUAL", "PERCENTAGE", "RANDOM_PICK"];
        if (!validMethods.includes(updates.split_method)) {
          throw new AppError("Invalid split method", 400);
        }
      }

      await bill.update(updateData, { transaction: t });

      let adjustmentResults = null;

      if (hasCriticalChanges) {
        const participantInputs = bill.participants.map((p) => ({
          type: p.user_id ? "USER" : "GUEST",
          userId: p.user_id,
          name: p.guest_name,
          phone: p.guest_phone,
          percentage: p.percentage,
          amount: p.amount_owed,
        }));

        adjustmentResults = await this.computeAndSaveShares(
          billId,
          participantInputs,
          updates.split_method || bill.split_method,
          t
        );

        const activityDescription = [];
        if (amountChanged) {
          activityDescription.push(
            `Amount changed from ₦${oldAmount} to ₦${updates.amount}`
          );
        }
        if (splitMethodChanged) {
          activityDescription.push(
            `Split method changed from ${oldSplitMethod} to ${updates.split_method}`
          );
        }

        await SplitBillActivity.create(
          {
            split_bill_id: billId,
            actor_id: actorId,
            action_type: "updated",
            description:
              activityDescription.join(". ") + ". Shares recalculated.",
            metadata: {
              updates: Object.keys(updateData),
              oldAmount,
              newAmount: updates.amount,
              oldSplitMethod,
              newSplitMethod: updates.split_method,
              adjustments: adjustmentResults.adjustments,
              hasRefundsRequired: adjustmentResults.hasRefundsRequired,
              hasAdditionalPaymentsRequired:
                adjustmentResults.hasAdditionalPaymentsRequired,
            },
          },
          { transaction: t }
        );
      } else {
        await SplitBillActivity.create(
          {
            split_bill_id: billId,
            actor_id: actorId,
            action_type: "updated",
            description: "Bill details updated",
            metadata: { updates: Object.keys(updateData) },
          },
          { transaction: t }
        );
      }

      const updatedBill = await SplitBill.findByPk(billId, {
        include: [
          {
            model: SplitBillParticipant,
            as: "participants",
          },
        ],
        transaction: t,
      });

      return {
        bill: updatedBill,
        adjustments: adjustmentResults?.adjustments || [],
        requiresAction:
          hasCriticalChanges &&
          adjustmentResults &&
          (adjustmentResults.hasRefundsRequired ||
            adjustmentResults.hasAdditionalPaymentsRequired),
        message: hasCriticalChanges
          ? "Bill updated. Some participants may require payment adjustments."
          : "Bill updated successfully.",
      };
    });
  }

  static async addParticipant(billId, participantData, actorId = null) {
    return await sequelize.transaction(async (t) => {
      const bill = await SplitBill.findByPk(billId, {
        include: [{ model: SplitBillParticipant, as: "participants" }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!bill) {
        throw new AppError("Bill not found", 404);
      }

      if (bill.is_finalized) {
        throw new AppError("Cannot add participant to finalized bill", 400);
      }

      if (bill.status === "cancelled") {
        throw new AppError("Cannot add participant to cancelled bill", 400);
      }

      if (bill.status === "completed") {
        throw new AppError("Cannot add participant to completed bill", 400);
      }

      const { userId, guestName, guestPhone, guestEmail } = participantData;

      if (!userId && !guestPhone) {
        throw new AppError(
          "Must provide either userId or guestPhone for guest",
          400
        );
      }

      if (userId) {
        const normalizedUserId = String(userId);
        const normalizedCreatorId = String(bill.creator_id);

        if (normalizedCreatorId === normalizedUserId) {
          throw new AppError("Bill creator cannot be a participant", 400);
        }

        const user = await User.findById(normalizedUserId, { transaction: t });
        if (!user) {
          throw new AppError("User does not exist", 404);
        }

        const exists = bill.participants.some(
          (p) => String(p.user_id) === normalizedUserId
        );
        if (exists) {
          throw new AppError("User is already a participant", 400);
        }
      }

      if (!userId && guestPhone) {
        if (!guestName) {
          throw new AppError("Guest name is required", 400);
        }

        const exists = bill.participants.some(
          (p) => p.user_id === null && p.guest_phone === guestPhone
        );
        if (exists) {
          throw new AppError("Guest with this phone already added", 400);
        }
      }

      const newParticipant = await SplitBillParticipant.create(
        {
          split_bill_id: billId,
          user_id: userId || null,
          guest_name: guestName || null,
          guest_phone: guestPhone || null,
          guest_email: guestEmail || null,
          percentage: null,
          amount_owed: 0,
          invite_code: generateInviteCode(),
          invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invited_at: new Date(),
        },
        { transaction: t }
      );

      const allParticipants = [...bill.participants, newParticipant];
      const participantInputs = allParticipants.map((p) => ({
        type: p.user_id ? "USER" : "GUEST",
        userId: p.user_id,
        name: p.guest_name,
        phone: p.guest_phone,
        percentage: p.percentage,
        amount: p.amount_owed,
      }));

      const adjustmentResults = await this.computeAndSaveShares(
        billId,
        participantInputs,
        bill.split_method,
        t
      );

      await bill.update(
        { total_participants: allParticipants.length },
        { transaction: t }
      );

      await SplitBillActivity.create(
        {
          split_bill_id: billId,
          actor_id: actorId,
          action_type: "participant_added",
          description: `New participant added: ${
            guestName || "User"
          }. Shares recalculated for all participants.`,
          metadata: {
            participantId: newParticipant.id,
            type: userId ? "USER" : "GUEST",
            adjustments: adjustmentResults.adjustments,
            hasRefundsRequired: adjustmentResults.hasRefundsRequired,
          },
        },
        { transaction: t }
      );

      return {
        participant: newParticipant,
        adjustments: adjustmentResults.adjustments,
        message:
          adjustmentResults.adjustments.length > 0
            ? "Participant added. Existing participant amounts have been adjusted."
            : "Participant added successfully.",
      };
    });
  }

  static async removeParticipant(billId, participantId, actorId = null) {
    return await sequelize.transaction(async (t) => {
      const participant = await SplitBillParticipant.findOne({
        where: {
          id: participantId,
          split_bill_id: billId,
        },
        include: [
          {
            model: SplitBill,
            as: "bill",
            include: [
              {
                model: SplitBillParticipant,
                as: "participants",
              },
            ],
          },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!participant) {
        throw new AppError("Participant not found in this bill", 404);
      }

      const bill = participant.bill;

      // Validation
      if (bill.is_finalized) {
        throw new AppError(
          "Cannot remove participant from finalized bill",
          400
        );
      }

      if (bill.status === "completed") {
        throw new AppError(
          "Cannot remove participant from completed bill",
          400
        );
      }

      if (bill.status === "cancelled") {
        throw new AppError(
          "Cannot remove participant from cancelled bill",
          400
        );
      }

      if (bill.participants.length <= 1) {
        throw new AppError("Cannot remove the last remaining participant", 400);
      }

      // Check if participant has payments
      const amountPaid = parseFloat(participant.amount_paid);
      const hasPayments = amountPaid > 0;

      if (hasPayments) {
        // Participant has made payments - mark for refund instead of blocking
        throw new AppError(
          `Cannot remove participant who has paid ₦${amountPaid}. Please process refund first or contact support.`,
          400
        );
      }

      // Store info before deletion
      const participantInfo = {
        id: participant.id,
        type: participant.user_id ? "USER" : "GUEST",
        name: participant.user_id ? "user" : participant.guest_name,
        user_id: participant.user_id,
        guest_phone: participant.guest_phone,
        amount_owed: parseFloat(participant.amount_owed),
      };

      // Delete participant
      await participant.destroy({ transaction: t });

      // Recalculate shares for remaining participants
      const remainingParticipants = bill.participants.filter(
        (p) => p.id !== participantId
      );

      const participantInputs = remainingParticipants.map((p) => ({
        type: p.user_id ? "USER" : "GUEST",
        userId: p.user_id,
        name: p.guest_name,
        phone: p.guest_phone,
        percentage: p.percentage,
        amount: p.amount_owed,
      }));

      const adjustmentResults = await this.computeAndSaveShares(
        billId,
        participantInputs,
        bill.split_method,
        t
      );

      // Update total participants
      await bill.update(
        { total_participants: remainingParticipants.length },
        { transaction: t }
      );

      // Log activity
      await SplitBillActivity.create(
        {
          split_bill_id: billId,
          actor_id: actorId,
          action_type: "participant_removed",
          description: `Participant removed: ${participantInfo.name}. Shares recalculated for remaining participants.`,
          metadata: {
            participantId: participantInfo.id,
            type: participantInfo.type,
            userId: participantInfo.user_id,
            guestPhone: participantInfo.guest_phone,
            amountOwed: participantInfo.amount_owed,
            adjustments: adjustmentResults.adjustments,
          },
        },
        { transaction: t }
      );

      return {
        success: true,
        removedParticipant: participantInfo,
        remainingParticipants: remainingParticipants.length,
        adjustments: adjustmentResults.adjustments,
        message:
          adjustmentResults.adjustments.length > 0
            ? "Participant removed. Remaining participant amounts have been adjusted."
            : "Participant removed successfully.",
      };
    });
  }

  static async cancelBill(billId, actorId = null, reason = null) {
    return await sequelize.transaction(async (t) => {
      const bill = await SplitBill.findByPk(billId, { transaction: t });

      if (!bill) {
        throw new AppError("Bill not found", 404);
      }

      if (bill.status === "completed") {
        throw new AppError("Cannot cancel completed bill", 400);
      }

      if (bill.status === "cancelled") {
        throw new AppError("Bill is already cancelled", 400);
      }

      if (parseFloat(bill.total_paid) > 0) {
        throw new AppError(
          "Cannot cancel bill with existing payments. Contact support for refunds.",
          400
        );
      }

      await bill.update({ status: "cancelled" }, { transaction: t });

      // await SplitBillActivity.create(
      //   {
      //     split_bill_id: billId,
      //     actor_id: actorId,
      //     action_type: "cancelled",
      //     description: reason || "Bill cancelled",
      //     metadata: { reason },
      //   },
      //   { transaction: t }
      // );

      return bill;
    });
  }

  static async getParticipantStatus(participantId) {
    const participant = await SplitBillParticipant.findByPk(participantId, {
      include: [
        {
          model: SplitBill,
          as: "bill",
        },
        {
          model: Payment,
          as: "payments",
          order: [["created_at", "DESC"]],
        },
      ],
    });

    if (!participant) {
      throw new AppError("Participant not found", 404);
    }

    const amountOwed = parseFloat(participant.amount_owed);
    const amountPaid = parseFloat(participant.amount_paid);
    const remaining = Math.max(0, amountOwed - amountPaid);

    return {
      participant: {
        id: participant.id,
        user_id: participant.user_id,
        guest_name: participant.guest_name,
        guest_phone: participant.guest_phone,
        amount_owed: amountOwed,
        amount_paid: amountPaid,
        remaining_amount: remaining,
        status: participant.status,
        paid: participant.paid,
        paid_at: participant.paid_at,
      },
      bill: {
        id: participant.bill.id,
        title: participant.bill.title,
        total_amount: parseFloat(participant.bill.amount),
        due_date: participant.bill.due_date,
        status: participant.bill.status,
      },
      payments: participant.payments,
    };
  }

  static async createFromSourceBill(
    sourceBillType,
    sourceBillId,
    splitData,
    creatorId
  ) {
    // Fetch source bill data based on type
    let sourceBill;

    switch (sourceBillType) {
      case "invoice":
        // Fetch from Invoice model
        const Invoice = require("../models/Invoice");
        sourceBill = await Invoice.findByPk(sourceBillId);
        break;
      case "campaign":
        // Fetch from Campaign model
        const Campaign = require("../models/Campaign");
        sourceBill = await Campaign.findByPk(sourceBillId);
        break;
      // Add other types as needed
      default:
        throw new AppError(
          `Unsupported source bill type: ${sourceBillType}`,
          400
        );
    }

    if (!sourceBill) {
      throw new AppError("Source bill not found", 404);
    }

    // Create split bill with source data
    return await this.createBill({
      creatorId,
      title: splitData.title || sourceBill.title,
      amount: splitData.amount || sourceBill.amount,
      currency: splitData.currency || sourceBill.currency || "NGN",
      description: splitData.description || sourceBill.description,
      imageUrl: splitData.imageUrl || sourceBill.image_url,
      participants: splitData.participants,
      splitMethod: splitData.splitMethod || "EVEN",
      dueDate: splitData.dueDate,
      sourceBillType,
      sourceBillId,
    });
  }

  static async finalizeBill(billId) {
    return await sequelize.transaction(async (t) => {
      const bill = await SplitBill.findByPk(billId, {
        include: [{ model: SplitBillParticipant, as: "participants" }],
        transaction: t,
      });

      if (!bill) throw new Error("Bill not found");

      bill.is_finalized = true;
      await bill.save({ transaction: t });

      return bill;
    });
  }
}

module.exports = SplitBillService;
