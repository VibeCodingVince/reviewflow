import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { review_id, status, edited_reply } = await request.json();

    if (!review_id || !status) {
      return NextResponse.json(
        { error: "review_id and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "approved", "posted", "skipped", "failed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { reply_status: status };
    if (edited_reply !== undefined) {
      updateData.edited_reply = edited_reply;
    }

    const { error } = await supabase
      .from("reviews")
      .update(updateData)
      .eq("id", review_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update review status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
