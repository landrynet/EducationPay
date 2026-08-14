import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import establishmentApplicationsRouter from "./establishment-applications.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(establishmentApplicationsRouter);

export default router;
