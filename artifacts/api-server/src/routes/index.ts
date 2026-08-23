import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import notesRouter from "./notes.js";
import bookmarksRouter from "./bookmarks.js";
import focusRouter from "./focus.js";
import journalRouter from "./journal.js";
import userRouter from "./user.js";
import ticketsRouter from "./tickets.js";
import adminRouter from "./admin.js";
import tasksRouter from "./tasks.js";
import webhooksRouter from "./webhooks.js";
import attachmentsRouter from "./attachments.js";
import bannersRouter from "./banners.js";
import flagsRouter from "./flags.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/banners", bannersRouter);
router.use("/feature-flags", flagsRouter);
router.use("/notes", notesRouter);
router.use("/attachments", attachmentsRouter);
router.use("/bookmarks", bookmarksRouter);
router.use("/focus", focusRouter);
router.use("/journal", journalRouter);
router.use("/user", userRouter);
router.use("/tickets", ticketsRouter);
router.use("/admin", adminRouter);
router.use("/tasks", tasksRouter);
router.use("/webhooks", webhooksRouter);

export default router;
