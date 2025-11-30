const { SplitBill, SplitBillParticipant } = require("../Models");
const AppError = require("../utils/AppError");

const checkBillOwnership = async (req, res, next) => {
  try {
    const { id: billId } = req.params;
    const userId = req.user.id;

    const bill = await SplitBill.findByPk(billId);

    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    // if (bill.creator_id !== userId) {
    //   throw new AppError("You don't have permission to modify this bill", 403);
    // }

    req.bill = bill;
    next();
  } catch (error) {
    next(error);
  }
};

const checkBillAccess = async (req, res, next) => {
  try {
    const { id: billId } = req.params;
    const userId = req.user.id;

    const bill = await SplitBill.findByPk(billId, {
      include: [
        {
          model: SplitBillParticipant,
          as: "participants",
          where: { user_id: userId },
          required: false,
        },
      ],
    });

    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    const isCreator = bill.creator_id === userId;
    const isParticipant = bill.participants && bill.participants.length > 0;

    // if (!isCreator && !isParticipant) {
    //   throw new AppError("You don't have access to this bill", 403);
    // }

    req.bill = bill;
    req.isCreator = isCreator;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkBillOwnership,
  checkBillAccess,
};
