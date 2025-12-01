const { Sequelize } = require("sequelize");
const sequelize = require("./Config/sequalize_db");

async function migrateToUUIDs() {
  const t = await sequelize.transaction();
  try {
    // 1️⃣ Add temporary UUID columns
    await sequelize.query(
      `ALTER TABLE split_bills ADD COLUMN new_id CHAR(36) NOT NULL;`,
      { transaction: t }
    );
    await sequelize.query(
      `ALTER TABLE split_bill_participants ADD COLUMN new_split_bill_id CHAR(36) NOT NULL;`,
      { transaction: t }
    );

    // 2️⃣ Generate UUIDs for existing split_bills
    await sequelize.query(
      `UPDATE split_bills SET new_id = UUID();`,
      { transaction: t }
    );

    // 3️⃣ Update split_bill_participants to match new UUIDs
    await sequelize.query(
      `UPDATE split_bill_participants sbp
       JOIN split_bills sb ON sbp.split_bill_id = sb.id
       SET sbp.new_split_bill_id = sb.new_id;`,
      { transaction: t }
    );

    // 4️⃣ Drop old foreign key
    await sequelize.query(
      `ALTER TABLE split_bill_participants DROP FOREIGN KEY split_bill_participants_ibfk_1;`,
      { transaction: t }
    );

    // 5️⃣ Drop old columns and rename new ones
    await sequelize.query(
      `ALTER TABLE split_bills DROP COLUMN id;`,
      { transaction: t }
    );
    await sequelize.query(
      `ALTER TABLE split_bills CHANGE COLUMN new_id id CHAR(36) NOT NULL PRIMARY KEY;`,
      { transaction: t }
    );

    await sequelize.query(
      `ALTER TABLE split_bill_participants DROP COLUMN split_bill_id;`,
      { transaction: t }
    );
    await sequelize.query(
      `ALTER TABLE split_bill_participants CHANGE COLUMN new_split_bill_id split_bill_id CHAR(36) NOT NULL;`,
      { transaction: t }
    );

    // 6️⃣ Re-add foreign key
    await sequelize.query(
      `ALTER TABLE split_bill_participants
       ADD CONSTRAINT split_bill_participants_ibfk_1
       FOREIGN KEY (split_bill_id) REFERENCES split_bills(id)
       ON DELETE CASCADE ON UPDATE CASCADE;`,
      { transaction: t }
    );

    await t.commit();
    console.log("✅ Migration to UUIDs completed successfully.");
  } catch (error) {
    await t.rollback();
    console.error("❌ Migration failed:", error);
  }
}

async function migrateParticipantsToUUID() {
  const t = await sequelize.transaction();
  try {
    // 1️⃣ Add a temporary UUID column
    await sequelize.query(
      `ALTER TABLE split_bill_participants ADD COLUMN new_id CHAR(36) NOT NULL;`,
      { transaction: t }
    );

    // 2️⃣ Populate with UUIDs
    await sequelize.query(
      `UPDATE split_bill_participants SET new_id = UUID();`,
      { transaction: t }
    );

    // 3️⃣ Drop old id column
    await sequelize.query(
      `ALTER TABLE split_bill_participants DROP COLUMN id;`,
      { transaction: t }
    );

    // 4️⃣ Rename new_id to id and make it primary key
    await sequelize.query(
      `ALTER TABLE split_bill_participants CHANGE COLUMN new_id id CHAR(36) NOT NULL PRIMARY KEY;`,
      { transaction: t }
    );

    await t.commit();
    console.log("✅ Participants table migrated to UUID successfully.");
  } catch (error) {
    await t.rollback();
    console.error("❌ Migration failed:", error);
  }
}

migrateParticipantsToUUID();
// Run migration
migrateToUUIDs();
