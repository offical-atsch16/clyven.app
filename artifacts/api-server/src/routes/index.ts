import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import notesRouter from "./notes.js";
import bookmarksRouter from "./bookmarks.js";
import focusRouter from "./focus.js";
import journalRouter from "./journal.js";
import userRouter from "./user.js";
import ticketsRouter from "./tickets.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/notes", notesRouter);
router.use("/bookmarks", bookmarksRouter);
router.use("/focus", focusRouter);
router.use("/journal", journalRouter);
router.use("/user", userRouter);
router.use("/tickets", ticketsRouter);
router.use("/admin", adminRouter);

export default router;
