import e, { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { CustomRequest, Enrollment } from "../libs/types.js";

// import database
import { enrollments, reset_enrollments, students } from "../db/db.js";

// import middlewares
import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";
import { checkRoles } from "../middlewares/checkRolesMiddleware.js";

const router = Router();

// Get /api/v2/enrollments (ADMIN)
router.get(
  "/",
  authenticateToken,
  checkRoleAdmin,
  (req: Request, res: Response) => {
    try {
      return res.status(200).json({
        success: true,
        message: "Enrollments Information",
        data: enrollments,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
      });
    }
  }
);

// POST /api/v2/enrollments/reset
router.post(
  "/reset",
  authenticateToken,
  checkRoleAdmin,
  (req: Request, res: Response) => {
    try {
      reset_enrollments();
      return res.status(200).json({
        success: true,
        message: "Enrollments database has been reset",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
      });
    }
  }
);

// GET /api/v2/enrollments/:studentId
router.get(
  "/:studentId",
  authenticateToken,
  (req: Request, res: Response, next) => {
    const user = (req as any).user;
    const { studentId } = req.params;

    if (user.role === "STUDENT" && user.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden access",
      });
    }

    next();
  },

  checkRoles,
  (req: Request, res: Response) => {
    const user = (req as any).user;
    const { studentId } = req.params;

    const studentEnrollments = enrollments
      .filter((e) => e.studentId === studentId)
      .map((e) => e.courseId);

    if (studentEnrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No enrollments found",
      });
    }

    const studentInfo = students.find((s) => s.studentId === studentId);

    return res.status(200).json({
      success: true,
      message: "Student Information",
      data: {
        studentId,
        firstName: studentInfo?.firstName || "",
        lastName: studentInfo?.lastName || "",
        program: studentInfo?.program || "",
        courses: studentEnrollments,
      },
    });
  }
);

// POST /api/v2/enrollments/:studentId (STUDENT)
router.post(
  "/:studentId",
  authenticateToken,
  (req: CustomRequest, res: Response) => {
    const user = (req as any).user;
    const { studentId } = req.params;
    const { courseId } = req.body;

    if (user.role !== "STUDENT" || user.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden access",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    const exists = enrollments.find(
      (e) => e.studentId === studentId && e.courseId === courseId
    );
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `studentId && courseId is already exists`,
      });
    }

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "studentId and courseId are required",
      });
    }

    const newEnroll: Enrollment = { studentId, courseId };
    enrollments.push(newEnroll);

    return res.status(200).json({
      success: true,
      message: `Student ${studentId} && course ${courseId} has been added successfully`,
      data: {
        newEnroll,
      },
    });
  }
);

// DELETE /api/v2/enrollments/:studentId (STUDENT)
router.delete(
  "/:studentId",
  authenticateToken,
  (req: Request, res: Response) => {
    const user = (req as any).user;
    const { studentId } = req.params;
    const { courseId } = req.body;

    if (user.role !== "STUDENT" || user.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to modify another student's data",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    const index = enrollments.findIndex(
      (e) => e.studentId === studentId && e.courseId === courseId
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Enrollment does not exist",
      });
    }

    enrollments.splice(index, 1);

    return res.status(200).json({
      success: true,
      message: `Student ${studentId} && course ${courseId} has been deleted successfully`,
      data: enrollments.filter((e) => e.studentId === studentId), // วิชาที่เหลือ
    });
  }
);

export default router;