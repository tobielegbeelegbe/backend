const Notification = require("../Models/notifications");
const { SplitBill, SplitBillParticipant } = require("../Models");
const SplitBillService = require("./splitBillService");
const SmsService = require("./smsService");
const SmsTemplate = require("../Template/SmsTemplate");

module.exports = {
  async notifyParticipantsCreated(bill, creatorId) {
    const participants = bill.participants;
    const notifications = [];

    for (const p of participants) {
      if (p.user_id) {
        notifications.push({
          user_id: p.user_id,
          message: `You were added to the split bill "${bill.title}"`,
          type: "split_bill",
          campaign_id: null,
        });
      } else {
        const link = SplitBillService.generateLink(p.id);

        await SplitBillParticipant.update(
          { payment_link: link },
          { where: { id: p.id } }
        );

        const smsBody = SmsTemplate.guestAddedToBill({
          name: p.guest_name,
          billTitle: bill.title,
          link,
        });

        await SmsService.send({ to: p.guest_phone, message: smsBody });
      }
    }

    const creatorMessage = `You created a split bill "${bill.title}" with ${participants.length} participants`;
    notifications.push({
      user_id: creatorId,
      message: creatorMessage,
      type: "split_bill",
      campaign_id: null,
    });

    for (const n of notifications) {
      await Notification.create(n);
    }

    return true;
  },

  async billUpdated(bill, actorId) {
    const participants = bill.participants || [];

    for (const p of participants) {
      if (p.user_id && p.user_id !== actorId) {
        await Notification.create({
          user_id: p.user_id,
          message: `The bill "${bill.title}" was updated`,
          type: "split_bill",
          campaign_id: null,
        });
      }
    }
  },

  async participantAdded(billId, participant) {
    const bill = await SplitBill.findByPk(billId, {
      include: [{ model: SplitBillParticipant, as: "participants" }],
    });

    if (participant.user_id) {
      await Notification.create({
        user_id: participant.user_id,
        message: `You have been added to split bill "${bill.title}"`,
        type: "split_bill",
        campaign_id: null,
      });
    }

    for (const p of bill.participants) {
      if (p.user_id && p.user_id !== participant.user_id) {
        await Notification.create({
          user_id: p.user_id,
          message: `A new participant was added to "${bill.title}"`,
          type: "split_bill",
          campaign_id: null,
        });
      } else {
        const link = SplitBillService.generateLink(p.id);

        await SplitBillParticipant.update(
          { payment_link: link },
          { where: { id: p.id } }
        );

        const smsBody = SmsTemplate.guestAddedToBill({
          name: p.guest_name,
          billTitle: bill.title,
          link,
        });

        await SmsService.send({ to: p.guest_phone, message: smsBody });
      }
    }
  },

  async participantRemoved(billId, removedParticipant) {
    const bill = await SplitBill.findByPk(billId, {
      include: [{ model: SplitBillParticipant, as: "participants" }],
    });

    if (removedParticipant.user_id) {
      await Notification.create({
        user_id: removedParticipant.user_id,
        message: `You have been removed from split bill "${bill.title}"`,
        type: "split_bill",
        campaign_id: null,
      });
    }

    for (const p of bill.participants) {
      if (p.user_id !== removedParticipant.user_id) {
        await Notification.create({
          user_id: p.user_id,
          message: `A participant was removed from "${bill.title}"`,
          type: "split_bill",
          campaign_id: null,
        });
      }
    }
  },

  async paymentApplied(result, payerId) {
    const bill = await SplitBill.findByPk(result.billId, {
      include: [{ model: SplitBillParticipant, as: "participants" }],
    });

    for (const p of bill.participants) {
      if (p.user_id) {
        const message =
          p.user_id === payerId
            ? `Your payment of ${result.amount} was applied to bill "${bill.title}"`
            : `A payment of ${result.amount} was made in bill "${bill.title}"`;

        await Notification.create({
          user_id: p.user_id,
          message,
          type: "split_bill",
          campaign_id: null,
        });
      }
    }
  },

  async paymentAppliedAsGuest(result, participantId) {
    const bill = await SplitBill.findByPk(result.billId, {
      include: [{ model: SplitBillParticipant, as: "participants" }],
    });

    const participant = bill.participants.find((p) => p.id === participantId);

    if (participant.guest_phone) {
      const smsBody = SmsTemplate.guestPaymentMade({
        name: participant.guest_name || "Guest",
        billTitle: bill.title,
        amount: result.amount,
        amountOwed: result.amountOwed,
        remaining: result.remainingAmount,
      });

      await SmsService.send({
        to: participant.guest_phone,
        message: smsBody,
      });
    }

    for (const p of bill.participants) {
      if (!p.user_id) continue;

      const message =
        p.id === participantId
          ? `Your payment of ${result.amountPaid} was applied to bill "${bill.title}".`
          : `A guest paid ${result.amountPaid} in bill "${bill.title}".`;

      await Notification.create({
        user_id: p.user_id,
        message,
        type: "split_bill",
        campaign_id: null,
      });
    }
  },

  async notifyBillFinalized(bill) {
    const participants = bill.participants || [];

    for (const p of participants) {
      console.log(
        `📩 Bill Finalized → User ${p.user_id}: "${bill.title}" has been finalized.`
      );
    }
  },

  async notifyPaymentReceived(participant) {
    console.log(
      `💰 Payment → User ${participant.user_id} has paid for bill ${participant.bill_id}`
    );
  },
};
