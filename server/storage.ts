import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type User, type InsertUser, type UpdateProfile } from "../shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateProfile(id: string, data: Partial<UpdateProfile>): Promise<User | undefined>;
  updateStats(id: string, stats: { totalMeasurements?: number; totalMealsLogged?: number; streakDays?: number }): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateProfile(id: string, data: Partial<UpdateProfile>): Promise<User | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.activityLevel !== undefined) updateData.activityLevel = data.activityLevel;
    if (data.goal !== undefined) updateData.goal = data.goal;
    if (data.targetWeight !== undefined) updateData.targetWeight = data.targetWeight;
    if (data.dailyWaterGoal !== undefined) updateData.dailyWaterGoal = data.dailyWaterGoal;
    if (data.notifications !== undefined) updateData.notifications = data.notifications;

    if (Object.keys(updateData).length === 0) return this.getUser(id);

    const result = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateStats(id: string, stats: { totalMeasurements?: number; totalMealsLogged?: number; streakDays?: number }): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (stats.totalMeasurements !== undefined) updateData.totalMeasurements = stats.totalMeasurements;
    if (stats.totalMealsLogged !== undefined) updateData.totalMealsLogged = stats.totalMealsLogged;
    if (stats.streakDays !== undefined) updateData.streakDays = stats.streakDays;
    await db.update(users).set(updateData).where(eq(users.id, id));
  }

  async updateLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();
