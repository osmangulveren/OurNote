import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as any)?.role as
    | "ADMIN" | "SUPER_ADMIN" | "OPERATIONS" | "ACCOUNTING" | "WAREHOUSE" | "SALES" | "CUSTOMER"
    | undefined;

  const isAdminPath = pathname.startsWith("/admin");
  const isCustomerPath = pathname.startsWith("/customer");
  const isInvoicePath = pathname.startsWith("/invoices");
  const isDeliveryPath = pathname.startsWith("/delivery-notes");
  const isProtected = isAdminPath || isCustomerPath || isInvoicePath || isDeliveryPath;

  if (!session && isProtected) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL(role && role !== "CUSTOMER" ? "/admin" : "/customer", req.url));
  }

  const isAdminish = role !== undefined && role !== "CUSTOMER";

  if (isAdminPath && !isAdminish) {
    return NextResponse.redirect(new URL("/customer", req.url));
  }
  if (isCustomerPath && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // /driver/[token] ve /api/driver/ping bilinçli olarak korumasızdır.
  matcher: ["/admin/:path*", "/customer/:path*", "/invoices/:path*", "/delivery-notes/:path*", "/login"],
};
