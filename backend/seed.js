/**
 * Seeds the database with one default user per role so the app can be
 * demoed immediately after deployment.
 *
 * Run with: npm run seed
 */
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";

dotenv.config();

const DEMO_USERS = [
  { name: "Aditi Sharma", email: "admin@taskflow.com", password: "Admin@123", role: "admin", avatarColor: "#4F46E5" },
  { name: "Rohit Verma", email: "manager@taskflow.com", password: "Manager@123", role: "manager", avatarColor: "#0EA5E9" },
  { name: "Priya Nair", email: "employee@taskflow.com", password: "Employee@123", role: "employee", avatarColor: "#10B981" },
];

const run = async () => {
  await connectDB();

  console.log("Clearing existing demo data...");
  await Task.deleteMany({});
  await Project.deleteMany({});
  await User.deleteMany({ email: { $in: DEMO_USERS.map((u) => u.email) } });

  console.log("Creating demo users...");
  const [admin, manager, employee] = await User.create(DEMO_USERS);

  console.log("Creating a demo project...");
  const project = await Project.create({
    name: "Website Redesign",
    description: "Revamp the marketing website with a new design system and improved performance.",
    status: "active",
    createdBy: manager._id,
    members: [manager._id, employee._id],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  console.log("Creating demo tasks...");
  await Task.create([
    {
      title: "Design new homepage wireframes",
      description: "Create low-fidelity wireframes for the new homepage layout.",
      project: project._id,
      assignedTo: employee._id,
      createdBy: manager._id,
      status: "in-progress",
      priority: "high",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automatic deployment.",
      project: project._id,
      assignedTo: manager._id,
      createdBy: manager._id,
      status: "todo",
      priority: "medium",
    },
    {
      title: "Write copy for the pricing page",
      project: project._id,
      assignedTo: employee._id,
      createdBy: manager._id,
      status: "todo",
      priority: "low",
    },
  ]);

  console.log("\nSeed complete! Demo credentials:");
  DEMO_USERS.forEach((u) => console.log(`  ${u.role.padEnd(8)} -> ${u.email} / ${u.password}`));

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
