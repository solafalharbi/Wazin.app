import { Router, type IRouter } from "express";
import healthRouter from "./health";
import userRouter from "./user";
import dashboardRouter from "./dashboard";
import simulationRouter from "./simulation";
import eventsRouter from "./events";
import aiRouter from "./ai";
import rewardsRouter from "./rewards";
import leaderboardRouter from "./leaderboard";
import scenariosRouter from "./scenarios";
import analysisRouter from "./analysis";
import twinRouter from "./twin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(userRouter);
router.use(dashboardRouter);
router.use(simulationRouter);
router.use(eventsRouter);
router.use(aiRouter);
router.use(rewardsRouter);
router.use(leaderboardRouter);
router.use(scenariosRouter);
router.use(analysisRouter);
router.use(twinRouter);

export default router;
