import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as any)?.role as "ADMIN" | "CUSTOMER" | undefined;

  const isAdminPath = pathname.startsWith("/admin");
  const isCustomerPath = pathname.startsWith("/customer");
  const isInvoicePath = pathname.startsWith("/invoices");
  const isProtected = isAdminPath || isCustomerPath || isInvoicePath;

  if (!session && isProtected) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/customer", req.url));
  }

  if (isAdminPath && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/customer", req.url));
  }
  if (isCustomerPath && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*", "/invoices/:path*", "/login"],
};
