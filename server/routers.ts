import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { accounts, employees, journalEntries, parties, products } from "../drizzle/schema";
import { createAccount, createEmployee, createJournalEntry, createParty, createProduct, getDashboardSummary, listAccounts, listEmployees, listInvoices, listJournalEntries, listNotifications, listParties, listProducts, updateUserRole } from "./db";

const accountInput = z.object({ code: z.string().min(1), name: z.string().min(2), category: z.enum(["asset", "liability", "equity", "revenue", "expense"]), parentId: z.number().optional() });
const partyInput = z.object({ type: z.enum(["customer", "supplier"]), name: z.string().min(2), phone: z.string().optional(), email: z.string().email().optional().or(z.literal("")), taxNumber: z.string().optional(), creditLimit: z.coerce.number().min(0).default(0), openingBalance: z.coerce.number().default(0) });
const productInput = z.object({ sku: z.string().min(1), barcode: z.string().optional(), name: z.string().min(2), unit: z.string().default("قطعة"), salePrice: z.coerce.number().min(0).default(0), purchasePrice: z.coerce.number().min(0).default(0), quantity: z.coerce.number().default(0), minQuantity: z.coerce.number().min(0).default(0) });
const employeeInput = z.object({ employeeNumber: z.string().min(1), name: z.string().min(2), department: z.string().optional(), phone: z.string().optional(), baseSalary: z.coerce.number().min(0).default(0), hireDate: z.coerce.date().optional() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  dashboard: router({ summary: protectedProcedure.query(() => getDashboardSummary()), notifications: protectedProcedure.query(() => listNotifications()) }),
  accounts: router({ list: protectedProcedure.query(() => listAccounts()), create: protectedProcedure.input(accountInput).mutation(({ input }) => createAccount(input as typeof accounts.$inferInsert)) }),
  parties: router({ list: protectedProcedure.input(z.object({ type: z.enum(["customer", "supplier"]).optional() }).optional()).query(({ input }) => listParties(input?.type)), create: protectedProcedure.input(partyInput).mutation(({ input }) => createParty({ ...input, creditLimit: input.creditLimit.toFixed(2), openingBalance: input.openingBalance.toFixed(2) })) }),
  products: router({ list: protectedProcedure.query(() => listProducts()), create: protectedProcedure.input(productInput).mutation(({ input }) => createProduct({ ...input, salePrice: input.salePrice.toFixed(2), purchasePrice: input.purchasePrice.toFixed(2), quantity: input.quantity.toFixed(3), minQuantity: input.minQuantity.toFixed(3) })) }),
  invoices: router({ list: protectedProcedure.input(z.object({ type: z.enum(["sale", "purchase"]).optional() }).optional()).query(({ input }) => listInvoices(input?.type)) }),
  employees: router({ list: protectedProcedure.query(() => listEmployees()), create: protectedProcedure.input(employeeInput).mutation(({ input }) => createEmployee({ ...input, baseSalary: input.baseSalary.toFixed(2) })) }),
  journals: router({ list: protectedProcedure.query(() => listJournalEntries()), create: protectedProcedure.input(z.object({ entryNumber: z.string().min(1), entryDate: z.coerce.date(), description: z.string().min(2), lines: z.array(z.object({ accountId: z.number(), debit: z.coerce.number().min(0).default(0), credit: z.coerce.number().min(0).default(0), note: z.string().optional() })).min(2) })).mutation(({ input, ctx }) => createJournalEntry({ entryNumber: input.entryNumber, entryDate: input.entryDate, description: input.description, status: "posted", createdBy: ctx.user.id }, input.lines.map(line => ({ accountId: line.accountId, debit: line.debit.toFixed(2), credit: line.credit.toFixed(2), note: line.note })))) }),
  assistant: router({
    ask: protectedProcedure.input(z.object({ question: z.string().min(2), context: z.string().optional() })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: "أنت مساعد محاسبي عربي دقيق. أجب بالعربية الفصحى، استخدم مصطلحات محاسبية واضحة، واذكر أن إجابتك إرشادية وليست بديلاً عن مراجعة المحاسب المعتمد. لا تخترع أرقاماً أو بيانات غير موجودة." },
          { role: "user", content: `${input.question}${input.context ? `\\nسياق النظام: ${input.context}` : ""}` },
        ],
        maxTokens: 900,
      });
      const content = response.choices[0]?.message?.content;
      return { answer: typeof content === "string" ? content : "تعذر الحصول على إجابة حالياً." };
    }),
  }),
  admin: router({ setRole: adminProcedure.input(z.object({ userId: z.number(), role: z.enum(["user", "accountant", "admin"]) })).mutation(async ({ input, ctx }) => { if (input.userId === ctx.user.id && input.role !== "admin") throw new Error("لا يمكن للمدير إلغاء صلاحية حسابه الحالي"); await updateUserRole(input.userId, input.role); return { success: true }; }) }),
});

export type AppRouter = typeof appRouter;
