import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  height: real("height"),
  weight: real("weight"),
  age: integer("age"),
  gender: text("gender"),
  activityLevel: text("activity_level"),
  goal: text("goal"),
  targetWeight: real("target_weight"),
  dailyWaterGoal: real("daily_water_goal"),
  darkMode: boolean("dark_mode").default(false),
  notifications: boolean("notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  streakDays: integer("streak_days").default(0),
  totalMeasurements: integer("total_measurements").default(0),
  totalMealsLogged: integer("total_meals_logged").default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const updateProfileSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  height: z.number().min(50).max(300).optional(),
  weight: z.number().min(20).max(500).optional(),
  age: z.number().min(10).max(120).optional(),
  gender: z.enum(["male", "female"]).optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very-active"]).optional(),
  goal: z.enum(["lose", "maintain", "gain"]).optional(),
  targetWeight: z.number().min(20).max(500).optional(),
  dailyWaterGoal: z.number().min(0.5).max(10).optional(),
  notifications: z.boolean().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
