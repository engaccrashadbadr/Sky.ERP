import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requireTemplates = (templates: string[], message: string) => t.middleware(async opts => {
  const { ctx, next } = opts;
  const allowed = ctx.user && (ctx.user.role === "admin" || ctx.user.role === "accountant" && templates.includes("المحاسبة") || templates.includes(ctx.user.permissionTemplate ?? "") || templates.includes("تشغيل عام") && ctx.user.permissionTemplate === "تشغيل عام");
  if (!ctx.user || !allowed) throw new TRPCError({ code: "FORBIDDEN", message });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const payrollProcedure = t.procedure.use(requireUser).use(requireTemplates(["المحاسبة"], "لا تملك صلاحية تشغيل مسير الرواتب"));
export const operationsProcedure = t.procedure.use(requireUser).use(requireTemplates(["المبيعات", "المشتريات", "المخزون", "نقطة البيع", "تشغيل عام"], "لا تملك صلاحية تنفيذ هذه العملية التشغيلية"));
export const aiProcedure = t.procedure.use(requireUser).use(requireTemplates(["المحاسبة", "تشغيل عام", "قراءة فقط"], "لا تملك صلاحية استخدام المساعد المحاسبي"));

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
