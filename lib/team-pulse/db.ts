import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Tenant isolation helper to ensure all operations filter by organisationId
 */
export function getTenantDb(organizationId: string) {
  return {
    employees: {
      findMany: (args: any = {}) =>
        prisma.employee.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId },
        }),
      findFirst: (args: any = {}) =>
        prisma.employee.findFirst({
          ...args,
          where: { ...(args.where || {}), organizationId },
        }),
      create: (data: any) =>
        prisma.employee.create({
          data: { ...data, organizationId },
        }),
      update: (id: string, data: any) =>
        prisma.employee.updateMany({
          where: { id, organizationId },
          data,
        }),
      delete: (id: string) =>
        prisma.employee.deleteMany({
          where: { id, organizationId },
        }),
    },
    candidates: {
      findMany: (args: any = {}) =>
        prisma.candidate.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId },
        }),
      findFirst: (args: any = {}) =>
        prisma.candidate.findFirst({
          ...args,
          where: { ...(args.where || {}), organizationId },
        }),
      create: (data: any) =>
        prisma.candidate.create({
          data: { ...data, organizationId },
        }),
      update: (id: string, data: any) =>
        prisma.candidate.updateMany({
          where: { id, organizationId },
          data,
        }),
    },
    jobs: {
      findMany: (args: any = {}) =>
        prisma.job.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId },
        }),
      findFirst: (args: any = {}) =>
        prisma.job.findFirst({
          ...args,
          where: { ...(args.where || {}), organizationId },
        }),
      create: (data: any) =>
        prisma.job.create({
          data: { ...data, organizationId },
        }),
    },
  };
}
