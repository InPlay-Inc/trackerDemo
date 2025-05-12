import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Smart Label / Asset Schema
export const smartLabels = pgTable("smart_labels", {
  id: text("id").primaryKey(),
  asset: text("asset").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const positionUpdates = pgTable("position_updates", {
  id: serial("id").primaryKey(),
  labelId: text("label_id").notNull().references(() => smartLabels.id),
  lat: text("lat").notNull(),
  lng: text("lng").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

// Schemas for validation
export const smartLabelSchema = createInsertSchema(smartLabels).pick({
  id: true,
  asset: true,
});

export const positionUpdateSchema = createInsertSchema(positionUpdates).pick({
  labelId: true,
  lat: true,
  lng: true,
  timestamp: true,
});

// Type for location trace point
export const tracePointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  timestamp: z.date(),
});

// Schema for a complete label with trace
export const smartLabelWithTraceSchema = smartLabelSchema.extend({
  trace: z.array(tracePointSchema),
  targetReached: z.boolean().default(false),
  description: z.string().optional(),
});

// Schema for real-time label data
export const realTimeLabelSchema = z.object({
  id: z.string(),
  macId: z.string(),
  name: z.string().optional(),
  position: tracePointSchema,
  lastUpdated: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  isSelected: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

// ShipRec.io API types
export const shipRecLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  timestamp: z.string(),
});

export const shipRecPackageSchema = z.object({
  tokenId: z.string(),
  packageId: z.string(),
  deleted: z.boolean(),
  deviceId: z.string(),
  userId: z.string(),
  notes: z.string(),
  created: z.string(),
  address: z.string(),
  email: z.string(),
  name: z.string(),
  status: z.string(),
  currentLocation: shipRecLocationSchema.optional(),
  location: z.object({
    lat: z.number(),
    long: z.number(),
    timestamp: z.number(),
  }).optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export const shipRecWebhookSchema = z.object({
  token: z.string(),
  mac_id: z.string(),
  lat: z.number(),
  long: z.number(),
  status: z.union([z.string(), z.number()]).nullable(),
  timestamp: z.number(),
  is_latest: z.boolean(),
});

export type TracePoint = z.infer<typeof tracePointSchema>;
export type SmartLabel = typeof smartLabels.$inferSelect;
export type InsertSmartLabel = z.infer<typeof smartLabelSchema>;
export type PositionUpdate = typeof positionUpdates.$inferSelect;
export type InsertPositionUpdate = z.infer<typeof positionUpdateSchema>;
export type SmartLabelWithTrace = z.infer<typeof smartLabelWithTraceSchema>;
export type RealTimeLabel = z.infer<typeof realTimeLabelSchema>;
export type ShipRecLocation = z.infer<typeof shipRecLocationSchema>;
export type ShipRecPackage = z.infer<typeof shipRecPackageSchema>;
export type ShipRecWebhook = z.infer<typeof shipRecWebhookSchema>;
