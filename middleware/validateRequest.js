const { ZodError } = require("zod");

const validateRequest = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateRequest;
