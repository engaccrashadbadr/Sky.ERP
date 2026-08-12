# Authenticated browser-flow verification

The live ERP preview was opened at the current preview URL. The unauthenticated browser state correctly rendered the Arabic login gate with the action **تسجيل الدخول للمتابعة** rather than exposing protected dashboard mutations. No OAuth session was available in the sandbox browser, so create, invoice, stock, payroll, attachment, and AI actions could not be submitted through an authenticated UI session. The route-level authorization was separately verified in Vitest, including forbidden ordinary users and successful accountant payroll access.
