const Notification = require("../Models/notifications");
const { SplitBill, SplitBillParticipant } = require("../Models");

module.exports = {
  async notifyParticipantsCreated(bill, creatorId) {
    const participants = bill.participants || [];
    const notifications = [];

    for (const p of participants) {
      if (p.user_id) {
        const message = `You were added to the split bill "${bill.title}"`;

        notifications.push({
          user_id: p.user_id,
          message,
          type: "split_bill",
          campaign_id: null,
        });

        console.log(
          `📩 Notification → User ${p.user_id}: You were added to bill "${bill.title}"`
        );
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

    console.log(
      `📩 Notification → User ${creatorId} created this split bill: You were added to bill "${bill.title}"`
    );

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
