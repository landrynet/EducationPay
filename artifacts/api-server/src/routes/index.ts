import { Router, type IRouter } from "express";
import healthRouter from "./health";
import establishmentApplicationsRouter from "./establishment-applications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(establishmentApplicationsRouter);

export default router;
