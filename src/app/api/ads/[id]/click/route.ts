import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Records an ad click and redirects to the campaign's destination.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const origin = new URL(req.url).origin;

  const campaign = await prisma.adCampaign.findUnique({
    where: { id },
    select: { ctaUrl: true, targetUrl: true, targetEntityType: true, targetEntityId: true },
  });
  if (!campaign) return NextResponse.redirect(`${origin}/dashboard`);

  await prisma.adClick.create({ data: { campaignId: id } }).catch(() => {});

  // destination: CTA URL → explicit targetUrl → sponsored entity detail page
  let dest = campaign.ctaUrl || campaign.targetUrl || "";
  if (!dest && campaign.targetEntityType && campaign.targetEntityId) {
    const map: Record<string, string> = {
      Job: "/jobs/",
      CatalogItem: "/market",
      Service: "/dashboard",
    };
    const base = map[campaign.targetEntityType];
    if (base) dest = base === "/jobs/" ? base + campaign.targetEntityId : base;
  }
  if (!dest || !dest.startsWith("/")) {
    if (dest.startsWith("http")) return NextResponse.redirect(dest);
    dest = "/dashboard";
  }
  return NextResponse.redirect(`${origin}${dest}`);
}
