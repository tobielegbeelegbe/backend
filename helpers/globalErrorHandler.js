const { ZodError } = require("zod");
const { ValidationError } = require("sequelize");

const globalErrorHandler = (err, req, res, next) => {
  console.log("Errors:", err);
  const isZodError =
    err instanceof ZodError || (err.name === "ZodError" && err.errors);

  if (isZodError) {
    if (!Array.isArray(err.errors)) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: [{ field: "unknown", message: err.message }],
      });
    }

    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join(".") || "root",
      message: e.message,
    }));

    return res.status(400).json({
      status: "error",
      message: "Input Validation failed",
      errors: formattedErrors,
    });
  }

  if (
    err instanceof ValidationError ||
    err.name === "SequelizeValidationError"
  ) {
    const formattedErrors = err.errors
      ? err.errors.map((e) => ({ field: e.path, message: e.message }))
      : [{ field: "db", message: err.message }];

    return res.status(400).json({
      status: "error",
      message: "Database validation failed",
      errors: formattedErrors,
    });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired authentication token",
    });
  }

  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  const errorMessage = err.message || "Internal Server Error";

  let cleanMessage = errorMessage;
  if (errorMessage.startsWith("[") && errorMessage.includes("code")) {
    try {
      const parsed = JSON.parse(errorMessage);
      if (Array.isArray(parsed)) cleanMessage = parsed[0].message;
    } catch (e) {}
  }

  return res.status(statusCode).json({
    status,
    message: cleanMessage,
  });
};

module.exports = globalErrorHandler;
