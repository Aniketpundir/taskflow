import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed"],
      default: "planning",
    },
    // The manager (or admin) who owns/created the project
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Employees (and managers) who are part of this project
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

projectSchema.index({ name: "text", description: "text" });
projectSchema.index({ createdBy: 1, createdAt: -1 });
projectSchema.index({ members: 1, createdAt: -1 });
projectSchema.index({ status: 1, createdAt: -1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
