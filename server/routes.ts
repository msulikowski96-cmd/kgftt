import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertUserSchema, updateProfileSchema } from "../shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Nie jestes zalogowany" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "metabolic-ai-pro-secret-key-2026",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Nieprawidlowe dane" });
      }

      const { username, password } = parsed.data;

      if (username.length < 3) {
        return res.status(400).json({ message: "Nazwa uzytkownika musi miec co najmniej 3 znaki" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Haslo musi miec co najmniej 6 znakow" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Ta nazwa uzytkownika jest juz zajeta" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });

      await storage.updateLastLogin(user.id);
      req.session.userId = user.id;

      const { password: _, ...safeUser } = user;
      return res.status(201).json(safeUser);
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Podaj nazwe uzytkownika i haslo" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Nieprawidlowa nazwa uzytkownika lub haslo" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Nieprawidlowa nazwa uzytkownika lub haslo" });
      }

      await storage.updateLastLogin(user.id);
      req.session.userId = user.id;

      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Blad wylogowania" });
      res.clearCookie("connect.sid");
      return res.json({ message: "Wylogowano" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Nie zalogowano" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Uzytkownik nie znaleziony" });
      }
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.put("/api/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Nieprawidlowe dane profilu" });
      }

      const updated = await storage.updateProfile(req.session.userId!, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Uzytkownik nie znaleziony" });
      }

      const { password: _, ...safeUser } = updated;
      return res.json(safeUser);
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({ message: "Blad serwera" });
    }
  });

  app.put("/api/profile/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.updateStats(req.session.userId!, req.body);
      return res.json({ message: "Zaktualizowano" });
    } catch (error) {
      return res.status(500).json({ message: "Blad serwera" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
