module.exports = {
  guestAddedToBill: ({ name, billTitle, link }) =>
    `Hello ${name}, you have been added to the split bill "${billTitle}". Click to view & pay your share: ${link}`,

  paymentApplied: ({ name, amount, billTitle }) =>
    `Hi ${name}, your payment of ${amount} for "${billTitle}" has been received. Thank you.`,

  participantRemoved: ({ name, billTitle }) =>
    `Hello ${name}, you have been removed from the split bill "${billTitle}".`,

  guestPaymentMade: ({ name, amount, billTitle, amountOwed, remaining }) => {
    return (
      `${name}, your payment of ₦${amount} for "${billTitle}" was successful. ` +
      `Total bill: ₦${amountOwed}. Amount paid now: ₦${amount}. ` +
      `Balance remaining: ₦${remaining}.`
    );
  },
};
